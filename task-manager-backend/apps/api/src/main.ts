import { ConfigType } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { ApiModule } from './api.module';
import { environmentConfig } from './config/environment.config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppErrorExceptionFilter } from './interfaces/http/errors/app-error-exception.filter';
import { ConsoleLogger } from '@nestjs/common';
import { REQUEST_ID_HEADER } from './interfaces/http/logging/http-logging.middleware';

const isProduction = process.env.NODE_ENV === 'production';
const logger = new ConsoleLogger({
  json: isProduction,
  colors: !isProduction,
});

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(ApiModule, {
    logger,
  });

  app.useGlobalFilters(new AppErrorExceptionFilter());

  const config = app.get<ConfigType<typeof environmentConfig>>(
    environmentConfig.KEY,
  );

  app.enableCors({
    origin: config.app.corsOrigins,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Accept',
      'Content-Type',
      'Idempotency-Key',
      REQUEST_ID_HEADER,
    ],
    exposedHeaders: [REQUEST_ID_HEADER],
  });

  await app.listen(config.app.port);

  logger.log({
    event: 'application.started',
    environment: process.env.NODE_ENV ?? 'development',
    port: config.app.port,
  });
}

void bootstrap().catch((exception: unknown) => {
  logger.error({
    event: 'application.bootstrap.failed',
    exception:
      exception instanceof Error
        ? {
            name: exception.name,
            message: exception.message,
            stack: exception.stack,
          }
        : {
            name: 'UnknownThrownValue',
            message: 'A non-Error value was thrown',
          },
  });
  process.exitCode = 1;
});
