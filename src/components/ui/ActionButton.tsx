'use client';

import type { ReactNode, ButtonHTMLAttributes } from 'react';
import { memo, useCallback } from 'react';
import styles from './ActionButton.module.css';

interface ActionButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> {
  variant?: 'primary' | 'secondary' | 'ghost';
  loading?: boolean;
  loadingText?: string;
  fullWidth?: boolean;
  children: ReactNode;
}

export const ActionButton = memo(function ActionButton({
  variant = 'primary',
  loading = false,
  loadingText,
  fullWidth = false,
  disabled,
  children,
  onClick,
  ...rest
}: ActionButtonProps) {
  const handleClick = useCallback<React.MouseEventHandler<HTMLButtonElement>>(
    (e) => {
      if (onClick && !loading && !disabled) {
        onClick(e);
      }
    },
    [onClick, loading, disabled],
  );

  return (
    <button
      className={`${styles.btn} ${styles[variant]} ${fullWidth ? styles.fullWidth : ''}`}
      disabled={disabled || loading}
      onClick={handleClick}
      {...rest}
    >
      {loading && <span className={styles.spinner} />}
      {loading && loadingText ? loadingText : children}
    </button>
  );
});
