import { Controller, Post, UseGuards, Request, Body, Get, HttpException, Res } from '@nestjs/common';
//import { AuthPayloadDTO } from './dto/auth.dto';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from 'src/modules/auth/guards/local-auth.guard';
import { CreateUserDto } from 'src/domain/user/dtos/create-user.dto';
import { NgoSignupDto } from './dtos/ngo-signup.dto';
import { Response } from 'express'; // Response do Express, para trabalhar com cookies
import { RefreshTokenGuard } from './guards/refresh-token.guard';

@Controller('auth')
export class AuthController {

    constructor(private authService: AuthService) { }

    @Post('login')
    @UseGuards(LocalAuthGuard) // Chama validateUser antes de login
    async login(@Request() req, @Res({ passthrough: true }) res: Response) {
        return this.authService.login(req.user, res);
    }

    @Post('refresh')
    @UseGuards(RefreshTokenGuard)
    async refresh(@Body('refreshToken') refreshToken: string, @Res({ passthrough: true }) res: Response) {
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
