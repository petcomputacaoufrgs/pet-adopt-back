import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Pet } from './schemas/pet.schema';
import { Model } from 'mongoose';
import { CreatePetDto } from './dtos/create-pet.dto';
import { Species } from 'src/core/enums/species.enum';

@Injectable()
export class PetService {
  constructor(@InjectModel(Pet.name) private petModel: Model<Pet>) {}

  async getAll(filters: any = {}) {
    // Remove filtros vazios
    Object.keys(filters).forEach(key => {
      if (!filters[key]) delete filters[key];
      if (typeof filters[key] === 'string') filters[key] = filters[key].replace(/^"+|"+$/g, '').replace(/^'+|'+$/g, '');
    });

    // Ajuste para species (exemplo: capitalize)
    if (filters.species) filters.species = filters.species.toLowerCase() // Ajuste para o enum Species
    
    if(filters.size) filters.size = filters.size.toUpperCase(); // Ajuste para o enum Size
    
    if(filters.status) filters.status = filters.status.toLowerCase(); // Ajuste para o enum Status

    const pets = await this.petModel.find(filters);
    
    return pets;
  }

  async create(createPetDto: CreatePetDto) {
    const petCreated = new this.petModel(createPetDto);

    petCreated.species = (createPetDto.species === Species.OTHER) ? createPetDto.otherSpecies : createPetDto.species; // regra de negócio

    return await petCreated.save();
  }

  async getById(id: string) { 
    const pet = await this.petModel.findById(id);
    console.log(pet);

    return pet;
  }

  async delete(id: string) {
    const pet = await this.petModel.findByIdAndDelete(id);
  }
}
