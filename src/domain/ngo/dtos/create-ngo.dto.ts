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
    cnpj: string;

    @IsOptional()
    city: string;

    @IsOptional()
    website: string;

    @IsOptional()
    instagram: string;

    @IsOptional()
    facebook: string;

    @IsNotEmpty()
    adoptionForm: string;

    @IsOptional()
    sponsorshipForm: string;

    @IsOptional()
    temporaryHomeForm: string;

    @IsOptional()
    claimForm: string;
}