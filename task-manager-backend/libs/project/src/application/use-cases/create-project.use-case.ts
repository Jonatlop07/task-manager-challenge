import { Project, ProjectId, ProjectSnapshot } from "@project/domain";
import { PROJECT_CREATION_STORE_RESULT_STATUSES, ProjectCreationStore } from "../ports";
import { IdGenerator } from "@shared/identity";
import { PROJECT_APPLICATION_ERROR_CODES, PROJECT_APPLICATION_ERROR_MESSAGES, ProjectApplicationError } from "../errors";
import { ERROR_CATEGORIES } from "@shared/errors";

export type CreateProjectCommand = Readonly<{
  idempotencyKey: string;
  name: string;
  description?: string;
}>;

export type CreateProjectResult = {
  project: ProjectSnapshot;
  idempotentReplay: boolean;
};

export class CreateProjectUseCase {
  constructor(
    private readonly store: ProjectCreationStore,
    private readonly projectIdGenerator: IdGenerator<string>,
  ) {}

  async execute(command: CreateProjectCommand): Promise<CreateProjectResult> {
    const projectId = ProjectId.create(this.projectIdGenerator.generate());
    const project = Project.create({
      id: projectId,
      name: command.name,
      description: command.description,
    });

    const storeResult = await this.store.save({
      idempotencyKey: command.idempotencyKey,
      project: project.toSnapshot(),
    });

    if (storeResult.status === PROJECT_CREATION_STORE_RESULT_STATUSES.IDEMPOTENCY_CONFLICT) {
      throw new ProjectApplicationError(
        PROJECT_APPLICATION_ERROR_CODES.IDEMPOTENCY_CONFLICT,
        PROJECT_APPLICATION_ERROR_MESSAGES.IDEMPOTENCY_CONFLICT,
        {
          category: ERROR_CATEGORIES.IDEMPOTENCY_CONFLICT,
          retryable: false,
        },
      );
    }

    const idempotentReplay = storeResult.status === PROJECT_CREATION_STORE_RESULT_STATUSES.REPLAYED;

    return {
      idempotentReplay,
      project: storeResult.project,
    };
  }
}
