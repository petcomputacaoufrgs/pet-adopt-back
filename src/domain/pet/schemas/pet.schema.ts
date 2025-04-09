import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class Pet {
  @Prop({
    required: true,
  })
  name: string;
  
  @Prop({
    required: true,
  })
  age: number;
  
  @Prop({
    required: true,
  })
  sex: string;

  @Prop()
  size: string;
  
  @Prop({
    required: true,
  })
  species: string;

  @Prop()
  breed: string;

  @Prop({
    required: true,
  })
  characteristics: string;

  @Prop({
    required: true,
  })
  NGO: string;

  @Prop({
    required: true,
  })
  status: string;

  @Prop({
    required: true,
  })
  forTempHome: boolean;
  
  @Prop({
    required: true,
  })
  forAdoption: boolean;

  @Prop({
    required: true,
  })
  photos: string[];

  @Prop({
    required: true,
  })
  city: string;

  @Prop({
    required: true,
  })
  state: string;
  
  @Prop()
  observations: string;
}

export const PetSchema = SchemaFactory.createForClass(Pet);
