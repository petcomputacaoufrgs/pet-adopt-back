import {IsDate, IsNotEmpty, IsOptional, MaxLength, MinLength, IsEnum, IsIn, IsDateString,Length, IsNumberString, IsNumber, IsBoolean, IsString} from 'class-validator'
import { IsSizeRequiredForSpecies } from './is-size-required-for-species';
import { IsSponsorshipRequired } from './is-sponsorship-required';


export class CreatePetDto {
  @IsNotEmpty()
  @MaxLength(20)
  name: string;

  @IsNotEmpty()
  // @IsNumber() // ???
  // @IsNumberString() // ???
  age: string; //age: number ???

  @IsNotEmpty()
  @IsIn(['F', 'M'])
  sex: string;

  @IsIn(['Cachorro', 'Gato', 'Outro'])
  species: string;

  @IsOptional()
  @IsIn(['G','M','P'])
  //@IsSizeRequiredForSpecies()
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
  sponsorship: boolean;

  //@IsSponsorshipRequired({ message: 'Sponsorship modalities are required when sponsorship is true' })
  //sponsorshipModalities: string[];
  
  @IsNotEmpty()
  @MinLength(2)
  photos: string[];

  @IsNotEmpty()
  @IsString()
  city: string;
  
  @IsNotEmpty()
  @IsString()
  state: string;

  // @IsOptional()
  //observations: string;
}
