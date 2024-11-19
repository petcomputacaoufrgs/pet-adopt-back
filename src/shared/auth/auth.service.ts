import { Injectable } from '@nestjs/common';
import { AuthPayloadDTO } from './dto/auth.dto';
import { JwtService} from '@nestjs/jwt';

interface User {
    id: number;
    username: string;
    password: string;
}

const fakeUsers: User[] = [
    {
        id: 1,
        username: "teste",
        password: "senha"
    },
    {
        id: 2,
        username: "teste2",
        password: "senha2"
    }
];

@Injectable()
export class AuthService { //integrar com o dto do usuário do petadopt

    constructor(private jwtService: JwtService){}

    validateUser({username, password}: AuthPayloadDTO){
        const findUser = fakeUsers.find((user) => user.username === username);
        if(!findUser) return null;

        if(password === findUser.password){
            const {password, ...user} = findUser;
            return this.jwtService.sign(user);
        }
    }
}
