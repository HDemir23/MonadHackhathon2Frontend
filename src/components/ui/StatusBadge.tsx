'use client';

import type { PoolStatus } from '@/lib/types';
import { STATUS_LABELS } from '@/lib/utils';
import styles from './StatusBadge.module.css';

interface StatusBadgeProps {
  status: PoolStatus;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  return (
    <span className={`${styles.badge} ${styles[status]} ${styles[size]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}
