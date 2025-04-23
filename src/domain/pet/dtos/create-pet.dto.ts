import {
    IsNotEmpty,
    IsOptional,
    MaxLength,
    IsEnum,
    IsIn,
    IsDateString,
    Length,
    IsNumber,
    IsBoolean,
    IsString,
    ValidateIf,
    ArrayMinSize,
    IsArray,
    ArrayMaxSize,
  } from 'class-validator';
  // import { IsSponsorshipRequired } from './is-sponsorship-required';
  import { Species } from 'src/core/enums/species.enum';
  
  export class CreatePetDto {
    @IsNotEmpty()
    @MaxLength(20)
    name: string;
  
    @IsNotEmpty()
    @IsNumber()
    age: number;
  
    @IsNotEmpty()
    @IsIn(['F', 'M'])
    sex: string;
  
    @IsNotEmpty()
    @IsEnum(Species)
    species: Species;
  
    @ValidateIf((o) => o.species === Species.OTHER)
    @IsNotEmpty()
    @IsString()
    otherSpecies: string;
  
    @ValidateIf((o) => o.species === Species.DOG)
    @IsNotEmpty()
    @IsIn(['G', 'M', 'P'])
    @IsString()
    size: string;
  
    @IsOptional()
    breed: string;
  
    @IsNotEmpty()
    characteristics: string;
  
    @IsNotEmpty()
    NGO: string;
  
    @IsNotEmpty()
    @IsIn(['Available', 'Adopted', 'TempHome'])
    status: string;
  
    @IsBoolean()
    @IsNotEmpty()
    forTempHome: boolean;
  
    @IsBoolean()
    @IsNotEmpty()
    forAdoption: boolean;
  
    @IsNotEmpty()
    @IsArray()
    @ArrayMinSize(2)
    @ArrayMaxSize(10)
    @IsString({ each: true })
    photos: string[];
  
    @IsNotEmpty()
    @IsString()
    city: string;
  
    @IsNotEmpty()
    @IsString()
    state: string;
  
    @IsOptional()
    observations: string;
  }
  
