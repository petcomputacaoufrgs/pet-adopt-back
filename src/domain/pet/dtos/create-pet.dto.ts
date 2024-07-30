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
  IsArray} from 'class-validator'
import { IsSizeRequiredForSpecies } from './is-size-required-for-species';
import { IsSponsorshipRequired } from './is-sponsorship-required';
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

  @ValidateIf(o => o.species === Species.OTHER)
  @IsNotEmpty()
  @IsString()
  otherSpecies: string;

  @ValidateIf(o => o.species === Species.DOG)
  @IsNotEmpty()
  @IsIn(['G','M','P'])
  @IsString()
  size: string;

  @IsOptional()
  breed: string;

  @IsNotEmpty()
  characteristics: string;

  @IsNotEmpty()
  NGO: string;

  @IsNotEmpty()
  @IsIn(['Disponivel', 'Adotado', 'Em lar temporario'])	
  status: string;

  @IsBoolean()
  @IsOptional()
  sponsorship: boolean;

  //@IsSponsorshipRequired({ message: 'Sponsorship modalities are required when sponsorship is true' })
  //sponsorshipModalities: string[];
  
  @IsNotEmpty()
  @IsArray()
  @ArrayMinSize(2)
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
