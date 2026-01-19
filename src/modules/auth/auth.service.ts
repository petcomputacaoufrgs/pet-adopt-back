import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { Response } from 'express';
import { BasicUserDto, NgoMemberDto } from 'src/domain/user/dtos/create-user.dto';
import { NgoSignupDto } from './dtos/ngo-signup.dto';
import { UpdateNgoDto } from 'src/domain/ngo/dtos/update-ngo.dto';
import { UserService } from 'src/domain/user/user.service';
import { NgoService } from 'src/domain/ngo/ngo.service';
import { TokenService, TokenPayload } from './services/token.service';
import { PasswordService } from './services/password.service';
import { SignupService } from './services/signup.service';
import { EncryptionService } from '../encryption/encryption.service';

/**
 * AuthService - Orquestrador de autenticação
 * 
 * Este serviço coordena os sub-serviços especializados:
 * - TokenService: Gerenciamento de tokens JWT
 * - PasswordService: Validação e recuperação de senha
 * - SignupService: Lógica de cadastros
 */
@Injectable()
export class AuthService {
    constructor(
        private userService: UserService,
        private ngoService: NgoService,
        private encryptionService: EncryptionService,
        private tokenService: TokenService,
        private passwordService: PasswordService,
        private signupService: SignupService,
        @InjectConnection() private connection: Connection
    ) {}

    // ==================== AUTENTICAÇÃO ====================

    // Validar credenciais de usuário (chamado pelo LocalAuthGuard)
    async validateUser(email: string, password: string): Promise<any> {
        const user = await this.userService.getByEmail(email);
        if (!user) return null;
        
        // Verificar senha
        if (this.encryptionService.comparePassword(password, user.password)) {
            const { password, ...result } = user;
            return result;
        }
        
        return null;
    }

    // Login - gera tokens e configura cookies
    async login(user: any, res: Response, deviceInfo?: string) {
        const payload: TokenPayload = {
            email: user._doc.email,
            sub: user._doc._id,
            role: user._doc.role,
        };

        const { accessToken, refreshToken } = await this.tokenService.generateTokenPair(payload, deviceInfo);
        this.tokenService.setCookies(res, accessToken, refreshToken);

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

    // Renovar tokens JWT
    async refreshTokens(refreshToken: string, res: Response) {
        try {
            const { accessToken, refreshToken: newRefreshToken } = 
                await this.tokenService.refreshTokens(refreshToken);
            
            this.tokenService.setCookies(res, accessToken, newRefreshToken);
            
            return { message: 'Tokens atualizados com sucesso' };
        } catch (error) {
            if (error.name === 'JsonWebTokenError') {
                throw new UnauthorizedException('Token de atualização inválido');
            }
            if (error.name === 'TokenExpiredError') {
                throw new UnauthorizedException('Token de atualização expirado');
            }
            if (error instanceof UnauthorizedException) {
                throw error;
            }
            console.error('Erro inesperado no refresh token:', error);
            throw new UnauthorizedException('Token de atualização inválido ou expirado');
        }
    }

    // Logout - revoga token específico
    async logout(refreshToken: string): Promise<void> {
        if (refreshToken) {
            await this.tokenService.revokeToken(refreshToken);
        }
    }

    // Logout de todos os dispositivos
    async logoutAll(userId: string): Promise<void> {
        await this.tokenService.revokeAllUserTokens(userId);
    }

    // ==================== CADASTROS ====================

    async signupAdmin(signupDto: BasicUserDto): Promise<any> {
        return this.signupService.signupAdmin(signupDto);
    }

    async signupNgoMember(signupDto: NgoMemberDto): Promise<any> {
        return this.signupService.signupNgoMember(signupDto);
    }

    async signupNgo(signupDto: NgoSignupDto): Promise<any> {
        return this.signupService.signupNgo(signupDto);
    }

    // ==================== RECUPERAÇÃO DE SENHA ====================

    async requestPasswordReset(email: string): Promise<{ message: string }> {
        return this.passwordService.requestPasswordReset(email);
    }

    async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
        // Passa função de revogação de tokens como callback
        return this.passwordService.resetPassword(
            token,
            newPassword,
            (userId) => this.tokenService.revokeAllUserTokens(userId)
        );
    }

    // ==================== GERENCIAMENTO DE PERFIL ====================

    // Atualizar perfil institucional de ONG
    async updateNgoProfile(userId: string, updateDto: UpdateNgoDto) {
        const user = await this.userService.getById(userId);
        
        if (!user.ngoId || user.role !== 'NGO_ADMIN') {
            throw new UnauthorizedException('Apenas administradores de ONG podem atualizar');
        }

        const session = await this.connection.startSession();
        
        try {
            await session.withTransaction(async () => {
                await this.ngoService.update(user.ngoId, updateDto, session);
                
                if (updateDto.name) {
                    await this.userService.update(userId, { name: updateDto.name }, session);
                }
            });
            
            return { message: 'Perfil institucional atualizado com sucesso' };
        } finally {
            await session.endSession();
        }
    }
}
