import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class Pet {
  @Prop({
    required: true,
  })
  name: string;
  @Prop()
  birth: string;
  @Prop()
  sex: string;
  @Prop()
  size: string;
  @Prop()
  species: string;
  @Prop()
  breed: string;
  @Prop()
  characteristics: string;
  @Prop()
  NGO: string;
  @Prop()
  status: string;
  @Prop()
  sponsorship: boolean;
  @Prop({
    required: false,
  })
  photos: string[];
  @Prop()
  city: string;
  @Prop()
  state: string;
}

export const PetSchema = SchemaFactory.createForClass(Pet);
