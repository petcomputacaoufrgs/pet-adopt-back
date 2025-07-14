import { Controller, Post, UseGuards, Request, Body, Get, HttpException } from '@nestjs/common';
//import { AuthPayloadDTO } from './dto/auth.dto';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from 'src/core/guards/local-auth.guard';
import { CreateUserDto } from 'src/domain/user/dtos/create-user.dto';

@Controller('auth')
export class AuthController {

    constructor(private authService: AuthService) { }

    @UseGuards(LocalAuthGuard)
    @Post('/login')
    async login(@Request() req) {
        const token = this.authService.login(req.user);

        if (!token) throw new HttpException('Invalid Credentials', 401);
        return token;
    }

    @Post('/signup')
    async signup(@Body() signupDto: CreateUserDto) {
        return await this.authService.signup(signupDto);
    }
}
