'use client';

import type { ReactNode } from 'react';
import styles from './SectionCard.module.css';

interface SectionCardProps {
  variant?: 'default' | 'glass';
  title?: string;
  children: ReactNode;
  className?: string;
}

export function SectionCard({ variant = 'default', title, children, className }: SectionCardProps) {
  return (
    <div className={`${styles.card} ${styles[variant]} ${className ?? ''}`}>
      {title && <h2 className={styles.title}>{title}</h2>}
      {children}
    </div>
  );
}
