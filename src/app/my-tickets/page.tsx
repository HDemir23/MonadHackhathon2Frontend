'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useAccount, useReadContracts } from 'wagmi';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/lib/contract';
import { usePoolContext } from '@/context/PoolContext';
import { getPoolStatus, formatMON, STATUS_LABELS } from '@/lib/utils';
import styles from './page.module.css';

export default function MyTicketsPage() {
  const { address } = useAccount();
  const { pools, loading, currentBlock, currentTimestamp } = usePoolContext();

  // For each pool, check how many tickets the user bought
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
    query: { enabled: !!address && pools.length > 0 },
  });

  // Filter to pools where user has tickets
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
        <p className={styles.message}>Connect your wallet to see your tickets.</p>
      </main>
    );
  }

  if (loading) {
    return (
      <main className={styles.main}>
        <h1 className={styles.title}>My Tickets</h1>
        <p className={styles.message}>Loading...</p>
      </main>
    );
  }

  return (
    <main className={styles.main}>
      <h1 className={styles.title}>My Tickets</h1>

      {userPools.length === 0 ? (
        <p className={styles.message}>You don&apos;t have any tickets yet.</p>
      ) : (
        <div className={styles.list}>
          {userPools.map(({ pool, ticketCount }) => {
            const status = getPoolStatus(pool, currentBlock, currentTimestamp);
            return (
              <Link key={pool.id} href={`/pool/${pool.id}`} className={styles.poolRow}>
                <div className={styles.poolInfo}>
                  <span className={styles.poolId}>Pool #{pool.id}</span>
                  <span className={`${styles.badge} ${styles[status]}`}>
                    {STATUS_LABELS[status]}
                  </span>
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
