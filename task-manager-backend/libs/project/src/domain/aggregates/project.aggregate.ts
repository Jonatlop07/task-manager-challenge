import { ProjectDescription, ProjectId, ProjectName } from '../value-objects';

interface ProjectProperties {
  id: ProjectId;
  name: ProjectName;
  description: ProjectDescription;
}

interface CreateProjectProperties {
  id: ProjectId;
  name: string;
  description?: ProjectDescription;
}

export type ProjectSnapshot = Readonly<{
  id: string;
  name: string;
  description: string | null;
}>;

export class Project {
  private constructor(private readonly properties: ProjectProperties) {}

  public static create(properties: CreateProjectProperties): Project {
    return new Project({
      id: properties.id,
      name: ProjectName.create(properties.name),
      description: properties.description ?? ProjectDescription.create(null),
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
}
