import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports : [JwtModule.register({
    secret: 'xyz456', //alterar para um secret válido depois
    signOptions: {expiresIn: '2h'}
  })],
  providers: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}