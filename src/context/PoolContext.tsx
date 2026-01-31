'use client';

import { createContext, useContext, useMemo, useCallback, useEffect, useState } from 'react';
import { useReadContract, useBlockNumber, useBlock } from 'wagmi';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/lib/contract';
import type { Pool } from '@/lib/types';

interface PoolContextValue {
  pools: Pool[];
  loading: boolean;
  currentBlock: bigint;
  currentTimestamp: bigint;
  refetch: () => void;
}

const PoolContext = createContext<PoolContextValue>({
  pools: [],
  loading: true,
  currentBlock: 0n,
  currentTimestamp: 0n,
  refetch: () => {},
});

export function usePoolContext() {
  return useContext(PoolContext);
}

export function PoolProvider({ children }: { children: React.ReactNode }) {
  const { data: poolCount, refetch: refetchCount } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'poolIdCounter',
  });

  const { data: blockNumber } = useBlockNumber({ watch: { poll: true, pollingInterval: 4_000 } });
  const { data: block } = useBlock({ watch: { poll: true, pollingInterval: 4_000 } });

  const currentBlock = blockNumber ?? 0n;
  const currentTimestamp = block?.timestamp ?? 0n;

  const count = poolCount ? Number(poolCount) : 0;

  // We fetch pool details individually using state + effects
  const [pools, setPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchTrigger, setFetchTrigger] = useState(0);

  const refetch = useCallback(() => {
    refetchCount();
    setFetchTrigger((t) => t + 1);
  }, [refetchCount]);

  // Fetch all pool details when count changes or refetch is triggered
  useEffect(() => {
    if (count === 0) {
      setPools([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    async function fetchPools() {
      const { readContracts } = await import('wagmi/actions');
      const { config } = await import('@/lib/config');

      // Build all calls upfront: getPoolDetails + getPoolCreatedAt per pool
      const contracts = [];
      for (let i = 0; i < count; i++) {
        contracts.push(
          {
            address: CONTRACT_ADDRESS,
            abi: CONTRACT_ABI,
            functionName: 'getPoolDetails' as const,
            args: [BigInt(i)],
          },
          {
            address: CONTRACT_ADDRESS,
            abi: CONTRACT_ABI,
            functionName: 'getPoolCreatedAt' as const,
            args: [BigInt(i)],
          },
        );
      }

      const results = await readContracts(config, { contracts });
      if (cancelled) return;

      const pools: Pool[] = [];
      for (let i = 0; i < count; i++) {
        const detailsResult = results[i * 2];
        const createdAtResult = results[i * 2 + 1];

        if (detailsResult.status !== 'success' || createdAtResult.status !== 'success') {
          continue; // Skip pools that fail to load
        }

        const [creator, totalDeposit, ticketPrice, ticketsSold, isRevealed, commitHash, revealBlock, creatorFeeWithdrawn] = detailsResult.result as [string, bigint, bigint, bigint, boolean, string, bigint, boolean];

        pools.push({
          id: i,
          creator: creator as `0x${string}`,
          totalDeposit,
          ticketPrice,
          ticketsSold: Number(ticketsSold),
          isRevealed,
          commitHash: commitHash as `0x${string}`,
          revealBlock,
          creatorFeeWithdrawn,
          createdAt: createdAtResult.result as bigint,
        });
      }

      if (!cancelled) {
        setPools(pools);
        setLoading(false);
      }
    }

    fetchPools();

    return () => {
      cancelled = true;
    };
  }, [count, fetchTrigger]);

  const value = useMemo(
    () => ({ pools, loading, currentBlock, currentTimestamp, refetch }),
    [pools, loading, currentBlock, currentTimestamp, refetch],
  );

  return (
    <PoolContext.Provider value={value}>
      {children}
    </PoolContext.Provider>
  );
}
