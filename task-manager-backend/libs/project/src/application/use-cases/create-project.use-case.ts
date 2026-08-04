import { Project, ProjectId } from "@project/domain";
import { ProjectCreationResult, ProjectCreationStore } from "../ports";
import { IdGenerator } from "@shared/identity";

type CreateProjectCommand = Readonly<{
  name: string;
  description?: string;
}>;

type CreateProjectResult = ProjectCreationResult;

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
    return this.store.save({
      project: project.toSnapshot(),
    });
  }
}
