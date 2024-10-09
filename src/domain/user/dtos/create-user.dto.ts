import { Role } from '../../../core/enums/role.enum';

export class CreateUserDto {
  email: string;
  password: string;
  NGO: string;
  role: Role;
}
