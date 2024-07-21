import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Ngo } from './schemas/NGO.schema';
import { Model } from 'mongoose';
import { CreateNgoDto } from './dtos/create-ngo.dto';

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
}
