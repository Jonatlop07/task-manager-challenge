import { Card } from '../../../shared/components';
import styles from './projects-skeleton.module.css';

const SKELETON_CARD_COUNT = 6;

export function ProjectsSkeleton() {
  return (
    <div className={styles.grid} role="status">
      <span className={styles.srOnly}>Cargando proyectos</span>
      {Array.from({ length: SKELETON_CARD_COUNT }, (_, index) => (
        <Card className={styles.card} key={index}>
          <span className={styles.mark} />
          <div className={styles.copy}>
            <span className={styles.title} />
            <span className={styles.description} />
          </div>
        </Card>
      ))}
    </div>
  );
}
