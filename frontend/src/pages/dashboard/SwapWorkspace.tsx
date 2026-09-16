import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight, ArrowDownUp, CheckCircle2 } from "lucide-react";
import AssetLogo from "@/components/AssetLogo";
import { ARC_EURC, createSwapHandoff, type SwapDirection } from "../../../../src/arc-swap";
import { isAssetAddress, NATIVE_USDC, type AssetDetail } from "../../../../src/asset-data";
import "./swap-workspace.css";

export default function SwapWorkspace({ initialAddress }: { initialAddress?: string }) {
  const [address, setAddress] = useState(initialAddress || ARC_EURC);
  const [selected, setSelected] = useState(initialAddress || ARC_EURC);
  const [refresh, setRefresh] = useState(0);
  const [detail, setDetail] = useState<AssetDetail | null>(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [direction, setDirection] = useState<SwapDirection>("buy");
  const [amount, setAmount] = useState("");
  const [review, setReview] = useState<ReturnType<typeof createSwapHandoff> | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setBusy(true);
    setDetail(null);
    setReview(null);
    setError("");
    fetch("/api/assets?" + new URLSearchParams({ network: "mainnet", address: selected }), {
      signal: controller.signal,
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Asset inspection is unavailable.");
        return data as AssetDetail;
      })
      .then((data) => {
        if (!controller.signal.aborted) setDetail(data);
      })
      .catch((e: unknown) => {
        if (!controller.signal.aborted)
          setError(e instanceof Error ? e.message : "Asset inspection failed.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setBusy(false);
      });
    return () => controller.abort();
  }, [selected, refresh]);

  const symbol = detail?.asset.symbol || "token";
  const isCurrent = !!detail && address.trim().toLowerCase() === detail.asset.address.toLowerCase();
  return (
    <section className="sw-workspace" aria-labelledby="swap-title">
      <header className="sw-heading">
        <p className="q-eyebrow">ARC MAINNET · 5042 · EXTERNAL EXECUTION</p>
        <h1 id="swap-title">From research to a swap.</h1>
        <p>
          Choose your pair here. Get the current quote and authorize with your wallet on Uniswap.
        </p>
      </header>
      <ol className="sw-steps" aria-label="Swap steps">
        <li>
          <span>01</span> Choose an asset
        </li>
        <li>
          <span>02</span> Review the pair
        </li>
        <li>
          <span>03</span> Continue on Uniswap
        </li>
      </ol>
      <div className="sw-grid">
        <div className="sw-card">
          <div className="sw-card-title">
            <h2>Prepare your swap</h2>
            <span>ARC MAINNET</span>
          </div>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              setReview(null);
              setError("");
              if (!isAssetAddress(address.trim())) {
                setError("Enter a valid Arc Mainnet token contract.");
                return;
              }
              setSelected(address.trim().toLowerCase());
              setRefresh((v) => v + 1);
            }}
          >
            <label htmlFor="swap-contract">Token contract</label>
            <div className="sw-input-row">
              <input
                id="swap-contract"
                value={address}
                autoComplete="off"
                spellCheck={false}
                onChange={(e) => {
                  setAddress(e.target.value);
                  setReview(null);
                }}
              />
              <button className="q-button" disabled={busy} type="submit">
                {busy ? "Inspecting…" : "Inspect"}
              </button>
            </div>
            <div className="sw-shortcuts">
              <button
                type="button"
                onClick={() => {
                  setAddress(ARC_EURC);
                  setSelected(ARC_EURC);
                  setRefresh((v) => v + 1);
                  setReview(null);
                }}
              >
                Use EURC
              </button>
              <Link to="/dashboard" search={{ view: "markets" }}>
                Find another asset <ArrowUpRight size={12} />
              </Link>
            </div>
          </form>
          {busy && (
            <p role="status" className="sw-note">
              Checking the selected contract on Arc Mainnet…
            </p>
          )}
          {isCurrent && detail && (
            <div className="sw-token">
              <AssetLogo network="mainnet" address={detail.asset.address} />
              <div>
                <strong>
                  {detail.asset.name} <span>{symbol}</span>
                </strong>
                <p>
                  {detail.contractRead
                    ? `Contract read · ${detail.decimals ?? "unknown"} decimals`
                    : "Contract not verified"}
                </p>
              </div>
              {detail.contractRead && (
                <CheckCircle2 size={17} aria-label="Contract read confirmed" />
              )}
            </div>
          )}
          <form
            onSubmit={(event) => {
              event.preventDefault();
              setReview(null);
              setError("");
              if (!detail || !isCurrent) {
                setError("Inspect the selected token first.");
                return;
              }
              try {
                setReview(createSwapHandoff(detail, direction, amount));
              } catch (e) {
                setError(e instanceof Error ? e.message : "Review could not be prepared.");
              }
            }}
          >
            <label htmlFor="swap-direction">Direction</label>
            <select
              id="swap-direction"
              value={direction}
              onChange={(e) => {
                setDirection(e.target.value as SwapDirection);
                setAmount("");
                setReview(null);
                setError("");
              }}
            >
              <option value="buy">USDC → {symbol}</option>
              <option value="sell">{symbol} → USDC</option>
            </select>
            <label htmlFor="swap-amount">You pay ({direction === "buy" ? "USDC" : symbol})</label>
            <div className="sw-amount">
              <input
                id="swap-amount"
                inputMode="decimal"
                placeholder="0.00"
                autoComplete="off"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setReview(null);
                  setError("");
                }}
              />
              <AssetLogo
                network="mainnet"
                address={direction === "buy" ? NATIVE_USDC : detail?.asset.address || selected}
              />
            </div>
            <p className="sw-note">
              The amount is an input for Uniswap, not a reserved quote. You will review output,
              slippage, fees and approvals there.
            </p>
            <button className="sw-primary" type="submit" disabled={busy || !isCurrent || !amount}>
              Review pair <ArrowRight size={16} />
            </button>
          </form>
          {error && (
            <p className="sw-error" role="alert">
              {error}
            </p>
          )}
          {review && detail && (
            <section className="sw-review" aria-label="Swap handoff review">
              <p className="q-eyebrow">REVIEW · ARC MAINNET</p>
              <h3>
                {review.amount} {direction === "buy" ? "USDC" : symbol} <ArrowRight size={18} />{" "}
                {direction === "buy" ? symbol : "USDC"}
              </h3>
              <dl>
                <dt>Input contract</dt>
                <dd>{review.input}</dd>
                <dt>Output contract</dt>
                <dd>{review.output}</dd>
                <dt>Execution provider</dt>
                <dd>app.uniswap.org</dd>
                <dt>Output amount & network fee</dt>
                <dd>Quoted on Uniswap</dd>
              </dl>
              <a className="sw-primary" href={review.url} target="_blank" rel="noopener noreferrer">
                Continue to Uniswap <ArrowUpRight size={16} />
              </a>
              <p className="sw-note">
                Opens the official Uniswap app in a new tab. Review the network and both contracts
                again before authorizing. No transaction has been submitted by ARCWELL.
              </p>
            </section>
          )}
        </div>
        <aside className="sw-context">
          <div className="sw-card">
            <ArrowDownUp size={24} />
            <h2>Your wallet stays in control.</h2>
            <p>
              Uniswap checks route availability and presents the executable quote. You connect and
              authorize in its interface. ARCWELL does not hold your funds or request token
              approvals.
            </p>
            <p>
              A token may have no route or require issuer permission. An onchain symbol does not
              prove stock backing or eligibility.
            </p>
          </div>
          <div className="sw-card">
            <p className="q-eyebrow">AFTER YOUR TRANSACTION</p>
            <h2>Follow its receipt.</h2>
            <p>
              Copy the transaction hash from Uniswap and inspect inclusion, finality and gas in the
              Arc workspace. External swaps are separate from your paper account.
            </p>
            <Link className="sw-text-link" to="/dashboard" search={{ view: "arc" }}>
              Open receipt verification <ArrowUpRight size={14} />
            </Link>
          </div>
          <p className="sw-note">
            Stock orders in Trade remain simulations. This integration opens token swaps on Arc
            Mainnet; it does not connect a stock issuer or brokerage.
          </p>
        </aside>
      </div>
    </section>
  );
}
