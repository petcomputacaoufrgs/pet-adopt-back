import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { NgoService } from './ngo.service';
import { CreateNgoDto } from './dtos/create-ngo.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('ngos')
@Controller('ngos')
export class NgoController {
  constructor(private ngoService: NgoService) {}

  @Get()
  getAll() {
    return this.ngoService.getAll();
  }

  @Post()
  create(@Body() createNgoDto: CreateNgoDto) {
    this.ngoService.create(createNgoDto);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.ngoService.getById(id);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    this.ngoService.delete(id);
  }
}
