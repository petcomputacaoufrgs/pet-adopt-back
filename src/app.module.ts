import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PetModule } from './domain/pet/pet.module';
import { AdminModule } from './domain/admin/admin.module';
import { NGOMemberModule } from './domain/ngo-member/ngo-member.module';
import { NgoModule } from './domain/ngo/ngo.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), PetModule, AdminModule, NGOMemberModule, NgoModule],
  controllers: [],
  providers: [],
})
export class AppModule {}