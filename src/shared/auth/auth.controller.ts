import { Controller, Post, UseGuards, Request, Body, Get, HttpException } from '@nestjs/common';
//import { AuthPayloadDTO } from './dto/auth.dto';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from 'src/core/guards/local-auth.guard';

@Controller('auth')
export class AuthController {

    constructor(private authService: AuthService){}


    // Versão Anterior:
    /*
    @Post('login')
    login(@Body() authPayload: AuthPayloadDTO){
        const token = this.authService.validateUser(authPayload);
    */

    @UseGuards(LocalAuthGuard)
    @Post('/login')
    async login(@Request() req){
        const token = this.authService.login(req.user);

    if(!token) throw new HttpException('Invalid Credentials', 401);
    return token;
 }
}
