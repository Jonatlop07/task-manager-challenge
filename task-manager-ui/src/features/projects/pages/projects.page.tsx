import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Button,
  Card,
  EmptyState,
  PageHeader,
} from '../../../shared/components';
import { CreateProjectDialog } from '../components/create-project-dialog';
import { ProjectList } from '../components/project-list';
import { ProjectsSkeleton } from '../components/projects-skeleton';
import { UpdateProjectDialog } from '../components/update-project-dialog';
import type { Project } from '../api/projects.api';
import { projectsQueryOptions } from '../queries/projects.queries';
import styles from './projects.page.module.css';

export function ProjectsPage() {
  const projectsQuery = useQuery(projectsQueryOptions());
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);

  return (
    <main className={styles.page}>
      <PageHeader
        actions={
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            Nuevo proyecto
          </Button>
        }
        eyebrow="Espacio de trabajo"
        title="Proyectos"
        description="Organiza el trabajo y entra al tablero de cada iniciativa."
      />

      <section
        aria-busy={projectsQuery.isPending}
        aria-labelledby="project-list-title"
      >
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.sectionTitle} id="project-list-title">
              Tus proyectos
            </h2>
            {!projectsQuery.isPending && !projectsQuery.isError ? (
              <p className={styles.projectCount}>
                {formatProjectCount(projectsQuery.data.length)}
              </p>
            ) : null}
          </div>
        </div>

        {projectsQuery.isPending ? <ProjectsSkeleton /> : null}

        {projectsQuery.isError ? (
          <Card className={styles.feedbackCard} role="alert">
            <div className={styles.feedbackIcon} aria-hidden="true">
              !
            </div>
            <div className={styles.feedbackCopy}>
              <h3>No pudimos cargar los proyectos</h3>
              <p>Revisa tu conexión e inténtalo nuevamente.</p>
            </div>
            <Button
              disabled={projectsQuery.isFetching}
              onClick={() => void projectsQuery.refetch()}
              variant="secondary"
            >
              {projectsQuery.isFetching ? 'Reintentando…' : 'Reintentar'}
            </Button>
          </Card>
        ) : null}

        {projectsQuery.data?.length === 0 ? (
          <Card>
            <EmptyState
              action={
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  Crear proyecto
                </Button>
              }
              title="Todavía no hay proyectos"
              description="Crea tu primer proyecto para comenzar a organizar tareas."
            />
          </Card>
        ) : null}

        {projectsQuery.data && projectsQuery.data.length > 0 ? (
          <ProjectList
            onEdit={setProjectToEdit}
            projects={projectsQuery.data}
          />
        ) : null}
      </section>

      <CreateProjectDialog
        onClose={() => setIsCreateDialogOpen(false)}
        open={isCreateDialogOpen}
      />
      <UpdateProjectDialog
        onClose={() => setProjectToEdit(null)}
        project={projectToEdit}
      />
    </main>
  );
}

function formatProjectCount(count: number): string {
  return count === 1 ? '1 proyecto' : `${count} proyectos`;
}
