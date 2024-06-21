import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class Ong {
  @Prop({
    required: true,
  })
  nome: string;

  @Prop()
  descricao: string;

  @Prop({
    required: true,
  })
  email: string;

  @Prop()
  telefone: string;

  @Prop()
  cnpj: string;

  @Prop()
  cidade: string;

  @Prop()
  website: string;

  @Prop()
  instagram: string;

  @Prop()
  facebook: string;

  @Prop()
  x: string;

  @Prop({
    required: true,
  })
  formularioAdocao: string;

  @Prop()
  formularioApadrinhamento: string;

  @Prop()
  formularioLarTemporario: string;

  @Prop()
  formularioReivindicacao: string;
}

export const OngSchema = SchemaFactory.createForClass(Ong);
