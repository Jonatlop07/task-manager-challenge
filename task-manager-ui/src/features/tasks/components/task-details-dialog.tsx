import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge, Button } from '../../../shared/components';
import type { Task, TaskPriority, TaskStatus } from '../api/tasks.api';
import { taskDetailsQueryOptions } from '../queries/tasks.queries';
import dialogStyles from './create-task-dialog.module.css';
import styles from './task-details-dialog.module.css';

export type TaskDetailsDialogProps = Readonly<{
  projectId: string;
  taskId: string | null;
  onClose: () => void;
  onEdit: (task: Task) => void;
}>;

export function TaskDetailsDialog({
  onClose,
  onEdit,
  projectId,
  taskId,
}: TaskDetailsDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const taskQuery = useQuery(taskDetailsQueryOptions(projectId, taskId ?? ''));

  useEffect(() => {
    const dialog = dialogRef.current;

    if (taskId && !dialog?.open) {
      dialog?.showModal();
    } else if (!taskId && dialog?.open) {
      dialog.close();
    }
  }, [taskId]);

  return (
    <dialog
      aria-labelledby="task-details-title"
      className={dialogStyles.dialog}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
      ref={dialogRef}
    >
      <div className={dialogStyles.form}>
        <header className={dialogStyles.header}>
          <div>
            <p className={dialogStyles.eyebrow}>Detalle de tarea</p>
            <h2 className={dialogStyles.title} id="task-details-title">
              {taskQuery.data?.title ?? 'Consultando tarea…'}
            </h2>
          </div>
          <button
            aria-label="Cerrar"
            className={dialogStyles.closeButton}
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </header>

        <div className={styles.content} aria-busy={taskQuery.isPending}>
          {taskQuery.isPending ? (
            <div className={styles.skeleton} aria-label="Cargando detalle">
              <span />
              <span />
              <span />
            </div>
          ) : null}

          {taskQuery.isError ? (
            <div className={styles.feedback} role="alert">
              <p>No pudimos consultar los detalles de la tarea.</p>
              <Button
                disabled={taskQuery.isFetching}
                onClick={() => void taskQuery.refetch()}
                variant="secondary"
              >
                {taskQuery.isFetching ? 'Reintentando…' : 'Reintentar'}
              </Button>
            </div>
          ) : null}

          {taskQuery.data ? (
            <>
              <div className={styles.badges}>
                <Badge tone={statusTone[taskQuery.data.status]}>
                  {statusLabel[taskQuery.data.status]}
                </Badge>
                <Badge tone={priorityTone[taskQuery.data.priority]}>
                  Prioridad {priorityLabel[taskQuery.data.priority]}
                </Badge>
              </div>

              <section className={styles.section}>
                <h3>Descripción</h3>
                <p>
                  {taskQuery.data.description ||
                    'Esta tarea no tiene una descripción.'}
                </p>
              </section>

              <dl className={styles.metadata}>
                <div>
                  <dt>Fecha límite</dt>
                  <dd>
                    {taskQuery.data.dueDate
                      ? formatDueDate(taskQuery.data.dueDate)
                      : 'Sin fecha límite'}
                  </dd>
                </div>
              </dl>
            </>
          ) : null}
        </div>

        <footer className={dialogStyles.actions}>
          {taskQuery.data ? (
            <Button onClick={() => onEdit(taskQuery.data)} type="button">
              Editar tarea
            </Button>
          ) : null}
          <Button onClick={onClose} type="button" variant="secondary">
            Cerrar
          </Button>
        </footer>
      </div>
    </dialog>
  );
}

const statusLabel: Record<TaskStatus, string> = {
  pending: 'Por hacer',
  'in-progress': 'En progreso',
  completed: 'Finalizada',
};

const statusTone: Record<TaskStatus, 'neutral' | 'info' | 'success'> = {
  pending: 'neutral',
  'in-progress': 'info',
  completed: 'success',
};

const priorityLabel: Record<TaskPriority, string> = {
  low: 'baja',
  medium: 'media',
  high: 'alta',
};

const priorityTone: Record<TaskPriority, 'neutral' | 'warning' | 'danger'> = {
  low: 'neutral',
  medium: 'warning',
  high: 'danger',
};

const dateFormatter = new Intl.DateTimeFormat('es-CO', {
  dateStyle: 'long',
  timeStyle: 'short',
});

function formatDueDate(dueDate: string): string {
  return dateFormatter.format(new Date(dueDate));
}
