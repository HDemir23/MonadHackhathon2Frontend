'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useAccount, useReadContracts } from 'wagmi';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/lib/contract';
import { usePoolContext } from '@/context/PoolContext';
import { getPoolStatus, formatMON } from '@/lib/utils';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { ActionButton } from '@/components/ui/ActionButton';
import styles from './page.module.css';

export default function MyTicketsPage() {
  const { address } = useAccount();
  const { pools, loading, currentBlock, currentTimestamp } = usePoolContext();

  const ticketCountCalls = useMemo(
    () =>
      address
        ? pools.map((pool) => ({
            address: CONTRACT_ADDRESS as `0x${string}`,
            abi: CONTRACT_ABI,
            functionName: 'getTicketsBoughtBy' as const,
            args: [BigInt(pool.id), address],
          }))
        : [],
    [pools, address],
  );

  const { data: ticketCounts } = useReadContracts({
    contracts: ticketCountCalls,
    query: { enabled: !!address && pools.length > 0, staleTime: 30_000 },
  });

  const userPools = useMemo(() => {
    if (!ticketCounts) return [];
    return pools
      .map((pool, i) => {
        const count = ticketCounts[i]?.result as bigint | undefined;
        return { pool, ticketCount: count ? Number(count) : 0 };
      })
      .filter(({ ticketCount }) => ticketCount > 0);
  }, [pools, ticketCounts]);

  if (!address) {
    return (
      <main className={styles.main}>
        <h1 className={styles.title}>My Tickets</h1>
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon}>&#128274;</span>
          <p>Connect your wallet to see your tickets.</p>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className={styles.main}>
        <h1 className={styles.title}>My Tickets</h1>
        <SkeletonLoader variant="row" count={4} />
      </main>
    );
  }

  return (
    <main className={styles.main}>
      <h1 className={styles.title}>My Tickets</h1>

      {userPools.length === 0 ? (
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon}>&#127915;</span>
          <p>You don&apos;t have any tickets yet.</p>
          <Link href="/">
            <ActionButton variant="secondary">Browse Pools</ActionButton>
          </Link>
        </div>
      ) : (
        <div className={styles.list}>
          {userPools.map(({ pool, ticketCount }, index) => {
            const status = getPoolStatus(pool, currentBlock, currentTimestamp);
            return (
              <Link
                key={pool.id}
                href={`/pool/${pool.id}`}
                className={styles.poolRow}
                style={{ animation: `fadeInUp 0.4s var(--ease-out-expo) ${index * 0.05}s both` }}
              >
                <div className={styles.poolInfo}>
                  <span className={styles.poolId}>Pool #{pool.id}</span>
                  <StatusBadge status={status} size="sm" />
                </div>
                <div className={styles.poolMeta}>
                  <span>{ticketCount} ticket{ticketCount !== 1 ? 's' : ''}</span>
                  <span className={styles.dot} />
                  <span>{formatMON(pool.ticketPrice)} MON each</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
