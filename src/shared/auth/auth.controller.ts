import { Controller, Post, UseGuards, Request, Body, Get, HttpException } from '@nestjs/common';
//import { AuthPayloadDTO } from './dto/auth.dto';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from 'src/core/guards/local-auth.guard';
import { CreateUserDto } from 'src/domain/user/dtos/create-user.dto';
import { NgoSignupDto } from './dtos/ngo-signup.dto';

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

    @Post('signup/regular')
    async signupRegular(@Body() signupDto: CreateUserDto) {
        return this.authService.signupRegularUser(signupDto);
    }

    @Post('signup/ngo')
    async signupNgo(@Body() signupDto: NgoSignupDto) {
        return this.authService.signupNgoAdmin(signupDto);
    }
}
