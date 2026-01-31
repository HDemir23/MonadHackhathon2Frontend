'use client';

import { tierLabel } from '@/lib/utils';
import { useCallback } from 'react';
import { SectionCard } from '@/components/ui/SectionCard';
import { ActionButton } from '@/components/ui/ActionButton';
import styles from './ClaimSection.module.css';

interface ClaimSectionProps {
  userTicketIds: number[];
  tierData: readonly { result?: unknown; status: string }[] | undefined;
  onClaimAll: () => void;
  isClaimPending: boolean;
  isCreator: boolean;
  creatorFeeWithdrawn: boolean;
  onCreatorWithdraw: () => void;
  isWithdrawPending: boolean;
  anyPending: boolean;
}

export function ClaimSection({
  userTicketIds,
  tierData,
  onClaimAll,
  isClaimPending,
  isCreator,
  creatorFeeWithdrawn,
  onCreatorWithdraw,
  isWithdrawPending,
  anyPending,
}: ClaimSectionProps) {
  const handleClaimAll = useCallback(() => {
    onClaimAll();
  }, [onClaimAll]);

  const handleCreatorWithdraw = useCallback(() => {
    onCreatorWithdraw();
  }, [onCreatorWithdraw]);

  return (
    <>
      {userTicketIds.length > 0 && (
        <SectionCard variant="glass" title="Your Tickets">
          <div className={styles.ticketList}>
            {userTicketIds.map((ticketId) => {
              const tier = tierData?.[ticketId]?.result as bigint | undefined;
              const tierNum = tier ? Number(tier) : 0;
              return (
                <div key={ticketId} className={styles.ticketListItem}>
                  <span>Ticket #{ticketId}</span>
                  <span className={styles[`tierBadge${tierNum}`]}>
                    {tierLabel(tierNum)}
                  </span>
                </div>
              );
            })}
          </div>
          <ActionButton
            onClick={handleClaimAll}
            disabled={anyPending}
            loading={isClaimPending}
            loadingText="Claiming..."
          >
            Claim All Prizes
          </ActionButton>
        </SectionCard>
      )}

      {isCreator && !creatorFeeWithdrawn && (
        <SectionCard variant="glass" title="Creator Fee">
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>
            You can withdraw your 8% creator fee.
          </p>
          <ActionButton
            variant="secondary"
            onClick={handleCreatorWithdraw}
            disabled={anyPending}
            loading={isWithdrawPending}
            loadingText="Withdrawing..."
          >
            Withdraw Creator Fee
          </ActionButton>
        </SectionCard>
      )}
    </>
  );
}
