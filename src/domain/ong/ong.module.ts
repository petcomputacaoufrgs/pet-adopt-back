import { Module } from '@nestjs/common';
import { OngController } from './ong.controller';
import { OngService } from './ong.service';

@Module({
  imports: [],
  controllers: [OngController],
  providers: [OngService],
  exports: [OngService],
})
export class OngModule {}
