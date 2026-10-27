import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { ErrorHandlerService } from './common/errors/error-handler.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const errorHandlerService = app.get(ErrorHandlerService);
  app.useGlobalFilters(new AllExceptionsFilter(errorHandlerService));

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  const configService = app.get(ConfigService);
  const PORT = configService.get<number>('APP_PORT') || 3000;
  const HOST = configService.get<string>('HOST') || '0.0.0.0';

  const enableSwagger = configService.get<string>('ENABLE_SWAGGER') !== 'false';
  if (enableSwagger) {
    const config = new DocumentBuilder()
      .setTitle('Login Service')
      .setDescription('API de autenticação e gerenciamento de usuários')
      .setVersion('1.0')
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        'access-token',
      )
      .build();

    const document = SwaggerModule.createDocument(app, config);
    document.tags = [
      { name: 'Login', description: 'Autenticação e sessão' },
      { name: 'Users', description: 'Cadastro e gerenciamento de usuários' },
      { name: 'Health Check', description: 'Disponibilidade da API' },
    ];
    SwaggerModule.setup('docs', app, document);
  }

  await app.listen(PORT, HOST);
}

bootstrap();
