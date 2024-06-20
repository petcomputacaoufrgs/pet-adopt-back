import { Prop, Schema } from '@nestjs/mongoose';

@Schema()
export class Pet {
  @Prop({
    required: true,
  })
  nome: string;
  @Prop()
  idade: string;
  @Prop()
  sexo: string;
  @Prop()
  porte: string;
  @Prop()
  especie: string;
  @Prop()
  raca: string;
  @Prop()
  características: string;
  @Prop()
  ONG: string;
  @Prop()
  status: string;
  @Prop()
  apadrinhado: string;
  @Prop({
    required: false,
  })
  fotos: string;
  @Prop()
  cidade: string;
}
