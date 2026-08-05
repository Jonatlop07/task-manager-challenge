import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  Inject,
  Param,
  Patch,
  Post,
  Res,
} from '@nestjs/common';
import {
  PROJECT_HTTP_HEADERS,
  PROJECT_HTTP_RESPONSE_STATUSES,
  PROJECT_HTTP_ROUTES,
} from './projects-http.constants';
import {
  CreateProjectUseCase,
  DeleteProjectUseCase,
  GetProjectUseCase,
  ListProjectsUseCase,
  UpdateProjectUseCase,
} from '@project/application';
import type {
  CreateProjectCommand,
  CreateProjectResult,
  GetProjectResult,
  ListProjectsResult,
  UpdateProjectResult,
} from '@project/application';
import {
  readHttpHeader,
  type ApiHttpHeaderMap,
} from '../shared/api-http-headers';
import {
  type CreateProjectHttpRequest,
  parseCreateProjectHttpRequest,
  parseProjectLifecycleParams,
  parseUpdateProjectHttpRequest,
} from './projects-http.schema';
import { assertProjectIdempotencyKeyHeader } from './projects-http.idempotency-key';
import { API_PROVIDER_TOKENS } from '@api/api-provider-tokens';
import type { Response } from 'express';

type HeaderMap = ApiHttpHeaderMap;
type CreateProjectHttpResult = CreateProjectResult;
type UpdateProjectHttpResult = UpdateProjectResult;
type GetProjectHttpResult = GetProjectResult;
type ListProjectsHttpResult = ListProjectsResult;

@Controller(PROJECT_HTTP_ROUTES.PROJECTS)
export class ProjectsController {
  constructor(
    @Inject(API_PROVIDER_TOKENS.CREATE_PROJECT_USE_CASE)
    private readonly createProjectUseCase: Pick<
      CreateProjectUseCase,
      'execute'
    >,
    @Inject(API_PROVIDER_TOKENS.UPDATE_PROJECT_USE_CASE)
    private readonly updateProjectUseCase: Pick<
      UpdateProjectUseCase,
      'execute'
    >,
    @Inject(API_PROVIDER_TOKENS.DELETE_PROJECT_USE_CASE)
    private readonly deleteProjectUseCase: Pick<
      DeleteProjectUseCase,
      'execute'
    >,
    @Inject(API_PROVIDER_TOKENS.GET_PROJECT_USE_CASE)
    private readonly getProjectUseCase: Pick<GetProjectUseCase, 'execute'>,
    @Inject(API_PROVIDER_TOKENS.LIST_PROJECTS_USE_CASE)
    private readonly listProjectsUseCase: Pick<ListProjectsUseCase, 'execute'>,
  ) {}

  @Post()
  async createProject(
    @Body() body: unknown,
    @Headers() headers: HeaderMap,
    @Res({ passthrough: true }) response: Response,
  ): Promise<CreateProjectHttpResult> {
    const request = parseCreateProjectHttpRequest(body);
    const result = await this.createProjectUseCase.execute(
      this.toCommand(request, headers),
    );

    response.status(
      result.idempotentReplay
        ? PROJECT_HTTP_RESPONSE_STATUSES.OK
        : PROJECT_HTTP_RESPONSE_STATUSES.CREATED,
    );

    return result;
  }

  @Patch(PROJECT_HTTP_ROUTES.PROJECT)
  @HttpCode(PROJECT_HTTP_RESPONSE_STATUSES.OK)
  async updateProject(
    @Param() params: unknown,
    @Body() body: unknown,
  ): Promise<UpdateProjectHttpResult> {
    const parsedParams = parseProjectLifecycleParams(params);
    const request = parseUpdateProjectHttpRequest(body);

    return this.updateProjectUseCase.execute({
      projectId: parsedParams.projectId,
      name: request.name,
      description: request.description,
    });
  }

  @Delete(PROJECT_HTTP_ROUTES.PROJECT)
  @HttpCode(PROJECT_HTTP_RESPONSE_STATUSES.NO_CONTENT)
  async deleteProject(@Param() params: unknown): Promise<void> {
    const parsedParams = parseProjectLifecycleParams(params);

    await this.deleteProjectUseCase.execute({
      projectId: parsedParams.projectId,
    });
  }

  @Get(PROJECT_HTTP_ROUTES.PROJECT)
  async getProject(@Param() params: unknown): Promise<GetProjectHttpResult> {
    const parsedParams = parseProjectLifecycleParams(params);

    return this.getProjectUseCase.execute({
      projectId: parsedParams.projectId,
    });
  }

  @Get()
  async listProjects(): Promise<ListProjectsHttpResult> {
    return this.listProjectsUseCase.execute();
  }

  private toCommand(
    body: CreateProjectHttpRequest,
    headers: HeaderMap,
  ): CreateProjectCommand {
    return {
      idempotencyKey: assertProjectIdempotencyKeyHeader(
        readHttpHeader(headers, PROJECT_HTTP_HEADERS.IDEMPOTENCY_KEY),
      ),
      name: body.name,
      description: body.description,
    };
  }
}
