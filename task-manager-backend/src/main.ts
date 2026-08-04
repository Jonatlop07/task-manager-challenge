import { ConfigType } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { environmentConfig } from './config/environment.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get<ConfigType<typeof environmentConfig>>(
    environmentConfig.KEY,
  );

  await app.listen(config.app.port);
}
void bootstrap();
