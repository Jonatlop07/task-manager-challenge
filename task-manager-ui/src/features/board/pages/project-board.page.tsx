import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router';
import { Button, Card, PageHeader } from '../../../shared/components';
import type { TaskStatus } from '../../tasks/api/tasks.api';
import { CreateTaskDialog } from '../../tasks/components/create-task-dialog';
import { TaskDetailsDialog } from '../../tasks/components/task-details-dialog';
import { tasksByProjectQueryOptions } from '../../tasks/queries/tasks.queries';
import { BoardColumn } from '../components/board-column';
import { BoardSkeleton } from '../components/board-skeleton';
import styles from './project-board.page.module.css';

const boardColumns = [
  { status: 'pending', title: 'Por hacer', tone: 'neutral' },
  { status: 'in-progress', title: 'En progreso', tone: 'info' },
  { status: 'completed', title: 'Finalizado', tone: 'success' },
] as const satisfies readonly {
  status: TaskStatus;
  title: string;
  tone: 'neutral' | 'info' | 'success';
}[];

export function ProjectBoardPage() {
  const { projectId = '' } = useParams<{ projectId: string }>();
  const [isCreateTaskDialogOpen, setIsCreateTaskDialogOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const tasksQuery = useQuery(tasksByProjectQueryOptions(projectId));

  return (
    <main className={styles.page}>
      <PageHeader
        eyebrow="Proyecto"
        title="Tablero"
        description={
          tasksQuery.data
            ? formatTaskCount(tasksQuery.data.length)
            : `Proyecto ${projectId}`
        }
        actions={
          <Button onClick={() => setIsCreateTaskDialogOpen(true)}>
            Nueva tarea
          </Button>
        }
      />

      <section
        aria-busy={tasksQuery.isPending}
        aria-label="Tareas del proyecto"
      >
        {tasksQuery.isPending ? <BoardSkeleton /> : null}

        {tasksQuery.isError ? (
          <Card className={styles.feedbackCard} role="alert">
            <div className={styles.feedbackIcon} aria-hidden="true">
              !
            </div>
            <div className={styles.feedbackCopy}>
              <h2>No pudimos cargar las tareas</h2>
              <p>Revisa tu conexión e inténtalo nuevamente.</p>
            </div>
            <Button
              disabled={tasksQuery.isFetching}
              onClick={() => void tasksQuery.refetch()}
              variant="secondary"
            >
              {tasksQuery.isFetching ? 'Reintentando…' : 'Reintentar'}
            </Button>
          </Card>
        ) : null}

        {tasksQuery.data ? (
          <div className={styles.board}>
            {boardColumns.map((column) => (
              <BoardColumn
                key={column.status}
                onTaskSelect={setSelectedTaskId}
                tasks={tasksQuery.data.filter(
                  (task) => task.status === column.status,
                )}
                title={column.title}
                tone={column.tone}
              />
            ))}
          </div>
        ) : null}
      </section>

      <CreateTaskDialog
        onClose={() => setIsCreateTaskDialogOpen(false)}
        open={isCreateTaskDialogOpen}
        projectId={projectId}
      />

      <TaskDetailsDialog
        onClose={() => setSelectedTaskId(null)}
        projectId={projectId}
        taskId={selectedTaskId}
      />
    </main>
  );
}

function formatTaskCount(count: number): string {
  return count === 1
    ? '1 tarea en el proyecto'
    : `${count} tareas en el proyecto`;
}
