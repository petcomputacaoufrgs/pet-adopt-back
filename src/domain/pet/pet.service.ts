import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
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


  async getPage(filters: any = {}, page: number = 1, limit: number = 12) {
    console.log('Received filters:', filters);
    
    // Remove filtros vazios
    Object.keys(filters).forEach(key => {
      if (!filters[key]) delete filters[key];
    });

    // Transforma os campos de texto para Exato + Case Insensitive
    const textFields = ['name', 'breed', 'city'];
    textFields.forEach(field => {
      if (filters[field]) {
        // Escapa a string para evitar que o usuário digite símbolos que quebrem o banco
        const safeVal = filters[field].replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        
        // ^ = início, $ = fim, i = case-insensitive
        filters[field] = { $regex: `^${safeVal}$`, $options: 'i' };
      }
    });

    // Os outros campos que já tinham padrão fixo
    if (filters.species) filters.species = filters.species.toLowerCase();
    if (filters.size) filters.size = filters.size.toUpperCase();

    // Paginação
    let currentPage = Math.max(1, page);
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
        limit: limit
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

    async updatePartial(id: string, updatePetDto: UpdatePetDto, userNgoId?: string) {
    const existingPet = await this.petModel.findById(id);
    if (!existingPet) return null;

    // Verificar ownership se userNgoId foi fornecido (via guard)
    if (userNgoId && existingPet.ngoId !== userNgoId) {
      throw new ForbiddenException('Você não tem permissão para editar este animal');
    }


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
      { ...updatePetDto, photos: finalPhotoList, species: updatePetDto.species === Species.OTHER ? updatePetDto.otherSpecies : updatePetDto.species },
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


  async delete(id: string, userNgoId?: string) {
    const pet = await this.petModel.findById(id);
    if (!pet) {
      return null;
    }

    // Verificar ownership se userNgoId foi fornecido (via guard)
    if (userNgoId && pet.ngoId !== userNgoId) {
      throw new ForbiddenException('Você não tem permissão para deletar este animal');
    }
    
    const deletedPet = await this.petModel.findByIdAndDelete(id);
    
    if (deletedPet) {
      // Deleta as fotos físicas
      if (deletedPet.photos && deletedPet.photos.length > 0) {
        await this.deletePhotoFiles(deletedPet.photos);
      }
      
      // Remove da coleção de estatísticas (recent pets)
      await this.statisticsService.removeRecentPet(deletedPet._id);
    }
    
    return { deleted: true, pet: deletedPet };
  }

  async deleteByNgoId(ngoId: string, session?: any) {
    // Busca todos os pets da ONG para deletar as fotos
    const petsToDelete = await this.petModel.find({ ngoId }).session(session);
    
    // Deleta os documentos do banco
    await this.petModel.deleteMany({ ngoId }).session(session);
    
    // Deleta as fotos físicas de todos os pets
    const allPhotos = petsToDelete.flatMap(pet => pet.photos || []);
    if (allPhotos.length > 0) {
      await this.deletePhotoFiles(allPhotos);
    }
    
    // Remove os pets da coleção de estatísticas (recent pets)
    const petIds = petsToDelete.map(pet => pet._id);
    for (const petId of petIds) {
      await this.statisticsService.removeRecentPet(petId);
    }
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
