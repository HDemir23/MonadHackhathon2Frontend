'use client';

import type { Pool, PoolStatus } from '@/lib/types';
import { formatMON, shortenAddress } from '@/lib/utils';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ActionButton } from '@/components/ui/ActionButton';
import styles from './PoolInfoHeader.module.css';

interface PoolInfoHeaderProps {
  pool: Pool;
  status: PoolStatus;
  blocksUntilReveal: number | null;
  blocksUntilExpiry: number | null;
  onRefresh: () => void;
}

export function PoolInfoHeader({
  pool,
  status,
  blocksUntilReveal,
  blocksUntilExpiry,
  onRefresh,
}: PoolInfoHeaderProps) {
  return (
    <>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Pool #{pool.id}</h1>
          <StatusBadge status={status} />
        </div>
        <ActionButton variant="ghost" onClick={onRefresh}>
          Refresh
        </ActionButton>
      </div>

      <div className={styles.infoGrid}>
        <div className={styles.infoItem}>
          <span className={styles.infoLabel}>Deposit</span>
          <span className={styles.infoValue}>
            {formatMON(pool.totalDeposit)} MON
          </span>
        </div>
        <div className={styles.infoItem}>
          <span className={styles.infoLabel}>Ticket Price</span>
          <span className={styles.infoValue}>
            {formatMON(pool.ticketPrice)} MON
          </span>
        </div>
        <div className={styles.infoItem}>
          <span className={styles.infoLabel}>Tickets Sold</span>
          <span className={styles.infoValue}>{pool.ticketsSold}/100</span>
        </div>
        <div className={styles.infoItem}>
          <span className={styles.infoLabel}>Creator</span>
          <span className={styles.infoValue}>
            {shortenAddress(pool.creator)}
          </span>
        </div>
        {blocksUntilReveal !== null && status === 'sold_out_waiting' && (
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Reveal Opens In</span>
            <span className={styles.infoValue}>{blocksUntilReveal} blocks</span>
          </div>
        )}
        {blocksUntilExpiry !== null && status === 'ready_to_reveal' && (
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Reveal Expires In</span>
            <span className={styles.infoValue}>{blocksUntilExpiry} blocks</span>
          </div>
        )}
      </div>
    </>
  );
}
