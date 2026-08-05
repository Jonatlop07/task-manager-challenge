import type { HTMLAttributes } from 'react';
import styles from './badge.module.css';

type BadgeTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

export type BadgeProps = HTMLAttributes<HTMLSpanElement> &
  Readonly<{
    tone?: BadgeTone;
  }>;

export function Badge({
  className = '',
  tone = 'neutral',
  ...props
}: BadgeProps) {
  return (
    <span
      {...props}
      className={`${styles.badge} ${styles[tone]} ${className}`}
    />
  );
}
