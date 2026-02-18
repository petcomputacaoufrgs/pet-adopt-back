import { Controller, Post, UseGuards, Request, Body, Get, Patch, Param, UnauthorizedException, Res, Delete } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from 'src/modules/auth/guards/local-auth.guard';
import { BasicUserDto, NgoMemberDto } from 'src/domain/user/dtos/create-user.dto';
import { NgoSignupDto } from './dtos/ngo-signup.dto';
import { Response, Request as ExpressRequest } from 'express'; // Para trabalhar com cookies
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from 'src/core/guards/roles.guard';
import { UpdateNgoDto } from 'src/domain/ngo/dtos/update-ngo.dto';
import { HasContactPipe } from 'src/core/pipes/has-contact.pipe';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { Roles } from 'src/core/decorators/roles.decorator';
import { Role } from 'src/core/enums/role.enum';

@Controller('auth')
export class AuthController {

    constructor(
        private authService: AuthService,
    ) { }

    @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 tentativas por minuto
    @Post('login')
    @UseGuards(LocalAuthGuard) // Chama validateUser antes de login
    async login(@Request() req, @Res({ passthrough: true }) res: Response) {
        return this.authService.login(req.user, res);
    }

    @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 req/min
    @Post('logout')
    async logout(@Request() req: ExpressRequest, @Res({ passthrough: true }) res: Response) {
        const refreshToken = req.cookies?.refresh_token;
        
        if (refreshToken) {
            // Revogar o token específico
            await this.authService.logout(refreshToken);
        }
        
        // Limpar cookies
        res.clearCookie('access_token');
        res.clearCookie('refresh_token');
        
        return { message: 'Logout realizado com sucesso' };
    }

    @Post('logout-all')
    @UseGuards(JwtAuthGuard) // Precisa estar autenticado
    async logoutAll(@Request() req, @Res({ passthrough: true }) res: Response) {
        // Revogar todos os tokens do usuário
        await this.authService.logoutAll(req.user.sub);
        
        // Limpar cookies
        res.clearCookie('access_token');
        res.clearCookie('refresh_token');
        
        return { message: 'Logout de todos os dispositivos realizado com sucesso' };
    }

    @Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 req/min - renovação automática de token
    @Post('refresh')
    async refresh(@Request() req: ExpressRequest, @Res({ passthrough: true }) res: Response) {
        const refreshToken = req.cookies?.refresh_token;
        
        if (!refreshToken) {
            throw new UnauthorizedException('Token de atualização não encontrado');
        }
        
        return this.authService.refreshTokens(refreshToken, res);
    }

    @Throttle({ default: { limit: 5, ttl: 300000 } }) // 5 req por 5 min
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @Post('signup/admin')
    async signupAdmin(@Body() signupDto: BasicUserDto) {
        return this.authService.signupAdmin(signupDto);
    }

    @Throttle({ default: { limit: 5, ttl: 300000 } }) // 5 req por 5 min
    @Post('signup/ngo-member')
    async signupNgoMember(@Body() dto: NgoMemberDto) {
        return this.authService.signupNgoMember(dto);
    }

    @Throttle({ default: { limit: 3, ttl: 300000 } }) // 3 req por 5 min
    @Post('signup/ngo')
    async signupNgo(@Body(new HasContactPipe()) signupDto: NgoSignupDto) {
        return this.authService.signupNgo(signupDto);
    }

    // Solicitar recuperação de senha
    @Throttle({ default: { limit: 3, ttl: 300000 } }) // 3 req. a cada 5 minutos
    @Post('password/request-reset')
    async requestPasswordReset(@Body() body: { email: string }) {
        return this.authService.requestPasswordReset(body.email);
    }

    // Resetar senha com token
    @Throttle({ default: { limit: 3, ttl: 300000 } })
    @Post('password/reset')
    async resetPassword(@Body() body: { token: string; newPassword: string }) {
        return this.authService.resetPassword(body.token, body.newPassword);
    }

    @Patch(':userId')
    @UseGuards(JwtAuthGuard, RolesGuard)
    async updateNgoInfo(@Param('userId') userId: string, @Body() updateData: UpdateNgoDto) {
        return this.authService.updateNgoProfile(userId, updateData);
    }

    // ==================== ADMINISTRAÇÃO ====================

    // Revogar todos os tokens do sistema (APENAS ADMIN)
    @Delete('tokens/revoke-all')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @Throttle({ default: { limit: 1, ttl: 300000 } }) // 1 req por 5 min
    async revokeAllTokens() {
        return this.authService.revokeAllSystemTokens();
    }
}
