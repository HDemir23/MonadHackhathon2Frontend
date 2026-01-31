'use client';

import { tierLabel } from '@/lib/utils';
import styles from './TicketGrid.module.css';

interface TicketGridProps {
  ticketOwners: readonly { result?: unknown; status: string }[] | undefined;
  tierData: readonly { result?: unknown; status: string }[] | undefined;
  isRevealed: boolean;
  userAddress: string | undefined;
}

export function TicketGrid({
  ticketOwners,
  tierData,
  isRevealed,
  userAddress,
}: TicketGridProps) {
  const ticketIds = Array.from({ length: 100 }, (_, i) => i);

  return (
    <div className={styles.wrapper}>
      <h2 className={styles.title}>Tickets</h2>
      <div className={styles.grid}>
        {ticketIds.map((ticketId) => {
          const ownerResult = ticketOwners?.[ticketId];
          const owner = ownerResult?.result as string | undefined;
          const isOwned =
            owner && owner !== '0x0000000000000000000000000000000000000000';
          const isYours =
            isOwned &&
            userAddress &&
            owner.toLowerCase() === userAddress.toLowerCase();
          const tier = tierData?.[ticketId]?.result as bigint | undefined;
          const tierNum = tier ? Number(tier) : 0;

          let ticketClass = styles.ticketAvailable;
          if (isYours) ticketClass = styles.ticketYours;
          else if (isOwned) ticketClass = styles.ticketSold;

          if (isRevealed && tierNum > 0) {
            ticketClass = `${ticketClass} ${styles[`tier${tierNum}`] ?? ''}`;
          }

          return (
            <div
              key={ticketId}
              className={`${styles.ticket} ${ticketClass}`}
              title={
                isYours
                  ? `#${ticketId} (yours)${tierNum ? ` - ${tierLabel(tierNum)}` : ''}`
                  : isOwned
                    ? `#${ticketId} (sold)`
                    : `#${ticketId} (available)`
              }
            >
              {ticketId}
            </div>
          );
        })}
      </div>
      <div className={styles.legend}>
        <span>
          <span className={`${styles.legendDot} ${styles.legendAvailable}`} />{' '}
          Available
        </span>
        <span>
          <span className={`${styles.legendDot} ${styles.legendSold}`} /> Sold
        </span>
        <span>
          <span className={`${styles.legendDot} ${styles.legendYours}`} />{' '}
          Yours
        </span>
      </div>
    </div>
  );
}
