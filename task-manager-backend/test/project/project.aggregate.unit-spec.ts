import { Project } from '@project/domain/aggregates';
import { ProjectDescription, ProjectId } from '@project/domain/value-objects';

describe('Project', () => {
  describe('create', () => {
    it('creates a project with valid properties', () => {
      const id = ProjectId.create('project-123');
      const description = ProjectDescription.create(
        'Backend project for task management',
      );
      const createdAt = new Date('2026-08-04T12:00:00.000Z');

      const project = Project.create({
        id,
        name: '  Task Manager  ',
        description,
        createdAt,
      });

      expect(project).toBeInstanceOf(Project);
      expect(project.id).toBe(id);
      expect(project.name.value).toBe('Task Manager');
      expect(project.description).toBe(description);
      expect(project.createdAt).toEqual(createdAt);
      expect(project.updatedAt).toEqual(createdAt);
    });
  });
});
