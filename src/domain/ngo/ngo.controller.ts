import { Body, Controller, Delete, Get,Query ,Param, Patch, Post } from '@nestjs/common';
import { NgoService } from './ngo.service';
import { CreateNgoDto } from './dtos/create-ngo.dto';
import { UpdateNgoDto } from './dtos/update-ngo.dto';
import { ApiTags } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { HasSocialMediaPipe } from 'src/core/pipes/has-social-media.pipe';

@ApiTags('ngos')
@Controller('ngos')
export class NgoController {
  constructor(private ngoService: NgoService) {}

  @Get()
  getAll(@Query() query: any) {
    return this.ngoService.getAll(query);
  }

  @Post()
  create(@Body(ValidationPipe, HasSocialMediaPipe) createNgoDto: CreateNgoDto) {
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

  @Patch(':id')
  update(@Param('id') id: string, @Body(ValidationPipe) updateNgoDto: UpdateNgoDto) {
    this.ngoService.update(id, updateNgoDto);
  }
}
