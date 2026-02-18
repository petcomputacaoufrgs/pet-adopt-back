import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Ngo } from './schemas/ngo.schema';
import { Model } from 'mongoose';
import { CreateNgoDto } from './dtos/create-ngo.dto';
import { UpdateNgoDto } from './dtos/update-ngo.dto';
import { UserService } from '../user/user.service';
import { PetService } from '../pet/pet.service';
import { filter } from 'rxjs';
import { Role } from 'src/core/enums/role.enum';

@Injectable()
export class NgoService {
  constructor(
    @InjectModel(Ngo.name) private ngoModel: Model<Ngo>,
    private userService: UserService,
    private petService: PetService
  ) {}

  async getAll(filters: any = {}) {
    // Remove empty filters
    Object.keys(filters).forEach(key => {
      if (!filters[key]) delete filters[key];
      if (typeof filters[key] === 'string') filters[key] = filters[key].replace(/^"+|"+$/g, '').replace(/^'+|'+$/g, '');
    });

    const ngos = await this.ngoModel.find(filters);

    return ngos;
  }

  async getApproved(filters: any = {}){
    // Remove empty filters
    Object.keys(filters).forEach(key => {
      if (!filters[key]) delete filters[key];
      if (typeof filters[key] === 'string') filters[key] = filters[key].replace(/^"+|"+$/g, '').replace(/^'+|'+$/g, '');
    });

    // Busca NGOs cujos usuários administradores têm role NGO_ADMIN (aprovados)
    const approvedUsers = await this.userService.getByRole(Role.NGO_ADMIN);
    const ngoIds = approvedUsers.map(user => user.ngoId);
    
    // Combina o filtro de NGOs aprovadas com os filtros recebidos
    const combinedFilters = {
      ...filters,
      _id: { $in: ngoIds }
    };

    return await this.ngoModel.find(combinedFilters);
  }

  async getUnapproved(){
    // Busca NGOs cujos usuários administradores têm role NGO_ADMIN_PENDING (pendentes)
    const pendingUsers = await this.userService.getByRole(Role.NGO_ADMIN_PENDING);
    const ngoIds = pendingUsers.map(user => user.ngoId);
    return await this.ngoModel.find({ _id: { $in: ngoIds } });
  }

  async getPage(filters: any = {}, approved: boolean = true){
      // 1. Extrair paginação
      const page = Number(filters.page) || 1;
      const limit = Number(filters.limit) || 12;

      // Removemos page/limit para não atrapalhar a limpeza de strings abaixo
      const { page: _, limit: __, ...restFilters } = filters;

      // Lógica antiga de limpeza de strings (Mantida)
      Object.keys(restFilters).forEach(key => {
        if (!restFilters[key]) delete restFilters[key];
        if (typeof restFilters[key] === 'string') {
            restFilters[key] = restFilters[key].replace(/^"+|"+$/g, '').replace(/^'+|'+$/g, '');
        }
      });

      // 2. Busca IDs (Lógica existente)
      const approvedUsers = await this.userService.getByRole(approved ? Role.NGO_ADMIN : Role.NGO_ADMIN_PENDING);
      const ngoIds = approvedUsers.map(user => user.ngoId);
      
      // 3. Monta a query final
      const combinedFilters = {
        ...restFilters,
        _id: { $in: ngoIds }
      };

      // 4. Calcula paginação
      const skip = (page - 1) * limit;

      // 5. Executa Busca + Contagem
      const [data, total] = await Promise.all([
        this.ngoModel.find(combinedFilters)
          .skip(skip)
          .limit(limit)
          .exec(),
        this.ngoModel.countDocuments(combinedFilters).exec()
      ]);

      return {
        data,
        meta: {
          total,
          page,
          lastPage: Math.ceil(total / limit),
          limit
        }
      };
    }

  async create(createNgoDto: CreateNgoDto, session: any) {
    const ngoCreated = new this.ngoModel({
        ...createNgoDto,
        approved: false  // Sempre falso para novas ONGs
    });

    return await ngoCreated.save({ session });
  }

  // Retorna dados da ONG, podem ser públicos ou privados (inclui o documento) dependendo do parâmetro
  async getById(id: string, includePrivateData: boolean = false) {
    const ngo = await this.ngoModel.findById(id).select(includePrivateData ? undefined : '-doc');
    if (!ngo) {
      throw new NotFoundException('ONG não encontrada');
    }
    return ngo;
  }

  async getByEmail(email: string): Promise<Ngo | undefined> {
      return await this.ngoModel.findOne({ email });
  }
  
  async update(id: string, updateNgoDto: UpdateNgoDto, session?: any) {
    
    const ngoUpdated = await this.ngoModel.findByIdAndUpdate(id, updateNgoDto, { new: true, session });

    if (!ngoUpdated) {
        throw new NotFoundException('NGO not found');
    }
    return ngoUpdated;
  }

  async delete(id: string): Promise<{ message: string }> {
    const session = await this.ngoModel.startSession();
    session.startTransaction();

    try {
      // Verifica se a ONG existe antes de deletar
      const ngoToDelete = await this.ngoModel.findById(id).session(session);
      
      if (!ngoToDelete) {
        throw new NotFoundException('NGO not found.');
      }

      // Deleta dependências primeiro (dentro da transação)
      // 1. Deleta pets da ONG (e suas fotos)
      await this.petService.deleteByNgoId(id, session);

      // 2. Deleta todos os usuários associados (admin + membros)
      await this.userService.deleteByNgoId(id, session);

      // 3. Por último, deleta a ONG
      await this.ngoModel.findByIdAndDelete(id, { session });

      // Commit da transação - tudo ou nada
      await session.commitTransaction();

      return { message: 'NGO and associated data deleted successfully.' };
    } catch (error) {
      // Aborta a transação em caso de erro
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async approve(ngoId: string): Promise<Ngo> {
    const session = await this.ngoModel.startSession();
    session.startTransaction();

    try {
      // Verifica se a NGO existe
      const ngo = await this.ngoModel.findById(ngoId).session(session);
      if (!ngo) {
        throw new NotFoundException('NGO not found.');
      }

      // Atualiza o role do usuário de NGO_ADMIN_PENDING para NGO_ADMIN
      await this.userService.updateUserRoleByNgoId(
        ngoId,
        'NGO_ADMIN',
        session
      );

      await session.commitTransaction();
      return ngo;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }


  async is_approved(ngoId: string): Promise<boolean> {
    //Verifica se entre os usuários NGO_ADMIN um deles faz parte da ong
    const approvedAdmin = await this.userService.getByRole(Role.NGO_ADMIN);
    return approvedAdmin.some(user => user.ngoId === ngoId);
  }

}