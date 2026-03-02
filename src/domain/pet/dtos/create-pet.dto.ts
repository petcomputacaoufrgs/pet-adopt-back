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

  import { Transform } from 'class-transformer';

  // import { IsSponsorshipRequired } from './is-sponsorship-required';
  import { Species } from 'src/core/enums/species.enum';
  import { Age } from 'src/core/enums/age.enum';
  
  export class CreatePetDto {
    @IsNotEmpty()
    @MaxLength(20)
    name: string;
  
    @IsNotEmpty()
    @IsEnum(Age)
    @MaxLength(15)
    age: string;
  
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
    @MaxLength(20)
    breed: string;
  
    @IsNotEmpty()
    @MaxLength(500)
    characteristics: string;
  
    @IsNotEmpty()
    @MaxLength(255)
    ngoId: string;
  
    @IsNotEmpty()
    @IsIn(['Available', 'Adopted', 'TempHome'])
    status: string;
  
    @IsBoolean()
    @IsNotEmpty()
    @Transform(({ value }) => {
    // Converte string "true"/"false" para booleano real
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
    })
    forTempHome: boolean;
  
    @IsBoolean()
    @IsNotEmpty()
    @Transform(({ value }) => {
    // Converte string "true"/"false" para booleano real
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
    })
    forAdoption: boolean;
  
    @IsOptional()
    @IsArray()
    photos: string[];
  
    @IsNotEmpty()
    @IsString()
    @MaxLength(100)
    city: string;
  
    @IsNotEmpty()
    @IsString()
    @MaxLength(2)
    @IsIn(['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'])
    state: string;
  
    @IsOptional()
    @MaxLength(255)
    observations: string;

    @IsOptional()
    photoOrder: string;
  }
  
