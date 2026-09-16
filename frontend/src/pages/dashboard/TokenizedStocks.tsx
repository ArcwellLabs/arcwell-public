import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDownUp, ArrowUpRight, Wallet, ArrowRight, ShieldCheck, Search } from "lucide-react";
import {
  STOCK_ASSETS,
  stockPair,
  stockDisplay,
  type StockIntent,
  type StockQuote,
  type StockOrderStatus,
} from "../../../../src/stock-trading";
import {
  stockApproval,
  stockFunding,
  verifyStockWallet,
  type StockWallet,
} from "@/lib/stock-wallet";
import { STOCK_CATALOG_METADATA } from "../../../../src/stock-catalog";
import type { StockAsset } from "../../../../src/stock-catalog-source";
import "@/components/asset-logo.css";
import "./tokenized-stocks.css";
import { useWalletSession } from "@/lib/wallet-session";
import StockTransferRecovery from "./StockTransferRecovery";
import StockCheckoutLoader from "./StockCheckoutLoader";

type Pending = { ticket: string; orderId: string; wallet: string; deadline: number };
const STORAGE = "arcwell.stock-order.v1";
const terminal = ["filled", "expired", "error", "cancelled", "insufficient-funds"];
class StockApiError extends Error {
  notSubmitted: boolean;
  constructor(message: string, notSubmitted: boolean) {
    super(message);
    this.notSubmitted = notSubmitted;
  }
}
async function api<T>(body?: unknown): Promise<T> {
  const response = await fetch(
    "/api/stock-trading",
    body
      ? {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      : undefined,
  );
  const data = await response.json();
  if (!response.ok)
    throw new StockApiError(data.error || "Trading request failed.", data.notSubmitted === true);
  return data as T;
}

function StockLogo({ asset }: { asset: StockAsset }) {
  const [failed, setFailed] = useState("");
  return (
    <img
      className="asset-logo"
      src={failed === asset.logoURI ? "/asset-logos/unverified.svg" : asset.logoURI}
      alt={`${asset.name} token logo`}
      width={32}
      height={32}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(asset.logoURI)}
    />
  );
}

