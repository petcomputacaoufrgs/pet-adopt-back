import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Pet } from './schemas/pet.schema';
import { Model } from 'mongoose';
import { CreatePetDto } from './dtos/create-pet.dto';

@Injectable()
export class PetService {
  constructor(@InjectModel(Pet.name) private petModel: Model<Pet>) {}

  async getAll() {
    const pets = await this.petModel.find({});

    return pets;
  }

  async create(createPetDto: CreatePetDto) {
    const petCreated = new this.petModel(createPetDto);

    // validate species for otherSpecies property
    // if is OTHER we put the value as the value in otherSpecies
    // if not, we just store the value of species

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
