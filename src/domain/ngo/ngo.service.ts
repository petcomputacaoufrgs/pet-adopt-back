import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Ngo } from './schemas/ngo.schema';
import { Model } from 'mongoose';
import { CreateNgoDto } from './dtos/create-ngo.dto';
import { UpdateNgoDto } from './dtos/update-ngo.dto';
import { UserService } from '../user/user.service';
import { filter } from 'rxjs';
import { Role } from 'src/core/enums/role.enum';

@Injectable()
export class NgoService {
  constructor(
    @InjectModel(Ngo.name) private ngoModel: Model<Ngo>,
    private userService: UserService
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

  async create(createNgoDto: CreateNgoDto, session: any) {
    const ngoCreated = new this.ngoModel({
        ...createNgoDto,
        approved: false  // Sempre falso para novas ONGs
    });

    return await ngoCreated.save({ session });
  }

  async getById(id: string) {
    const ngo = await this.ngoModel.findById(id);

    return ngo;
  }
  
  async update(id: string, updateNgoDto: UpdateNgoDto) {
    const ngoUpdated = await this.ngoModel.findByIdAndUpdate(id, updateNgoDto, { new: true });
    if (!ngoUpdated) {
        throw new NotFoundException('NGO not found');
    }
    return ngoUpdated;
  }

  async delete(id: string): Promise<{ message: string }> {
    const session = await this.ngoModel.startSession();
    session.startTransaction();

    try {
      // 1. Verifica se a ONG existe antes de deletar
      const ngoToDelete = await this.ngoModel.findById(id).session(session);
      
      if (!ngoToDelete) {
        throw new NotFoundException('NGO not found.');
      }

      // 2. Delete a conta institucional associada primeiro
      await this.userService.deleteByNgoId(id, session);

      // 3. Delete a ONG
      await this.ngoModel.findByIdAndDelete(id, { session });

      // Salve a transação
      await session.commitTransaction();
      return { message: 'NGO and associated user deleted successfully.' };
    } catch (error) {
      // Aborte a transação em caso de erro
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
}
