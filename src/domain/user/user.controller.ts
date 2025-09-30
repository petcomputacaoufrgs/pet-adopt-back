import { Body, Controller, Delete, Get, Param, Query, Patch, Post, ValidationPipe } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dtos/create-user.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
import { ApiTags } from '@nestjs/swagger';
import { Role } from '../../core/enums/role.enum';

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @Get()
  getAll(@Query () query: any) {
    return this.userService.getAll(query);
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
}