'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import styles from './Header.module.css';

export function Header() {
  const pathname = usePathname();

  return (
    <header className={styles.header}>
      <Link href="/" className={styles.logo}>
        MonadB2
      </Link>
      <nav className={styles.nav}>
        <Link
          href="/"
          className={`${styles.navLink} ${pathname === '/' ? styles.navLinkActive : ''}`}
        >
          Home
        </Link>
        <Link
          href="/create"
          className={`${styles.navLink} ${pathname === '/create' ? styles.navLinkActive : ''}`}
        >
          Create
        </Link>
        <Link
          href="/my-tickets"
          className={`${styles.navLink} ${pathname === '/my-tickets' ? styles.navLinkActive : ''}`}
        >
          My Tickets
        </Link>
      </nav>
      <ConnectButton showBalance={false} />
    </header>
  );
}
