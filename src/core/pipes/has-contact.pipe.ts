import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class HasContactPipe implements PipeTransform {
  transform(value: any) {
    // Se o valor tem a propriedade 'ngo', valida dentro dela (caso NgoSignupDto)
    // Caso contrário, valida diretamente (caso CreateNgoDto ou UpdateNgoDto)
    const ngoData = value.ngo || value;
    
    const hasSocialMedia =
      ngoData.facebook ||
      ngoData.instagram ||
      ngoData.twitter ||
      ngoData.tiktok ||
      ngoData.website ||
      ngoData.phone;
    if (!hasSocialMedia) {
      throw new BadRequestException(
        'NGO must have at least one contact information.',
      );
    }
    return value;
  }
}
