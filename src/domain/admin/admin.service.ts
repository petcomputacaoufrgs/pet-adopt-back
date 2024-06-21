import { Injectable } from '@nestjs/common';

@Injectable()
export class AdminService {
  private admin = [
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
    return this.admin;
  }
}
