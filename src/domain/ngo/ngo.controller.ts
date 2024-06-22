import { Controller, Get } from '@nestjs/common';
import { NgoService } from './ngo.service';

@Controller('ngo')
export class NgoController {
  constructor(private ngoService: NgoService) {}

  @Get()
  getAll() {
    return this.ngoService.getAll();
  }
}
