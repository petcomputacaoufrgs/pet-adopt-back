import { IsEmail, IsNotEmpty, IsOptional, IsString, IsEnum, ValidateIf } from 'class-validator';
import { Role } from '../../../core/enums/role.enum';

// Interface interna para criação de usuários com todos os campos necessários
export interface UserData {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
    role: Role;
    ngoId?: string;
}

// basic-user.dto.ts (para ADMIN)
export class BasicUserDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  password: string;
  
  @IsNotEmpty()
  @IsString()
  confirmPassword: string;
}

// ngo-member.dto.ts (para NGO_MEMBER)
export class NgoMemberDto extends BasicUserDto {
  @IsNotEmpty()
  @IsString()
  ngoId: string;
}
  