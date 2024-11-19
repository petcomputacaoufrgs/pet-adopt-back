import { Controller, Post, Body, HttpException } from '@nestjs/common';
import { AuthPayloadDTO } from './dto/auth.dto';
import { AuthService } from './auth.service';


@Controller('auth')
export class AuthController {

    constructor(private authService: AuthService){}

 @Post('login')
 login(@Body() authPayload: AuthPayloadDTO){
    const token = this.authService.validateUser(authPayload);

    if(!token) throw new HttpException('Invalid Credentials', 401);
    return token;
 }
}
