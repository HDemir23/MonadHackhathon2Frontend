export interface Pool {
  id: number;
  creator: `0x${string}`;
  totalDeposit: bigint;
  ticketPrice: bigint;
  ticketsSold: number;
  isRevealed: boolean;
  commitHash: `0x${string}`;
  revealBlock: bigint;
  creatorFeeWithdrawn: boolean;
  createdAt: bigint;
}

export type PoolStatus =
  | 'open'
  | 'sold_out_waiting'
  | 'ready_to_reveal'
  | 'reveal_expired'
  | 'revealed'
  | 'expired';

export type Tier = 1 | 2 | 3 | 4 | 5;
