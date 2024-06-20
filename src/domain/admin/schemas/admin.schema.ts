import { Prop, Schema } from '@nestjs/mongoose';

@Schema()
export class Admin {
  @Prop({
    required: true,
  })
  email: string;
  @Prop({
    required: true,
  })
  senha: string;
}
