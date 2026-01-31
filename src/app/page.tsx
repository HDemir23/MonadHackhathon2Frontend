'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { usePoolContext } from '@/context/PoolContext';
import { PoolCard } from '@/components/PoolCard';
import { getPoolStatus } from '@/lib/utils';
import type { PoolStatus } from '@/lib/types';
import styles from './page.module.css';

type FilterTab = 'all' | 'open' | 'sold_out' | 'revealed' | 'expired';

const TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'open', label: 'Active' },
  { key: 'sold_out', label: 'Sold Out' },
  { key: 'revealed', label: 'Revealed' },
  { key: 'expired', label: 'Expired' },
];

function matchesFilter(status: PoolStatus, filter: FilterTab): boolean {
  if (filter === 'all') return true;
  if (filter === 'open') return status === 'open';
  if (filter === 'sold_out') return status === 'sold_out_waiting' || status === 'ready_to_reveal';
  if (filter === 'revealed') return status === 'revealed';
  if (filter === 'expired') return status === 'expired' || status === 'reveal_expired';
  return true;
}

export default function Home() {
  const { pools, loading, currentBlock, currentTimestamp } = usePoolContext();
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  const poolsWithStatus = useMemo(
    () =>
      pools.map((pool) => ({
        pool,
        status: getPoolStatus(pool, currentBlock, currentTimestamp),
      })),
    [pools, currentBlock, currentTimestamp],
  );

  const filtered = useMemo(
    () => poolsWithStatus.filter(({ status }) => matchesFilter(status, activeTab)),
    [poolsWithStatus, activeTab],
  );

  return (
    <main className={styles.main}>
      <div className={styles.topBar}>
        <h1 className={styles.title}>Prize Pools</h1>
        <Link href="/create" className={styles.createBtn}>
          + Create Pool
        </Link>
      </div>

      <div className={styles.tabs}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`${styles.tab} ${activeTab === tab.key ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className={styles.message}>Loading pools...</p>
      ) : filtered.length === 0 ? (
        <p className={styles.message}>No pools found.</p>
      ) : (
        <div className={styles.grid}>
          {filtered.map(({ pool, status }) => (
            <PoolCard key={pool.id} pool={pool} status={status} />
          ))}
        </div>
      )}
    </main>
  );
}
