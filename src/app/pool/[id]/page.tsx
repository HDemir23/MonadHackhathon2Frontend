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
import {
  getPoolStatus,
  formatMON,
  shortenAddress,
  STATUS_LABELS,
  tierLabel,
} from "@/lib/utils";
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

  const [quantity, setQuantity] = useState(1);
  const [txError, setTxError] = useState<string | null>(null);
  const [refundingAll, setRefundingAll] = useState(false);
  const [refundProgress, setRefundProgress] = useState("");
  const maxBuyable = 10 - userTicketCount;

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
    useWaitForTransactionReceipt({
      hash: buyHash,
    });

  const handleBuy = useCallback(() => {
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
  }, [pool, poolId, quantity, writeBuy]);

  // Reveal winners (creator only)
  const { writeContract: writeReveal, data: revealHash } = useWriteContract({
    mutation: { onError: onTxError },
  });
  const { isLoading: isRevealPending, isSuccess: isRevealSuccess } =
    useWaitForTransactionReceipt({
      hash: revealHash,
    });

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
    useWaitForTransactionReceipt({
      hash: claimHash,
    });

  // Creator withdraw
  const { writeContract: writeCreatorWithdraw, data: creatorWithdrawHash } =
    useWriteContract({ mutation: { onError: onTxError } });
  const {
    isLoading: isCreatorWithdrawPending,
    isSuccess: isCreatorWithdrawSuccess,
  } = useWaitForTransactionReceipt({
    hash: creatorWithdrawHash,
  });

  // Ticket refund
  const { writeContractAsync: writeTicketRefundAsync, data: ticketRefundHash } =
    useWriteContract({ mutation: { onError: onTxError } });
  const { isLoading: isTicketRefundPending, isSuccess: isTicketRefundSuccess } =
    useWaitForTransactionReceipt({
      hash: ticketRefundHash,
    });

  // Creator refund
  const { writeContractAsync: writeCreatorRefundAsync, data: creatorRefundHash } =
    useWriteContract({ mutation: { onError: onTxError } });
  const { isLoading: isCreatorRefundPending, isSuccess: isCreatorRefundSuccess } =
    useWaitForTransactionReceipt({
      hash: creatorRefundHash,
    });

  // Ticket owner data for grid
  const ticketIds = useMemo(() => Array.from({ length: 100 }, (_, i) => i), []);
  const ticketOwnerCalls = useMemo(
    () =>
      ticketIds.map((ticketId) => ({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: CONTRACT_ABI,
        functionName: "getTicketOwner" as const,
        args: [BigInt(poolId), BigInt(ticketId)],
      })),
    [poolId, ticketIds],
  );

  const { data: ticketOwners } = useReadContracts({
    contracts: ticketOwnerCalls,
  });

  // Tier data (only after reveal)
  const tierCalls = useMemo(
    () =>
      pool?.isRevealed
        ? ticketIds.map((ticketId) => ({
            address: CONTRACT_ADDRESS as `0x${string}`,
            abi: CONTRACT_ABI,
            functionName: "getWinnerTier" as const,
            args: [BigInt(poolId), BigInt(ticketId)],
          }))
        : [],
    [pool?.isRevealed, poolId, ticketIds],
  );

  const { data: tierData } = useReadContracts({
    contracts: tierCalls,
    query: { enabled: !!pool?.isRevealed },
  });

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
        <p className={styles.message}>Loading pool...</p>
      </main>
    );
  }

  if (!pool) {
    return (
      <main className={styles.main}>
        <p className={styles.message}>Pool not found.</p>
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
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Pool #{poolId}</h1>
          {status && (
            <span className={`${styles.badge} ${styles[status]}`}>
              {STATUS_LABELS[status]}
            </span>
          )}
        </div>
        <button className={styles.refreshBtn} onClick={handleRefetch}>
          Refresh
        </button>
      </div>

      <div className={styles.infoGrid}>
        <div className={styles.infoItem}>
          <span className={styles.infoLabel}>Deposit</span>
          <span className={styles.infoValue}>
            {formatMON(pool.totalDeposit)} MON
          </span>
        </div>
        <div className={styles.infoItem}>
          <span className={styles.infoLabel}>Ticket Price</span>
          <span className={styles.infoValue}>
            {formatMON(pool.ticketPrice)} MON
          </span>
        </div>
        <div className={styles.infoItem}>
          <span className={styles.infoLabel}>Tickets Sold</span>
          <span className={styles.infoValue}>{pool.ticketsSold}/100</span>
        </div>
        <div className={styles.infoItem}>
          <span className={styles.infoLabel}>Creator</span>
          <span className={styles.infoValue}>
            {shortenAddress(pool.creator)}
          </span>
        </div>
        {blocksUntilReveal !== null && status === "sold_out_waiting" && (
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Reveal Opens In</span>
            <span className={styles.infoValue}>{blocksUntilReveal} blocks</span>
          </div>
        )}
        {blocksUntilExpiry !== null && status === "ready_to_reveal" && (
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Reveal Expires In</span>
            <span className={styles.infoValue}>{blocksUntilExpiry} blocks</span>
          </div>
        )}
      </div>

      {txError && (
        <div className={styles.section}>
          <p className={styles.error}>{txError}</p>
        </div>
      )}

      {/* Ticket Grid */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Tickets</h2>
        <div className={styles.ticketGrid}>
          {ticketIds.map((ticketId) => {
            const ownerResult = ticketOwners?.[ticketId];
            const owner = ownerResult?.result as string | undefined;
            const isOwned =
              owner && owner !== "0x0000000000000000000000000000000000000000";
            const isYours =
              isOwned &&
              address &&
              owner.toLowerCase() === address.toLowerCase();
            const tier = tierData?.[ticketId]?.result as bigint | undefined;
            const tierNum = tier ? Number(tier) : 0;

            let ticketClass = styles.ticketAvailable;
            if (isYours) ticketClass = styles.ticketYours;
            else if (isOwned) ticketClass = styles.ticketSold;

            if (pool.isRevealed && tierNum > 0) {
              ticketClass = `${ticketClass} ${styles[`tier${tierNum}`] ?? ""}`;
            }

            return (
              <div
                key={ticketId}
                className={`${styles.ticket} ${ticketClass}`}
                title={
                  isYours
                    ? `#${ticketId} (yours)${tierNum ? ` - ${tierLabel(tierNum)}` : ""}`
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
            <span className={`${styles.legendDot} ${styles.legendAvailable}`} />{" "}
            Available
          </span>
          <span>
            <span className={`${styles.legendDot} ${styles.legendSold}`} /> Sold
          </span>
          <span>
            <span className={`${styles.legendDot} ${styles.legendYours}`} />{" "}
            Yours
          </span>
        </div>
      </div>

      {/* Buy Section */}
      {status === "open" && address && maxBuyable > 0 && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Buy Tickets</h2>
          <div className={styles.buyRow}>
            <label className={styles.buyLabel}>
              Quantity:
              <select
                className={styles.select}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
              >
                {Array.from({ length: maxBuyable }, (_, i) => i + 1).map(
                  (n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ),
                )}
              </select>
            </label>
            <span className={styles.buyTotal}>
              Total: {formatMON(pool.ticketPrice * BigInt(quantity))} MON
            </span>
            <button
              className={styles.actionBtn}
              onClick={handleBuy}
              disabled={anyPending}
            >
              {isBuyPending ? "Buying..." : "Buy"}
            </button>
          </div>
          <p className={styles.hint}>
            You have {userTicketCount}/10 tickets in this pool.
          </p>
        </div>
      )}

      {/* Reveal Section (creator only) */}
      {status === "ready_to_reveal" && isCreator && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Reveal Winners</h2>
          <p className={styles.hint}>
            The reveal window is open. Submit your secret to reveal winners.
          </p>
          <button
            className={styles.actionBtn}
            onClick={handleReveal}
            disabled={anyPending}
          >
            {isRevealPending ? "Revealing..." : "Reveal Winners"}
          </button>
        </div>
      )}

      {/* Claim Section */}
      {status === "revealed" && userTicketIds.length > 0 && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Your Tickets</h2>
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
          <button
            className={styles.actionBtn}
            onClick={handleClaimAll}
            disabled={anyPending}
          >
            {isClaimPending ? "Claiming..." : "Claim All Prizes"}
          </button>
        </div>
      )}

      {/* Creator Withdraw */}
      {status === "revealed" && isCreator && !pool.creatorFeeWithdrawn && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Creator Fee</h2>
          <p className={styles.hint}>You can withdraw your 8% creator fee.</p>
          <button
            className={styles.actionBtn}
            onClick={handleCreatorWithdraw}
            disabled={anyPending}
          >
            {isCreatorWithdrawPending
              ? "Withdrawing..."
              : "Withdraw Creator Fee"}
          </button>
        </div>
      )}

      {/* Refund Section */}
      {(status === "expired" || status === "reveal_expired") && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Refund</h2>
          {userTicketIds.length > 0 && (
            <button
              className={styles.actionBtn}
              onClick={handleRefund}
              disabled={anyPending}
            >
              {refundingAll
                ? `Refunding ${refundProgress}...`
                : `Refund All Tickets (${userTicketIds.length})`}
            </button>
          )}
          {isCreator && (
            <button
              className={`${styles.actionBtn} ${styles.secondaryBtn}`}
              onClick={handleCreatorRefund}
              disabled={anyPending}
            >
              {isCreatorRefundPending ? "Refunding..." : "Refund Creator Deposit"}
            </button>
          )}
        </div>
      )}
    </main>
  );
}
