import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class Ngo {
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
