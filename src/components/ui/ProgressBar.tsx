'use client';

import styles from './ProgressBar.module.css';

interface ProgressBarProps {
  value: number;
  showLabel?: boolean;
  animated?: boolean;
}

export function ProgressBar({ value, showLabel = false, animated = true }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className={styles.wrapper}>
      <div className={styles.track}>
        <div
          className={`${styles.fill} ${animated ? styles.animated : ''}`}
          style={{ width: `${clamped}%` }}
        >
          {animated && clamped > 0 && <span className={styles.shine} />}
        </div>
      </div>
      {showLabel && <span className={styles.label}>{clamped}%</span>}
    </div>
  );
}
