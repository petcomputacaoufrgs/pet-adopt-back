import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './schemas/user.schema';
import { Model } from 'mongoose';
import { BasicUserDto, NgoMemberDto, UserData } from './dtos/create-user.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
import { Role } from 'src/core/enums/role.enum';	
import { filter } from 'rxjs';
import { NotFoundException } from '@nestjs/common';
import { Ngo } from '../ngo/schemas/ngo.schema';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {} // Uso da classe User do schema

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

  async create(createUserDto: UserData, session?: any) {
    // Validação: se é role de NGO, deve ter ngoId
    const ngoRoles = [Role.NGO_MEMBER_PENDING, Role.NGO_ADMIN_PENDING];
    if (ngoRoles.includes(createUserDto.role) && !createUserDto.ngoId) {
      throw new Error('ngoId é obrigatório para usuários de ONG');
    }

    // Validação: deve ser admin, ngo_admin_pending ou ngo_member_pending
    const validRoles = [Role.ADMIN, ...ngoRoles];
    if (!validRoles.includes(createUserDto.role)) {
      throw new Error('Role inválida para criação de usuário');
    }

    const userCreated = new this.userModel(createUserDto);
    
    if (session) {
      return await userCreated.save({ session });
    } else {
      return await userCreated.save();
    }
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

  async getUnapprovedMembers(ngoId: string, filters: any = {}): Promise<User[]> {
    const query: any = { ngoId, role: Role.NGO_MEMBER_PENDING };
    if (filters.name) {
      query.name = { $regex: new RegExp(filters.name, 'i') };
    }
    return await this.userModel.find(query);
  }

  async getApprovedMembers(ngoId: string, filters: any = {}): Promise<User[]> {
    const query: any = { ngoId, role: Role.NGO_MEMBER };

    if (filters.name) {
      query.name = { $regex: new RegExp(filters.name, 'i') };
    }

    return await this.userModel.find(query);
  }
  
  async deleteByNgoId(ngoId: string, session: any) {
    const result = await this.userModel.deleteOne({ ngoId }, { session });

    // Registra se nenhum usuário foi encontrado
    if (result.deletedCount === 0) {
      console.warn(`No user found with ngoId: ${ngoId}`);
    }
    
    return result;
  }

  async update(id: string, updateUserDto: UpdateUserDto, session?: any) {
    const userUpdated = await this.userModel.findByIdAndUpdate(id, updateUserDto, { new: true, session });
    if (!userUpdated) {
      throw new NotFoundException('User not found');
    }
    return userUpdated;
  }

  async updateUserRoleByNgoId(ngoId: string, newRole: string, session: any): Promise<User> {
    const user = await this.userModel.findOneAndUpdate(
        { ngoId: ngoId },
        { role: newRole },
        { new: true, session }
    ).exec();
    if (!user) {
        throw new NotFoundException('User for this NGO not found.');
    }
    return user;
  }

  async approve(id: string): Promise<User> {
    const user = await this.userModel.findByIdAndUpdate(id, {role: Role.NGO_MEMBER }, { new: true });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }
}