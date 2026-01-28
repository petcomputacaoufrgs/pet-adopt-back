// pet.controller.ts

import { Body, Controller, Delete, Get, Param, Post, Patch, Query, UseInterceptors, UploadedFiles, UsePipes, BadRequestException, NotFoundException } from '@nestjs/common';
import { PetService } from './pet.service';
import { CreatePetDto } from './dtos/create-pet.dto';
import { UpdatePetDto } from './dtos/update-pet.dto';
import { ApiTags } from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import { PhotoValidationPipe } from 'src/core/pipes/photo-validation.pipe';
import { Throttle } from '@nestjs/throttler';

const MAX_PHOTOS = 10;

@ApiTags('pets')
@Controller('pets')
export class PetController {
  constructor(private petService: PetService) {}

  // Leitura pública - permite mais requisições
  @Throttle({ default: { limit: 30, ttl: 60000 } }) // 30 req/min
  @Get()
  getAll(@Query() query: any) {
    return this.petService.getAll(query);
  }

  // TO DO: Aplicar paginação corretamente no front usando esse método aqui
  @Throttle({ default: { limit: 30, ttl: 60000 } }) // 30 req/min
  @Get('page')
  getPage(@Query() query: any, @Query('page') page: number = 1, @Query('limit') limit: number = 12) { 
    return this.petService.getPage(query, page, limit);
  }

  @Throttle({ default: { limit: 30, ttl: 60000 } }) // 30 req/min
  @Get('recent')
    async getRecentPets() {
        return this.petService.getRecentPets();
  }

  @Throttle({ default: { limit: 50, ttl: 60000 } }) // 50 req/min
  @Get(':id')
  getById(@Param('id') id: string) {
    return this.petService.getById(id);
  }

  @Get('ngo/:ngoId')
  getByNgoId(@Param('ngoId') ngoId: string, @Query() query: any) {
    //return this.petService.getByNgoId(ngoId, query);
  }
  
  @Post()
  @UseInterceptors(
    FilesInterceptor('photos', MAX_PHOTOS, {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, callback) => {
          const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
          callback(null, uniqueName);
        },
      }),
      fileFilter: (req, file, callback) => {
        if (file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
          callback(null, true);
        } else {
          callback(new BadRequestException('File format not supported!'), false);
        }
      },
    }),
  )
  async createWithPhotos(
    @UploadedFiles(new PhotoValidationPipe()) files: Express.Multer.File[],
    @Body() createPetDto: CreatePetDto,
  ) {    
    if (!files || files.length === 0) {
        throw new BadRequestException('At least one photo is required.');
    }

    if (files.length > MAX_PHOTOS) {
        throw new BadRequestException(`A maximum of ${MAX_PHOTOS} photos are allowed.`);
    }

   const photoPaths = files.map((file) => `/uploads/${file.filename}`);
   createPetDto.photos = photoPaths;

   return this.petService.create(createPetDto);
 }

  @Patch(':id')
  @UseInterceptors(
    FilesInterceptor('photos', MAX_PHOTOS, {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, callback) => {
          const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
          callback(null, uniqueName);
        },
      }),
      fileFilter: (req, file, callback) => {
        if (file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
          callback(null, true);
        } else {
          callback(new BadRequestException('File format not supported!'), false);
        }
      },
    }),
  )
  async updatePet(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Body() updatePetDto: UpdatePetDto,
  ) {
    

    // Se novas fotos foram enviadas, adiciona os caminhos
    if (files && files.length > 0) {
      const photoPaths = files.map((file) => `/uploads/${file.filename}`);
      updatePetDto.photos = photoPaths;
    }

    const updatedPet = await this.petService.updatePartial(id, updatePetDto);
    
    if (!updatedPet) {
      throw new NotFoundException('Pet not found');
    }

    return updatedPet;
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    const result = await this.petService.delete(id);
    
    if (!result) {
      throw new NotFoundException('Pet not found');
    }
    
    return result;
  }
}