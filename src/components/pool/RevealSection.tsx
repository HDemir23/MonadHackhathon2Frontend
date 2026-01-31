'use client';

import { useCallback } from 'react';
import { SectionCard } from '@/components/ui/SectionCard';
import { ActionButton } from '@/components/ui/ActionButton';

interface RevealSectionProps {
  onReveal: () => void;
  isPending: boolean;
  anyPending: boolean;
  blocksUntilExpiry: number | null;
}

export function RevealSection({
  onReveal,
  isPending,
  anyPending,
}: RevealSectionProps) {
  const handleReveal = useCallback(() => {
    onReveal();
  }, [onReveal]);

  return (
    <SectionCard variant="glass" title="Reveal Winners">
      <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>
        The reveal window is open. Submit your secret to reveal winners.
      </p>
      <ActionButton
        onClick={handleReveal}
        disabled={anyPending}
        loading={isPending}
        loadingText="Revealing..."
      >
        Reveal Winners
      </ActionButton>
    </SectionCard>
  );
}
