import { IsNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { BasicUserDto } from '../../../domain/user/dtos/create-user.dto';
import { CreateNgoDto } from '../../../domain/ngo/dtos/create-ngo.dto';

// DTO para cadastro de ONG valida ambos os DTO's de usuário e ONG,
// para garantir que os todos os dados estejam corretos antes de criar a ONG e a conta institucional.
export class NgoSignupDto {
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => BasicUserDto) // Tipo basic (sem ngoId) pois ngo ainda não foi criada
  readonly user: BasicUserDto;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => CreateNgoDto)
  readonly ngo: CreateNgoDto;
}