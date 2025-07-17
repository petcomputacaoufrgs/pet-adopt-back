import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Ngo } from './schemas/NGO.schema';
import { Model } from 'mongoose';
import { CreateNgoDto } from './dtos/create-ngo.dto';
import { UpdateNgoDto } from './dtos/update-ngo.dto';
import { filter } from 'rxjs';

@Injectable()
export class NgoService {
  constructor(@InjectModel(Ngo.name) private ngoModel: Model<Ngo>) {}

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
