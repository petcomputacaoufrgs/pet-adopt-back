import { Injectable } from '@nestjs/common';

@Injectable()
export class NgoService {
  private ngos = [
    {
      name: 'Associação Amigos dos Animais',
      description: 'ONG dedicada ao resgate e cuidado de animais abandonados.',
      email: 'contato@amigosdosanimais.org',
      phone: '(99) 9999-9999',
      cnpj: '00.000.000/0001-00',
      city: 'São Paulo',
      website: 'http://www.amigosdosanimais.org',
      instagram: '@amigosdosanimais',
      facebook: 'Associação Amigos dos Animais',
      x: '...',
      adoptionForm: 'Link para formulário de adoção',
      sponsorshipForm: 'Link para formulário de apadrinhamento',
      temporaryHomeForm: 'Link para formulário de lar temporário',
      claimForm: 'Link para formulário para reivindicar que o animal é seu',
    },
    // Exemplo adicional em português
    {
      name: 'ONG Viva Bicho',
      description: 'ONG que promove a proteção e bem-estar de animais domésticos e silvestres.',
      email: 'contato@vivabicho.org',
      phone: '(88) 8888-8888',
      cnpj: '11.111.111/0001-11',
      city: 'Rio de Janeiro',
      website: 'http://www.vivabicho.org',
      instagram: '@vivabicho_oficial',
      facebook: 'ONG Viva Bicho',
      x: '...',
      adoptionForm: 'Link para formulário de adoção',
      sponsorshipForm: '',
      temporaryHomeForm: 'Link para formulário de lar temporário',
      claimForm: '',
    }
  ];

  getAll() {
    return this.ngos;
  }
}
