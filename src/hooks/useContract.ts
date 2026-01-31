import { useReadContract } from 'wagmi';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/lib/contract';
import type { Pool } from '@/lib/types';

export function usePoolCount() {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'poolIdCounter',
  });
}

export function usePoolDetails(poolId: number) {
  const details = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getPoolDetails',
    args: [BigInt(poolId)],
  });

  const createdAt = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getPoolCreatedAt',
    args: [BigInt(poolId)],
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

  return {
    pool,
    isLoading: details.isLoading || createdAt.isLoading,
    refetch: () => { details.refetch(); createdAt.refetch(); },
  };
}

export function useTicketsBoughtBy(poolId: number, address: `0x${string}` | undefined) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getTicketsBoughtBy',
    args: address ? [BigInt(poolId), address] : undefined,
    query: { enabled: !!address },
  });
}
