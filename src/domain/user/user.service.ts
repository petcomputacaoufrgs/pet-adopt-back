import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './schemas/user.schema';
import { Model } from 'mongoose';
import { CreateUserDto } from './dtos/create-user.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async getAll() {
    const users = await this.userModel.find({});

    return users;
  }

  async create(createUserDto: CreateUserDto) {
    const userCreated = new this.userModel(createUserDto);

    return await userCreated.save();
  }

  async getById(id: string) {
    const user = await this.userModel.findById(id);
    return user;
  }

  async delete(id: string) {
    const user = await this.userModel.findByIdAndDelete(id);
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const userUpdated = await this.userModel.findByIdAndUpdate(id, updateUserDto, { new: true });
    return await userUpdated.save();
  }
}
