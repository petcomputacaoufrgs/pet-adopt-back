import { HttpException, HttpStatus, Injectable } from '@nestjs/common'; 
import { CreateUserDto } from 'src/domain/user/dtos/create-user.dto';
import { UserService } from 'src/domain/user/user.service';
import { EncryptionService } from '../encryption/encryption.service';
import { JwtService} from '@nestjs/jwt';
import { NgoService } from 'src/domain/ngo/ngo.service';
import { NgoSignupDto } from './dtos/ngo-signup.dto';
import { Role } from 'src/core/enums/role.enum';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import { Connection } from 'mongoose';
import { Response } from 'express'; // Response do Express, para trabalhar com cookies
import { Token } from './schemas/token.schema';
import { UnauthorizedException } from '@nestjs/common';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private encryptionService: EncryptionService,
    private jwtService: JwtService,
    private ngoService: NgoService,
    private configService: ConfigService,
    @InjectConnection() private connection: Connection,
    @InjectModel(Token.name) private tokenModel: Model<Token>
  ) {}

    // Método privado para configurar cookies HTTP-only
    private setCookies(res: Response, accessToken: string, refreshToken: string) {
        // Obter durações do .env e converter para milissegundos
        const accessTokenExpiration = this.parseJwtExpiration(this.configService.get('JWT_EXPIRES_IN'));
        const refreshTokenExpiration = this.parseJwtExpiration(this.configService.get('REFRESH_JWT_EXPIRES_IN'));

        // Cookie para access token
        res.cookie('access_token', accessToken, {
            httpOnly: true,
            secure: this.configService.get('NODE_ENV') === 'production',
            sameSite: 'strict',
            expires: new Date(Date.now() + accessTokenExpiration),
        });

        // Cookie para refresh token
        res.cookie('refresh_token', refreshToken, {
            httpOnly: true,
            secure: this.configService.get('NODE_ENV') === 'production',
            sameSite: 'strict',
            expires: new Date(Date.now() + refreshTokenExpiration),
        });
    }

    // Método auxiliar para converter strings de tempo JWT em milissegundos
    private parseJwtExpiration(timeString: string): number {
        // Remove aspas se existirem
        const cleanTime = timeString.replace(/['"]/g, '');
        
        // Extrai número e unidade (ex: "2h" -> numero: 2, unidade: "h")
        const match = cleanTime.match(/^(\d+)([smhd])$/);
        
        if (!match) {
            throw new Error(`Formato de tempo inválido: ${timeString}`);
        }
        
        const [, amount, unit] = match;
        const value = parseInt(amount, 10);
        
        switch (unit) {
            case 's': return value * 1000;                    // segundos
            case 'm': return value * 60 * 1000;               // minutos
            case 'h': return value * 60 * 60 * 1000;          // horas
            case 'd': return value * 24 * 60 * 60 * 1000;     // dias
            default:
                throw new Error(`Unidade de tempo não suportada: ${unit}`);
        }
    }

    // Método privado para gerar tokens
    private async generateTokens(payload: any) {
        const accessToken = this.jwtService.sign(payload);
        const refreshToken = this.jwtService.sign(payload, {
            secret: this.configService.get('REFRESH_JWT_SECRET'),
            expiresIn: this.configService.get('REFRESH_JWT_EXPIRES_IN'),
        });

        // Usar a mesma lógica de expiração do .env para o banco de dados
        const refreshTokenExpiration = this.parseJwtExpiration(this.configService.get('REFRESH_JWT_EXPIRES_IN'));
        const expiresAt = new Date(Date.now() + refreshTokenExpiration);

        await this.tokenModel.create({
            userId: payload.sub,
            token: refreshToken,
            expiresAt,
        });

        return { accessToken, refreshToken };
    }

    // Método para validar usuário, chamado no LocalAuthGuard
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

        // Geração dos tokens usando o método reutilizável
        const { accessToken, refreshToken } = await this.generateTokens(accessTokenPayload);

        // Configurar cookies usando método reutilizável
        this.setCookies(res, accessToken, refreshToken);

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

    // Método para renovar tokens JWT
    async refreshTokens(refreshToken: string, res: Response) {
        try {
            // 1. Verificar a assinatura e expiração do refresh token
            const decodedToken = this.jwtService.verify(refreshToken, {
                secret: this.configService.get('REFRESH_JWT_SECRET'),
            });

            // 2. Buscar o token no banco de dados (whitelist)
            const storedToken = await this.tokenModel.findOne({
                token: refreshToken,
                userId: decodedToken.sub,
            });

            // 3. Se o token não for encontrado ou tiver expirado, lançar erro
            if (!storedToken) {
                throw new UnauthorizedException('Token de atualização inválido ou expirado');
            }

            // 4. Invalidar o refresh token antigo (deletar do banco de dados)
            await this.tokenModel.deleteOne({ token: refreshToken });

            // 5. Gerar novos tokens usando o método reutilizável
            const payload = {
                email: decodedToken.email,
                sub: decodedToken.sub,
                role: decodedToken.role,
            };

            const { accessToken: newAccessToken, refreshToken: newRefreshToken } = 
                await this.generateTokens(payload);

            // 6. Configurar cookies
            this.setCookies(res, newAccessToken, newRefreshToken);

            return { message: 'Tokens atualizados com sucesso' };

        } catch (error) {
            // Capturar erros de verificação ou banco de dados e retornar 401
            throw new UnauthorizedException('Token de atualização inválido ou expirado');
        }
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
