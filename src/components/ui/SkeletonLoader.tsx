'use client';

import styles from './SkeletonLoader.module.css';

interface SkeletonLoaderProps {
  variant: 'text' | 'card' | 'ticketGrid' | 'infoGrid' | 'row';
  count?: number;
}

function SkeletonText() {
  return (
    <div className={styles.textGroup}>
      <div className={`${styles.skeleton} ${styles.textLine} ${styles.wide}`} />
      <div className={`${styles.skeleton} ${styles.textLine} ${styles.medium}`} />
      <div className={`${styles.skeleton} ${styles.textLine} ${styles.narrow}`} />
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={`${styles.skeleton} ${styles.cardTitle}`} />
        <div className={`${styles.skeleton} ${styles.cardBadge}`} />
      </div>
      <div className={`${styles.skeleton} ${styles.cardRow}`} />
      <div className={`${styles.skeleton} ${styles.cardRow}`} />
      <div className={`${styles.skeleton} ${styles.cardBar}`} />
    </div>
  );
}

function SkeletonTicketGrid() {
  return (
    <div className={styles.ticketGrid}>
      {Array.from({ length: 100 }, (_, i) => (
        <div key={i} className={`${styles.skeleton} ${styles.ticketCell}`} />
      ))}
    </div>
  );
}

function SkeletonInfoGrid() {
  return (
    <div className={styles.infoGrid}>
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className={styles.infoItem}>
          <div className={`${styles.skeleton} ${styles.infoLabel}`} />
          <div className={`${styles.skeleton} ${styles.infoValue}`} />
        </div>
      ))}
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className={styles.row}>
      <div className={styles.rowLeft}>
        <div className={`${styles.skeleton} ${styles.rowTitle}`} />
        <div className={`${styles.skeleton} ${styles.rowBadge}`} />
      </div>
      <div className={`${styles.skeleton} ${styles.rowMeta}`} />
    </div>
  );
}

const VARIANT_MAP = {
  text: SkeletonText,
  card: SkeletonCard,
  ticketGrid: SkeletonTicketGrid,
  infoGrid: SkeletonInfoGrid,
  row: SkeletonRow,
};

export function SkeletonLoader({ variant, count = 1 }: SkeletonLoaderProps) {
  const Component = VARIANT_MAP[variant];
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <Component key={i} />
      ))}
    </>
  );
}
