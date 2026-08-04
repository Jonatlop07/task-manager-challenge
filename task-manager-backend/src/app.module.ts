import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { environmentConfig } from './config/environment.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [environmentConfig],
    }),
    TypeOrmModule.forRootAsync({
      inject: [environmentConfig.KEY],
      useFactory: (config) => ({
        type: 'postgres',
        host: config.database.host,
        port: config.database.port,
        username: config.database.username,
        password: config.database.password,
        database: config.database.name,
        ssl: config.database.ssl,
        autoLoadEntities: true,
        synchronize: false,
      }),
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
