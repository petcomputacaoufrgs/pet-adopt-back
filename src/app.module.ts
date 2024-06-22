import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PetModule } from './domain/pet/pet.module';
import { AdminModule } from './domain/admin/admin.module';
import { NgoModule } from './domain/ngo/ngo.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), PetModule, NgoModule,  AdminModule],
  controllers: [],
  providers: [],
})
export class AppModule {}