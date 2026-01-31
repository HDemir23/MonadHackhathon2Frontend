'use client';

import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import styles from './Header.module.css';

export function Header() {
  return (
    <header className={styles.header}>
      <Link href="/" className={styles.logo}>
        MonadB2
      </Link>
      <nav className={styles.nav}>
        <Link href="/" className={styles.navLink}>Home</Link>
        <Link href="/create" className={styles.navLink}>Create</Link>
        <Link href="/my-tickets" className={styles.navLink}>My Tickets</Link>
      </nav>
      <ConnectButton />
    </header>
  );
}
