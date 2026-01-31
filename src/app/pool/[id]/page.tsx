"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { use } from "react";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContracts,
} from "wagmi";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/lib/contract";
import { usePoolDetails, useTicketsBoughtBy } from "@/hooks/useContract";
import { usePoolContext } from "@/context/PoolContext";
import { getPoolStatus } from "@/lib/utils";
import { SkeletonLoader } from "@/components/ui/SkeletonLoader";
import { SectionCard } from "@/components/ui/SectionCard";
import { PoolInfoHeader } from "@/components/pool/PoolInfoHeader";
import { TicketGrid } from "@/components/pool/TicketGrid";
import { BuySection } from "@/components/pool/BuySection";
import { RevealSection } from "@/components/pool/RevealSection";
import { ClaimSection } from "@/components/pool/ClaimSection";
import { RefundSection } from "@/components/pool/RefundSection";
import styles from "./page.module.css";

export default function PoolDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const poolId = Number(id);
  const { address } = useAccount();
  const {
    currentBlock,
    currentTimestamp,
    refetch: refetchPools,
  } = usePoolContext();

  const { pool, isLoading, refetch } = usePoolDetails(poolId);
  const { data: ticketsBought } = useTicketsBoughtBy(poolId, address);
  const userTicketCount = ticketsBought ? Number(ticketsBought) : 0;

  const [txError, setTxError] = useState<string | null>(null);
  const [refundingAll, setRefundingAll] = useState(false);
  const [refundProgress, setRefundProgress] = useState("");

  const status = pool
    ? getPoolStatus(pool, currentBlock, currentTimestamp)
    : undefined;

  const onTxError = useCallback((err: Error) => {
    setTxError(err.message.split("\n")[0]);
  }, []);

  // Buy tickets
  const { writeContract: writeBuy, data: buyHash } = useWriteContract({
    mutation: { onError: onTxError },
  });
  const { isLoading: isBuyPending, isSuccess: isBuySuccess } =
    useWaitForTransactionReceipt({ hash: buyHash });

  const handleBuy = useCallback(
    (quantity: number) => {
      if (!pool) return;
      setTxError(null);
      const value = pool.ticketPrice * BigInt(quantity);
      if (quantity === 1) {
        writeBuy({
          address: CONTRACT_ADDRESS,
          abi: CONTRACT_ABI,
          functionName: "buyTicket",
          args: [BigInt(poolId)],
          value,
        });
      } else {
        writeBuy({
          address: CONTRACT_ADDRESS,
          abi: CONTRACT_ABI,
          functionName: "buyTickets",
          args: [BigInt(poolId), BigInt(quantity)],
          value,
        });
      }
    },
    [pool, poolId, writeBuy],
  );

  // Reveal winners (creator only)
  const { writeContract: writeReveal, data: revealHash } = useWriteContract({
    mutation: { onError: onTxError },
  });
  const { isLoading: isRevealPending, isSuccess: isRevealSuccess } =
    useWaitForTransactionReceipt({ hash: revealHash });

  const handleReveal = useCallback(() => {
    setTxError(null);
    const secret = localStorage.getItem(`pool-secret-${poolId}`);
    if (!secret) {
      alert(
        "Secret not found in localStorage. Please enter the secret you used when creating this pool.",
      );
      return;
    }
    writeReveal({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: "revealWinners",
      args: [BigInt(poolId), secret as `0x${string}`],
    });
  }, [poolId, writeReveal]);

  // Claim prizes
  const { writeContract: writeClaim, data: claimHash } = useWriteContract({
    mutation: { onError: onTxError },
  });
  const { isLoading: isClaimPending, isSuccess: isClaimSuccess } =
    useWaitForTransactionReceipt({ hash: claimHash });

  // Creator withdraw
  const { writeContract: writeCreatorWithdraw, data: creatorWithdrawHash } =
    useWriteContract({ mutation: { onError: onTxError } });
  const {
    isLoading: isCreatorWithdrawPending,
    isSuccess: isCreatorWithdrawSuccess,
  } = useWaitForTransactionReceipt({ hash: creatorWithdrawHash });

  // Ticket refund
  const {
    writeContractAsync: writeTicketRefundAsync,
    data: ticketRefundHash,
  } = useWriteContract({ mutation: { onError: onTxError } });
  const {
    isLoading: isTicketRefundPending,
    isSuccess: isTicketRefundSuccess,
  } = useWaitForTransactionReceipt({ hash: ticketRefundHash });

  // Creator refund
  const {
    writeContractAsync: writeCreatorRefundAsync,
    data: creatorRefundHash,
  } = useWriteContract({ mutation: { onError: onTxError } });
  const {
    isLoading: isCreatorRefundPending,
    isSuccess: isCreatorRefundSuccess,
  } = useWaitForTransactionReceipt({ hash: creatorRefundHash });

  // Ticket owner data for grid — only query sold tickets
  const soldCount = pool?.ticketsSold ?? 0;
  const ticketIds = useMemo(
    () => Array.from({ length: 100 }, (_, i) => i),
    [],
  );
  const ticketOwnerCalls = useMemo(
    () =>
      ticketIds.slice(0, soldCount).map((ticketId) => ({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: CONTRACT_ABI,
        functionName: "getTicketOwner" as const,
        args: [BigInt(poolId), BigInt(ticketId)],
      })),
    [poolId, ticketIds, soldCount],
  );

  const { data: ticketOwnersRaw } = useReadContracts({
    contracts: ticketOwnerCalls,
    query: { enabled: soldCount > 0, staleTime: 30_000 },
  });

  // Pad to 100 entries so indices stay aligned with ticketIds
  const ticketOwners = useMemo(() => {
    if (!ticketOwnersRaw) return undefined;
    const padded = [...ticketOwnersRaw];
    for (let i = padded.length; i < 100; i++) {
      padded.push({ status: 'success' as const, result: '0x0000000000000000000000000000000000000000' });
    }
    return padded;
  }, [ticketOwnersRaw]);

  // Tier data (only after reveal) — only query sold tickets
  const tierCalls = useMemo(
    () =>
      pool?.isRevealed
        ? ticketIds.slice(0, soldCount).map((ticketId) => ({
            address: CONTRACT_ADDRESS as `0x${string}`,
            abi: CONTRACT_ABI,
            functionName: "getWinnerTier" as const,
            args: [BigInt(poolId), BigInt(ticketId)],
          }))
        : [],
    [pool?.isRevealed, poolId, ticketIds, soldCount],
  );

  const { data: tierDataRaw } = useReadContracts({
    contracts: tierCalls,
    query: { enabled: !!pool?.isRevealed, staleTime: 30_000 },
  });

  // Pad tier data to 100 entries
  const tierData = useMemo(() => {
    if (!tierDataRaw) return undefined;
    const padded = [...tierDataRaw];
    for (let i = padded.length; i < 100; i++) {
      padded.push({ status: 'success' as const, result: 0n });
    }
    return padded;
  }, [tierDataRaw]);

  // User's ticket IDs
  const userTicketIds = useMemo(() => {
    if (!ticketOwners || !address) return [];
    return ticketIds.filter((i) => {
      const result = ticketOwners[i];
      return (
        result?.result &&
        (result.result as string).toLowerCase() === address.toLowerCase()
      );
    });
  }, [ticketOwners, address, ticketIds]);

  const handleClaimAll = useCallback(() => {
    if (userTicketIds.length === 0) return;
    setTxError(null);
    writeClaim({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: "claimPrizes",
      args: [BigInt(poolId), userTicketIds.map((id) => BigInt(id))],
    });
  }, [poolId, userTicketIds, writeClaim]);

  const handleCreatorWithdraw = useCallback(() => {
    setTxError(null);
    writeCreatorWithdraw({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: "creatorWithdraw",
      args: [BigInt(poolId)],
    });
  }, [poolId, writeCreatorWithdraw]);

  const handleRefund = useCallback(async () => {
    if (userTicketIds.length === 0) return;
    setTxError(null);
    setRefundingAll(true);
    const fnName =
      status === "reveal_expired" ? "expiredPoolRefund" : "refundTicket";
    try {
      for (let i = 0; i < userTicketIds.length; i++) {
        setRefundProgress(`${i + 1}/${userTicketIds.length}`);
        await writeTicketRefundAsync({
          address: CONTRACT_ADDRESS,
          abi: CONTRACT_ABI,
          functionName: fnName,
          args: [BigInt(poolId), BigInt(userTicketIds[i])],
        });
      }
    } catch (err) {
      setTxError(
        err instanceof Error ? err.message.split("\n")[0] : "Refund failed",
      );
    } finally {
      setRefundingAll(false);
      setRefundProgress("");
    }
  }, [poolId, userTicketIds, status, writeTicketRefundAsync]);

  const handleCreatorRefund = useCallback(async () => {
    setTxError(null);
    const fnName =
      status === "reveal_expired"
        ? "expiredPoolCreatorRefund"
        : "refundCreator";
    try {
      await writeCreatorRefundAsync({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: fnName,
        args: [BigInt(poolId)],
      });
    } catch (err) {
      setTxError(
        err instanceof Error ? err.message.split("\n")[0] : "Refund failed",
      );
    }
  }, [poolId, status, writeCreatorRefundAsync]);

  // Auto-refetch when any transaction confirms
  const lastSuccessRef = useRef({
    buy: false,
    reveal: false,
    claim: false,
    withdraw: false,
    ticketRefund: false,
    creatorRefund: false,
  });
  useEffect(() => {
    const prev = lastSuccessRef.current;
    const changed =
      (isBuySuccess && !prev.buy) ||
      (isRevealSuccess && !prev.reveal) ||
      (isClaimSuccess && !prev.claim) ||
      (isCreatorWithdrawSuccess && !prev.withdraw) ||
      (isTicketRefundSuccess && !prev.ticketRefund) ||
      (isCreatorRefundSuccess && !prev.creatorRefund);
    lastSuccessRef.current = {
      buy: isBuySuccess,
      reveal: isRevealSuccess,
      claim: isClaimSuccess,
      withdraw: isCreatorWithdrawSuccess,
      ticketRefund: isTicketRefundSuccess,
      creatorRefund: isCreatorRefundSuccess,
    };
    if (changed) {
      refetch();
      refetchPools();
    }
  }, [
    isBuySuccess,
    isRevealSuccess,
    isClaimSuccess,
    isCreatorWithdrawSuccess,
    isTicketRefundSuccess,
    isCreatorRefundSuccess,
    refetch,
    refetchPools,
  ]);

  const anyPending =
    isBuyPending ||
    isRevealPending ||
    isClaimPending ||
    isCreatorWithdrawPending ||
    isTicketRefundPending ||
    isCreatorRefundPending ||
    refundingAll;

  const handleRefetch = useCallback(() => {
    refetch();
    refetchPools();
  }, [refetch, refetchPools]);

  if (isLoading) {
    return (
      <main className={styles.main}>
        <SkeletonLoader variant="infoGrid" />
        <SkeletonLoader variant="ticketGrid" />
      </main>
    );
  }

  if (!pool || !status) {
    return (
      <main className={styles.main}>
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon}>?</span>
          <p>Pool not found.</p>
        </div>
      </main>
    );
  }

  const isCreator =
    address && pool.creator.toLowerCase() === address.toLowerCase();
  const blocksUntilReveal =
    pool.revealBlock > 0n ? Number(pool.revealBlock - currentBlock) : null;
  const blocksUntilExpiry =
    pool.revealBlock > 0n
      ? Number(pool.revealBlock + 250n - currentBlock)
      : null;

  return (
    <main className={styles.main}>
      <PoolInfoHeader
        pool={pool}
        status={status}
        blocksUntilReveal={blocksUntilReveal}
        blocksUntilExpiry={blocksUntilExpiry}
        onRefresh={handleRefetch}
      />

      {txError && (
        <SectionCard variant="glass">
          <p className={styles.error}>{txError}</p>
        </SectionCard>
      )}

      <SectionCard variant="glass">
        <TicketGrid
          ticketOwners={ticketOwners}
          tierData={tierData}
          isRevealed={pool.isRevealed}
          userAddress={address}
        />
      </SectionCard>

      {status === "open" && address && (
        <BuySection
          ticketPrice={pool.ticketPrice}
          userTicketCount={userTicketCount}
          onBuy={handleBuy}
          isPending={isBuyPending}
          anyPending={anyPending}
        />
      )}

      {status === "ready_to_reveal" && isCreator && (
        <RevealSection
          onReveal={handleReveal}
          isPending={isRevealPending}
          anyPending={anyPending}
          blocksUntilExpiry={blocksUntilExpiry}
        />
      )}

      {status === "revealed" && (
        <ClaimSection
          userTicketIds={userTicketIds}
          tierData={tierData}
          onClaimAll={handleClaimAll}
          isClaimPending={isClaimPending}
          isCreator={!!isCreator}
          creatorFeeWithdrawn={pool.creatorFeeWithdrawn}
          onCreatorWithdraw={handleCreatorWithdraw}
          isWithdrawPending={isCreatorWithdrawPending}
          anyPending={anyPending}
        />
      )}

      {(status === "expired" || status === "reveal_expired") && (
        <RefundSection
          userTicketIds={userTicketIds}
          isCreator={!!isCreator}
          onRefundTickets={handleRefund}
          onRefundCreator={handleCreatorRefund}
          isRefunding={refundingAll}
          refundProgress={refundProgress}
          isCreatorRefundPending={isCreatorRefundPending}
          anyPending={anyPending}
        />
      )}
    </main>
  );
}
