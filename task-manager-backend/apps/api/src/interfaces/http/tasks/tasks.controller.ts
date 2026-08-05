import { API_PROVIDER_TOKENS } from '@api/api-provider-tokens';
import {
  Body,
  Controller,
  HttpCode,
  Inject,
  Param,
  Post,
} from '@nestjs/common';
import { CreateTaskUseCase, type CreateTaskResult } from '@task/application';
import {
  TASK_HTTP_RESPONSE_STATUSES,
  TASK_HTTP_ROUTES,
} from './tasks-http.constants';
import {
  parseCreateTaskHttpRequest,
  parseTaskCollectionParams,
} from './tasks-http.schema';

@Controller(TASK_HTTP_ROUTES.PROJECT_TASKS)
export class TasksController {
  constructor(
    @Inject(API_PROVIDER_TOKENS.CREATE_TASK_USE_CASE)
    private readonly createTaskUseCase: Pick<CreateTaskUseCase, 'execute'>,
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
}
