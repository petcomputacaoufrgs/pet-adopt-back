import { Injectable, HttpException, HttpStatus, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Token, TokenType } from '../schemas/token.schema';
import { EncryptionService } from '../../encryption/encryption.service';
import { UserService } from 'src/domain/user/user.service';
import { MailService } from '../../mail/mail.service';

@Injectable()
export class PasswordService {
    constructor(
        private jwtService: JwtService,
        private configService: ConfigService,
        private encryptionService: EncryptionService,
        private userService: UserService,
        private mailService: MailService,
        @InjectModel(Token.name) private tokenModel: Model<Token>
    ) {}

    // Validar força da senha
    validatePasswordStrength(password: string): void {
        const { valid, errors } = this.encryptionService.validatePasswordStrength(password);
        if (!valid) {
            throw new HttpException(
                `Senha fraca: ${errors.join(', ')}`, 
                HttpStatus.BAD_REQUEST
            );
        }
    }

    // Validar se senhas coincidem
    validatePasswordMatch(password: string, confirmPassword: string): void {
        if (password !== confirmPassword) {
            throw new HttpException('Há diferença entre as senhas.', HttpStatus.BAD_REQUEST);
        }
    }

    // Solicitar recuperação de senha
    async requestPasswordReset(email: string): Promise<{ message: string }> {
        const user = await this.userService.getByEmail(email);
        if (!user) {
            // Não revelar se o email existe (segurança)
            return { message: 'Se o e-mail existir, um link de recuperação será enviado.' };
        }

        const userId = (user as any)._id.toString();

        // Invalidar tokens de reset anteriores
        await this.tokenModel.deleteMany({
            userId: Types.ObjectId.createFromHexString(userId),
            type: TokenType.PASSWORD_RESET,
        });

        // Gerar e enviar novo token
        const resetToken = await this.generatePasswordResetToken(userId);
        await this.mailService.sendPasswordReset(email, resetToken);

        return { message: 'Se o e-mail existir, um link de recuperação será enviado.' };
    }

    // Gerar token de recuperação de senha
    private async generatePasswordResetToken(userId: string): Promise<string> {
        const payload = { sub: userId };
        
        const resetToken = this.jwtService.sign(payload, {
            secret: this.configService.get('JWT_SECRET'),
            expiresIn: this.configService.get('PASSWORD_RESET_EXPIRES_IN') || '15m',
        });

        const expiresAt = new Date(
            Date.now() + this.parseJwtExpiration(
                this.configService.get('PASSWORD_RESET_EXPIRES_IN') || '15m'
            )
        );

        await this.tokenModel.create({
            userId: Types.ObjectId.createFromHexString(userId),
            token: resetToken,
            type: TokenType.PASSWORD_RESET,
            expiresAt,
            deviceInfo: 'Password Reset',
        });

        return resetToken;
    }

    // Resetar senha com token
    async resetPassword(token: string, newPassword: string, revokeAllTokensFn: (userId: string) => Promise<void>): Promise<{ message: string }> {
        // 1. Verificar token JWT primeiro
        let decoded;
        try {
            decoded = this.jwtService.verify(token, {
                secret: this.configService.get('JWT_SECRET'),
            });
        } catch (error) {
            // Captura TokenExpiredError, JsonWebTokenError, etc.
            throw new UnauthorizedException('Token inválido ou expirado');
        }

        // 2. Validar força da senha ANTES de consumir o token
        this.validatePasswordStrength(newPassword);

        // 3. Buscar e deletar token no banco (uso único)
        const storedToken = await this.tokenModel.findOneAndDelete({
            token,
            type: TokenType.PASSWORD_RESET,
            expiresAt: { $gt: new Date() },
        });

        if (!storedToken) {
            throw new UnauthorizedException('Token inválido ou expirado');
        }

        // 4. Atualizar senha e revogar tokens
        const hashedPassword = await this.encryptionService.encryptPassword(newPassword);
        await this.userService.updatePassword(decoded.sub, hashedPassword);
        await revokeAllTokensFn(decoded.sub);

        return { message: 'Senha atualizada com sucesso' };
    }

    private parseJwtExpiration(timeString: string): number {
        const cleanTime = timeString.replace(/['"]/g, '');
        const match = cleanTime.match(/^(\d+)([smhd])$/);
        
        if (!match) throw new Error(`Formato de tempo inválido: ${timeString}`);
        
        const [, amount, unit] = match;
        const value = parseInt(amount, 10);
        
        switch (unit) {
            case 's': return value * 1000;
            case 'm': return value * 60 * 1000;
            case 'h': return value * 60 * 60 * 1000;
            case 'd': return value * 24 * 60 * 60 * 1000;
            default: throw new Error(`Unidade de tempo não suportada: ${unit}`);
        }
    }
}
