import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { environmentConfig } from '@api/config';
import { API_PROVIDER_TOKENS } from './api-provider-tokens';
import { createApiCreateProjectUseCase } from './composition/projects/api-create-project-use-case.factory';
import { ProjectsController } from './interfaces/http/projects/projects.controller';
import {
  ProjectIdempotencyRecordOrmEntity,
  ProjectOrmEntity,
} from '@project/infrastructure';
import { DataSource } from 'typeorm';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [environmentConfig],
    }),
    TypeOrmModule.forRootAsync({
      inject: [environmentConfig.KEY],
      useFactory: (config: ConfigType<typeof environmentConfig>) => ({
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
    TypeOrmModule.forFeature([
      ProjectOrmEntity,
      ProjectIdempotencyRecordOrmEntity,
    ]),
  ],
  controllers: [ProjectsController],
  providers: [
    {
      provide: API_PROVIDER_TOKENS.CREATE_PROJECT_USE_CASE,
      inject: [DataSource],
      useFactory: (dataSource: DataSource) =>
        createApiCreateProjectUseCase({ dataSource }),
    },
  ],
})
export class ApiModule {}
