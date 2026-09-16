import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, Wallet } from "lucide-react";
import type { EIP1193Provider } from "viem";
import type { StockWallet } from "@/lib/stock-wallet";
import {
  ARC_CHAIN,
  ARC_USDC,
  ARC_BRIDGE,
  assertFundingTransaction,
  FUNDING_STORAGE,
  forwardingHash,
  isAddress,
  isHash,
  parseFundingRecord,
  usdcUnits,
  usdcDisplay,
  verifyArcWallet,
  type FundingRecord,
} from "@/lib/arc-stock-funding";
import "./arc-stock-funding.css";

type Review = { wallet: string; amount: string; maxFee: string; expiresAt: number; gas: string };
type Props = {
  disabled: boolean;
  onLockChange: (locked: boolean) => void;
  onFunded?: (wallet: string) => void;
};
const unresolved = (r: FundingRecord | null) =>
  Boolean(r && !["complete", "reverted"].includes(r.stage));
const injected = () => (window as unknown as { ethereum?: StockWallet }).ethereum;

export default function ArcStockFunding({ disabled, onLockChange, onFunded }: Props) {
  const [amount, setAmount] = useState("");
  const [review, setReview] = useState<Review | null>(null);
  const [record, setRecord] = useState<FundingRecord | null>(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [blocked, setBlocked] = useState(false);
  const [recoveryHash, setRecoveryHash] = useState("");
  const running = useRef(false);
  const liveRecord = useRef<FundingRecord | null>(null);
  const callbacks = useRef({ onLockChange, onFunded });
  callbacks.current = { onLockChange, onFunded };
  function save(next: FundingRecord) {
    localStorage.setItem(FUNDING_STORAGE, JSON.stringify(next));
    liveRecord.current = next;
    setRecord(next);
  }
  useEffect(() => {
    try {
      const saved = parseFundingRecord(localStorage.getItem(FUNDING_STORAGE));
      liveRecord.current = saved;
      setRecord(saved);
    } catch {
      setBlocked(true);
      setError(
        "Funding recovery data is unavailable. Check your Arc wallet activity before starting another transfer.",
      );
    }
  }, []);
  useEffect(() => {
    callbacks.current.onLockChange(Boolean(busy || blocked || unresolved(record)));
  }, [busy, blocked, record]);
  useEffect(() => {
    const wallet = injected();
    const changed = () => setReview(null);
    wallet?.on?.("accountsChanged", changed);
    wallet?.on?.("chainChanged", changed);
    return () => {
      wallet?.removeListener?.("accountsChanged", changed);
      wallet?.removeListener?.("chainChanged", changed);
    };
  }, []);
  async function run(label: string, fn: () => Promise<void>) {
    if (running.current || disabled || blocked) return;
    running.current = true;
    setBusy(label);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Funding could not finish. Check transfer status before trying again.",
      );
    } finally {
      running.current = false;
      setBusy("");
    }
  }
  async function sdk(wallet: StockWallet) {
    const [{ BridgeKit }, { createViemAdapterFromProvider }] = await Promise.all([
      import("@circle-fin/bridge-kit"),
      import("@circle-fin/adapter-viem-v2"),
    ]);
    return {
      kit: new BridgeKit(),
      adapter: await createViemAdapterFromProvider({ provider: wallet as EIP1193Provider }),
    };
  }
  const params = (
    adapter: Awaited<ReturnType<typeof sdk>>["adapter"],
    address: string,
    value: string,
    maxFee?: string,
  ) => ({
    from: { adapter, chain: "Arc" as const },
    to: { chain: "Ethereum" as const, recipientAddress: address, useForwarder: true as const },
    amount: value,
    config: {
      transferSpeed: "SLOW" as const,
      batchTransactions: false,
      ...(maxFee === undefined ? {} : { maxFee }),
    },
  });
  async function estimate() {
    if (unresolved(liveRecord.current)) return;
    setReview(null);
    if (usdcUnits(amount) <= 0n) throw new Error("Enter the amount of Arc USDC to transfer.");
    const wallet = injected();
    if (!wallet)
      throw new Error("Open Arcwell in your wallet browser or enable an EVM wallet extension.");
    const accounts = await wallet.request({ method: "eth_requestAccounts" });
    const address = Array.isArray(accounts) ? accounts[0] : null;
    if (!isAddress(address)) throw new Error("No wallet account was selected.");
    try {
      await wallet.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: ARC_CHAIN }],
      });
    } catch (e) {
      if ((e as { code?: number }).code !== 4902) throw e;
      await wallet.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: ARC_CHAIN,
            chainName: "Arc Mainnet",
            nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
            rpcUrls: ["https://rpc.mainnet.arc.io"],
            blockExplorerUrls: ["https://explorer.arc.io"],
          },
        ],
      });
      await wallet.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: ARC_CHAIN }],
      });
    }
    await verifyArcWallet(wallet, address);
    const { kit, adapter } = await sdk(wallet);
    const result = await kit.estimate(params(adapter, address, amount));
    await verifyArcWallet(wallet, address);
    if (
      result.source.chain !== "Arc" ||
      result.destination.chain !== "Ethereum" ||
      result.source.address.toLowerCase() !== address.toLowerCase() ||
      (result.destination.recipientAddress || result.destination.address).toLowerCase() !==
        address.toLowerCase()
    )
      throw new Error("Funding route did not match the selected wallet.");
    if (
      !result.fees.some((f) => f.type === "forwarder") ||
      result.fees.some((f) => f.error || f.amount === null || f.token !== "USDC")
    )
      throw new Error("Circle could not estimate forwarding fees. Try again later.");
    const fee = result.fees.reduce((sum, f) => sum + usdcUnits(f.amount!), 0n);
    if (fee >= usdcUnits(amount))
      throw new Error("The transfer amount must exceed the forwarding fee.");
    const gas = result.gasFees.filter((f) => f.blockchain === "Arc");
    if (
      !gas.length ||
      gas.some(
        (f) => f.error || !f.fees || !Number.isFinite(Number(f.fees.fee)) || Number(f.fees.fee) < 0,
      )
    )
      throw new Error("Arc network fees could not be estimated. Check your Arc USDC balance.");
    setReview({
      wallet: address,
      amount,
      maxFee: usdcDisplay(fee),
      expiresAt: Date.now() + 60000,
      gas: gas.reduce((sum, f) => sum + Number(f.fees!.fee), 0).toFixed(6),
    });
  }
  async function transfer() {
    if (!review || unresolved(liveRecord.current)) return;
    if (localStorage.getItem("arcwell.stock-order.v1"))
      throw new Error("Resolve the existing stock order before starting another funding transfer.");
    const saved = parseFundingRecord(localStorage.getItem(FUNDING_STORAGE));
    if (unresolved(saved)) {
      liveRecord.current = saved;
      setRecord(saved);
      setReview(null);
      throw new Error("Another funding transfer is unresolved. Check its status first.");
    }
    if (Date.now() >= review.expiresAt) {
      setReview(null);
      throw new Error("Fee review expired. Review current fees again.");
    }
    const wallet = injected();
    if (!wallet) throw new Error("Reconnect your wallet.");
    await verifyArcWallet(wallet, review.wallet);
    let burnDispatched = false;
    const guarded: StockWallet = {
      request: async (args) => {
        if (args.method === "eth_sendTransaction") {
          await verifyArcWallet(wallet, review.wallet);
          const tx = args.params?.[0] as {
            to?: string;
            from?: string;
            value?: string;
            data?: string;
          };
          const approval = assertFundingTransaction(tx, review) === "approval";
          if (!approval) {
            burnDispatched = true;
            save({ ...liveRecord.current!, stage: "submitting" });
          }
          try {
            const hash = await wallet.request(args);
            if (!isHash(hash))
              throw new Error("Wallet did not return a transaction hash. Check wallet activity.");
            save({
              ...liveRecord.current!,
              ...(approval
                ? { approvalHash: hash }
                : { burnHash: hash, stage: "pending" as const }),
            });
            return hash;
          } catch (e) {
            if (!approval && (e as { code?: number }).code === 4001) burnDispatched = false;
            throw e;
          }
        }
        if (
          args.method === "wallet_sendCalls" ||
          args.method === "eth_sendRawTransaction" ||
          args.method.startsWith("eth_sign") ||
          args.method === "personal_sign"
        )
          throw new Error("Unexpected wallet request blocked.");
        return wallet.request(args);
      },
    };
    save({
      wallet: review.wallet,
      amount: review.amount,
      maxFee: review.maxFee,
      startedAt: Date.now(),
      stage: "submitting",
    });
    setReview(null);
    try {
      const { kit, adapter } = await sdk(guarded);
      const result = await kit.bridge(params(adapter, review.wallet, review.amount, review.maxFee));
      if (result.state === "error")
        throw new Error(
          result.steps.find((s) => s.state === "error")?.errorMessage ||
            "Transfer interrupted. Check status to recover.",
        );
      await checkStatus();
    } catch (e) {
      if (!burnDispatched && !liveRecord.current?.burnHash)
        save({ ...liveRecord.current!, stage: "reverted" });
      throw e;
    }
  }
  async function checkStatus() {
    const current = liveRecord.current;
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
    callbacks.current.onFunded?.(current.wallet);
  }
  const locked = Boolean(disabled || busy || blocked || unresolved(record));
  return (
    <section className="arc-stock-funding" aria-label="Fund stocks from Arc">
      <div className="arc-funding-heading">
        <span className="arc-funding-orb">A</span>
        <div>
          <span className="arc-funding-kicker">START WITH ARC</span>
          <h3>Your USDC. More possibilities.</h3>
        </div>
      </div>
      <div className="arc-funding-route">
        <strong>Arc USDC</strong>
        <ArrowRight size={16} />
        <span>Ethereum USDC</span>
        <ArrowRight size={16} />
        <span>Stocks</span>
      </div>
      <p>
        Fund from Arc in your own wallet. Circle transfers your USDC; then you review a separate
        stock order here. Stock tokens settle on Ethereum, where approvals require ETH for gas.
      </p>
      {!unresolved(record) && (
        <>
          <label htmlFor="arc-funding-amount">
            Transfer from Arc <span>USDC</span>
          </label>
          <input
            id="arc-funding-amount"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            disabled={locked}
            onChange={(e) => {
              setAmount(e.target.value);
              setReview(null);
              setError("");
            }}
          />
          {!review ? (
            <button
              disabled={locked || !amount}
              onClick={() => void run("Reviewing fees…", estimate)}
            >
              <Wallet size={16} />
              {busy || "Connect Arc & review fees"}
              <ArrowRight size={16} />
            </button>
          ) : (
            <div className="arc-funding-review">
              <dl>
                <div>
                  <dt>From Arc</dt>
                  <dd>{review.amount} USDC</dd>
                </div>
                <div>
                  <dt>Maximum Circle fee</dt>
                  <dd>{review.maxFee} USDC</dd>
                </div>
                <div>
                  <dt>Receive at least</dt>
                  <dd>{usdcDisplay(usdcUnits(review.amount) - usdcUnits(review.maxFee))} USDC</dd>
                </div>
                <div>
                  <dt>Estimated Arc gas</dt>
                  <dd>{review.gas} USDC</dd>
                </div>
              </dl>
              <small>
                Same wallet: {review.wallet.slice(0, 6)}…{review.wallet.slice(-4)}. Fees are
                deducted from the transfer. Wallet confirmation required.
              </small>
              <button disabled={locked} onClick={() => void run("Confirm in wallet…", transfer)}>
                Transfer Arc USDC
                <ArrowRight size={16} />
              </button>
              <button
                className="arc-funding-secondary"
                disabled={locked}
                onClick={() => setReview(null)}
              >
                Edit / refresh fees
              </button>
            </div>
          )}
        </>
      )}
      {unresolved(record) && (
        <div className="arc-funding-progress">
          <strong>{busy || "Transfer in progress"}</strong>
          <p>Your transfer is saved in this browser. Check its status before starting another.</p>
          {!record?.burnHash && (
            <input
              aria-label="Arc transfer transaction hash"
              placeholder="Arc transfer hash: 0x…"
              value={recoveryHash}
              onChange={(e) => setRecoveryHash(e.target.value)}
            />
          )}
          <button
            disabled={Boolean(disabled || busy || blocked)}
            onClick={() => void run("Checking transfer…", checkStatus)}
          >
            Check transfer status
          </button>
        </div>
      )}
      {record?.stage === "complete" && (
        <p className="arc-funding-success">
          <Check size={16} /> Funding confirmed. Continue to your stock order.
        </p>
      )}
      {record?.burnHash && (
        <a href={`https://explorer.arc.io/tx/${record.burnHash}`} target="_blank" rel="noreferrer">
          View Arc transfer ↗
        </a>
      )}
      {record?.mintHash && (
        <a href={`https://etherscan.io/tx/${record.mintHash}`} target="_blank" rel="noreferrer">
          View received USDC ↗
        </a>
      )}
      {error && (
        <p className="arc-funding-error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
