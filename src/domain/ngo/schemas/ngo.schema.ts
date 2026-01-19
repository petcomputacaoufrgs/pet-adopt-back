import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
// Extende documento para herdar propriedade _id.
export class Ngo extends Document {
  @Prop({
    required: true,
  })
  name: string;

  @Prop()
  description: string;

  @Prop({
    required: true,
  })
  email: string;

  @Prop()
  phone: string;

  @Prop()
  document: string;

  @Prop()
  city: string;

  @Prop()
  state: string;

  @Prop()
  website: string;

  @Prop()
  instagram: string;

  @Prop()
  facebook: string;

  @Prop()
  tiktok: string;

  @Prop()
  x: string;

  @Prop({
    required: true,
  })
  adoptionForm: string;

  @Prop()
  sponsorshipForm: string;

  @Prop()
  temporaryHomeForm: string;

  @Prop()
  claimForm: string;
}

export const NgoSchema = SchemaFactory.createForClass(Ngo);
