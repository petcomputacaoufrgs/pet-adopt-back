import { Body, Controller, Delete, Get, Param, Query, Patch, Post, ValidationPipe } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dtos/create-user.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
import { ApiTags } from '@nestjs/swagger';
import { Role } from '../../core/enums/role.enum';

import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/core/guards/roles.guard';
import { Roles } from 'src/core/decorators/roles.decorator';

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}
  
  


  @Get()
  getAll(@Query () query: any) {
    return this.userService.getAll(query);
  }

  @Get('unapprovedMembers/:ngoId')
  getUnapprovedMembers(@Param('ngoId') ngoId: string, @Query() query: any) {
    return this.userService.getUnapprovedMembers(ngoId, query);
  }

 

  @Get('approvedMembers/:ngoId')
  getAnapprovedMembers(@Param('ngoId') ngoId: string, @Query() query: any) {
    return this.userService.getApprovedMembers(ngoId, query);
  }

  @Get(':name')
  getByName(@Param('name') name: string) {
    return this.userService.getByName(name);
  }
  
  @Get(':id')
  getById(@Param('id') id: string) {
    return this.userService.getById(id);
  }


  @Get('role/:role')
  getByRole(@Param('role') role: Role) {
    return this.userService.getByRole(role);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    this.userService.delete(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body(ValidationPipe) updateUserDto: UpdateUserDto) {
    this.userService.update(id, updateUserDto);
  }

  @Patch(':id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.NGO_ADMIN)
  async approveNgo(@Param('id') id: string) {
    return this.userService.approve(id);
  }
}