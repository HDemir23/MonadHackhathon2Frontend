'use client';

import Link from 'next/link';
import type { Pool, PoolStatus } from '@/lib/types';
import { formatMON } from '@/lib/utils';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useMemo } from 'react';
import styles from './PoolCard.module.css';

interface PoolCardProps {
  pool: Pool;
  status: PoolStatus;
  style?: React.CSSProperties;
}

export function PoolCard({ pool, status, style }: PoolCardProps) {
  const progress = (pool.ticketsSold / 100) * 100;
  useMemo(() => {
    const _ = pool;
    return null;
  }, [pool.id, pool.totalDeposit, pool.ticketPrice, pool.ticketsSold]);

  return (
    <Link href={`/pool/${pool.id}`} className={styles.card} style={style}>
      <div className={styles.cardHeader}>
        <span className={styles.poolId}>Pool #{pool.id}</span>
        <StatusBadge status={status} />
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
        <ProgressBar value={progress} />
      </div>
    </Link>
  );
}
