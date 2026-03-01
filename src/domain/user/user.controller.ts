import { Body, Controller, Delete, Get, Param, Query, Patch, Post, ValidationPipe, Request } from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDto } from './dtos/update-user.dto';
import { ApiTags } from '@nestjs/swagger';
import { Role } from '../../core/enums/role.enum';

import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/core/guards/roles.guard';
import { Roles } from 'src/core/decorators/roles.decorator';
import { NgoOwnershipGuard } from 'src/core/guards/ngo-ownership.guard';
import { NgoOwnership } from 'src/core/decorators/ngo-ownership.decorator';
import { SelfOrNgoOwnershipGuard } from 'src/core/guards/self-or-ngo-ownership.guard';
import { SelfOrNgoOwnership } from 'src/core/decorators/self-or-ngo-ownership.decorator';

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  getAll(@Query () query: any) {
    return this.userService.getAll(query);
  }

  @Get('unapprovedMembers/:ngoId')
  @UseGuards(JwtAuthGuard, RolesGuard, NgoOwnershipGuard)
  @Roles(Role.ADMIN, Role.NGO_ADMIN)
  @NgoOwnership({ resourceIdParam: 'ngoId', paramIsNgoId: true })
  getUnapprovedMembers(@Param('ngoId') ngoId: string, @Query() query: any) {
    return this.userService.getUnapprovedMembers(ngoId, query);
  }

  @Get('approvedMembers/:ngoId')
  @UseGuards(JwtAuthGuard, RolesGuard, NgoOwnershipGuard)
  @Roles(Role.ADMIN, Role.NGO_ADMIN)
  @NgoOwnership({ resourceIdParam: 'ngoId', paramIsNgoId: true })
  getApprovedMembers(@Param('ngoId') ngoId: string, @Query() query: any) {
    return this.userService.getApprovedMembers(ngoId, query);
  }


  @Get('approvedMembers/page/:ngoId') 
  @UseGuards(JwtAuthGuard, RolesGuard, NgoOwnershipGuard)
  @Roles(Role.ADMIN, Role.NGO_ADMIN)
  @NgoOwnership({ resourceIdParam: 'ngoId', paramIsNgoId: true })
  getApprovedMembersPage(@Param('ngoId') ngoId: string, @Query() query: any) {
    return this.userService.getPage(ngoId, query, true);
  }

  @Get('unapprovedMembers/page/:ngoId') 
  @UseGuards(JwtAuthGuard, RolesGuard, NgoOwnershipGuard)
  @Roles(Role.ADMIN, Role.NGO_ADMIN)
  @NgoOwnership({ resourceIdParam: 'ngoId', paramIsNgoId: true })
  getUnapprovedMembersPage(@Param('ngoId') ngoId: string, @Query() query: any) {
    return this.userService.getPage(ngoId, query, false);
  }

  // Visualizar usuário: própria conta, ADMIN ou NGO_ADMIN da mesma ONG
  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, SelfOrNgoOwnershipGuard)
  @Roles(Role.ADMIN, Role.NGO_ADMIN, Role.NGO_MEMBER)
  @SelfOrNgoOwnership({ 
    userIdParam: 'id', 
    allowSelf: true, 
    allowNgoOwnership: true,
    checkInService: true 
  })
  getById(@Param('id') id: string, @Request() req: any) {    
    return this.userService.getById(id, req.userNgoId);
  }
  
  @Get('name/:name')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  getByName(@Param('name') name: string) {
    return this.userService.getByName(name);
  }

  @Get('role/:role')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  getByRole(@Param('role') role: Role) {
    return this.userService.getByRole(role);
  }

  // Deletar usuário: ADMIN ou NGO_ADMIN da mesma ONG
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, SelfOrNgoOwnershipGuard)
  @Roles(Role.ADMIN, Role.NGO_ADMIN)
  @SelfOrNgoOwnership({ 
    userIdParam: 'id',
    allowSelf: false, // Não permite deletar a própria conta
    allowNgoOwnership: true,
    checkInService: true 
  })
  delete(@Param('id') id: string, @Request() req: any) {
    return this.userService.delete(id, req.userNgoId);
  }

  // Editar usuário: somente própria conta
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, SelfOrNgoOwnershipGuard)
  @Roles(Role.ADMIN, Role.NGO_ADMIN, Role.NGO_MEMBER)
  @SelfOrNgoOwnership({ 
    userIdParam: 'id', 
    allowSelf: true, 
    allowNgoOwnership: false,
    checkInService: true 
  })
  update(@Param('id') id: string, @Body(ValidationPipe) updateUserDto: UpdateUserDto, @Request() req: any) {
    return this.userService.update(id, updateUserDto, req.userNgoId);
  }
  // Aprovar membro: NGO_ADMIN da mesma ONG
  @Patch(':id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard, NgoOwnershipGuard)
  @Roles(Role.NGO_ADMIN)
  @NgoOwnership({ resourceIdParam: 'id', checkInService: true })
  async approveNgo(@Param('id') id: string, @Request() req: any) {
    return this.userService.approve(id, req.userNgoId);
  }
}