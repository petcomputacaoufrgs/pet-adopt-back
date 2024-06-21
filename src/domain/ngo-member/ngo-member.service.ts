import { Injectable } from '@nestjs/common';

@Injectable()
export class NGOMemberService {
    private NGOmembers = [
        {
            email: 'joaozinho@gmail.com',
            password: '123456',
            NGO: 'Médicos do Mundo'
        },

        {
            email: 'mariazinha@gmail.com',
            password: '654321',
            NGO: 'Médicos do Mundo'
        }
    ];

    getAll() {
        return this.NGOmembers;
    }
}
