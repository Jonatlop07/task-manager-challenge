import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useSearchParams } from 'react-router';
import { Button, Card, PageHeader } from '../../../shared/components';
import {
  taskPrioritySchema,
  taskStatusSchema,
  type ListTasksFilters,
  type Task,
  type TaskStatus,
} from '../../tasks/api/tasks.api';
import { CreateTaskDialog } from '../../tasks/components/create-task-dialog';
import { TaskDetailsDialog } from '../../tasks/components/task-details-dialog';
import { UpdateTaskDialog } from '../../tasks/components/update-task-dialog';
import { tasksByProjectQueryOptions } from '../../tasks/queries/tasks.queries';
import { projectSummaryQueryOptions } from '../../projects/queries/projects.queries';
import { BoardColumn } from '../components/board-column';
import { BoardSkeleton } from '../components/board-skeleton';
import { ProjectSummary } from '../components/project-summary';
import { ProjectSummarySkeleton } from '../components/project-summary-skeleton';
import { TaskFilters } from '../components/task-filters';
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
  const [searchParams, setSearchParams] = useSearchParams();
  const [isCreateTaskDialogOpen, setIsCreateTaskDialogOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [taskToUpdate, setTaskToUpdate] = useState<Task | null>(null);
  const filters = parseTaskFilters(searchParams);
  const tasksQuery = useQuery(tasksByProjectQueryOptions(projectId, filters));
  const summaryQuery = useQuery(projectSummaryQueryOptions(projectId));

  return (
    <main className={styles.page}>
      <PageHeader
        eyebrow="Proyecto"
        title="Tablero"
        description={
          summaryQuery.data
            ? formatTaskCount(summaryQuery.data.total)
            : `Proyecto ${projectId}`
        }
        actions={
          <Button onClick={() => setIsCreateTaskDialogOpen(true)}>
            Nueva tarea
          </Button>
        }
      />

      <section
        aria-busy={summaryQuery.isPending}
        aria-label="Resumen del proyecto"
      >
        {summaryQuery.isPending ? <ProjectSummarySkeleton /> : null}

        {summaryQuery.isError ? (
          <Card className={styles.summaryError} role="alert">
            <p>No pudimos cargar el resumen del proyecto.</p>
            <Button
              disabled={summaryQuery.isFetching}
              onClick={() => void summaryQuery.refetch()}
              variant="secondary"
            >
              {summaryQuery.isFetching ? 'Reintentando…' : 'Reintentar'}
            </Button>
          </Card>
        ) : null}

        {summaryQuery.data ? (
          <ProjectSummary summary={summaryQuery.data} />
        ) : null}
      </section>

      <TaskFilters
        filters={filters}
        isFetching={tasksQuery.isFetching}
        onChange={(nextFilters) =>
          setSearchParams(toSearchParams(nextFilters), { replace: true })
        }
        resultCount={tasksQuery.data?.length}
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
        onEdit={(task) => {
          setSelectedTaskId(null);
          setTaskToUpdate(task);
        }}
        projectId={projectId}
        taskId={selectedTaskId}
      />

      <UpdateTaskDialog
        onClose={() => setTaskToUpdate(null)}
        task={taskToUpdate}
      />
    </main>
  );
}

function parseTaskFilters(searchParams: URLSearchParams): ListTasksFilters {
  const parsedStatus = taskStatusSchema.safeParse(searchParams.get('status'));
  const parsedPriority = taskPrioritySchema.safeParse(
    searchParams.get('priority'),
  );
  const search = searchParams.get('search')?.trim() || undefined;

  return {
    status: parsedStatus.success ? parsedStatus.data : undefined,
    priority: parsedPriority.success ? parsedPriority.data : undefined,
    search,
  };
}

function toSearchParams(filters: ListTasksFilters): URLSearchParams {
  const searchParams = new URLSearchParams();

  if (filters.status) searchParams.set('status', filters.status);
  if (filters.priority) searchParams.set('priority', filters.priority);
  if (filters.search) searchParams.set('search', filters.search);

  return searchParams;
}

function formatTaskCount(count: number): string {
  return count === 1
    ? '1 tarea en el proyecto'
    : `${count} tareas en el proyecto`;
}
