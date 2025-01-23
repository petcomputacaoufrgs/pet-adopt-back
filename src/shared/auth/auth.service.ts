import { Injectable } from '@nestjs/common';
import { CreateUserDto } from 'src/domain/user/dtos/create-user.dto';
import { UserService } from 'src/domain/user/user.service';
import { EncryptionService } from '../encryption/encryption.service';
import { JwtService} from '@nestjs/jwt';

//interface User {
//    id: number;
//    email: string;
//    password: string;
//}

// const fakeUsers: User[] = [
//     {
//         id: 1,
//         username: "teste",
//         password: "senha"
//     },
//     {
//         id: 2,
//         username: "teste2",
//         password: "senha2"
//     }
// ];

@Injectable()
export class AuthService { //integrar com o dto do usuário do petadopt

    constructor(
        private userService: UserService,
        private encryptionService: EncryptionService,
        private jwtService: JwtService,
    ) {}

    async validateUser(email: string, password: string): Promise<any> {
        // Verificação de e-mail. 
        const user = await this.userService.getByEmail(email)
        if (user == null) return null;
        

        // Verificação da senha (com criptografia)
        // if (this.encryptionService.comparePassword(user.password, password)) 

        // Verificação da senha (sem criptografia)
        if (user.password === password) {
            // Remove campo sensível de senha antes de retornar um objeto usuário.
            const { password, ...result } = user;  // decidir se o campo confirmPassword é necessário
            return result;
        }
        else
            return null;
        
    }

    // Gera token JWT depois de validar usuário.
    async login(user: any) {
        // Dados de usuário que serão usados para criar o token.
        const payload = {
            email: user._doc.email,
            sub: user._doc._id,
            role: user._doc.role,
        };
        console.log(user);
        
        // Cria token.
        return {
            access_token: this.jwtService.sign(payload),
        };
    }
}
