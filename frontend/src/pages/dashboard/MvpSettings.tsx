import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Download, Wallet } from "lucide-react";
import { initialBook, type PaperBook } from "@/lib/quant";
import { useWalletSession } from "@/lib/wallet-session";
import { useWorkspacePreferences } from "./WorkspacePreferences";
import { Segments } from "./QuantCharts";
import { exportPositions } from "./PrecisionInvesting";

export default function MvpSettings({
  book,
  setBook,
  ready,
  storageNote,
}: {
  book: PaperBook;
  setBook: Dispatch<SetStateAction<PaperBook>>;
  ready: boolean;
  storageNote: string;
}) {
  const { preferences, save } = useWorkspacePreferences();
  const wallet = useWalletSession();
  const [draft, setDraft] = useState(preferences);
  const [tab, setTab] = useState("General");
  const [format, setFormat] = useState("CSV");
  const [message, setMessage] = useState("");
  const [confirmReset, setConfirmReset] = useState(false);
  useEffect(() => setDraft(preferences), [preferences]);
  const exportAccount = () => {
    if (format === "CSV") {
      exportPositions(book);
      return;
    }
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(book, null, 2)], { type: "application/json" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "arcwell-account.json";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return (
    <div>
      <header className="aw-page-heading">
        <div>
          <h1>Settings</h1>
          <p>Make ARCWELL yours.</p>
        </div>
      </header>
      <div className="aw-settings-tabs" role="group" aria-label="Settings section">
        {["General", "Wallet", "Data"].map((item) => (
          <button
            key={item}
            aria-pressed={item === tab}
            onClick={() => {
              setTab(item);
              setMessage("");
            }}
          >
            {item}
          </button>
        ))}
      </div>
      <div className="aw-settings-grid">
        <div className="aw-settings-main">
          {tab === "General" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const persisted = save({ ...draft, name: draft.name.trim() || "My workspace" });
                setMessage(
                  persisted
                    ? "Preferences saved."
                    : "Preferences applied for this session. Browser storage is unavailable.",
                );
              }}
            >
              <section className="aw-settings-group">
                <h2>Workspace</h2>
                <label className="aw-settings-row">
                  <span>Workspace name</span>
                  <input
                    value={draft.name}
                    maxLength={60}
                    required
                    onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  />
                </label>
                <div className="aw-settings-row">
                  <span>Default currency</span>
                  <strong>USD</strong>
                </div>
                <label className="aw-settings-row">
                  <span>Time zone</span>
                  <select
                    value={draft.timezone}
                    onChange={(e) => setDraft({ ...draft, timezone: e.target.value })}
                  >
                    {[
                      "America/New_York",
                      "America/Los_Angeles",
                      "Europe/London",
                      "Europe/Paris",
                      "Asia/Tokyo",
                      "Asia/Singapore",
                      "UTC",
                    ].map((zone) => (
                      <option key={zone}>{zone}</option>
                    ))}
                  </select>
                </label>
                <div className="aw-settings-row">
                  <span>Number format</span>
                  <strong>1,234.56</strong>
                </div>
              </section>
              <section className="aw-settings-group">
                <h2>Display</h2>
                <div className="aw-settings-row">
                  <span>Density</span>
                  <Segments
                    value={draft.density === "comfortable" ? "Comfortable" : "Compact"}
                    values={["Comfortable", "Compact"]}
                    onChange={(value) =>
                      setDraft({
                        ...draft,
                        density: value === "Compact" ? "compact" : "comfortable",
                      })
                    }
                    label="Display density"
                  />
                </div>
                <div className="aw-settings-row">
                  <span>Chart style</span>
                  <Segments
                    value={draft.chart}
                    values={["Line", "Candles"]}
                    onChange={(value) => setDraft({ ...draft, chart: value as "Line" | "Candles" })}
                    label="Default portfolio chart"
                  />
                </div>
                <div className="aw-settings-row">
                  <span>
                    Reduce motion<small>Minimize animations across the workspace.</small>
                  </span>
                  <button
                    type="button"
                    className="aw-switch"
                    role="switch"
                    aria-label="Reduce motion"
                    aria-checked={draft.reduceMotion}
                    onClick={() => setDraft({ ...draft, reduceMotion: !draft.reduceMotion })}
                  >
                    <span />
                  </button>
                </div>
              </section>
              <div className="aw-actions">
                <button className="aw-button aw-primary" type="submit">
                  Save preferences
                </button>
                <button
                  className="aw-button"
                  type="button"
                  onClick={() => {
                    setDraft(preferences);
                    setMessage("Changes discarded.");
                  }}
                >
                  Discard changes
                </button>
              </div>
            </form>
          )}
          {tab === "Wallet" && (
            <section className="aw-settings-group">
              <h2>Wallet connection</h2>
              <div className="aw-data-note">
                <p>
                  Choose your wallet and manage its connection to ARCWELL. Your wallet authorizes
                  each transaction.
                </p>
                <p>{wallet.address || "No wallet connected."}</p>
              </div>
              <button
                className="aw-button aw-primary"
                disabled={!wallet.ready || wallet.busy || wallet.locked}
                onClick={wallet.openWallet}
              >
                {wallet.address ? "Manage connection" : "Connect wallet"}
                <ArrowUpRight size={14} />
              </button>
              {wallet.address && (
                <button
                  className="aw-text-button"
                  disabled={wallet.busy || wallet.locked}
                  onClick={() => void wallet.disconnect()}
                >
                  Disconnect wallet
                </button>
              )}
            </section>
          )}
          {tab === "Data" && (
            <section className="aw-settings-group">
              <h2>Your data</h2>
              <div className="aw-data-note">
                <h3>Portfolio & trading workspace</h3>
                <p>
                  The saved Portfolio account uses the built-in reference-price dataset. Its
                  holdings, cash, and earlier recorded orders are stored in this browser. These
                  records are independent of your wallet assets and wallet trading.
                </p>
                <p>
                  The holdings chart reconstructs current positions over historical reference
                  prices. It does not include cash flows, fees, or corporate actions.
                </p>
                <h3>Connected markets & wallet trading</h3>
                <p>
                  Arc research reads provider observations and shows their source and retrieval
                  time. Tokenized stocks request routes and quotes through the connected providers.
                  Swap opens Uniswap for quotes and authorization. Arc reads balances and receipts
                  from the selected network.
                </p>
                <h3>Local storage</h3>
                <p>
                  Clearing browser data removes the local account. Export a copy before clearing or
                  resetting it. Wallet assets are independent of this local ledger.
                </p>
              </div>
              <button className="aw-button" disabled={!ready} onClick={() => setConfirmReset(true)}>
                Reset local account
              </button>
              {confirmReset && (
                <div className="aw-feedback">
                  <p>
                    Reset local positions and cash to the starting balances and clear recorded
                    activity? Export first to keep a copy.
                  </p>
                  <div className="aw-actions">
                    <button
                      className="aw-button"
                      onClick={() => {
                        setBook(initialBook());
                        setConfirmReset(false);
                        setMessage("Local account reset.");
                      }}
                    >
                      Confirm reset
                    </button>
                    <button className="aw-button" onClick={() => setConfirmReset(false)}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}
          {(message || storageNote) && (
            <p className="aw-feedback" role="status">
              {message || storageNote}
            </p>
          )}
        </div>
        <aside className="aw-settings-aside">
          <section>
            <h2>Connected wallet</h2>
            <div className="aw-wallet-identity">
              <Wallet size={29} strokeWidth={1.2} />
              <div>
                <strong>
                  {wallet.address
                    ? `${wallet.address.slice(0, 6)}…${wallet.address.slice(-4)}`
                    : "Your wallet"}
                </strong>
                <small>{wallet.address ? wallet.walletName : "Connect when you’re ready"}</small>
              </div>
            </div>
            <p>One connection. Your assets, in your control.</p>
            <button
              className="aw-button"
              onClick={wallet.openWallet}
              disabled={!wallet.ready || wallet.busy || wallet.locked}
            >
              {wallet.address ? "Manage connection" : "Connect wallet"}
            </button>
          </section>
          <section>
            <h2>Your data</h2>
            <p>Download your positions or a complete copy of your local account.</p>
            <label className="aw-settings-row">
              <span>Export format</span>
              <select value={format} onChange={(e) => setFormat(e.target.value)}>
                <option>CSV</option>
                <option>JSON</option>
              </select>
            </label>
            <button className="aw-button" disabled={!ready} onClick={exportAccount}>
              <Download size={14} />
              Export account
            </button>
          </section>
          <section>
            <h2>About ARCWELL</h2>
            <p>Learn about our mission, architecture, and resources.</p>
            <Link to="/whitepaper">
              View documentation <ArrowUpRight size={13} />
            </Link>
            <button className="aw-text-button" onClick={() => setTab("Data")}>
              Data & execution details
            </button>
          </section>
        </aside>
      </div>
    </div>
  );
}
