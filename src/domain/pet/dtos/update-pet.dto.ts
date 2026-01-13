import { PartialType } from '@nestjs/mapped-types';
import { CreatePetDto } from './create-pet.dto';
import { IsArray, IsOptional, ArrayMaxSize } from 'class-validator';

export class UpdatePetDto extends PartialType(CreatePetDto) {
    @IsOptional()
    @IsArray()
    @ArrayMaxSize(10)
    existingPhotos: string[];

    @IsOptional()
    photoOrder: string;
}