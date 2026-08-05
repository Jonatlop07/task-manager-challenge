import { ConfigType } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { ApiModule } from './api.module';
import { environmentConfig } from './config/environment.config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppErrorExceptionFilter } from './interfaces/http/errors/app-error-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(ApiModule);

  app.useGlobalFilters(new AppErrorExceptionFilter());

  const config = app.get<ConfigType<typeof environmentConfig>>(
    environmentConfig.KEY,
  );

  app.enableCors({
    origin: config.app.corsOrigins,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Accept', 'Content-Type', 'Idempotency-Key'],
  });

  await app.listen(config.app.port);
}

void bootstrap();
