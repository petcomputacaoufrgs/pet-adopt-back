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


  // TO DO: Aplicar paginação corretamente no front usando esse método aqui
  // A ideia é "emburrecer" a paginação no front e deixar tudo controlado por aqui. 
  // Independente do tamanho da página no front, aqui sempre será <limit> itens por página
  async getPage(filters: any = {}, page: number = 1, limit: number = 12) {
    // Remove filtros vazios

    Object.keys(filters).forEach(key => {
      if (!filters[key]) delete filters[key];
    });

    if (filters.species) filters.species = filters.species.toLowerCase();
    if (filters.size) filters.size = filters.size.toUpperCase();

    // Se page < 1, força ser 1 para evitar erro
    const currentPage = Math.max(1, page);
    const skip = (currentPage - 1) * limit;

    const [data, total] = await Promise.all([
      this.petModel.find(filters)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.petModel.countDocuments(filters).exec()
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        total,
        page: currentPage,
        lastPage: totalPages,
        hasNextPage: currentPage < totalPages,
        hasPreviousPage: currentPage > 1,
      }
    };
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
    const existingPet = await this.petModel.findById(id);
    if (!existingPet) return null;


    const newUploadedPaths = updatePetDto.photos || [];
    const photoOrder = JSON.parse(updatePetDto.photoOrder) || [];


    let finalPhotoList: string[] = [];

    // Se o frontend enviou uma ordem, seguimos ela estritamente
    if (photoOrder.length > 0) {
      let uploadIndex = 0;

      finalPhotoList = photoOrder.map((item) => {
        if (item === 'NEW_FILE_MARKER') {
          // Pega o próximo arquivo da fila de novos uploads
          const path = newUploadedPaths[uploadIndex];
          uploadIndex++;
          return path;
        }
        return item;
      }).filter((item) => item); // Remove undefined caso haja mais marcadores que arquivos (segurança)
      
    } else {
      // Fallback: Se não mandou photoOrder, só dá um append das fotos antigas com as novas
      const oldPhotos = existingPet.photos || [];
      finalPhotoList = [...oldPhotos, ...newUploadedPaths];
    }

    finalPhotoList = [...new Set(finalPhotoList)];


    const updatedPet = await this.petModel.findByIdAndUpdate(
      id,
      { ...updatePetDto, photos: finalPhotoList },
      { new: true, runValidators: true }
    );
    
    const photosToDelete = (existingPet.photos || []).filter(
      (oldPath) => !finalPhotoList.includes(oldPath)
    );

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
