import { Injectable } from '@nestjs/common';

@Injectable()
export class MembroOngService {
    private membrosOng = [
        {
            email: 'joaozinho@gmail.com',
            senha: '123456',
            ONG: 'Médicos do Mundo'
        },

        {
            email: 'mariazinha@gmail.com',
            senha: '654321',
            ONG: 'Médicos do Mundo'
        }
    ];
}
