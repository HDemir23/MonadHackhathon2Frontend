import { useCallback } from 'react';
import { useReadContract } from 'wagmi';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/lib/contract';
import type { Pool } from '@/lib/types';

const STALE_TIME = 30_000; // 30 seconds

export function usePoolCount() {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'poolIdCounter',
    query: { staleTime: STALE_TIME },
  });
}

export function usePoolDetails(poolId: number) {
  const details = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getPoolDetails',
    args: [BigInt(poolId)],
    query: { staleTime: STALE_TIME },
  });

  const createdAt = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getPoolCreatedAt',
    args: [BigInt(poolId)],
    query: { staleTime: STALE_TIME },
  });

  let pool: Pool | undefined;
  if (details.data && createdAt.data !== undefined) {
    const [creator, totalDeposit, ticketPrice, ticketsSold, isRevealed, commitHash, revealBlock, creatorFeeWithdrawn] = details.data;
    pool = {
      id: poolId,
      creator: creator as `0x${string}`,
      totalDeposit,
      ticketPrice,
      ticketsSold: Number(ticketsSold),
      isRevealed,
      commitHash: commitHash as `0x${string}`,
      revealBlock,
      creatorFeeWithdrawn,
      createdAt: createdAt.data,
    };
  }

  const refetch = useCallback(() => {
    details.refetch();
    createdAt.refetch();
  }, [details.refetch, createdAt.refetch]);

  return {
    pool,
    isLoading: details.isLoading || createdAt.isLoading,
    refetch,
  };
}

export function useTicketsBoughtBy(poolId: number, address: `0x${string}` | undefined) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getTicketsBoughtBy',
    args: address ? [BigInt(poolId), address] : undefined,
    query: { enabled: !!address, staleTime: STALE_TIME },
  });
}
