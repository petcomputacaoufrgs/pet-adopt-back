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

  async create(createNgoDto: CreateNgoDto) {
    const ngoCreated = new this.ngoModel({
        ...createNgoDto,
        approved: false  // Sempre falso para novas ONGs
    });

    return await ngoCreated.save();
  }

  async getById(id: string) {
    const ngo = await this.ngoModel.findById(id);

    return ngo;
  }

  async delete(id: string) {
    const ngo = await this.ngoModel.findByIdAndDelete(id);
  }
  
  async update(id: string, updateNgoDto: UpdateNgoDto) {
    const ngoUpdated = await this.ngoModel.findByIdAndUpdate(id, updateNgoDto, { new: true });
    if (!ngoUpdated) {
        throw new NotFoundException('NGO not found');
    }
    return ngoUpdated;
  }

  async approve(ngoId: string): Promise<Ngo> {
    // Start a transaction if your MongoDB setup supports it
    const session = await this.ngoModel.startSession();
    session.startTransaction();

    try {
      // 1. Approve the NGO
      const approvedNgo = await this.ngoModel
        .findByIdAndUpdate(ngoId, { approved: true }, { new: true, session })
        .exec();

      if (!approvedNgo) {
        throw new NotFoundException('NGO not found.');
      }

      // 2. Find the associated user and update their role
      await this.userService.updateUserRoleByNgoId(
        ngoId,
        'NGO_ADMIN',
        session
      );

      // Commit the transaction
      await session.commitTransaction();
      return approvedNgo;
    } catch (error) {
      // Abort the transaction on error
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async getUnapproved(){
      return await this.ngoModel.find({ approved: false });
  }
}
