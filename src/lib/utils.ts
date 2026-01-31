import type { Pool, PoolStatus, Tier, SerializablePool } from './types';
import { formatEther } from 'viem';

export function getPoolStatus(
  pool: Pool,
  currentBlock: bigint,
  currentTimestamp: bigint,
): PoolStatus {
  const { ticketsSold, isRevealed, revealBlock, createdAt } = pool;
  const expiry = createdAt + BigInt(7 * 24 * 60 * 60);

  if (isRevealed) return 'revealed';
  if (ticketsSold === 100 && revealBlock > 0n) {
    if (currentBlock > revealBlock + 250n) return 'reveal_expired';
    if (currentBlock >= revealBlock) return 'ready_to_reveal';
    return 'sold_out_waiting';
  }
  if (currentTimestamp > expiry) return 'expired';
  return 'open';
}

export function formatMON(value: bigint): string {
  const formatted = formatEther(value);
  // Remove trailing zeros after decimal, keep at least one decimal place for small values
  const num = parseFloat(formatted);
  if (num === 0) return '0';
  if (num >= 1) return num.toLocaleString(undefined, { maximumFractionDigits: 4 });
  return formatted.replace(/\.?0+$/, '');
}

const TIER_LABELS: Record<Tier, string> = {
  5: 'Jackpot',
  4: 'High',
  3: 'Medium',
  2: 'Consolation',
  1: 'Loser',
};

export function tierLabel(tier: number): string {
  return TIER_LABELS[tier as Tier] ?? `Tier ${tier}`;
}

export function shortenAddress(addr: string): string {
  if (addr.length < 10) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export const STATUS_LABELS: Record<PoolStatus, string> = {
  open: 'Active',
  sold_out_waiting: 'Sold Out',
  ready_to_reveal: 'Ready to Reveal',
  reveal_expired: 'Reveal Expired',
  revealed: 'Revealed',
  expired: 'Expired',
};

export function makeSerializablePool(pool: Pool): SerializablePool {
  return {
    id: pool.id,
    creator: pool.creator,
    totalDeposit: pool.totalDeposit.toString(),
    ticketPrice: pool.ticketPrice.toString(),
    ticketsSold: pool.ticketsSold,
    isRevealed: pool.isRevealed,
    commitHash: pool.commitHash,
    revealBlock: pool.revealBlock.toString(),
    creatorFeeWithdrawn: pool.creatorFeeWithdrawn,
    createdAt: pool.createdAt.toString(),
  };
}
