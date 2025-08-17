import { HttpException, HttpStatus, Injectable } from '@nestjs/common'; 
import { CreateUserDto } from 'src/domain/user/dtos/create-user.dto';
import { UserService } from 'src/domain/user/user.service';
import { EncryptionService } from '../encryption/encryption.service';
import { JwtService} from '@nestjs/jwt';
import { NgoService } from 'src/domain/ngo/ngo.service';
import { NgoSignupDto } from './dtos/ngo-signup.dto';
import { Role } from 'src/core/enums/role.enum';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Connection } from 'mongoose';
import { Response } from 'express'; // Response do Express, para trabalhar com cookies
import { Token } from './schemas/token.schema';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private encryptionService: EncryptionService,
    private jwtService: JwtService,
    private ngoService: NgoService,
    @InjectConnection() private connection: Connection,
    @InjectModel(Token.name) private tokenModel: Model<Token>
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
    async login(user: any, res: Response) {
        // Payload para o token de acesso, incluindo informações do usuário
        const accessTokenPayload = {
            email: user._doc.email,
            sub: user._doc._id,
            role: user._doc.role,
        };

        // Geração dos tokens
        const accessToken = this.jwtService.sign(accessTokenPayload);
        const refreshToken = this.jwtService.sign(accessTokenPayload, {
            secret: process.env.JWT_REFRESH_SECRET, // Use uma secret diferente e mais forte
            expiresIn: '7d', // Token de refresh com validade mais longa
        });

        // Salvar o refresh token no banco de dados (whitelist)
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // Expiração em 7 dias

        await this.tokenModel.create({
            userId: user._doc._id,
            token: refreshToken,
            expiresAt,
        });

        // Configurar e enviar os cookies
        res.cookie('access_token', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // Use HTTPS em produção
            sameSite: 'strict',
            expires: new Date(Date.now() + 15 * 60 * 1000), // Expira em 15 minutos
        });

        res.cookie('refresh_token', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Expira em 7 dias
        });

        // Retornar um JSON simples sem os tokens
        return {
            message: 'Login successful',
            user: {
                id: user._doc._id,
                email: user._doc.email,
                role: user._doc.role,
            },
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
