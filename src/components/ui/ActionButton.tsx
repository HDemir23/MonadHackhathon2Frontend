'use client';

import type { ReactNode, ButtonHTMLAttributes } from 'react';
import styles from './ActionButton.module.css';

interface ActionButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> {
  variant?: 'primary' | 'secondary' | 'ghost';
  loading?: boolean;
  loadingText?: string;
  fullWidth?: boolean;
  children: ReactNode;
}

export function ActionButton({
  variant = 'primary',
  loading = false,
  loadingText,
  fullWidth = false,
  disabled,
  children,
  ...rest
}: ActionButtonProps) {
  return (
    <button
      className={`${styles.btn} ${styles[variant]} ${fullWidth ? styles.fullWidth : ''}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && <span className={styles.spinner} />}
      {loading && loadingText ? loadingText : children}
    </button>
  );
}
