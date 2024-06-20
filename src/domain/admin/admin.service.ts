import { Injectable } from '@nestjs/common';

@Injectable()
export class AdminService {
  private pets = [
    {
        email: 'teste@gmail.com',
        senha: '123456',
    },
    {
        email: 'nome@gmail.com',
        senha: 'abcdef',
    },
  ];

  getAll() {
    return this.pets;
  }
}
