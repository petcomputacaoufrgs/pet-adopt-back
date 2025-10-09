import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());
  
  
  const configService = app.get(ConfigService);

  // pega variáveis do .env
  const frontendUrl =
    configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
  const port = configService.get<string>('PORT') || '3002';

  // Configuração CORS para permitir cookies e credenciais
  app.enableCors({
    origin: [frontendUrl], // URL do frontend
    credentials: true, // Permite envio de cookies e credenciais
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    exposedHeaders: ['Set-Cookie'], // Permite que o frontend acesse o header Set-Cookie
  });
  
  app.setGlobalPrefix('api/v1');


  const config = new DocumentBuilder()
    .setTitle('PetAdopt - V1')
    .setDescription('Pet Adopt API Documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(port, '0.0.0.0'); // Escuta em todas as interfaces de rede
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
