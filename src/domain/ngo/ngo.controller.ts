import { Body, Controller, Delete, Get,Query ,Param, Patch, Post } from '@nestjs/common';
import { NgoService } from './ngo.service';
import { UpdateNgoDto } from './dtos/update-ngo.dto';
import { ApiTags } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { HasSocialMediaPipe } from 'src/core/pipes/has-social-media.pipe';

import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/core/guards/roles.guard';
import { Roles } from 'src/core/decorators/roles.decorator';
import { Role } from 'src/core/enums/role.enum';

@ApiTags('ngos')
@Controller('ngos')
export class NgoController {
  constructor(private ngoService: NgoService) {}

  @Get()
  getAll(@Query() query: any) {
    return this.ngoService.getAll(query);
  }

  @Get('/unapproved')
  getUnapproved() {
    return this.ngoService.getUnapproved();
  }

  @Get('/approved')
  getApproved() {
    return this.ngoService.getApproved();
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.ngoService.getById(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async deleteNgo(@Param('id') id: string) {
    return this.ngoService.delete(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body(ValidationPipe) updateNgoDto: UpdateNgoDto) {
    return this.ngoService.update(id, updateNgoDto);
  }

  @Patch(':id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async approveNgo(@Param('id') id: string) {
    return this.ngoService.approve(id);
  }
}
