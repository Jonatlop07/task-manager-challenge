import { API_PROVIDER_TOKENS } from '@api/api-provider-tokens';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  CreateTaskUseCase,
  type CreateTaskResult,
  DeleteTaskUseCase,
  ListTasksUseCase,
  type ListTasksResult,
  UpdateTaskUseCase,
  type UpdateTaskResult,
} from '@task/application';
import {
  TASK_HTTP_RESPONSE_STATUSES,
  TASK_HTTP_ROUTES,
} from './tasks-http.constants';
import {
  parseCreateTaskHttpRequest,
  parseListTasksHttpQuery,
  parseTaskCollectionParams,
  parseTaskLifecycleParams,
  parseUpdateTaskHttpRequest,
} from './tasks-http.schema';

@Controller(TASK_HTTP_ROUTES.PROJECT_TASKS)
export class TasksController {
  constructor(
    @Inject(API_PROVIDER_TOKENS.CREATE_TASK_USE_CASE)
    private readonly createTaskUseCase: Pick<CreateTaskUseCase, 'execute'>,
    @Inject(API_PROVIDER_TOKENS.LIST_TASKS_USE_CASE)
    private readonly listTasksUseCase: Pick<ListTasksUseCase, 'execute'>,
    @Inject(API_PROVIDER_TOKENS.UPDATE_TASK_USE_CASE)
    private readonly updateTaskUseCase: Pick<UpdateTaskUseCase, 'execute'>,
    @Inject(API_PROVIDER_TOKENS.DELETE_TASK_USE_CASE)
    private readonly deleteTaskUseCase: Pick<DeleteTaskUseCase, 'execute'>,
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

  @Patch(TASK_HTTP_ROUTES.TASK)
  @HttpCode(TASK_HTTP_RESPONSE_STATUSES.OK)
  async updateTask(
    @Param() params: unknown,
    @Body() body: unknown,
  ): Promise<UpdateTaskResult> {
    const parsedParams = parseTaskLifecycleParams(params);
    const request = parseUpdateTaskHttpRequest(body);

    return this.updateTaskUseCase.execute({
      projectId: parsedParams.projectId,
      taskId: parsedParams.taskId,
      title: request.title,
      description: request.description,
      status: request.status,
      priority: request.priority,
      dueDate: request.dueDate,
    });
  }

  @Delete(TASK_HTTP_ROUTES.TASK)
  @HttpCode(TASK_HTTP_RESPONSE_STATUSES.NO_CONTENT)
  async deleteTask(@Param() params: unknown): Promise<void> {
    const parsedParams = parseTaskLifecycleParams(params);

    await this.deleteTaskUseCase.execute({
      projectId: parsedParams.projectId,
      taskId: parsedParams.taskId,
    });
  }
}
