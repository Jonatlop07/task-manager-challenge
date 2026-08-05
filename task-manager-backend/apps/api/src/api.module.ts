import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { environmentConfig } from '@api/config';
import { API_PROVIDER_TOKENS } from './api-provider-tokens';
import { createApiCreateProjectUseCase } from './composition/projects/api-create-project-use-case.factory';
import { createApiUpdateProjectUseCase } from './composition/projects/api-update-project-use-case.factory';
import { createApiDeleteProjectUseCase } from './composition/projects/api-delete-project-use-case.factory';
import { createApiGetProjectUseCase } from './composition/projects/api-get-project-use-case.factory';
import { createApiListProjectsUseCase } from './composition/projects/api-list-projects-use-case.factory';
import { createApiCreateTaskUseCase } from './composition/tasks/api-create-task-use-case.factory';
import { ProjectsController } from './interfaces/http/projects/projects.controller';
import { TasksController } from './interfaces/http/tasks/tasks.controller';
import {
  ProjectIdempotencyRecordOrmEntity,
  ProjectOrmEntity,
} from '@project/infrastructure';
import { TaskOrmEntity } from '@task/infrastructure';
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
      TaskOrmEntity,
    ]),
  ],
  controllers: [ProjectsController, TasksController],
  providers: [
    {
      provide: API_PROVIDER_TOKENS.CREATE_PROJECT_USE_CASE,
      inject: [DataSource],
      useFactory: (dataSource: DataSource) =>
        createApiCreateProjectUseCase({ dataSource }),
    },
    {
      provide: API_PROVIDER_TOKENS.UPDATE_PROJECT_USE_CASE,
      inject: [DataSource],
      useFactory: (dataSource: DataSource) =>
        createApiUpdateProjectUseCase({ dataSource }),
    },
    {
      provide: API_PROVIDER_TOKENS.DELETE_PROJECT_USE_CASE,
      inject: [DataSource],
      useFactory: (dataSource: DataSource) =>
        createApiDeleteProjectUseCase({ dataSource }),
    },
    {
      provide: API_PROVIDER_TOKENS.GET_PROJECT_USE_CASE,
      inject: [DataSource],
      useFactory: (dataSource: DataSource) =>
        createApiGetProjectUseCase({ dataSource }),
    },
    {
      provide: API_PROVIDER_TOKENS.LIST_PROJECTS_USE_CASE,
      inject: [DataSource],
      useFactory: (dataSource: DataSource) =>
        createApiListProjectsUseCase({ dataSource }),
    },
    {
      provide: API_PROVIDER_TOKENS.CREATE_TASK_USE_CASE,
      inject: [DataSource],
      useFactory: (dataSource: DataSource) =>
        createApiCreateTaskUseCase({ dataSource }),
    },
  ],
})
export class ApiModule {}
