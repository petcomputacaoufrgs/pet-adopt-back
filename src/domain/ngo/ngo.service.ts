import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Ngo } from './schemas/NGO.schema';
import { Model } from 'mongoose';
import { CreateNgoDto } from './dtos/create-ngo.dto';
import { UpdateNgoDto } from './dtos/update-ngo.dto';

@Injectable()
export class NgoService {
  constructor(@InjectModel(Ngo.name) private ngoModel: Model<Ngo>) {}

  async getAll() {
    const ngos = await this.ngoModel.find({});

    return ngos;
  }

  async create(createNgoDto: CreateNgoDto) {
    const ngoCreated = new this.ngoModel(createNgoDto);

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
    const userUpdated = await this.ngoModel.findByIdAndUpdate(id, updateNgoDto, { new: true });
    return await userUpdated.save();
  }
}
