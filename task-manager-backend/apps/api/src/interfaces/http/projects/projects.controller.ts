import { Body, Controller, Headers, Inject, Post, Res } from '@nestjs/common';
import {
  PROJECT_HTTP_HEADERS,
  PROJECT_HTTP_RESPONSE_STATUSES,
  PROJECT_HTTP_ROUTES,
} from './projects-http.constants';
import { CreateProjectUseCase } from '@project/application';
import type {
  CreateProjectCommand,
  CreateProjectResult,
} from '@project/application';
import {
  readHttpHeader,
  type ApiHttpHeaderMap,
} from '../shared/api-http-headers';
import {
  type CreateProjectHttpRequest,
  parseCreateProjectHttpRequest,
} from './projects-http.schema';
import { assertProjectIdempotencyKeyHeader } from './projects-http.idempotency-key';
import { API_PROVIDER_TOKENS } from '@api/api-provider-tokens';
import type { Response } from 'express';

type HeaderMap = ApiHttpHeaderMap;
type CreateProjectHttpResult = CreateProjectResult;

@Controller(PROJECT_HTTP_ROUTES.PROJECTS)
export class ProjectsController {
  constructor(
    @Inject(API_PROVIDER_TOKENS.CREATE_PROJECT_USE_CASE)
    private readonly createProjectUseCase: Pick<
      CreateProjectUseCase,
      'execute'
    >,
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
