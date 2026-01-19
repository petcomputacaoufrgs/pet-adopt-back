import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { BasicUserDto, NgoMemberDto } from 'src/domain/user/dtos/create-user.dto';
import { NgoSignupDto } from '../dtos/ngo-signup.dto';
import { Role } from 'src/core/enums/role.enum';
import { UserService } from 'src/domain/user/user.service';
import { NgoService } from 'src/domain/ngo/ngo.service';
import { EncryptionService } from '../../encryption/encryption.service';
import { PasswordService } from './password.service';

@Injectable()
export class SignupService {
    constructor(
        private userService: UserService,
        private ngoService: NgoService,
        private encryptionService: EncryptionService,
        private passwordService: PasswordService,
        @InjectConnection() private connection: Connection
    ) {}

    // Validar se email já existe
    private async validateEmailNotExists(email: string): Promise<void> {
        const existingUser = await this.userService.getByEmail(email);
        if (existingUser) {
            throw new HttpException('Este e-mail já foi cadastrado', HttpStatus.CONFLICT);
        }
    }

    // Criar usuário genérico (admin ou ngo member)
    private async createUser(signupDto: BasicUserDto | NgoMemberDto, role: Role): Promise<any> {
        this.passwordService.validatePasswordMatch(signupDto.password, signupDto.confirmPassword);
        this.passwordService.validatePasswordStrength(signupDto.password);
        await this.validateEmailNotExists(signupDto.email);

        const hashedPassword = await this.encryptionService.encryptPassword(signupDto.password);
        
        await this.userService.create({
            ...signupDto,
            role,
            password: hashedPassword,
            confirmPassword: hashedPassword,
        });

        return { message: 'Usuário criado com sucesso' };
    }

    // Signup para admin
    async signupAdmin(signupDto: BasicUserDto): Promise<any> {
        return this.createUser(signupDto, Role.ADMIN);
    }

    // Signup para membro de ONG
    async signupNgoMember(signupDto: NgoMemberDto): Promise<any> {
        const ngo = await this.ngoService.getById(signupDto.ngoId);
        if (!ngo) {
            throw new HttpException('ONG não encontrada', HttpStatus.NOT_FOUND);
        }
        return this.createUser(signupDto, Role.NGO_MEMBER_PENDING);
    }

    // Signup para conta institucional de ONG (transacional)
    async signupNgo(signupDto: NgoSignupDto): Promise<any> {
        const { user, ngo } = signupDto;

        // Validações
        this.passwordService.validatePasswordMatch(user.password, user.confirmPassword);
        this.passwordService.validatePasswordStrength(user.password);
        
        const existingAdmin = await this.userService.getByEmail(user.email);
        if (existingAdmin) {
            if (existingAdmin.role === Role.NGO_ADMIN) {
                throw new HttpException(
                    'Já existe uma ONG registrada com este e-mail, faça login na ONG ou crie uma conta membro da ONG.',
                    HttpStatus.CONFLICT
                );
            }
            if (existingAdmin.role === Role.NGO_ADMIN_PENDING) {
                throw new HttpException(
                    'Já existe uma solicitação de ONG registrada com este e-mail, aguarde a aprovação da ONG.',
                    HttpStatus.CONFLICT
                );
            }
        }

        // Transação para criar ONG + Admin
        const session = await this.connection.startSession();

        try {
            await session.withTransaction(async () => {
                // 1. Criar ONG
                const createdNgo = await this.ngoService.create(ngo, session);

                // 2. Criar usuário admin da ONG
                const hashedPassword = await this.encryptionService.encryptPassword(user.password);
                
                const userData = {
                    ...user,
                    password: hashedPassword,
                    confirmPassword: hashedPassword,
                    ngoId: createdNgo._id.toString(),
                    role: Role.NGO_ADMIN_PENDING,
                };

                await this.userService.create(userData, session);
            });

            return { message: 'ONG e conta administrativa criadas. Aguardando aprovação.' };

        } catch (error) {
            console.error('Erro durante a transação:', error);
            throw new HttpException(
                'Falha no cadastro da ONG: ' + error.message,
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        } finally {
            await session.endSession();
        }
    }
}
