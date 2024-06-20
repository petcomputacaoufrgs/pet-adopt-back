import { Injectable } from '@nestjs/common';

@Injectable()
export class PetService {
  private pets = [
    {
      nome: 'Yoko',
      idade: '10',
      sexo: 'F',
      porte: 'pequeno',
      especie: 'cachorro',
      raça: 'lulu',
      características: 'fofa',
      ONG: 'ong 1',
      status: 'ativa',
      apadrinhado: 'sim',
      fotos: '',
      cidade: 'poa',
    },
    {
      nome: 'Dog 2',
      idade: '12',
      sexo: 'M',
      porte: 'pequeno',
      especie: 'cachorro',
      raça: 'lulu',
      características: 'fofa',
      ONG: 'ong 1',
      status: 'ativa',
      apadrinhado: 'sim',
      fotos: '',
      cidade: 'poa',
    },
  ];

  getAll() {
    return this.pets;
  }
}
