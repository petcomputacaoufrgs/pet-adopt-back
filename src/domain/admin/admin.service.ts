import { Injectable } from '@nestjs/common';

@Injectable()
export class AdminService {
  private admin = [
    {
        email: 'test@gmail.com',
        password: '123456',
    },
    {
        email: 'name@gmail.com',
        password: 'abcdef',
    },
  ];

  getAll() {
    return this.admin;
  }
}
