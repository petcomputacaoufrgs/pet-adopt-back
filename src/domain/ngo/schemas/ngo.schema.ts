import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Organization extends Document {
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
  cnpj: string;

  @Prop()
  city: string;

  @Prop()
  website: string;

  @Prop()
  instagram: string;

  @Prop()
  facebook: string;

  @Prop()
  x: string;

  @Prop({
    required: true
  })
  adoptionForm: string;

  @Prop()
  sponsorshipForm: string;

  @Prop()
  temporaryHomeForm: string;

  @Prop()
  claimForm: string;
}

export const OrganizationSchema = SchemaFactory.createForClass(Organization);
