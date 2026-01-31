'use client';

import { SectionCard } from '@/components/ui/SectionCard';
import { ActionButton } from '@/components/ui/ActionButton';

interface RefundSectionProps {
  userTicketIds: number[];
  isCreator: boolean;
  onRefundTickets: () => void;
  onRefundCreator: () => void;
  isRefunding: boolean;
  refundProgress: string;
  isCreatorRefundPending: boolean;
  anyPending: boolean;
}

export function RefundSection({
  userTicketIds,
  isCreator,
  onRefundTickets,
  onRefundCreator,
  isRefunding,
  refundProgress,
  isCreatorRefundPending,
  anyPending,
}: RefundSectionProps) {
  return (
    <SectionCard variant="glass" title="Refund">
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        {userTicketIds.length > 0 && (
          <ActionButton
            onClick={onRefundTickets}
            disabled={anyPending}
            loading={isRefunding}
            loadingText={`Refunding ${refundProgress}...`}
          >
            Refund All Tickets ({userTicketIds.length})
          </ActionButton>
        )}
        {isCreator && (
          <ActionButton
            variant="secondary"
            onClick={onRefundCreator}
            disabled={anyPending}
            loading={isCreatorRefundPending}
            loadingText="Refunding..."
          >
            Refund Creator Deposit
          </ActionButton>
        )}
      </div>
    </SectionCard>
  );
}
