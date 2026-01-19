import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Token, TokenType } from '../schemas/token.schema';
import { EncryptionService } from '../../encryption/encryption.service';
import { Response } from 'express';

const MAX_TOKENS_PER_USER = 3;

export interface TokenPayload {
    email: string;
    sub: string;
    role: string;
}

@Injectable()
export class TokenService {
    constructor(
        private jwtService: JwtService,
        private configService: ConfigService,
        private encryptionService: EncryptionService,
        @InjectModel(Token.name) private tokenModel: Model<Token>
    ) {}

    // Método auxiliar para converter strings de tempo JWT em milissegundos
    private parseJwtExpiration(timeString: string): number {
        const cleanTime = timeString.replace(/['"]/g, '');
        const match = cleanTime.match(/^(\d+)([smhd])$/);
        
        if (!match) {
            throw new Error(`Formato de tempo inválido: ${timeString}`);
        }
        
        const [, amount, unit] = match;
        const value = parseInt(amount, 10);
        
        switch (unit) {
            case 's': return value * 1000;
            case 'm': return value * 60 * 1000;
            case 'h': return value * 60 * 60 * 1000;
            case 'd': return value * 24 * 60 * 60 * 1000;
            default:
                throw new Error(`Unidade de tempo não suportada: ${unit}`);
        }
    }

    // Configura cookies HTTP-only com tokens
    setCookies(res: Response, accessToken: string, refreshToken: string): void {
        const accessTokenExpiration = this.parseJwtExpiration(
            this.configService.get('JWT_EXPIRES_IN')
        );
        const refreshTokenExpiration = this.parseJwtExpiration(
            this.configService.get('REFRESH_JWT_EXPIRES_IN')
        );

        res.cookie('access_token', accessToken, {
            httpOnly: true,
            secure: this.configService.get('NODE_ENV') === 'production',
            sameSite: 'strict',
            expires: new Date(Date.now() + accessTokenExpiration),
        });

        res.cookie('refresh_token', refreshToken, {
            httpOnly: true,
            secure: this.configService.get('NODE_ENV') === 'production',
            sameSite: 'strict',
            expires: new Date(Date.now() + refreshTokenExpiration),
        });
    }

    // Gera par de tokens (access + refresh)
    async generateTokenPair(payload: TokenPayload, deviceInfo?: string): Promise<{ accessToken: string; refreshToken: string }> {
        const accessToken = this.jwtService.sign(payload, {
            secret: this.configService.get('JWT_SECRET'),
            expiresIn: this.configService.get('JWT_EXPIRES_IN'),
        });
        
        const refreshToken = this.jwtService.sign(payload, {
            secret: this.configService.get('REFRESH_JWT_SECRET'),
            expiresIn: this.configService.get('REFRESH_JWT_EXPIRES_IN'),
        });

        await this.saveRefreshToken(payload.sub, refreshToken, deviceInfo);

        return { accessToken, refreshToken };
    }

    // Salva refresh token no banco (com hash)
    private async saveRefreshToken(userId: string, refreshToken: string, deviceInfo?: string): Promise<void> {
        const refreshTokenExpiration = this.parseJwtExpiration(
            this.configService.get('REFRESH_JWT_EXPIRES_IN')
        );
        const expiresAt = new Date(Date.now() + refreshTokenExpiration);

        // Limitar tokens por usuário
        await this.enforceTokenLimit(userId);

        const tokenHash = this.encryptionService.hashToken(refreshToken);
        
        await this.tokenModel.create({
            userId,
            token: tokenHash,
            type: TokenType.REFRESH,
            expiresAt,
            deviceInfo: deviceInfo || 'Unknown',
            createdAt: new Date(),
        });
    }

    // Garante limite de tokens por usuário
    private async enforceTokenLimit(userId: string): Promise<void> {
        const userTokenCount = await this.tokenModel.countDocuments({ 
            userId,
            type: TokenType.REFRESH 
        });

        if (userTokenCount >= MAX_TOKENS_PER_USER) {
            const oldestToken = await this.tokenModel
                .findOne({ userId, type: TokenType.REFRESH })
                .sort({ createdAt: 1 });
            
            if (oldestToken) {
                await this.tokenModel.deleteOne({ _id: oldestToken._id });
            }
        }
    }

    // Valida e renova refresh token
    async refreshTokens(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
        // 1. Verificar assinatura JWT
        const decodedToken = this.jwtService.verify(refreshToken, {
            secret: this.configService.get('REFRESH_JWT_SECRET'),
        });

        // 2. Buscar token no banco
        const userObjectId = Types.ObjectId.createFromHexString(decodedToken.sub);
        const tokenHash = this.encryptionService.hashToken(refreshToken);

        const storedToken = await this.tokenModel.findOne({
            token: tokenHash,
            userId: userObjectId,
            type: TokenType.REFRESH,
        });

        if (!storedToken) {
            throw new UnauthorizedException('Token de atualização não encontrado');
        }

        // 3. Verificar expiração
        if (storedToken.expiresAt < new Date()) {
            await this.tokenModel.deleteOne({ token: tokenHash });
            throw new UnauthorizedException('Token de atualização expirado');
        }

        // 4. Invalidar token antigo (rotação)
        await this.tokenModel.deleteOne({ token: tokenHash });

        // 5. Gerar novos tokens
        const payload: TokenPayload = {
            email: decodedToken.email,
            sub: decodedToken.sub,
            role: decodedToken.role,
        };

        return this.generateTokenPair(payload);
    }

    // Revoga todos os tokens de um usuário
    async revokeAllUserTokens(userId: string): Promise<void> {
        const userObjectId = Types.ObjectId.createFromHexString(userId);
        await this.tokenModel.deleteMany({ 
            userId: userObjectId,
            type: TokenType.REFRESH 
        });
    }

    // Revoga um token específico
    async revokeToken(refreshToken: string): Promise<void> {
        const tokenHash = this.encryptionService.hashToken(refreshToken);
        await this.tokenModel.deleteOne({ token: tokenHash });
    }

    // Limpa tokens expirados
    async cleanupExpiredTokens(): Promise<void> {
        await this.tokenModel.deleteMany({
            expiresAt: { $lt: new Date() }
        });
    }
}
