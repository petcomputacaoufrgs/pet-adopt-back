import { Body, Controller, Delete, Get, Param, Post, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { PetService } from './pet.service';
import { CreatePetDto } from './dtos/create-pet.dto';
import { ApiTags } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
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
  create(@Body(ValidationPipe) createPetDto: CreatePetDto) {
    this.petService.create(createPetDto);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.petService.getById(id);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    this.petService.delete(id);
  }

  @Post('upload')
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
    const photoPaths = files.map((file) => `/uploads/${file.filename}`);
    createPetDto.photos = photoPaths; // Associa os caminhos das fotos ao DTO

    return this.petService.create(createPetDto);
  }
}
