import { Injectable } from '@nestjs/common';
import { CreateUserDto } from 'src/domain/user/dtos/create-user.dto';
import { UserService } from 'src/domain/user/user.service';
import { EncryptionService } from '../encryption/encryption.service';
import { JwtService} from '@nestjs/jwt';
import { ValidationError } from 'class-validator';
import { Role } from 'src/core/enums/role.enum';
import { HttpException, HttpStatus } from '@nestjs/common'; 

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
        if (this.encryptionService.comparePassword(user.password, password)){
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

    async signup(signupDto: CreateUserDto): Promise<any> {  
        if (signupDto.password !== signupDto.confirmPassword)
            throw new HttpException('Há diferença entre as senhas.', HttpStatus.BAD_REQUEST);
        
        const existingUser = await this.userService.getByEmail(signupDto.email);
        if (existingUser) {
            throw new HttpException('Este e-mail já foi cadastrado', HttpStatus.CONFLICT);
        }

        const hashedPassword = await this.encryptionService.encryptPassword(
          signupDto.password,
        );
    
        await this.userService.create({
          name: signupDto.name,
          email: signupDto.email,
          password: hashedPassword,
          confirmPassword:hashedPassword,
          NGO: signupDto.NGO,
          role: signupDto.role,
        });
    }
}
