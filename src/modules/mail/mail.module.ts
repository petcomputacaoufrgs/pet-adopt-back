import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailService } from './mail.service';

@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        transport: {
          host: configService.get('MAILTRAP_HOST'),
          port: configService.get('MAILTRAP_PORT'),
          auth: {
            user: configService.get('MAILTRAP_USER'),
            pass: configService.get('MAILTRAP_PASSWORD'),
          },
        },
        defaults: {
          from: configService.get('MAILTRAP_FROM_EMAIL'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}