import { Module } from '@nestjs/common';
import { MembroOngController } from './membro-ong.controller';
import { MembroOngService } from './membro-ong.service';

@Module({
  controllers: [MembroOngController],
  providers: [MembroOngService]
})
export class MembroOngModule {}
