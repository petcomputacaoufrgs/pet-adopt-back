import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PetModule } from './domain/pet/pet.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), PetModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
