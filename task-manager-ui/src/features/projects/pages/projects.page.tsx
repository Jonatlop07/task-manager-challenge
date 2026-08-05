import { Card, EmptyState, PageHeader } from '../../../shared/components';
import styles from './projects.page.module.css';

export function ProjectsPage() {
  return (
    <main className={styles.page}>
      <PageHeader
        eyebrow="Espacio de trabajo"
        title="Proyectos"
        description="Organiza el trabajo y entra al tablero de cada iniciativa."
      />

      <Card>
        <EmptyState
          title="Todavía no hay proyectos"
          description="Crea tu primer proyecto para comenzar a organizar tareas."
        />
      </Card>
    </main>
  );
}
