import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { ArrowUpRight, Blocks, Coins, Link2, Wallet } from "lucide-react";
import {
  ARC,
  ARC_MAINNET,
  readNativeUsdcBalance,
  readNetwork,
  readReceipt,
  estimateNativeUsdcTransfer,
} from "@/lib/arc";
import type { ArcNetwork } from "@/lib/arc";
import { switchArcNetwork } from "@/lib/arc-wallet";
import { useWalletSession } from "@/lib/wallet-session";
import { ChartPanel } from "./QuantCharts";
import { shortHash } from "./ui";
import "./investing.css";

const NETWORKS = [ARC_MAINNET, ARC] as const;
const fieldClass =
  "mt-2 block min-h-11 w-full rounded-xl border border-hairline-strong bg-bg px-4 py-3 font-mono text-sm text-ink";

function useObservation<T>() {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const version = useRef(0);
  useEffect(
    () => () => {
      version.current += 1;
    },
    [],
  );
  const reset = useCallback(() => {
    version.current += 1;
    setData(null);
    setError("");
    setBusy(false);
  }, []);
  async function run(work: () => Promise<T>) {
    const current = ++version.current;
    setData(null);
    setError("");
    setBusy(true);
    try {
      const value = await work();
      if (current === version.current) setData(value);
    } catch (e) {
      if (current === version.current)
        setError(e instanceof Error ? e.message : "The request could not be completed.");
    } finally {
      if (current === version.current) setBusy(false);
    }
  }
  return { data, error, busy, run, reset };
}

function ErrorNotice({ message }: { message: string }) {
  return message ? (
    <p role="alert" className="mt-4 rounded-xl border border-red-400/30 p-4 text-sm text-red-300">
      {message}
    </p>
  ) : null;
}

function ExplorerLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      className="inline-flex min-h-11 items-center gap-2 text-sm text-ink underline underline-offset-4"
      href={href}
      target="_blank"
      rel="noreferrer"
    >
      {label}
      <ArrowUpRight size={14} />
    </a>
  );
}

