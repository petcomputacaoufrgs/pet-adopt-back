import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PetModule } from './domain/pet/pet.module';
import { MembroOngModule } from './domain/membro-ong/membro-ong.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), PetModule, MembroOngModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
