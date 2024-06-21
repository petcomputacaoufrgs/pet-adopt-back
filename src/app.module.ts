import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PetModule } from './domain/pet/pet.module';
import { AdminModule } from './domain/admin/admin.module';
import { NGOMemberModule } from './domain/ngo-member/ngo-member.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), PetModule, AdminModule, NGOMemberModule],
  controllers: [],
  providers: [],
})
export class AppModule {}