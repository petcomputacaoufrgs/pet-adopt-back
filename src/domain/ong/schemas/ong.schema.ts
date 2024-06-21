import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Organization extends Document {
  @Prop({
    required: true,
    type: String,
  })
  name: string;

  @Prop({
    type: String,
  })
  description: string;

  @Prop({
    required: true,
    type: String,
  })
  email: string;

  @Prop({
    type: String,
  })
  phone: string;

  @Prop({
    type: String,
  })
  cnpj: string;

  @Prop({
    type: String,
  })
  city: string;

  @Prop({
    type: String,
  })
  website: string;

  @Prop({
    type: String,
  })
  instagram: string;

  @Prop({
    type: String,
  })
  facebook: string;

  @Prop({
    type: String,
  })
  x: string; // Precisa de um nome mais descritivo se possível

  @Prop({
    required: true,
    type: String,
  })
  adoptionForm: string;

  @Prop({
    type: String,
  })
  sponsorshipForm: string;

  @Prop({
    type: String,
  })
  temporaryHomeForm: string;

  @Prop({
    type: String,
  })
  claimForm: string;
}

export const OrganizationSchema = SchemaFactory.createForClass(Organization);
