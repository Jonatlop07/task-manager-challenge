import { useParams } from 'react-router';
import { Badge, Card, PageHeader } from '../../../shared/components';
import styles from './project-board.page.module.css';

export function ProjectBoardPage() {
  const { projectId } = useParams<{ projectId: string }>();

  return (
    <main className={styles.page}>
      <PageHeader
        eyebrow="Proyecto"
        title="Tablero"
        description={`Proyecto ${projectId ?? ''}`}
      />

      <div className={styles.board}>
        <BoardColumn title="Por hacer" tone="neutral" />
        <BoardColumn title="En progreso" tone="info" />
        <BoardColumn title="Finalizado" tone="success" />
      </div>
    </main>
  );
}

type BoardColumnProps = Readonly<{
  title: string;
  tone: 'neutral' | 'info' | 'success';
}>;

function BoardColumn({ title, tone }: BoardColumnProps) {
  return (
    <Card className={styles.column}>
      <header className={styles.columnHeader}>
        <h2>{title}</h2>
        <Badge tone={tone}>0</Badge>
      </header>
      <p className={styles.columnEmpty}>No hay tareas en esta columna.</p>
    </Card>
  );
}
