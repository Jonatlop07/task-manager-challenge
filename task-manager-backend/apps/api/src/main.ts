import { ConfigType } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { ApiModule } from './api.module';
import { environmentConfig } from './config/environment.config';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(ApiModule);
  const config = app.get<ConfigType<typeof environmentConfig>>(
    environmentConfig.KEY,
  );

  await app.listen(config.app.port);
}

void bootstrap();
