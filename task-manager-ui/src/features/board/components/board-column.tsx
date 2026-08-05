import { Badge, Card } from '../../../shared/components';
import type { Task, TaskPriority } from '../../tasks/api/tasks.api';
import styles from './board-column.module.css';

export type BoardColumnProps = Readonly<{
  title: string;
  tone: 'neutral' | 'info' | 'success';
  tasks: readonly Task[];
}>;

export function BoardColumn({ tasks, title, tone }: BoardColumnProps) {
  return (
    <Card className={styles.column}>
      <header className={styles.columnHeader}>
        <h2>{title}</h2>
        <Badge tone={tone}>{tasks.length}</Badge>
      </header>

      {tasks.length === 0 ? (
        <p className={styles.columnEmpty}>No hay tareas en esta columna.</p>
      ) : (
        <ul className={styles.taskList}>
          {tasks.map((task) => (
            <li key={task.id}>
              <article className={styles.taskCard}>
                <div className={styles.taskHeader}>
                  <h3>{task.title}</h3>
                  <Badge tone={priorityTone[task.priority]}>
                    {priorityLabel[task.priority]}
                  </Badge>
                </div>

                {task.description ? (
                  <p className={styles.description}>{task.description}</p>
                ) : null}

                {task.dueDate ? (
                  <p className={styles.dueDate}>
                    <span aria-hidden="true">◷</span>
                    Vence el {formatDueDate(task.dueDate)}
                  </p>
                ) : null}
              </article>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

const priorityLabel: Record<TaskPriority, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
};

const priorityTone: Record<TaskPriority, 'neutral' | 'warning' | 'danger'> = {
  low: 'neutral',
  medium: 'warning',
  high: 'danger',
};

const dueDateFormatter = new Intl.DateTimeFormat('es-CO', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

function formatDueDate(dueDate: string): string {
  return dueDateFormatter.format(new Date(dueDate));
}
