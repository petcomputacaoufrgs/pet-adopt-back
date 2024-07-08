//import { IsNotEmpty, validate, ValidationError } from 'class-validator';

export class CreateNgoDto {

    name: string;
    description?: string;
    email: string;
    phone?: string;
    cnpj?: string;
    city?: string;
    website?: string;
    instagram?: string;
    facebook?: string;
    x?: string;
    adoptionForm: string;
    sponsorshipForm?: string;
    temporaryHomeForm?: string;
    claimForm?: string;
}