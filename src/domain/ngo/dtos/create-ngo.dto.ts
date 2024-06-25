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

    // Método de validação customizado
    //async validateSocialMedia(): Promise<ValidationError[]> {
        //if (!this.x && !this.facebook && !this.instagram) {
            //return [new ValidationError({
                //property: 'socialMedia',
                //constraints: {
                    //oneOf: 'At least one of x, facebook, or instagram must be provided',
                //},
            //})];
        //}
        //return [];
    //}
    
}