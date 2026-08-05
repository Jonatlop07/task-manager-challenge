import { Card } from '../../../shared/components';
import styles from './project-summary-skeleton.module.css';

export function ProjectSummarySkeleton() {
  return (
    <div aria-label="Cargando resumen del proyecto" className={styles.skeleton}>
      {Array.from({ length: 4 }, (_, index) => (
        <Card className={styles.card} key={index}>
          <span />
          <span />
        </Card>
      ))}
    </div>
  );
}
