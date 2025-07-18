import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors(); // <-- Isso permite chamadas do React (ou qualquer frontend via HTTP)
  // Podemos adicionar uma origem específica, para garantir que só o front tenha acesso, por segurança
  
  app.setGlobalPrefix('api/v1');

  const configService = app.get(ConfigService);
  const port = configService.get<string>('PORT', '3000');
  const config = new DocumentBuilder()
    .setTitle('PetAdopt - V1')
    .setDescription('Pet Adopt API Documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(port);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
