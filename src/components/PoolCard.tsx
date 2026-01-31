'use client';

import Link from 'next/link';
import type { Pool, PoolStatus } from '@/lib/types';
import { formatMON, STATUS_LABELS } from '@/lib/utils';
import styles from './PoolCard.module.css';

interface PoolCardProps {
  pool: Pool;
  status: PoolStatus;
}

export function PoolCard({ pool, status }: PoolCardProps) {
  const progress = (pool.ticketsSold / 100) * 100;

  return (
    <Link href={`/pool/${pool.id}`} className={styles.card}>
      <div className={styles.cardHeader}>
        <span className={styles.poolId}>Pool #{pool.id}</span>
        <span className={`${styles.badge} ${styles[status]}`}>
          {STATUS_LABELS[status]}
        </span>
      </div>
      <div className={styles.info}>
        <div className={styles.row}>
          <span className={styles.label}>Deposit</span>
          <span className={styles.value}>{formatMON(pool.totalDeposit)} MON</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>Ticket Price</span>
          <span className={styles.value}>{formatMON(pool.ticketPrice)} MON</span>
        </div>
      </div>
      <div className={styles.progressSection}>
        <div className={styles.progressLabel}>
          <span>Tickets Sold</span>
          <span>{pool.ticketsSold}/100</span>
        </div>
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </Link>
  );
}
