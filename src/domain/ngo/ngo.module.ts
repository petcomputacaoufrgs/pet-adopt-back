import { Module } from '@nestjs/common';
import { NgoController } from './ngo.controller';
import { NgoService } from './ngo.service';

@Module({
  imports: [],
  controllers: [NgoController],
  providers: [NgoService],
  exports: [NgoService],
})
export class NgoModule {}
