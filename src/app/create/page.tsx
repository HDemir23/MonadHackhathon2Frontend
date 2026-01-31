'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, keccak256, encodePacked, toHex, decodeEventLog } from 'viem';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/lib/contract';
import { formatMON } from '@/lib/utils';
import { usePoolContext } from '@/context/PoolContext';
import styles from './page.module.css';

export default function CreatePoolPage() {
  const { address } = useAccount();
  const router = useRouter();
  const { refetch: refetchPools } = usePoolContext();

  const [deposit, setDeposit] = useState('');
  const [error, setError] = useState('');

  const pendingSecretRef = useRef<string | null>(null);

  const { writeContract, data: txHash } = useWriteContract();
  const { data: txReceipt, isLoading: isPending, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const depositBigInt = useMemo(() => {
    try {
      if (!deposit || isNaN(Number(deposit))) return null;
      return parseEther(deposit);
    } catch {
      return null;
    }
  }, [deposit]);

  const ticketPrice = useMemo(() => {
    if (!depositBigInt) return null;
    return depositBigInt / 100n;
  }, [depositBigInt]);

  const validate = useCallback((): string | null => {
    if (!deposit) return 'Enter a deposit amount.';
    const num = Number(deposit);
    if (isNaN(num) || num <= 0) return 'Invalid amount.';
    if (num < 0.01) return 'Minimum deposit is 0.01 MON.';
    if (num > 10000) return 'Maximum deposit is 10,000 MON.';
    // Check divisible by 100: deposit in wei must be divisible by 100
    if (depositBigInt && depositBigInt % 100n !== 0n) {
      return 'Deposit must be evenly divisible by 100 (for ticket pricing).';
    }
    return null;
  }, [deposit, depositBigInt]);

  const handleSubmit = useCallback(() => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError('');

    if (!depositBigInt) return;

    // Generate random secret (32 bytes)
    const randomBytes = new Uint8Array(32);
    crypto.getRandomValues(randomBytes);
    const secret = toHex(randomBytes);

    // Compute commit hash: keccak256(abi.encodePacked(secret))
    const commitHash = keccak256(encodePacked(['bytes32'], [secret]));

    // Hold the secret in a ref until the tx confirms and we can extract the pool ID
    pendingSecretRef.current = secret;

    writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'createPool',
      args: [commitHash],
      value: depositBigInt,
    });
  }, [validate, depositBigInt, writeContract]);

  // Once tx confirms, parse PoolCreated event to get pool ID and store the secret
  useEffect(() => {
    if (!isSuccess || !txReceipt || !pendingSecretRef.current) return;

    const secret = pendingSecretRef.current;
    pendingSecretRef.current = null;

    // Find the PoolCreated event in the receipt logs
    let poolId: bigint | undefined;
    for (const log of txReceipt.logs) {
      try {
        const event = decodeEventLog({
          abi: CONTRACT_ABI,
          data: log.data,
          topics: log.topics,
        });
        if (event.eventName === 'PoolCreated') {
          poolId = (event.args as { poolId: bigint }).poolId;
          break;
        }
      } catch {
        // Not a matching event, skip
      }
    }

    if (poolId !== undefined) {
      localStorage.setItem(`pool-secret-${poolId}`, secret);
    }

    refetchPools();
    router.push('/');
  }, [isSuccess, txReceipt, refetchPools, router]);

  return (
    <main className={styles.main}>
      <h1 className={styles.title}>Create Pool</h1>

      {!address ? (
        <p className={styles.message}>Connect your wallet to create a pool.</p>
      ) : (
        <div className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="deposit">
              Deposit Amount (MON)
            </label>
            <input
              id="deposit"
              type="number"
              className={styles.input}
              placeholder="e.g. 1.0"
              value={deposit}
              onChange={(e) => { setDeposit(e.target.value); setError(''); }}
              min="0.01"
              max="10000"
              step="0.01"
            />
            <p className={styles.hint}>
              Min 0.01 MON, max 10,000 MON. Must be divisible by 100.
            </p>
          </div>

          {ticketPrice && (
            <div className={styles.preview}>
              <div className={styles.previewRow}>
                <span>Ticket Price</span>
                <span>{formatMON(ticketPrice)} MON</span>
              </div>
              <div className={styles.previewRow}>
                <span>Total Tickets</span>
                <span>100</span>
              </div>
              <div className={styles.previewRow}>
                <span>Prize Pool (90%)</span>
                <span>{formatMON(depositBigInt! * 90n / 100n)} MON</span>
              </div>
              <div className={styles.previewRow}>
                <span>Creator Fee (8%)</span>
                <span>{formatMON(depositBigInt! * 8n / 100n)} MON</span>
              </div>
            </div>
          )}

          {error && <p className={styles.error}>{error}</p>}

          <button
            className={styles.submitBtn}
            onClick={handleSubmit}
            disabled={isPending}
          >
            {isPending ? 'Creating Pool...' : 'Create Pool'}
          </button>

          <p className={styles.warning}>
            Your secret will be stored in your browser&apos;s localStorage. You will need it to reveal winners after all tickets are sold. Do not clear your browser data before revealing.
          </p>
        </div>
      )}
    </main>
  );
}
