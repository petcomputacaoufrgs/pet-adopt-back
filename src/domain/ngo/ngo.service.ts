import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Ngo } from './schemas/NGO.schema';
import { Model } from 'mongoose';
import { CreateNgoDto } from './dtos/create-ngo.dto';
import { UpdateNgoDto } from './dtos/update-ngo.dto';
import { UserService } from '../user/user.service';
import { filter } from 'rxjs';

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

  async getApproved(){
      return await this.ngoModel.find({ approved: true });
  }

  async getUnapproved(){
      return await this.ngoModel.find({ approved: false });
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
    // Começa uma transação, o que garante que todas as operações sejam atômicas, ou seja, se uma falhar, a outra deve ser revertida.
    const session = await this.ngoModel.startSession();
    session.startTransaction();

    try {
      // 1. Aprove a ONG
      const approvedNgo = await this.ngoModel
        .findByIdAndUpdate(ngoId, { approved: true }, { new: true, session })
        .exec();

      if (!approvedNgo) {
        throw new NotFoundException('NGO not found.');
      }

      // 2. Ache o usuário associado e atualize seu papel
      await this.userService.updateUserRoleByNgoId(
        ngoId,
        'NGO_ADMIN',
        session
      );

      // Salve a transação
      await session.commitTransaction();
      return approvedNgo;
    } catch (error) {
      // Aborte a transação em caso de erro
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}
