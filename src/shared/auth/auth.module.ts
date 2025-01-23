import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { LocalStrategy } from './strategies/local.strategy';
import { EncryptionModule } from '../encryption/encryption.module';
import { ConfigService } from '@nestjs/config';
import { UserModule } from 'src/domain/user/user.module';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtModule } from '@nestjs/jwt';

@Module({
  providers: [AuthService, LocalStrategy, JwtStrategy], // Remove o UserService
  imports: [
    UserModule, // Garante que o AuthModule tem acesso ao UserService
    EncryptionModule,
    PassportModule,
  
    JwtModule.register({
      secret: 'xyz456', // Alterar para um secret válido depois
      signOptions: { expiresIn: '2h' },
    }),
    
  ],
  controllers: [AuthController],
})
export class AuthModule {}