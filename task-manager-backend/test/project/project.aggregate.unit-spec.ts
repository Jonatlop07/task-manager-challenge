import { Project } from '@project/domain/aggregates';
import { ProjectDescription, ProjectId } from '@project/domain/value-objects';

describe('Project', () => {
  describe('create', () => {
    it('creates a project with valid properties', () => {
      const id = ProjectId.create('project-123');
      const description = ProjectDescription.create(
        'Backend project for task management',
      );

      const project = Project.create({
        id,
        name: '  Task Manager  ',
        description,
      });

      expect(project).toBeInstanceOf(Project);
      expect(project.id).toBe(id);
      expect(project.name.value).toBe('Task Manager');
      expect(project.description).toBe(description);
    });
  });
});
