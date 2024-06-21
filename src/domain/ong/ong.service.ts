import { Injectable } from '@nestjs/common';

@Injectable()
export class OngService {
  private ongs = [
    { id: 1, name: 'ONG A' },
    { id: 2, name: 'ONG B' },
  ];

  getAll() {
    return this.ongs;
  }
}
