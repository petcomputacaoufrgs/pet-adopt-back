import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Token } from '../schemas/token.schema';

@Injectable()
export class TokenCleanupService {
    private readonly logger = new Logger(TokenCleanupService.name);

    constructor(
        @InjectModel(Token.name) private tokenModel: Model<Token>
    ) {}

    // Executa todos os dias à meia-noite
    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async cleanupExpiredTokens() {
        try {
            this.logger.log('Iniciando limpeza automática de tokens expirados');
            
            const result = await this.tokenModel.deleteMany({
                expiresAt: { $lt: new Date() }
            });
            
            this.logger.log(`Tokens expirados removidos: ${result.deletedCount}`);
            
            // Também limpar tokens muito antigos (com mais de 30 dias)
            const veryOldTokens = await this.tokenModel.deleteMany({
                createdAt: { $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
            });
            
            if (veryOldTokens.deletedCount > 0) {
                this.logger.log(`Tokens muito antigos removidos: ${veryOldTokens.deletedCount}`);
            }
            
        } catch (error) {
            this.logger.error('Erro ao limpar tokens expirados:', error);
        }
    }

    // Limpeza manual (pode ser chamada via endpoint administrativo)
    async manualCleanup(): Promise<{ expired: number; old: number }> {
        try {
            const expiredResult = await this.tokenModel.deleteMany({
                expiresAt: { $lt: new Date() }
            });
            
            const oldResult = await this.tokenModel.deleteMany({
                createdAt: { $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
            });
            
            return {
                expired: expiredResult.deletedCount,
                old: oldResult.deletedCount
            };
        } catch (error) {
            this.logger.error('❌ Erro na limpeza manual:', error);
            throw error;
        }
    }

    // Estatísticas dos tokens
    async getTokenStats() {
        try {
            const total = await this.tokenModel.countDocuments();
            const expired = await this.tokenModel.countDocuments({
                expiresAt: { $lt: new Date() }
            });
            const active = total - expired;
            
            return { total, active, expired };
        } catch (error) {
            this.logger.error('❌ Erro ao obter estatísticas:', error);
            throw error;
        }
    }
}