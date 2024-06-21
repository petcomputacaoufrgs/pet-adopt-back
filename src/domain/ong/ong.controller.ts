import { Controller, Get } from '@nestjs/common';
import { OngService } from './ong.service';

@Controller('ong')
export class OngController {
  constructor(private ongService: OngService) {}

  @Get()
  getAll() {
    return this.ongService.getAll();
  }
}
