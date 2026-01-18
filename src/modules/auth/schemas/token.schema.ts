import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum TokenType {
  REFRESH = 'refresh',
  PASSWORD_RESET = 'password_reset',
}

// Define o tipo do documento do Mongoose
export type TokenDocument = Token & Document;

@Schema({ timestamps: true }) // Adiciona createdAt e updatedAt automaticamente
export class Token {
  @Prop({ type: Types.ObjectId, required: true, ref: 'User' })
  userId: Types.ObjectId; // O ID do usuário associado a este token

  @Prop({ required: true })
  token: string; // A string do token (refresh ou password reset)

  @Prop({ 
    required: true,
    enum: Object.values(TokenType),
    default: TokenType.REFRESH 
  })
  type: TokenType;

  @Prop({ required: true })
  expiresAt: Date; // A data de expiração do token

  @Prop({ default: 'Unknown' })
  deviceInfo: string; // Para identificar diferentes dispositivos

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const TokenSchema = SchemaFactory.createForClass(Token);

// Índice para performance e limpeza automática
TokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // MongoDB TTL
TokenSchema.index({ userId: 1, type: 1 }); // Buscar tokens por usuário e tipo
TokenSchema.index({ token: 1, type: 1 }); // Buscar token específico por tipo