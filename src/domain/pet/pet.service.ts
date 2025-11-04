import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Pet } from './schemas/pet.schema';
import { Model } from 'mongoose';
import { CreatePetDto } from './dtos/create-pet.dto';
import { UpdatePetDto } from './dtos/update-pet.dto';
import { Species } from 'src/core/enums/species.enum';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class PetService {
  constructor(@InjectModel(Pet.name) private petModel: Model<Pet>) {}

  async getAll(filters: any = {}) {
    // Remove filtros vazios
    Object.keys(filters).forEach(key => {
      if (!filters[key]) delete filters[key];
    });

    // Ajuste para species (exemplo: capitalize)
    if (filters.species) {
      filters.species = filters.species.toLowerCase();
    }

    if(filters.size) filters.size = filters.size.toUpperCase();

    const pets = await this.petModel.find(filters);
    return pets;
  }

  async create(createPetDto: CreatePetDto) {
    const petCreated = new this.petModel(createPetDto);

    petCreated.species = (createPetDto.species === Species.OTHER) ? createPetDto.otherSpecies : createPetDto.species;

    return await petCreated.save();
  }

  async getById(id: string) { 
    const pet = await this.petModel.findById(id);
    return pet;
  }

  async updatePartial(id: string, updatePetDto: UpdatePetDto) {
    const existingPet = await this.petModel.findById(id);
    if (!existingPet) return null;

    // Normalizar arrays recebidos
    const newPhotos = updatePetDto.photos ?? []; // fotos recém enviadas (ex: ['/uploads/xxx.jpg'])
    const keptPhotos = updatePetDto.existingPhotos ?? []; // URLs que frontend quer manter

    // Montar lista final sem duplicatas
    const photosSet = new Set<string>([...newPhotos, ...keptPhotos]);
    const photosToKeep = Array.from(photosSet);

    // Atualizar documento no banco (sobrescreve campo photos com a lista final)
    const updatedPet = await this.petModel.findByIdAndUpdate(
      id,
      { ...updatePetDto, photos: photosToKeep },
      { new: true, runValidators: true }
    );

    // depois da atualização, remover os ficheiros que não serão mantidos
    const photosToDelete = (existingPet.photos ?? []).filter(p => !photosToKeep.includes(p));
    if (photosToDelete.length > 0) {
      await this.deletePhotoFiles(photosToDelete);
    }

    return updatedPet;
  }

  async delete(id: string) {
    const pet = await this.petModel.findById(id);
    if (!pet) {
      return null;
    }
    
    const deletedPet = await this.petModel.findByIdAndDelete(id);
    
    if (deletedPet && deletedPet.photos && deletedPet.photos.length > 0) {
      await this.deletePhotoFiles(deletedPet.photos);
    }
    
    return { deleted: true, pet: deletedPet };
  }

  // Método auxiliar para deletar arquivos de foto
  private async deletePhotoFiles(photoPaths: string[]) {
    await Promise.all(
      photoPaths.map(async (photoPath) => {
        const localPath = path.join('./uploads', path.basename(photoPath));
        
        try {
          await fs.unlink(localPath);
        } catch (e) {
          if (e.code === 'ENOENT') {
            console.warn(`File not found for deletion: ${localPath}`);
          } else {
            console.error(`Error deleting file ${localPath}:`, e);
          }
        }
      }),
    );
  }
}
