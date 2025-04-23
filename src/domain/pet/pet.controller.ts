import * as fs from 'fs';
import * as path from 'path';
import { Body, Controller, Delete, Get, Param, Post, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { PetService } from './pet.service';
import { CreatePetDto } from './dtos/create-pet.dto';
import { ApiTags } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
const MAX_PHOTOS = 10;

@ApiTags('pets')
@Controller('pets')
export class PetController {
  constructor(private petService: PetService) {}

  @Get()
  getAll() {
    return this.petService.getAll();
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
   }),
 )
 async createWithPhotos(
   @UploadedFiles() files: Express.Multer.File[],
   @Body() createPetDto: CreatePetDto,
 ) {
   if (files.length < 2 || files.length > MAX_PHOTOS) {
     // Apaga os arquivos da pasta de uploads
     files.forEach((file) => {
       const filePath = path.join('./uploads', file.filename);
       if (fs.existsSync(filePath)) {
         fs.unlinkSync(filePath);
       }
     });
     throw new Error('O número de fotos deve ser entre 2 e 10.');
   }

   const photoPaths = files.map((file) => `/uploads/${file.filename}`);
   createPetDto.photos = photoPaths; // Associa os caminhos das fotos ao DTO

   return this.petService.create(createPetDto);
 }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.petService.getById(id);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    this.petService.delete(id);
  }

 
}
