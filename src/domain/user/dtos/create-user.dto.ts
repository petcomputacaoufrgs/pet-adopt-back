import { IsEmail, IsNotEmpty, IsOptional, IsString, IsEnum } from 'class-validator';
import { Role } from '../../../core/enums/role.enum';

export class CreateUserDto {
    @IsEmail({}, { message: 'Invalid Email' })
    email: string;

    @IsNotEmpty()
    @IsString()
    password: string;
    confirmPassword: string;

    @IsOptional()
    @IsString()
    NGO: string;

    @IsNotEmpty()
    @IsEnum(Role, {message: 'Invalid Role'})
    role: Role;
  }
  