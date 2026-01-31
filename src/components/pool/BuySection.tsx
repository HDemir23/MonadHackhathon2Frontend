'use client';

import { useState, useCallback } from 'react';
import { formatMON } from '@/lib/utils';
import { SectionCard } from '@/components/ui/SectionCard';
import { ActionButton } from '@/components/ui/ActionButton';
import styles from './BuySection.module.css';

interface BuySectionProps {
  ticketPrice: bigint;
  userTicketCount: number;
  onBuy: (quantity: number) => void;
  isPending: boolean;
  anyPending: boolean;
}

export function BuySection({
  ticketPrice,
  userTicketCount,
  onBuy,
  isPending,
  anyPending,
}: BuySectionProps) {
  const [quantity, setQuantity] = useState(1);
  const maxBuyable = 10 - userTicketCount;

  const handleBuy = useCallback(() => {
    onBuy(quantity);
  }, [quantity, onBuy]);

  if (maxBuyable <= 0) return null;

  return (
    <SectionCard variant="glass" title="Buy Tickets">
      <div className={styles.buyRow}>
        <label className={styles.buyLabel}>
          Quantity:
          <select
            className={styles.select}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
          >
            {Array.from({ length: maxBuyable }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <span className={styles.buyTotal}>
          Total: {formatMON(ticketPrice * BigInt(quantity))} MON
        </span>
        <ActionButton
          onClick={handleBuy}
          disabled={anyPending}
          loading={isPending}
          loadingText="Buying..."
        >
          Buy
        </ActionButton>
      </div>
      <p className={styles.hint}>
        You have {userTicketCount}/10 tickets in this pool.
      </p>
    </SectionCard>
  );
}
