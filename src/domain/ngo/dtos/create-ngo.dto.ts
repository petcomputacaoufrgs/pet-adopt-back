import { IsNotEmpty, IsEmail, IsOptional, Max, MaxLength, max, IsIn } from 'class-validator';

export class CreateNgoDto {
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsOptional()
  @MaxLength(500)
  description: string;

  @IsNotEmpty()
  @IsEmail()
  @MaxLength(255)
  email: string;

  @IsOptional()
  @MaxLength(20)
  phone: string;

  @IsOptional()
  @MaxLength(20)
  doc: string;

  @IsOptional()
  @MaxLength(100)
  city: string;

  @IsNotEmpty()
  @MaxLength(2)
  @IsIn(['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'])
  state: string;

  @IsOptional()
  @MaxLength(255)
  website: string;

  @IsOptional()
  @MaxLength(255)
  instagram: string;

  @IsOptional()
  @MaxLength(255)
  facebook: string;

  @IsOptional()
  @MaxLength(255)
  tiktok: string;

  @IsNotEmpty()
  @MaxLength(2048)
  adoptionForm: string;

  @IsOptional()
  @MaxLength(2048)
  sponsorshipForm: string;

  @IsOptional()
  @MaxLength(2048)
  temporaryHomeForm: string;

  @IsOptional()
  @MaxLength(2048)
  claimForm: string;
}
