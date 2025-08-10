import { HttpException, HttpStatus, Injectable } from '@nestjs/common'; 
import { CreateUserDto } from 'src/domain/user/dtos/create-user.dto';
import { UserService } from 'src/domain/user/user.service';
import { EncryptionService } from '../encryption/encryption.service';
import { JwtService} from '@nestjs/jwt';
import { NgoService } from 'src/domain/ngo/ngo.service';
import { NgoSignupDto } from './dtos/ngo-signup.dto';
import { Role } from 'src/core/enums/role.enum';

@Injectable()
@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private encryptionService: EncryptionService,
    private jwtService: JwtService,
    private ngoService: NgoService,
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
        
        // Cria token.
        return {
            access_token: this.jwtService.sign(payload),
        };
    }

    // Método de signup para usuários comuns (membros de ONG e admins do site)
    async signupRegularUser(signupDto: CreateUserDto): Promise<any> {
        if (signupDto.password !== signupDto.confirmPassword) {
        throw new HttpException('Há diferença entre as senhas.', HttpStatus.BAD_REQUEST);
        }
        
        const existingUser = await this.userService.getByEmail(signupDto.email);
        if (existingUser) {
        throw new HttpException('Este e-mail já foi cadastrado', HttpStatus.CONFLICT);
        }

        const hashedPassword = await this.encryptionService.encryptPassword(signupDto.password);
        
        await this.userService.create({
        ...signupDto,
        password: hashedPassword,
        confirmPassword: hashedPassword,
        });
    }

    // Método para signup de Admin de ONG
    async signupNgoAdmin(signupDto: NgoSignupDto): Promise<any> {
        const { user, ngo } = signupDto;

        if (user.password !== user.confirmPassword) {
            throw new HttpException('Há diferença entre as senhas.', HttpStatus.BAD_REQUEST);
        }
        
        const existingUser = await this.userService.getByEmail(user.email);
        if (existingUser) {
            throw new HttpException('Este e-mail já foi cadastrado', HttpStatus.CONFLICT);
        }

        // Cria ONG e conta institucional, garantindo que ambas as operações sejam atômicas, ou seja, se uma falhar, a outra deve ser revertida.
        let createdNgo;
        try {
            console.log(ngo);
            createdNgo = await this.ngoService.create(ngo);
            console.log('ONG criada com sucesso:', createdNgo);

            const hashedPassword = await this.encryptionService.encryptPassword(user.password);

            await this.userService.create({
                ...user,
                password: hashedPassword,
                confirmPassword: hashedPassword,
                ngoId: createdNgo._id.toString(),
                role: Role.NGO_ADMIN_PENDING,
            });
            console.log('Usuário criado com sucesso:', user);

            return { message: 'ONG e conta administrativa criadas. Aguardando aprovação.' };
            } catch (error) {
            // Rollback manual caso a criação da conta de usuário falhe
            if (createdNgo) {
                await this.ngoService.delete(createdNgo._id).catch(err => {
                console.error('Falha no rollback: não foi possível deletar a ONG órfã.', err);
                });
            }
            throw new HttpException('Falha no cadastro da ONG.', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
