import { Controller, Post, UseGuards, Request, Body, Get, HttpException, Res } from '@nestjs/common';
//import { AuthPayloadDTO } from './dto/auth.dto';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from 'src/modules/auth/guards/local-auth.guard';
import { CreateUserDto } from 'src/domain/user/dtos/create-user.dto';
import { NgoSignupDto } from './dtos/ngo-signup.dto';
import { Response, Request as ExpressRequest } from 'express'; // Para trabalhar com cookies
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from 'src/core/guards/roles.guard';

@Controller('auth')
export class AuthController {

    constructor(private authService: AuthService) { }

    @Post('login')
    @UseGuards(LocalAuthGuard) // Chama validateUser antes de login
    async login(@Request() req, @Res({ passthrough: true }) res: Response) {
        return this.authService.login(req.user, res);
    }

    @Post('logout')
    async logout(@Request() req: ExpressRequest, @Res({ passthrough: true }) res: Response) {
        const refreshToken = req.cookies?.refresh_token;
        
        if (refreshToken) {
            // Revogar o token específico
            await this.authService.revokeSpecificToken(refreshToken);
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
        await this.authService.revokeAllUserTokens(req.user.sub);
        
        // Limpar cookies
        res.clearCookie('access_token');
        res.clearCookie('refresh_token');
        
        return { message: 'Logout de todos os dispositivos realizado com sucesso' };
    }

    @Post('refresh')
    async refresh(@Request() req: ExpressRequest, @Res({ passthrough: true }) res: Response) {
        const refreshToken = req.cookies?.refresh_token;
        
        if (!refreshToken) {
            throw new HttpException('Token de atualização não encontrado', 401);
        }
        
        return this.authService.refreshTokens(refreshToken, res);
    }

    @Post('signup/regular')
    async signupRegular(@Body() signupDto: CreateUserDto) {
        return this.authService.signupRegularUser(signupDto);
    }

    @Post('signup/ngo')
    async signupNgo(@Body() signupDto: NgoSignupDto) {
        return this.authService.signupNgoAdmin(signupDto);
    }
}
