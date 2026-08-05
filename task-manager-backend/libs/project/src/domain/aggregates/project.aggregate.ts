import { ProjectDescription, ProjectId, ProjectName } from '../value-objects';

interface ProjectProperties {
  id: ProjectId;
  name: ProjectName;
  description: ProjectDescription;
}

interface CreateProjectProperties {
  id: ProjectId;
  name: string;
  description?: string;
}

export type ProjectSnapshot = Readonly<{
  id: string;
  name: string;
  description: string | null;
}>;

export class Project {
  private constructor(private readonly properties: ProjectProperties) {}

  static create(properties: CreateProjectProperties): Project {
    return new Project({
      id: properties.id,
      name: ProjectName.create(properties.name),
      description: ProjectDescription.create(properties.description ?? null),
    });
  }

  toSnapshot(): ProjectSnapshot {
    return {
      id: this.id.value,
      name: this.name.value,
      description: this.description.value,
    };
  }

  get id(): ProjectId {
    return this.properties.id;
  }

  get name(): ProjectName {
    return this.properties.name;
  }

  get description(): ProjectDescription {
    return this.properties.description;
  }
}
