import { Card } from '../../../shared/components';
import type { ProjectSummary as ProjectSummaryData } from '../../projects/api/projects.api';
import styles from './project-summary.module.css';

export type ProjectSummaryProps = Readonly<{
  summary: ProjectSummaryData;
}>;

export function ProjectSummary({ summary }: ProjectSummaryProps) {
  return (
    <div className={styles.summary}>
      <div className={styles.metrics}>
        <MetricCard label="Total" value={summary.total.toString()} />
        <MetricCard
          label="Completadas"
          tone="success"
          value={summary.byStatus.completed.toString()}
        />
        <MetricCard
          label="Progreso"
          tone="primary"
          value={formatPercentage(summary.completionPercentage)}
        />
        <MetricCard
          label="Vencidas"
          tone={summary.overdue > 0 ? 'danger' : 'neutral'}
          value={summary.overdue.toString()}
        />
      </div>

      <div className={styles.breakdowns}>
        <BreakdownCard
          items={[
            { label: 'Por hacer', value: summary.byStatus.pending },
            { label: 'En progreso', value: summary.byStatus.inProgress },
            { label: 'Finalizadas', value: summary.byStatus.completed },
          ]}
          title="Por estado"
        />
        <BreakdownCard
          items={[
            { label: 'Baja', value: summary.byPriority.low },
            { label: 'Media', value: summary.byPriority.medium },
            { label: 'Alta', value: summary.byPriority.high },
          ]}
          title="Por prioridad"
        />
      </div>

      <div className={styles.progress}>
        <div className={styles.progressHeader}>
          <span>Avance general</span>
          <strong>{formatPercentage(summary.completionPercentage)}</strong>
        </div>
        <div
          aria-label={`${formatPercentage(summary.completionPercentage)} completado`}
          aria-valuemax={100}
          aria-valuemin={0}
          aria-valuenow={summary.completionPercentage}
          className={styles.progressTrack}
          role="progressbar"
        >
          <span
            className={styles.progressValue}
            style={{ width: `${summary.completionPercentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}

type MetricCardProps = Readonly<{
  label: string;
  value: string;
  tone?: 'neutral' | 'primary' | 'success' | 'danger';
}>;

function MetricCard({ label, tone = 'neutral', value }: MetricCardProps) {
  return (
    <Card className={styles.metric} data-tone={tone}>
      <span>{label}</span>
      <strong>{value}</strong>
    </Card>
  );
}

type BreakdownCardProps = Readonly<{
  title: string;
  items: readonly Readonly<{ label: string; value: number }>[];
}>;

function BreakdownCard({ items, title }: BreakdownCardProps) {
  return (
    <Card className={styles.breakdown}>
      <h2>{title}</h2>
      <dl>
        {items.map((item) => (
          <div key={item.label}>
            <dt>{item.label}</dt>
            <dd>{item.value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

const percentageFormatter = new Intl.NumberFormat('es-CO', {
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
});

function formatPercentage(value: number): string {
  return `${percentageFormatter.format(value)}%`;
}
