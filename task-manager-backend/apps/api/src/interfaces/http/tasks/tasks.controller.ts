import { API_PROVIDER_TOKENS } from '@api/api-provider-tokens';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  Inject,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import {
  CreateTaskUseCase,
  type CreateTaskResult,
  ListTasksUseCase,
  type ListTasksResult,
} from '@task/application';
import {
  TASK_HTTP_RESPONSE_STATUSES,
  TASK_HTTP_ROUTES,
} from './tasks-http.constants';
import {
  parseCreateTaskHttpRequest,
  parseListTasksHttpQuery,
  parseTaskCollectionParams,
} from './tasks-http.schema';

@Controller(TASK_HTTP_ROUTES.PROJECT_TASKS)
export class TasksController {
  constructor(
    @Inject(API_PROVIDER_TOKENS.CREATE_TASK_USE_CASE)
    private readonly createTaskUseCase: Pick<CreateTaskUseCase, 'execute'>,
    @Inject(API_PROVIDER_TOKENS.LIST_TASKS_USE_CASE)
    private readonly listTasksUseCase: Pick<ListTasksUseCase, 'execute'>,
  ) {}

  @Post()
  @HttpCode(TASK_HTTP_RESPONSE_STATUSES.CREATED)
  async createTask(
    @Param() params: unknown,
    @Body() body: unknown,
  ): Promise<CreateTaskResult> {
    const parsedParams = parseTaskCollectionParams(params);
    const request = parseCreateTaskHttpRequest(body);

    return this.createTaskUseCase.execute({
      projectId: parsedParams.projectId,
      title: request.title,
      description: request.description,
      priority: request.priority,
      dueDate: request.dueDate,
    });
  }

  @Get()
  async listTasks(
    @Param() params: unknown,
    @Query() query: unknown,
  ): Promise<ListTasksResult> {
    const parsedParams = parseTaskCollectionParams(params);
    const parsedQuery = parseListTasksHttpQuery(query);

    return this.listTasksUseCase.execute({
      projectId: parsedParams.projectId,
      status: parsedQuery.status,
      priority: parsedQuery.priority,
      search: parsedQuery.search,
    });
  }
}
