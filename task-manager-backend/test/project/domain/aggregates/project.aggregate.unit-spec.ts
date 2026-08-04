import { Project } from '@project/domain/aggregates';
import { ProjectId } from '@project/domain/value-objects';

describe('Project', () => {
  describe('create', () => {
    it('creates a project with valid properties', () => {
      const id = ProjectId.create('project-123');

      const project = Project.create({
        id,
        name: '  Task Manager  ',
        description: '  Backend project for task management  ',
      });

      expect(project).toBeInstanceOf(Project);
      expect(project.id).toBe(id);
      expect(project.name.value).toBe('Task Manager');
      expect(project.description.value).toBe(
        'Backend project for task management',
      );
    });
  });
});
