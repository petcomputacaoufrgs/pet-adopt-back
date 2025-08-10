import { HttpException, HttpStatus, Injectable } from '@nestjs/common'; 
import { CreateUserDto } from 'src/domain/user/dtos/create-user.dto';
import { UserService } from 'src/domain/user/user.service';
import { EncryptionService } from '../encryption/encryption.service';
import { JwtService} from '@nestjs/jwt';
import { NgoService } from 'src/domain/ngo/ngo.service';
import { NgoSignupDto } from './dtos/ngo-signup.dto';
import { Role } from 'src/core/enums/role.enum';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private encryptionService: EncryptionService,
    private jwtService: JwtService,
    private ngoService: NgoService,
    @InjectConnection() private connection: Connection,
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

        // Inicia uma sessão de transação
        const session = await this.connection.startSession();

        try {
            // Inicia a transação
            await session.withTransaction(async () => {
                console.log('Iniciando transação para criação de ONG e usuário');
                
                // 1. Cria a ONG dentro da transação
                console.log('Criando ONG:', ngo);
                const createdNgo = await this.ngoService.create(ngo, session);
                console.log('ONG criada com sucesso:', createdNgo);

                // 2. Prepara os dados do usuário
                const hashedPassword = await this.encryptionService.encryptPassword(user.password);
                
                const userData = {
                    ...user,
                    password: hashedPassword,
                    confirmPassword: hashedPassword,
                    ngoId: createdNgo._id.toString(),
                    role: Role.NGO_ADMIN_PENDING,
                };

                // 3. Cria o usuário dentro da transação
                console.log('Criando usuário com dados:', userData);
                const createdUser = await this.userService.create(userData, session);
                console.log('Usuário criado com sucesso:', createdUser);
            });

            console.log('Transação concluída com sucesso');
            return { message: 'ONG e conta administrativa criadas. Aguardando aprovação.' };

        } catch (error) {
            console.error('Erro durante a transação:', error);
            throw new HttpException(
                'Falha no cadastro da ONG: ' + error.message, 
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        } finally {
            // Encerra a sessão
            await session.endSession();
        }
    }
}
