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
  @Prop()
  characteristics: string;
  @Prop({
    required: true,
  })
  NGO: string;
  @Prop({
    required: true,
  })
  status: string;
  @Prop()
  sponsorship: boolean;
  // @Prop()
  // sponsorshipModalities: string[];
  @Prop()
  photos: string[];
  @Prop()
  city: string;
  @Prop()
  state: string;
  @Prop()
  observations: string;
}

export const PetSchema = SchemaFactory.createForClass(Pet);