export default function TokenizedStocks() {
  const walletSession = useWalletSession();
  const { setTransactionLock } = walletSession;
  const [ready, setReady] = useState<boolean | null>(null);
  const [symbol, setSymbol] = useState<string>("AAPLon");
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(24);
  const filteredAssets = useMemo(() => {
    const term = query.trim().toLowerCase();
    return STOCK_ASSETS.filter((item) =>
      `${item.symbol} ${item.name} ${item.address}`.toLowerCase().includes(term),
    );
  }, [query]);
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [amount, setAmount] = useState("");
  const [address, setAddress] = useState("");
  const [quote, setQuote] = useState<StockQuote | null>(null);
  const [approved, setApproved] = useState(false);
  const [approvalHash, setApprovalHash] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [busy, setBusy] = useState("");
  const [fundingLocked, setFundingLocked] = useState(false);
  const [checkoutLocked, setCheckoutLocked] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [pending, setPending] = useState<Pending | null>(null);
  const [order, setOrder] = useState<StockOrderStatus | null>(null);
  const [clock, setClock] = useState(Date.now());
  const provider = useRef<StockWallet | null>(null);
  const generation = useRef(0);
  const signing = useRef(false);
  const mounted = useRef(false);
  const asset = STOCK_ASSETS.find((item) => item.symbol === symbol)!;
  const inputSymbol = side === "buy" ? "USDC" : symbol;
  const intent: StockIntent = { symbol, side, amount, wallet: address };
  const locked = Boolean(busy || pending || approvalHash || fundingLocked || checkoutLocked);
  const arcCheckout = side === "buy" && !pending && !approvalHash;
  const expired = Boolean(quote && clock >= quote.expiresAt);
  const orderFinished = Boolean(order && terminal.includes(order.status));

  const invalidate = () => {
    generation.current++;
    setQuote(null);
    setApproved(false);
    setBalance(null);
    setError("");
    setNote("");
  };
  useEffect(() => {
    mounted.current = true;
    let active = true;
    api<{ ready: boolean }>()
      .then((data) => {
        if (active) setReady(data.ready);
      })
      .catch(() => {
        if (active) setReady(false);
      });
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE) || "null");
      if (
        saved &&
        typeof saved.ticket === "string" &&
        saved.ticket.length < 2000 &&
        typeof saved.orderId === "string" &&
        saved.orderId.length < 200 &&
        /^0x[\da-fA-F]{40}$/.test(saved.wallet) &&
        Number.isFinite(saved.deadline)
      )
        setPending(saved);
    } catch {
      /* Storage may be unavailable; trading remains possible in this session. */
    }
    const timer = window.setInterval(() => setClock(Date.now()), 1000);
    return () => {
      active = false;
      mounted.current = false;
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    const injected = walletSession.provider;
    provider.current = injected;
    invalidate();
    setAddress(walletSession.chainId === 1 ? walletSession.address : "");
    if (!injected) return;
    const changed = () => {
      invalidate();
      setAddress("");
      setNote("Wallet changed. Reconnect before starting another trade.");
    };
    injected.on?.("accountsChanged", changed);
    injected.on?.("chainChanged", changed);
    return () => {
      injected.removeListener?.("accountsChanged", changed);
      injected.removeListener?.("chainChanged", changed);
    };
  }, [walletSession.provider, walletSession.address, walletSession.chainId]);

  useEffect(() => {
    setTransactionLock("stock-trade", locked);
    return () => setTransactionLock("stock-trade", false);
  }, [locked, setTransactionLock]);

  const checkStatus = async (record: Pending) => {
    try {
      const result = await api<StockOrderStatus>({ action: "status", ticket: record.ticket });
      setOrder(result);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Order status is unavailable.");
    }
  };
  useEffect(() => {
    if (!pending || orderFinished) return;
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    let attempts = 0;
    const poll = async () => {
      try {
        const result = await api<StockOrderStatus>({ action: "status", ticket: pending.ticket });
        if (!active) return;
        setOrder(result);
        if (terminal.includes(result.status)) return;
      } catch {
        /* Keep the known pending order; never infer a fill from a timeout. */
      }
      if (active && ++attempts < 24) timer = setTimeout(poll, 5000);
    };
    void poll();
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [pending, orderFinished]);

  const run = async (label: string, action: () => Promise<void>) => {
    if (signing.current || fundingLocked || checkoutLocked) return;
    signing.current = true;
    setBusy(label);
    setError("");
    setNote("");
    try {
      await action();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Wallet request was not completed.");
    } finally {
      signing.current = false;
      setBusy("");
    }
  };
  const getWallet = () => {
    if (!provider.current)
      throw new Error("Open ARCWELL in a wallet browser or install an Ethereum wallet extension.");
    return provider.current;
  };
  const unchanged = (version: number) => {
    if (!mounted.current || generation.current !== version)
      throw new Error("Trade or wallet changed. Request a fresh quote.");
  };

  const connect = () => {
    if (!walletSession.provider) {
      walletSession.openWallet();
      return;
    }
    return run("Connecting wallet…", async () => {
      const wallet = getWallet();
      const accounts = await wallet.request({ method: "eth_requestAccounts" });
      if (!Array.isArray(accounts) || !/^0x[\da-fA-F]{40}$/.test(String(accounts[0])))
        throw new Error("No wallet account was selected.");
      const chain = await wallet.request({ method: "eth_chainId" });
      if (chain !== "0x1")
        await wallet.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0x1" }],
        });
      await verifyStockWallet(wallet, accounts[0]);
      invalidate();
      setAddress(accounts[0]);
    });
  };
  const requestQuote = () =>
    run("Checking funds and quote…", async () => {
      setQuote(null);
      setApproved(false);
      const wallet = getWallet(),
        version = generation.current;
      const pair = stockPair(intent);
      const funding = await stockFunding(wallet, intent);
      unchanged(version);
      setBalance(stockDisplay(funding.balance, pair.inputDecimals));
      if (!funding.sufficient)
        throw new Error(
          `Not enough ${inputSymbol} on Ethereum. Arc and paper balances cannot fund this trade.`,
        );
      const result = await api<StockQuote>({ action: "quote", intent });
      unchanged(version);
      await verifyStockWallet(wallet, address);
      unchanged(version);
      setQuote(result);
      setApproved(funding.approved);
      setClock(Date.now());
    });
  const approve = () =>
    run("Approve in your wallet…", async () => {
      if (!quote || expired) throw new Error("Request a fresh quote first.");
      const wallet = getWallet(),
        version = generation.current;
      await verifyStockWallet(wallet, quote.intent.wallet);
      unchanged(version);
      const hash = await wallet.request({
        method: "eth_sendTransaction",
        params: [stockApproval(quote.intent)],
      });
      if (typeof hash !== "string" || !/^0x[\da-fA-F]{64}$/.test(hash))
        throw new Error("Wallet did not return an approval transaction hash.");
      setQuote(null);
      setApprovalHash(hash);
      setNote("Token approval submitted. Check its confirmation before requesting a fresh quote.");
      // The next explicit quote request reads confirmed allowance; approval is never treated as a fill.
    });
  const checkApproval = () =>
    run("Checking approval…", async () => {
      const wallet = getWallet();
      if ((await wallet.request({ method: "eth_chainId" })) !== "0x1")
        throw new Error("Switch to Ethereum to check this approval.");
      const receipt = (await wallet.request({
        method: "eth_getTransactionReceipt",
        params: [approvalHash],
      })) as { status?: string; transactionHash?: string } | null;
      if (!receipt) {
        setNote("Approval is still pending on Ethereum.");
        return;
      }
      if (receipt.transactionHash?.toLowerCase() !== approvalHash?.toLowerCase())
        throw new Error("Approval receipt could not be verified.");
      if (receipt.status !== "0x1" && receipt.status !== "0x0")
        throw new Error("Approval status is not yet available.");
      setApprovalHash(null);
      if (receipt.status === "0x0")
        throw new Error("Approval reverted. Request a fresh quote to try again.");
      setNote("Approval confirmed. Request a fresh quote to review the current price.");
    });
  const submit = () =>
    run("Review the order in your wallet…", async () => {
      if (!quote || Date.now() >= quote.expiresAt || pending)
        throw new Error("Request a fresh quote first.");
      const current = quote,
        wallet = getWallet(),
        version = generation.current;
      const funding = await stockFunding(wallet, current.intent);
      unchanged(version);
      if (!funding.sufficient || !funding.approved)
        throw new Error("Your balance or token approval changed. Request a fresh quote.");
      await verifyStockWallet(wallet, current.intent.wallet);
      unchanged(version);
      const signature = await wallet.request({
        method: "eth_signTypedData_v4",
        params: [current.intent.wallet, JSON.stringify(current.typedData)],
      });
      unchanged(version);
      if (typeof signature !== "string") throw new Error("Wallet signature was not returned.");
      if (Date.now() >= current.expiresAt)
        throw new Error(
          "Quote expired while signing. Nothing was submitted; request a fresh quote.",
        );
      await verifyStockWallet(wallet, current.intent.wallet);
      unchanged(version);
      const record: Pending = {
        ticket: current.statusTicket,
        orderId: current.orderId,
        wallet: current.intent.wallet,
        deadline: current.deadline,
      };
      // Save BEFORE submission. An HTTP timeout is ambiguous, never permission to send a new order.
      setPending(record);
      setOrder({ orderId: record.orderId, status: "unknown" });
      try {
        localStorage.setItem(STORAGE, JSON.stringify(record));
      } catch {
        setNote("Keep this page open to track the order; browser storage is unavailable.");
      }
      setBusy("Submitting signed order…");
      try {
        const result = await api<StockOrderStatus>({
          action: "order",
          ticket: current.ticket,
          signature,
        });
        setOrder(result);
        setQuote(null);
      } catch (e) {
        if (e instanceof StockApiError && e.notSubmitted) {
          try {
            localStorage.removeItem(STORAGE);
          } catch {
            /* Best effort. */
          }
          setPending(null);
          setOrder(null);
          setQuote(null);
        }
        throw e;
      }
    });

  return (
    <section className="st-workspace" aria-labelledby="stock-title">
      <header className="st-heading">
        <div>
          <p className="q-eyebrow">EQUITIES, ONCHAIN / 01</p>
          <h2 id="stock-title">
            A new way to hold
            <br />
            <span>the names you know.</span>
          </h2>
        </div>
        <p>
          Tokenized stocks. Your wallet.
          <br />
          Ondo stocks. Pay from Arc.
        </p>
      </header>
      <div className="st-grid">
        <div className="st-market">
          <div className="st-catalog">
            <div className="st-list-heading">
              <h3>Stocks & ETFs</h3>
              <span>{STOCK_ASSETS.length} ASSETS</span>
            </div>
            <label className="st-catalog-search">
              <Search size={16} aria-hidden="true" />
              <input
                type="search"
                aria-label="Search stocks and ETFs"
                placeholder="Search company, ticker or contract"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setVisibleCount(24);
                }}
              />
            </label>
            <div className="st-catalog-summary" role="status">
              {query.trim()
                ? `${filteredAssets.length} ${filteredAssets.length === 1 ? "match" : "matches"}`
                : `${STOCK_ASSETS.length} issuer-listed assets`}
              <a
                href="https://github.com/ondoprotocol/ondo-global-markets-token-list"
                target="_blank"
                rel="noreferrer"
                title={`Issuer list published ${STOCK_CATALOG_METADATA.publishedAt}`}
              >
                Ondo catalog <ArrowUpRight size={12} />
              </a>
            </div>
            <div className="st-asset-list" role="group" aria-label="Choose a tokenized stock">
              {filteredAssets.slice(0, visibleCount).map((item, index) => (
                <button
                  key={item.symbol}
                  type="button"
                  aria-pressed={symbol === item.symbol}
                  disabled={locked}
                  onClick={() => {
                    invalidate();
                    setSymbol(item.symbol);
                    setAmount("");
                  }}
                >
                  <span className="st-row-number">{String(index + 1).padStart(2, "0")}</span>
                  <StockLogo asset={item} />
                  <span className="st-row-name">
                    <strong>{item.name}</strong>
                    <small>{item.symbol}</small>
                  </span>

                  <ArrowUpRight size={17} />
                </button>
              ))}
            </div>
            {!filteredAssets.length && (
              <p className="st-catalog-empty">No issuer-listed assets match this search.</p>
            )}
            {visibleCount < filteredAssets.length && (
              <button
                className="st-catalog-more"
                onClick={() => setVisibleCount((count) => count + 24)}
              >
                Show more · {Math.min(visibleCount, filteredAssets.length)} of{" "}
                {filteredAssets.length}
              </button>
            )}
            <p className="st-catalog-note">
              Catalog coverage is not a live quote. Available routes and minimum amounts are checked
              when you request one.
            </p>
          </div>
          <div className="st-detail">
            <div className="st-asset-feature" key={symbol}>
              <div className="st-feature-top">
                <span className="st-token-badge">ONDO STOCKS</span>
                <span>ETHEREUM ↗</span>
              </div>
              <div className="st-feature-identity">
                <StockLogo asset={asset} />
                <span>{asset.name}</span>
              </div>
              <div className="st-ticker" aria-label={asset.symbol}>
                {symbol.replace(/on$/, "")}
                <span>on</span>
              </div>
              <div className="st-feature-bottom">
                <span>Issuer-listed · Ethereum</span>
                <span>
                  {STOCK_ASSETS.findIndex((item) => item.symbol === symbol) + 1} /{" "}
                  {STOCK_ASSETS.length}
                </span>
              </div>
              <div className="st-dot-field" aria-hidden="true">
                {Array.from({ length: 96 }, (_, i) => (
                  <i key={i} style={{ opacity: 0.1 + ((i * 7) % 13) / 18 }} />
                ))}
              </div>
            </div>
            <aside className="st-context">
              <div>
                <ShieldCheck size={18} />
                <h3>Your keys. Your position.</h3>
              </div>
              <p>
                Tokenized exposure issued by Ondo. Review the quote here, then authorize with your
                wallet. Token rights differ from directly owning shares.
              </p>
              <div className="st-source-links">
                <a
                  href={`https://app.ondo.finance/assets/${symbol.toLowerCase()}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Issuer details <ArrowUpRight size={13} />
                </a>
                <a
                  href={`https://etherscan.io/token/${asset.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Token contract <ArrowUpRight size={13} />
                </a>
              </div>
            </aside>
          </div>
        </div>
        <div className="st-trade-column">
          <div className="st-ticket">
            <div className="st-ticket-head">
              <span>ORDER</span>
              <span className="st-network-dot">{arcCheckout ? "Pay with Arc" : "Ethereum"}</span>
            </div>
            <h3 className="st-ticket-title">Prepare an order</h3>
            <StockTransferRecovery
              disabled={Boolean(busy || pending || approvalHash)}
              onLockChange={setFundingLocked}
              onResolved={() => {
                invalidate();
                setAddress("");
                setNote("Existing transfer confirmed. Reconnect your wallet for the stock order.");
              }}
            />
            <p className="st-ticket-subtitle">USDC ⇄ {symbol}</p>
            <label htmlFor="stock-asset">Asset</label>
            <select
              id="stock-asset"
              value={symbol}
              disabled={locked}
              onChange={(e) => {
                invalidate();
                setSymbol(e.target.value);
                setAmount("");
              }}
            >
              {STOCK_ASSETS.map((item) => (
                <option key={item.symbol} value={item.symbol}>
                  {item.name} · {item.symbol}
                </option>
              ))}
            </select>
            <div className="st-direction">
              <button
                type="button"
                disabled={locked}
                aria-pressed={side === "buy"}
                onClick={() => {
                  invalidate();
                  setSide("buy");
                  setAmount("");
                }}
              >
                Buy
              </button>
              <ArrowDownUp size={16} />
              <button
                type="button"
                disabled={locked}
                aria-pressed={side === "sell"}
                onClick={() => {
                  invalidate();
                  setSide("sell");
                  setAmount("");
                }}
              >
                Sell
              </button>
            </div>
            {arcCheckout ? (
              fundingLocked ? (
                <p className="st-caption">Resolve the existing transfer above to continue.</p>
              ) : (
                <StockCheckoutLoader asset={asset} onLockChange={setCheckoutLocked} />
              )
            ) : (
              <div className="st-legacy-order">
                <div className="st-amount-box">
                  <label htmlFor="stock-amount">You pay ({inputSymbol})</label>
                  <input
                    id="stock-amount"
                    value={amount}
                    disabled={locked}
                    inputMode="decimal"
                    placeholder="0.00"
                    autoComplete="off"
                    onChange={(e) => {
                      invalidate();
                      setAmount(e.target.value);
                    }}
                  />
                </div>
                <p className="st-caption">
                  {balance !== null
                    ? `${balance} ${inputSymbol} available for Ethereum settlement`
                    : "Stock orders currently use USDC on Ethereum."}
                </p>
                <div className="st-receive">
                  <span>You receive</span>
                  <strong>
                    {quote
                      ? `${quote.minimum} ${quote.outputSymbol} minimum`
                      : side === "buy"
                        ? symbol
                        : "USDC"}
                  </strong>
                  <span>{quote ? "From your current quote" : "Amount shown after live quote"}</span>
                </div>
                <button type="button" className="st-wallet" disabled={locked} onClick={connect}>
                  <Wallet size={16} />
                  {address
                    ? `${address.slice(0, 6)}…${address.slice(-4)} · Ethereum`
                    : walletSession.address
                      ? "Switch wallet to Ethereum"
                      : "Connect wallet"}
                </button>
                <button
                  type="button"
                  className="st-primary"
                  disabled={!ready || !address || !amount || locked}
                  onClick={requestQuote}
                >
                  {busy || "Review quote"} <ArrowRight size={16} />
                </button>
                <div className="st-route">
                  <span>Your wallet</span>
                  <ArrowRight size={12} />
                  <span>UniswapX</span>
                  <ArrowRight size={12} />
                  <span>{side === "buy" ? symbol : "USDC"}</span>
                </div>
                {ready === false && (
                  <div className="st-notice" role="status">
                    <strong>Trading connection pending</strong>
                    <p>Browse assets now. Quotes open when the connection is activated.</p>
                  </div>
                )}
                {approvalHash && (
                  <div className="st-review">
                    <a
                      href={`https://etherscan.io/tx/${approvalHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View token approval ↗
                    </a>
                    <button
                      type="button"
                      className="st-wallet"
                      disabled={Boolean(busy)}
                      onClick={checkApproval}
                    >
                      Check approval confirmation
                    </button>
                  </div>
                )}
                {quote && !pending && (
                  <div className="st-review" aria-label="Review tokenized stock order">
                    <p className="q-eyebrow">REVIEW YOUR ORDER</p>
                    <dl>
                      <dt>You pay</dt>
                      <dd>
                        {quote.intent.amount} {inputSymbol}
                      </dd>
                      <dt>Minimum received</dt>
                      <dd>
                        {quote.minimum} {quote.outputSymbol}
                      </dd>
                      <dt>Network</dt>
                      <dd>Ethereum Mainnet</dd>
                      <dt>Price protection</dt>
                      <dd>0.5% slippage tolerance</dd>
                      <dt>Execution costs</dt>
                      <dd>Included in the UniswapX quote</dd>
                      <dt>Token approval</dt>
                      <dd>{approved ? "Already approved" : "Wallet network fee applies"}</dd>
                      <dt>Quote valid for</dt>
                      <dd>
                        {expired
                          ? "Expired — refresh quote"
                          : `${Math.max(0, Math.ceil((quote.expiresAt - clock) / 1000))}s`}
                      </dd>
                    </dl>
                    <button
                      type="button"
                      className="st-primary"
                      disabled={Boolean(busy || expired)}
                      onClick={approved ? submit : approve}
                    >
                      {busy ||
                        (approved
                          ? "Sign and submit order"
                          : `Approve ${quote.intent.amount} ${inputSymbol}`)}
                    </button>
                    <p className="st-caption">
                      {approved
                        ? "Your wallet signature authorizes this exact order. A submitted order still needs to fill."
                        : "Approves only this input amount to Uniswap Permit2. Request a fresh quote after the approval confirms."}
                    </p>
                  </div>
                )}
                {error && (
                  <p className="st-error" role="alert">
                    {error}
                  </p>
                )}
                {note && (
                  <p className="st-caption" role="status">
                    {note}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      {pending && (
        <section className="st-order" aria-live="polite">
          <p className="q-eyebrow">UNISWAPX ORDER</p>
          <h3>
            {order?.status === "filled"
              ? "Filled"
              : order?.status === "unknown"
                ? "Awaiting provider confirmation"
                : order?.status || "Checking status"}
          </h3>
          <p className="st-caption">{pending.orderId}</p>
          <p>
            {order?.status === "filled"
              ? "Uniswap reports that the order filled. Inspect the transaction for settlement details."
              : "Do not submit another order while this one is unresolved. A signature or submission alone does not confirm a fill."}
          </p>
          {order?.txHash && (
            <a
              href={`https://etherscan.io/tx/${order.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              View transaction <ArrowUpRight size={14} />
            </a>
          )}
          <button type="button" disabled={Boolean(busy)} onClick={() => void checkStatus(pending)}>
            Refresh order status
          </button>
          {order && terminal.includes(order.status) && (
            <button
              type="button"
              onClick={() => {
                try {
                  localStorage.removeItem(STORAGE);
                } catch {
                  /* Best effort. */
                }
                setPending(null);
                setOrder(null);
                invalidate();
              }}
            >
              Start another trade
            </button>
          )}
        </section>
      )}
    </section>
  );
}
