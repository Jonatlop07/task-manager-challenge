import { ProjectDescription, ProjectId, ProjectName } from '../value-objects';

interface ProjectProperties {
  id: ProjectId;
  name: ProjectName;
  description: ProjectDescription;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateProjectProperties {
  id: ProjectId;
  name: string;
  description?: ProjectDescription;
  createdAt?: Date;
}

export class Project {
  private constructor(private readonly properties: ProjectProperties) {}

  public static create(properties: CreateProjectProperties): Project {
    const createdAt = properties.createdAt
      ? new Date(properties.createdAt)
      : new Date();

    return new Project({
      id: properties.id,
      name: ProjectName.create(properties.name),
      description: properties.description ?? ProjectDescription.create(null),
      createdAt,
      updatedAt: new Date(createdAt),
    });
  }

  public get id(): ProjectId {
    return this.properties.id;
  }

  public get name(): ProjectName {
    return this.properties.name;
  }

  public get description(): ProjectDescription {
    return this.properties.description;
  }

  public get createdAt(): Date {
    return new Date(this.properties.createdAt);
  }

  public get updatedAt(): Date {
    return new Date(this.properties.updatedAt);
  }
}
