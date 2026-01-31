'use client';

import { createContext, useContext, useMemo, useCallback, useEffect, useState, useRef } from 'react';
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

  const { data: blockNumber } = useBlockNumber({ watch: { poll: true, pollingInterval: 12_000 } });
  const { data: block } = useBlock({ watch: { poll: true, pollingInterval: 12_000 } });

  const currentBlock = blockNumber ?? 0n;
  const currentTimestamp = block?.timestamp ?? 0n;

  const count = poolCount ? Number(poolCount) : 0;

  const [pools, setPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchTrigger, setFetchTrigger] = useState(0);

  const refetch = useCallback(() => {
    refetchCount();
    setFetchTrigger((t) => t + 1);
  }, [refetchCount]);

  const refetchStable = useRef(refetch);
  refetchStable.current = refetch;

  const countRef = useRef(count);
  const fetchTriggerRef = useRef(fetchTrigger);
  countRef.current = count;
  fetchTriggerRef.current = fetchTrigger;

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

      const pools: Pool[] = [];
      const BATCH_SIZE = 5; // Fetch in small batches to avoid rate limits

      for (let i = 0; i < count; i += BATCH_SIZE) {
        if (cancelled) return;

        const batchContracts = [];
        const batchEnd = Math.min(i + BATCH_SIZE, count);

        for (let j = i; j < batchEnd; j++) {
          batchContracts.push(
            {
              address: CONTRACT_ADDRESS,
              abi: CONTRACT_ABI,
              functionName: 'getPoolDetails' as const,
              args: [BigInt(j)],
            },
            {
              address: CONTRACT_ADDRESS,
              abi: CONTRACT_ABI,
              functionName: 'getPoolCreatedAt' as const,
              args: [BigInt(j)],
            },
          );
        }

        try {
          const results = await readContracts(config, { contracts: batchContracts });
          if (cancelled) return;

          for (let j = 0; j < (batchEnd - i); j++) {
            const detailsResult = results[j * 2];
            const createdAtResult = results[j * 2 + 1];

            if (detailsResult.status !== 'success' || createdAtResult.status !== 'success') {
              continue;
            }

            const [creator, totalDeposit, ticketPrice, ticketsSold, isRevealed, commitHash, revealBlock, creatorFeeWithdrawn] = detailsResult.result as [string, bigint, bigint, bigint, boolean, string, bigint, boolean];

            pools.push({
              id: i + j,
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

          // Small delay between batches to respect rate limits
          if (batchEnd < count) {
            await new Promise((resolve) => setTimeout(resolve, 250));
          }
        } catch (error) {
          console.error(`Error fetching batch ${i}-${batchEnd}:`, error);
        }
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

  const refetchCallback = useCallback(() => {
    refetchStable.current();
  }, []);

  const value = useMemo(
    () => ({ pools, loading, currentBlock, currentTimestamp, refetch: refetchCallback }),
    [pools, loading, currentBlock, currentTimestamp, refetchCallback],
  );

  return (
    <PoolContext.Provider value={value}>
      {children}
    </PoolContext.Provider>
  );
}
