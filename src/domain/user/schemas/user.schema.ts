import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Role } from 'src/core/enums/role.enum';

@Schema()
export class User {
  @Prop({
    required: true,
  })
  email: string;

  @Prop({
    required: true,
  })
  password: string;

  @Prop({
    required: false,
  })
  NGO: string;

  @Prop({
    required: true,
  })
  role: Role;
}

export const UserSchema = SchemaFactory.createForClass(User);
