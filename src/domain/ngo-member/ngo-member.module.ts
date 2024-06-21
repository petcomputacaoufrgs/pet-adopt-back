import { Module } from '@nestjs/common';
import { NGOMemberController } from './ngo-member.controller';
import { NGOMemberService } from './ngo-member.service';

@Module({
  controllers: [NGOMemberController],
  providers: [NGOMemberService]
})
export class NGOMemberModule {}
