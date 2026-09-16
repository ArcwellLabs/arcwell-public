import { useEffect, useRef, useState } from "react";
import {
  ARC_BRIDGE,
  FUNDING_STORAGE,
  assertFundingTransaction,
  forwardingHash,
  isHash,
  parseFundingRecord,
  type FundingRecord,
} from "@/lib/arc-stock-funding";

// Keep read-only reconciliation for transfers initiated before the funding card was removed.
export default function StockTransferRecovery({
  disabled,
  onLockChange,
  onResolved,
}: {
  disabled: boolean;
  onLockChange: (locked: boolean) => void;
  onResolved: () => void;
}) {
  const [record, setRecord] = useState<FundingRecord | null>(null);
  const [blocked, setBlocked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [recoveryHash, setRecoveryHash] = useState("");
  const running = useRef(false);
  const callbacks = useRef({ onLockChange, onResolved });
  callbacks.current = { onLockChange, onResolved };
  const pending = Boolean(record && !["complete", "reverted"].includes(record.stage));
  useEffect(() => {
    try {
      setRecord(parseFundingRecord(localStorage.getItem(FUNDING_STORAGE)));
    } catch {
      setBlocked(true);
      setError(
        "Existing transfer data could not be read. Check your wallet activity before another order.",
      );
    }
  }, []);
  useEffect(() => {
    callbacks.current.onLockChange(pending || blocked || busy);
  }, [pending, blocked, busy]);
  function save(next: FundingRecord) {
    localStorage.setItem(FUNDING_STORAGE, JSON.stringify(next));
    setRecord(next);
  }
  async function reconcile() {
    const current = record;
    if (!current) return;
    const hash = current.burnHash || recoveryHash;
    if (!isHash(hash))
      throw new Error("Paste the Arc transfer transaction hash from your wallet activity.");
    // Verify the burn belongs to this recovery record before trusting a supplied hash.
    const rpc = async (method: string) => {
      const response = await fetch("https://rpc.mainnet.arc.io", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params: [hash] }),
      });
      if (!response.ok) throw new Error("Arc status is unavailable. Your transfer is still saved.");
      return (await response.json()).result;
    };
    const tx = await rpc("eth_getTransactionByHash");
    if (
      !tx ||
      tx.from?.toLowerCase() !== current.wallet.toLowerCase() ||
      tx.to?.toLowerCase() !== ARC_BRIDGE.toLowerCase()
    )
      throw new Error("Matching Arc transfer not found yet. Check the hash and try again.");
    assertFundingTransaction(
      { from: tx.from, to: tx.to, value: tx.value, data: tx.input },
      current,
    );
    const receipt = await rpc("eth_getTransactionReceipt");
    if (receipt?.status === "0x0") {
      save({ ...current, burnHash: hash, stage: "reverted" });
      throw new Error(
        "Arc transfer reverted. No USDC was bridged; network gas may have been spent.",
      );
    }
    save({ ...current, burnHash: hash, stage: "pending" });
    const response = await fetch(
      `https://iris-api.circle.com/v2/messages/26?transactionHash=${hash}`,
    );
    if (!response.ok) throw new Error("Circle is processing this transfer. Check again shortly.");
    const mintHash = forwardingHash(await response.json(), current);
    if (!mintHash)
      throw new Error(
        "Transfer is awaiting Circle forwarding confirmation. Do not send a second transfer.",
      );
    save({ ...current, burnHash: hash, mintHash, stage: "complete" });
    callbacks.current.onResolved();
  }
  async function refresh() {
    if (disabled || running.current) return;
    running.current = true;
    setBusy(true);
    setError("");
    try {
      await reconcile();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Transfer status is unavailable.");
    } finally {
      running.current = false;
      setBusy(false);
    }
  }
  if (!pending && !blocked && !error) return null;
  return (
    <div className="st-notice" aria-label="Existing transfer status">
      <strong>Existing transfer status</strong>
      {pending && (
        <p>An earlier Arc transfer is unresolved. Check its status before placing another order.</p>
      )}
      {pending && !record?.burnHash && (
        <input
          aria-label="Existing Arc transfer transaction hash"
          placeholder="0x…"
          value={recoveryHash}
          onChange={(e) => setRecoveryHash(e.target.value)}
        />
      )}
      {pending && (
        <button className="st-wallet" disabled={disabled || busy} onClick={() => void refresh()}>
          {busy ? "Checking transfer…" : "Check existing transfer"}
        </button>
      )}
      {record?.burnHash && (
        <a href={`https://explorer.arc.io/tx/${record.burnHash}`} target="_blank" rel="noreferrer">
          View existing transfer ↗
        </a>
      )}
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
