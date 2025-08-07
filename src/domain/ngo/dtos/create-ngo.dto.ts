import { IsNotEmpty, IsEmail, IsOptional } from 'class-validator';

export class CreateNgoDto {
  @IsNotEmpty()
  name: string;

  @IsOptional()
  description: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsOptional()
  phone: string;

  @IsOptional()
  documento: string;

  @IsOptional()
  city: string;

  @IsOptional()
  website: string;

  @IsNotEmpty()
  instagram: string;

  @IsOptional()
  facebook: string;

  @IsOptional()
  tiktok: string;

  @IsNotEmpty()
  adoptionForm: string;

  @IsOptional()
  sponsorshipForm: string;

  @IsOptional()
  temporaryHomeForm: string;

  @IsOptional()
  claimForm: string;
}
