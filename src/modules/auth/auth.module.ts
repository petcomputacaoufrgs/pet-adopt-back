import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { RefreshTokenStrategy } from './strategies/refresh-token.strategy';
import { EncryptionModule } from '../encryption/encryption.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserModule } from 'src/domain/user/user.module';
import { NgoModule } from 'src/domain/ngo/ngo.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { TokenSchema, Token } from './schemas/token.schema';
import { TokenCleanupService } from './services/token-cleanup.service';
import { MailModule } from '../mail/mail.module';

@Module({
  providers: [AuthService, LocalStrategy, JwtStrategy, RefreshTokenStrategy, TokenCleanupService],
  imports: [
    UserModule,
    NgoModule,
    MailModule,
    EncryptionModule,
    PassportModule,
    ConfigModule,
    MongooseModule.forFeature([{ name: Token.name, schema: TokenSchema }]),
    JwtModule.registerAsync({
      imports: [ConfigModule], // MongooseModule is no longer needed here
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  exports: [TokenCleanupService],
})
export class AuthModule {}