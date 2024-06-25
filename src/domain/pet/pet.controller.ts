import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { PetService } from './pet.service';
import { CreatePetDto } from './dtos/create-pet.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('pets')
@Controller('pets')
export class PetController {
  constructor(private petService: PetService) {}

  @Get()
  getAll() {
    return this.petService.getAll();
  }

  @Post()
  create(@Body() createPetDto: CreatePetDto) {
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
}
