import { HttpException, HttpStatus, Injectable } from '@nestjs/common'; 
import { BasicUserDto, NgoMemberDto } from 'src/domain/user/dtos/create-user.dto';
import { UserService } from 'src/domain/user/user.service';
import { EncryptionService } from '../encryption/encryption.service';
import { JwtService} from '@nestjs/jwt';
import { NgoService } from 'src/domain/ngo/ngo.service';
import { NgoSignupDto } from './dtos/ngo-signup.dto';
import { Role } from 'src/core/enums/role.enum';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Model, Types, Connection } from 'mongoose';
import { Response } from 'express'; // Response do Express, para trabalhar com cookies
import { Token } from './schemas/token.schema';
import { UnauthorizedException } from '@nestjs/common';
import { UpdateNgoDto } from 'src/domain/ngo/dtos/update-ngo.dto';
import { Ngo } from 'src/domain/ngo/schemas/ngo.schema';

const MAX_TOKENS_PER_USER = 3;

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
    private async generateTokens(payload: any, deviceInfo?: string) {
        const accessToken = this.jwtService.sign(payload, {
            secret: this.configService.get('JWT_SECRET'),
            expiresIn: this.configService.get('JWT_EXPIRES_IN'),
        });
        
        const refreshToken = this.jwtService.sign(payload, {
            secret: this.configService.get('REFRESH_JWT_SECRET'),
            expiresIn: this.configService.get('REFRESH_JWT_EXPIRES_IN'),
        });

        const refreshTokenExpiration = this.parseJwtExpiration(this.configService.get('REFRESH_JWT_EXPIRES_IN'));
        const expiresAt = new Date(Date.now() + refreshTokenExpiration);

        // Limitar a 3 tokens por usuário (opcional)
        const userTokenCount = await this.tokenModel.countDocuments({ userId: payload.sub });
        if (userTokenCount >= MAX_TOKENS_PER_USER) {
            // Remove o token mais antigo
            const oldestToken = await this.tokenModel.findOne({ userId: payload.sub }).sort({ createdAt: 1 });
            if (oldestToken) {
                await this.tokenModel.deleteOne({ _id: oldestToken._id });
            }
        }

        const savedToken = await this.tokenModel.create({
            userId: payload.sub,
            token: refreshToken,
            expiresAt,
            deviceInfo: deviceInfo || 'Unknown', // Para identificar dispositivos
            createdAt: new Date(),
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
            const { password, ...result } = user;
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
                ngoId: user._doc.ngoId || null,
                name: user._doc.name,
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
            const userObjectId = Types.ObjectId.createFromHexString(decodedToken.sub);

            const storedToken = await this.tokenModel.findOne({
                token: refreshToken,
                userId: userObjectId,
            });

            // 3. Verificar se o token existe
            if (!storedToken) {
                throw new UnauthorizedException('Token de atualização não encontrado');
            }

            // 4. Verificar se o token não expirou no banco de dados
            if (storedToken.expiresAt < new Date()) {
                // Remove o token expirado
                await this.tokenModel.deleteOne({ token: refreshToken });
                throw new UnauthorizedException('Token de atualização expirado');
            }

            // 5. Invalidar o refresh token antigo (deletar do banco de dados)
            await this.tokenModel.deleteOne({ token: refreshToken });

            // 6. Gerar novos tokens usando o método reutilizável
            const payload = {
                email: decodedToken.email,
                sub: decodedToken.sub,
                role: decodedToken.role,
            };

            const { accessToken: newAccessToken, refreshToken: newRefreshToken } = 
                await this.generateTokens(payload);

            // 7. Configurar cookies
            this.setCookies(res, newAccessToken, newRefreshToken);

            return { message: 'Tokens atualizados com sucesso' };

        } catch (error) {
            // Se for erro de JWT (token inválido/expirado), retornar erro específico
            if (error.name === 'JsonWebTokenError') {
                throw new UnauthorizedException('Token de atualização inválido');
            }
            
            if (error.name === 'TokenExpiredError') {
                throw new UnauthorizedException('Token de atualização expirado');
            }
            
            // Se já for UnauthorizedException, re-lançar
            if (error instanceof UnauthorizedException) {
                throw error;
            }
            
            // Para outros erros, logar e retornar genérico
            console.error('Erro inesperado no refresh token:', error);
            throw new UnauthorizedException('Token de atualização inválido ou expirado');
        }
    }

    // Validações
    private validatePasswordMatch(password: string, confirmPassword: string): void {
        if (password !== confirmPassword) {
            throw new HttpException('Há diferença entre as senhas.', HttpStatus.BAD_REQUEST);
        }
    }

    private async validateEmailNotExists(email: string): Promise<void> {
        const existingUser = await this.userService.getByEmail(email);
        if (existingUser) {
            throw new HttpException('Este e-mail já foi cadastrado', HttpStatus.CONFLICT);
        }
    }

    // Método genérico para criar usuários (não é usado para conta institucional de ONG)
    private async createUser(signupDto: BasicUserDto | NgoMemberDto, role: Role): Promise<any> {
        this.validatePasswordMatch(signupDto.password, signupDto.confirmPassword);
        await this.validateEmailNotExists(signupDto.email);

        const hashedPassword = await this.encryptionService.encryptPassword(signupDto.password);
        
        await this.userService.create({
            ...signupDto,
            role,
            password: hashedPassword,
            confirmPassword: hashedPassword,
        });

        return { message: 'Usuário criado com sucesso' };
    }

    async signupAdmin(signupDto: BasicUserDto): Promise<any> {
        return this.createUser(signupDto, Role.ADMIN);
    }

    async signupNgoMember(signupDto: NgoMemberDto): Promise<any> {
        const ngo = await this.ngoService.getById(signupDto.ngoId);
        if (!ngo) {
            throw new HttpException('ONG não encontrada', HttpStatus.NOT_FOUND);
        }
        return this.createUser(signupDto, Role.NGO_MEMBER_PENDING);
    }

    // Método para signup para conta institucional de ONG
    async signupNgo(signupDto: NgoSignupDto): Promise<any> {
        const { user, ngo } = signupDto;

        if (user.password !== user.confirmPassword) {
            throw new HttpException('Há diferença entre as senhas.', HttpStatus.BAD_REQUEST);
        }
        
        const existingAdmin= await this.userService.getByEmail(user.email);
        if (existingAdmin) {
            if (existingAdmin.role == Role.NGO_ADMIN) {
                throw new HttpException('Já existe uma ONG registrada com este e-mail, faça login na ONG ou crie uma conta membro da ONG.', HttpStatus.CONFLICT);
            }
            if (existingAdmin.role == Role.NGO_ADMIN_PENDING) {
                throw new HttpException('Já existe uma solicitação de ONG registrada com este e-mail, aguarde a aprovação da ONG.', HttpStatus.CONFLICT);
            }
        }

        // Inicia uma sessão de transação
        const session = await this.connection.startSession();

        try {
            // Inicia a transação
            await session.withTransaction(async () => {          
                // 1. Cria a ONG dentro da transação
                const createdNgo = await this.ngoService.create(ngo, session);

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
                const createdUser = await this.userService.create(userData, session);
            });

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

    // Recebe o id da conta institucional (NGO_ADMIN) e os dados para atualizar a ONG 
    async updateNgoProfile(userId: string, updateDto: UpdateNgoDto) {
        const user = await this.userService.getById(userId);
        
        if (!user.ngoId || user.role !== Role.NGO_ADMIN) {
            throw new UnauthorizedException('Apenas administradores de ONG podem atualizar');
        }

        const session = await this.connection.startSession();
        
        try {
            await session.withTransaction(async () => {     
                // Atualiza NGO com TODOS os campos
                await this.ngoService.update(user.ngoId, updateDto, session);
                
                // Atualiza User apenas com nome caso tenha sido alterado
                if (updateDto.name) {
                    await this.userService.update(userId, { name: updateDto.name }, session);
                }
            });
            return { message: 'Perfil institucional atualizado com sucesso' };
        } finally {
            await session.endSession();
        }
    }

    // Método para limpar tokens expirados
    async cleanupExpiredTokens(): Promise<void> {
        try {
            const result = await this.tokenModel.deleteMany({
                expiresAt: { $lt: new Date() }
            });
        } catch (error) {
            console.error('Erro ao limpar tokens expirados:', error);
        }
    }

    // Método para revogar todos os tokens de um usuário (logout de todos os dispositivos)
    async revokeAllUserTokens(userId: string): Promise<void> {
        try {
            const userObjectId = Types.ObjectId.createFromHexString(userId);
            const result = await this.tokenModel.deleteMany({ userId: userObjectId });
        } catch (error) {
            console.error('Erro ao revogar tokens do usuário:', error);
        }
    }

    // Método para revogar um token específico (logout de um dispositivo)
    async revokeSpecificToken(refreshToken: string): Promise<void> {
        try {
            const result = await this.tokenModel.deleteOne({ token: refreshToken });
        } catch (error) {
            console.error('Erro ao revogar token específico:', error);
        }
    }
}