function NetworkWorkspace({ network }: { network: ArcNetwork }) {
  const [address, setAddress] = useState("");
  const [hash, setHash] = useState("");
  const [recipient, setRecipient] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const session = useWalletSession();
  const provider = session.provider;
  const wallet =
    session.address && session.chainId
      ? { address: session.address, chainId: session.chainId }
      : null;
  const [walletBusy, setWalletBusy] = useState(false);
  const [walletError, setWalletError] = useState("");
  const walletGeneration = useRef(0);
  const balance = useObservation<Awaited<ReturnType<typeof readNativeUsdcBalance>>>();
  const chain = useObservation<Awaited<ReturnType<typeof readNetwork>>>();
  const receipt = useObservation<Awaited<ReturnType<typeof readReceipt>>>();
  const estimate = useObservation<Awaited<ReturnType<typeof estimateNativeUsdcTransfer>>>();
  const resetBalance = balance.reset;
  const resetEstimate = estimate.reset;

  useEffect(() => {
    walletGeneration.current += 1;
    setAddress(session.address);
    resetBalance();
    resetEstimate();
  }, [session.address, session.chainId, resetBalance, resetEstimate]);

  async function connect(switchNetwork = false) {
    if (!provider || !switchNetwork) {
      session.openWallet();
      return;
    }
    setWalletBusy(true);
    setWalletError("");
    session.setTransactionLock("arc-network", true);
    try {
      await switchArcNetwork(provider, network);
    } catch (e) {
      setWalletError(e instanceof Error ? e.message : "Network change was declined.");
    } finally {
      setWalletBusy(false);
      session.setTransactionLock("arc-network", false);
    }
  }

  function inspectBalance(event: FormEvent) {
    event.preventDefault();
    void balance.run(() => readNativeUsdcBalance(address.trim(), fetch, network));
  }
  function inspectReceipt(event: FormEvent) {
    event.preventDefault();
    void receipt.run(() => readReceipt(hash.trim(), fetch, network));
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          {
            label: "NETWORK",
            value: network.name,
            detail: `Chain ${network.chainId}`,
            icon: Blocks,
          },
          {
            label: "NATIVE CURRENCY",
            value: "USDC",
            detail: "Network fees paid in dollars",
            icon: Coins,
          },
          { label: "EXECUTION", value: "EVM", detail: "Deterministic block finality", icon: Link2 },
        ].map(({ label, value, detail, icon: Icon }) => (
          <div key={label} className="rounded-2xl border border-hairline bg-surface p-5">
            <div className="flex items-center justify-between font-mono text-[10px] tracking-widest text-faint">
              {label}
              <Icon size={16} />
            </div>
            <p className="mt-5 text-2xl text-ink">{value}</p>
            <p className="mt-2 text-xs text-ink-muted">{detail}</p>
          </div>
        ))}
      </div>
      <ChartPanel
        title="Your Arc wallet"
        meta={
          network.chainId === ARC.chainId
            ? "Testnet funds have no monetary value"
            : "Mainnet · public onchain balances"
        }
      >
        <div className="q-body space-y-4">
          <p className="q-description">
            Connect your preferred wallet or inspect a public address. This view reads Arc directly.
            Your paper portfolio stays separate.
          </p>
          <div className="q-toolbar">
            <button
              type="button"
              className="q-button"
              disabled={!session.ready || session.busy || session.locked || walletBusy}
              onClick={() => void connect()}
            >
              <Wallet size={14} />
              {walletBusy
                ? "Waiting for wallet…"
                : wallet
                  ? shortHash(wallet.address, 6)
                  : "Connect wallet"}
            </button>
            {wallet && wallet.chainId !== network.chainId ? (
              <button
                type="button"
                className="q-button"
                disabled={walletBusy || session.busy || session.locked}
                onClick={() => void connect(true)}
              >
                Switch wallet to {network.name}
              </button>
            ) : null}
            {wallet ? (
              <button
                type="button"
                className="q-button"
                disabled={walletBusy || session.busy || session.locked}
                onClick={() => {
                  walletGeneration.current += 1;
                  void session.disconnect();
                  setAddress("");
                  setWalletError("");
                  setWalletBusy(false);
                  resetBalance();
                  resetEstimate();
                }}
              >
                Clear connection
              </button>
            ) : null}
          </div>
          {!provider ? (
            <p className="text-xs text-ink-muted">
              Choose MetaMask, Coinbase Wallet or an installed wallet such as Rabby, Phantom or
              Trust Wallet.
            </p>
          ) : null}
          {wallet ? (
            <p className="text-xs text-ink-muted">
              Wallet network:{" "}
              {wallet.chainId === network.chainId
                ? network.name
                : `chain ${wallet.chainId} · different from selected network`}
              . No signature or spending permission requested.
            </p>
          ) : null}
          <ErrorNotice message={walletError} />
          <form onSubmit={inspectBalance} className="space-y-4">
            <label className="block text-sm text-ink" htmlFor="arc-inspect-address">
              Public wallet address
              <input
                id="arc-inspect-address"
                className={fieldClass}
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value);
                  balance.reset();
                  estimate.reset();
                }}
                placeholder="0x…"
                autoComplete="off"
                spellCheck={false}
                required
              />
            </label>
            <button className="q-button" disabled={balance.busy}>
              {balance.busy ? "Reading balance…" : "Read USDC balance"}
            </button>
          </form>
          <ErrorNotice message={balance.error} />
          {balance.data ? (
            <div role="status" className="rounded-xl border border-accent/25 bg-accent/5 p-5">
              <p className="break-all font-mono text-3xl text-ink">
                {balance.data.amount} <span className="text-base text-ink-muted">USDC</span>
              </p>
              <p className="mt-3 break-all font-mono text-xs text-ink-muted">
                {balance.data.address}
              </p>
              <p className="mt-2 text-xs text-ink-muted">
                Block {balance.data.block} · observed{" "}
                {new Date(balance.data.observedAt).toLocaleString()}
              </p>
              <ExplorerLink
                href={`${network.explorerUrl}/address/${balance.data.address}`}
                label="View address"
              />
            </div>
          ) : null}
          <p className="text-xs text-faint">
            Addresses are sent to the selected network’s public RPC. Native USDC and ERC-20 USDC are
            the same funds, shown once.
          </p>
        </div>
      </ChartPanel>
      <ChartPanel title="Estimate a USDC network fee" meta="Read-only · no signature or transfer">
        <form
          className="q-body space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void estimate.run(() =>
              estimateNativeUsdcTransfer(
                address.trim(),
                recipient.trim(),
                transferAmount.trim(),
                fetch,
                network,
              ),
            );
          }}
        >
          <p className="q-description">
            Use the public sender address entered above to estimate a native USDC transfer. The
            selected network simulates the transfer and returns its current gas price.
          </p>
          <label className="block text-sm text-ink" htmlFor="arc-fee-recipient">
            Recipient address
            <input
              id="arc-fee-recipient"
              className={fieldClass}
              value={recipient}
              onChange={(e) => {
                setRecipient(e.target.value);
                estimate.reset();
              }}
              placeholder="0x…"
              autoComplete="off"
              spellCheck={false}
              required
            />
          </label>
          <label className="block text-sm text-ink" htmlFor="arc-fee-amount">
            Amount (USDC)
            <input
              id="arc-fee-amount"
              className={fieldClass}
              value={transferAmount}
              onChange={(e) => {
                setTransferAmount(e.target.value);
                estimate.reset();
              }}
              placeholder="1.00"
              inputMode="decimal"
              autoComplete="off"
              required
            />
          </label>
          <button className="q-button" disabled={estimate.busy || !address.trim()}>
            {estimate.busy ? "Estimating…" : "Estimate network fee"}
          </button>
          {!address.trim() ? (
            <p className="text-xs text-ink-muted">
              Enter a sender address in the wallet panel first.
            </p>
          ) : null}
          <ErrorNotice message={estimate.error} />
          {estimate.data ? (
            <div role="status" className="rounded-xl border border-hairline p-5 space-y-2">
              <p className="text-2xl text-ink">
                {estimate.data.feeUsdc} USDC{" "}
                <span className="text-sm text-ink-muted">estimated network fee</span>
              </p>
              <p className="text-sm text-ink-muted">
                Amount plus fee: {estimate.data.totalUsdc} USDC · {estimate.data.gasUnits} gas units
              </p>
              <p className="text-xs text-ink-muted">
                Observed {new Date(estimate.data.observedAt).toLocaleString()} · balance block{" "}
                {estimate.data.block}
              </p>
              {!estimate.data.hasEstimatedFunds ? (
                <p className="text-sm text-amber-300">
                  The observed sender balance does not cover this amount and estimated fee.
                </p>
              ) : null}
              <p className="text-xs text-faint">
                Fees and state can change. This estimate is not a reserved quote or spending limit.
                Nothing was signed or broadcast.
              </p>
            </div>
          ) : null}
        </form>
      </ChartPanel>
      <ChartPanel title="Transaction receipt" meta="Verify a transaction on the selected network">
        <form onSubmit={inspectReceipt} className="q-body space-y-4">
          <label className="block text-sm text-ink" htmlFor="arc-inspect-hash">
            Transaction hash
            <input
              id="arc-inspect-hash"
              className={fieldClass}
              value={hash}
              onChange={(e) => {
                setHash(e.target.value);
                receipt.reset();
              }}
              placeholder="0x…"
              autoComplete="off"
              spellCheck={false}
              required
            />
          </label>
          <button className="q-button" disabled={receipt.busy}>
            {receipt.busy ? "Verifying…" : "Verify receipt"}
          </button>
          <ErrorNotice message={receipt.error} />
          {receipt.data ? (
            <div role="status" className="rounded-xl border border-hairline p-5">
              <p className="text-xl capitalize text-ink">
                {receipt.data.state.replaceAll("-", " ")}
              </p>
              <p className="mt-2 text-sm text-ink-muted">
                Finality: {receipt.data.finality}
                {receipt.data.block ? ` · Block ${receipt.data.block}` : ""}
              </p>
              {receipt.data.gasFeeUsdc !== undefined ? (
                <p className="mt-2 font-mono text-sm">
                  Network fee: {receipt.data.gasFeeUsdc} USDC
                </p>
              ) : null}
              <p className="mt-2 text-xs text-ink-muted">
                Observed {new Date(receipt.data.observedAt).toLocaleString()}
              </p>
              <ExplorerLink
                href={`${network.explorerUrl}/tx/${receipt.data.hash}`}
                label="View transaction"
              />
              <p className="mt-2 text-xs text-faint">
                A finalized blockchain transaction does not by itself prove a stock purchase or
                issuer settlement.
              </p>
            </div>
          ) : null}
        </form>
      </ChartPanel>
      <ChartPanel title="Use your wallet to trade" meta="Tokenized stocks & ETFs">
        <div className="q-body space-y-4">
          <p className="q-description">
            Browse issuer-listed stocks and ETFs in Trade. Pay with Arc USDC where a purchase route
            is available; the stock tokens settle in your wallet on Ethereum.
          </p>
          <ExplorerLink href="/dashboard?view=stocks" label="Explore stocks & ETFs" />
          <p className="text-xs text-ink-muted">
            Review the route, fees and destination before approving any transaction.
          </p>
        </div>
      </ChartPanel>
      <ChartPanel title="Network observation" meta="Checked on demand">
        <div className="q-body space-y-4">
          <button
            type="button"
            className="q-button"
            disabled={chain.busy}
            onClick={() => void chain.run(() => readNetwork(fetch, network))}
          >
            {chain.busy ? "Checking…" : `Check ${network.name}`}
          </button>
          <ErrorNotice message={chain.error} />
          {chain.data ? (
            <p role="status" className="q-description">
              Chain {network.chainId} verified · latest block {chain.data.block} · observed{" "}
              {new Date(chain.data.observedAt).toLocaleString()}
            </p>
          ) : null}
          <ExplorerLink href={network.explorerUrl} label="Open Arc explorer" />
        </div>
      </ChartPanel>
    </div>
  );
}

export default function ArcWorkspace() {
  const [network, setNetwork] = useState<ArcNetwork>(ARC_MAINNET);
  return (
    <div className="quant-workspace">
      <header className="q-view-header">
        <div>
          <p className="q-eyebrow">ARCWELL / ARC NETWORK</p>
          <h1>Arc workspace</h1>
          <p className="q-description">Your wallet, USDC balance and transaction trail.</p>
        </div>
        <label className="text-xs text-ink-muted" htmlFor="arc-network-select">
          Network
          <select
            id="arc-network-select"
            className={fieldClass}
            value={network.chainId}
            onChange={(e) =>
              setNetwork(
                NETWORKS.find((item) => item.chainId === Number(e.target.value)) ?? ARC_MAINNET,
              )
            }
          >
            {NETWORKS.map((item) => (
              <option key={item.chainId} value={item.chainId}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
      </header>
      <NetworkWorkspace key={network.chainId} network={network} />
    </div>
  );
}
