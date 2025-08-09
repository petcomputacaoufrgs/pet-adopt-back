import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './schemas/user.schema';
import { Model } from 'mongoose';
import { CreateUserDto } from './dtos/create-user.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
import { Role } from 'src/core/enums/role.enum';	
import { filter } from 'rxjs';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {} // uso da classe User do schema

  async getAll(filters: any = {}) {
    // Remove filtros vazios
    Object.keys(filters).forEach(key => {
      if (!filters[key]) delete filters[key];
      if (typeof filters[key] === 'string') filters[key] = filters[key].replace(/^"+|"+$/g, '').replace(/^'+|'+$/g, '');
      });

    
    if(filters.role) filters.role = filters.role.toUpperCase(); 

    const users = await this.userModel.find(filters); // .populate('NGO');Popula o campo NGO se existir

    return users;
  }

  async create(createUserDto: CreateUserDto) {
    if (createUserDto.role === Role.NGO_MEMBER && !createUserDto.ngoId) {
      throw new Error('NGO is required when role is NGO_MEMBER');
    }
    
    if (createUserDto.role === Role.ADMIN && createUserDto.ngoId) {
      throw new Error('NGO is not required when role is ADMIN');
    }
  
    const userCreated = new this.userModel(createUserDto);
    return await userCreated.save();
  }

  async getById(id: string) {
    const user = await this.userModel.findById(id);
    return user;
  }

  async getByName(name: string): Promise<User | undefined>{
    return await this.userModel.findOne({name});
  }

  async getByEmail(email: string): Promise<User | undefined> {
    return await this.userModel.findOne({ email }).select('+password');
  }

  async getByRole(role: Role): Promise<User[]> {
    return await this.userModel.find({ role });
  }

  async delete(id: string) {
    const user = await this.userModel.findByIdAndDelete(id);
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const userUpdated = await this.userModel.findByIdAndUpdate(id, updateUserDto, { new: true });
    return await userUpdated.save();
  }
}
