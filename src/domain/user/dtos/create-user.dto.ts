import { IsEmail, IsNotEmpty, IsOptional, IsString, IsEnum, ValidateIf } from 'class-validator';
import { Role } from '../../../core/enums/role.enum';

export class CreateUserDto {
    @IsNotEmpty()
    @IsString()
    name: string;

    @IsEmail({}, { message: 'Invalid Email' })
    email: string;

    @IsNotEmpty()
    @IsString()
    password: string;
    confirmPassword: string;

    @IsNotEmpty()
    @IsEnum(Role, {message: 'Invalid Role'})
    role: Role;

    @ValidateIf((o) => o.role === Role.NGO_MEMBER)
    @IsNotEmpty({ message: 'NGO is required when role is NGO_MEMBER' })
    @IsString()
    NGO: string;

   
}
  