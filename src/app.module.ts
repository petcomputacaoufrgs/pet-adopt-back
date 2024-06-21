import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PetModule } from './domain/pet/pet.module';
import { AdminModule } from './domain/admin/admin.module';
import { OngModule } from './domain/ong/ong.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), PetModule, OngModule,  AdminModule],
  controllers: [],
  providers: [],
})
export class AppModule {}