import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

// Define o tipo do documento do Mongoose
export type TokenDocument = Token & Document;

@Schema()
export class Token {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId; // O ID do usuário associado a este token

  @Prop({ required: true, unique: true })
  token: string; // A string do refresh token

  @Prop({ required: true, expires: 0 })
  expiresAt: Date; // A data de expiração do token
}

export const TokenSchema = SchemaFactory.createForClass(Token);