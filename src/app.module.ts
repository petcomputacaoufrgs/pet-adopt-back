import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PetModule } from './domain/pet/pet.module';
import { NgoModule } from './domain/ngo/ngo.module';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from './domain/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { MailModule } from './modules/mail/mail.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        uri: configService
          .get('MONGO_DB_URL')
          .replace('<PASSWORD>', configService.get('MONGO_DB_PASSWORD')),
      }),
      inject: [ConfigService],
    }),
    PetModule,
    NgoModule,
    UserModule,
    AuthModule,
    MailModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
