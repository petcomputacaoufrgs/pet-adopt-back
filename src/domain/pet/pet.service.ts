import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Pet } from './schemas/pet.schema';
import { Model, Types } from 'mongoose';
import { CreatePetDto } from './dtos/create-pet.dto';
import { UpdatePetDto } from './dtos/update-pet.dto';
import { Species } from 'src/core/enums/species.enum';
import { StatisticsService } from '../statistics/statistics.service';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class PetService {
  constructor(@InjectModel(Pet.name) private petModel: Model<Pet>, private statisticsService: StatisticsService) {}

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

    // Salvar id na coleção statistics
    await this.statisticsService.addRecentPet(petCreated._id);

    return await petCreated.save();
  }

 async getById(id: string) { 
  try {
    // Verifica se o id é válido
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid pet ID format');
    }

    const pet = await this.petModel.findById(id);
    if (!pet) {
      throw new NotFoundException('Pet not found');
    }

    return pet;
  } catch (error) {
    if (error instanceof NotFoundException) {
      throw error;
    }
    throw new NotFoundException('Pet not found');
  }
 }

  async getRecentPets() {
    const petIds = await this.statisticsService.getRecentPetIDs();
    if (!petIds.length) return [];

    // Uma única query para buscar todos os pets
    const pets = await this.petModel.find({
        '_id': { $in: petIds }
    });

    // Mantém a ordem original dos IDs
    return petIds
      .map(id => pets.find(pet => pet._id.equals(id)))
      .filter(Boolean);
  }

  async updatePartial(id: string, updatePetDto: UpdatePetDto) {
    const existingPet = await this.petModel.findById(id.toString());
    if (!existingPet) return null;

    let finalPhotoList: string[] = [];

    // Se temos uma ordem definida vindo do front
    if (updatePetDto.photoOrder) {
        // Faz o parse do JSON string para array
        const orderMap = JSON.parse(updatePetDto.photoOrder) as string[];
        
        // Criamos uma cópia mutável da lista de arquivos novos para ir consumindo
        // O Multer garante que a ordem do array 'photos' é a mesma ordem do append no frontend
        const newFilesQueue = updatePetDto.photos ? [...updatePetDto.photos] : [];

        finalPhotoList = orderMap.map(item => {
            if (item === "NEW_FILE_MARKER") {
                // Se é um marcador, pegamos o próximo arquivo da fila
                return newFilesQueue.shift();
            } else {
                // Se não é marcador, é a URL antiga
                return item;
            }
        }).filter(item => item !== null) as string[]; // Remove possíveis nulos
        
    } else {
        // FALLBACK: Se por algum motivo não veio o photoOrder (não deveria acontecer), mantemos as fotos existentes
        finalPhotoList = existingPet.photos; 
    }

    // Atualizar documento no banco (sobrescreve campo photos com a lista final)
    const updatedPet = await this.petModel.findByIdAndUpdate(
      id,
      { ...updatePetDto, photos: finalPhotoList },
      { new: true, runValidators: true }
    );

    // depois da atualização, remover os ficheiros que não serão mantidos
    const photosToDelete = (existingPet.photos ?? []).filter(p => !finalPhotoList.includes(p));
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
