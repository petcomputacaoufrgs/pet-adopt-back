import { Body, Controller, Delete, Get,Query ,Param, Patch, Post } from '@nestjs/common';
import { NgoService } from './ngo.service';
import { UpdateNgoDto } from './dtos/update-ngo.dto';
import { ApiTags } from '@nestjs/swagger';

import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/core/guards/roles.guard';
import { Roles } from 'src/core/decorators/roles.decorator';
import { Role } from 'src/core/enums/role.enum';
import { NgoOwnershipGuard } from 'src/core/guards/ngo-ownership.guard';
import { NgoOwnership } from 'src/core/decorators/ngo-ownership.decorator';

@ApiTags('ngos')
@Controller('ngos')
export class NgoController {
  constructor(private ngoService: NgoService) {}

  @Get()
  getAll(@Query() query: any) {
    return this.ngoService.getApproved(query);
  }

  @Get('/page')
  getApprovedPage(@Query() query: any) {
    return this.ngoService.getPage(query, true);
  }

  @Get('/unapproved')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  getUnapproved() {
    return this.ngoService.getUnapproved();
  }

  @Get('/unapproved/page')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  getUnapprovedPage(@Query() query: any) {
    return this.ngoService.getPage(query, false);
  }

  // Dados completos da ONG (incluindo documento) - apenas para ADMIN e NGO_ADMIN da própria ONG
  @Get(':id/details')
  @UseGuards(JwtAuthGuard, RolesGuard, NgoOwnershipGuard)
  @Roles(Role.ADMIN, Role.NGO_ADMIN)
  @NgoOwnership({ resourceIdParam: 'id', paramIsNgoId: true })
  getByIdWithDetails(@Param('id') id: string) {
    return this.ngoService.getById(id, true);
  }

  @Get(':id/is-approved')
  async isApproved(@Param('id') id: string) {
    const approved = await this.ngoService.is_approved(id);
    return { approved };
  }

  // Dados públicos da ONG (sem documento)
  @Get(':id')
  getById(@Param('id') id: string) {
    return this.ngoService.getById(id, false);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, NgoOwnershipGuard)
  @Roles(Role.ADMIN, Role.NGO_ADMIN)
  @NgoOwnership({ resourceIdParam: 'id', paramIsNgoId: true })
  async deleteNgo(@Param('id') id: string) {
    return this.ngoService.delete(id);
  }

  // Edição somente para própria ONG
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, NgoOwnershipGuard)
  @Roles(Role.NGO_ADMIN)
  @NgoOwnership({ resourceIdParam: 'id', paramIsNgoId: true })
  update(@Param('id') id: string, @Body() updateNgoDto: UpdateNgoDto) {
    return this.ngoService.update(id, updateNgoDto);
  }

  @Patch(':id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async approveNgo(@Param('id') id: string) {
    return this.ngoService.approve(id);
  }


}