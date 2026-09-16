import { useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { Download, RotateCcw } from "lucide-react";
import type { PaperBook } from "@/lib/quant";
import { initialBook } from "@/lib/quant";
import { dashboardViewNumber } from "@/lib/dashboard-release";
import { ChartPanel } from "./QuantCharts";
import "./investing.css";

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
  const [confirmReset, setConfirmReset] = useState(false);
  const [message, setMessage] = useState("");
  const exportAccount = () => {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(book, null, 2)], { type: "application/json" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "arcwell-paper-account.json";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return (
    <div className="quant-workspace">
      <header className="q-view-header">
        <div>
          <p className="q-eyebrow">[{dashboardViewNumber("settings")}] ARCWELL / PAPER BETA</p>
          <h1>Settings</h1>
          <p className="q-description">Your paper account, saved data and product limits.</p>
        </div>
        <span className="q-badge">Paper account</span>
      </header>
      <ChartPanel title="Your paper account" meta="Saved in this browser">
        <div className="q-body space-y-5">
          <p className="q-description">
            Holdings, cash and paper fills are stored on this device. They are not synced to an
            online account. Clearing browser data removes them.
          </p>
          <p className="q-notice" role="status">
            {storageNote ||
              (ready
                ? "Browser storage loaded. Export your account before resetting or clearing browser data."
                : "Loading your paper account…")}
          </p>
          <div className="q-toolbar">
            <button className="q-button" disabled={!ready} onClick={exportAccount}>
              <Download size={13} /> Export paper account
            </button>
            <button
              className="q-button"
              disabled={!ready}
              onClick={() => {
                setConfirmReset(true);
                setMessage("");
              }}
            >
              <RotateCcw size={13} /> Reset paper account
            </button>
          </div>
          {confirmReset ? (
            <div className="q-notice space-y-3">
              <p>
                Reset holdings and cash to the sample starting account and clear your paper fills?
                Export first if you want to keep a copy.
              </p>
              <div className="q-toolbar">
                <button
                  className="q-button"
                  onClick={() => {
                    setBook(initialBook());
                    setConfirmReset(false);
                    setMessage("Paper account reset to the sample starting balances.");
                  }}
                >
                  Confirm reset
                </button>
                <button className="q-button" onClick={() => setConfirmReset(false)}>
                  Cancel
                </button>
              </div>
            </div>
          ) : null}
          {message ? (
            <p role="status" className="q-notice">
              {message}
            </p>
          ) : null}
        </div>
      </ChartPanel>
      <div className="q-section-gap">
        <ChartPanel title="What this beta does" meta="Research and practice">
          <div className="q-body space-y-4">
            <p className="q-description">
              Explore illustrative assets, compare synthetic price histories and practice buying and
              selling. Paper fills update your local holdings, cash and activity.
            </p>
            <p className="q-description">
              The Arc tab connects a browser wallet and reads balances and receipts. No brokerage,
              wallet signing, deposits, withdrawals or real stock execution is connected. Familiar
              asset symbols are examples, not supported token listings. Issuer backing, eligibility
              and live prices still require verified providers.
            </p>
            <p className="q-description">
              Charts reconstruct today’s holdings across sample historical prices. They do not
              represent your actual investment performance and exclude fees, cash flows and
              corporate actions.
            </p>
          </div>
        </ChartPanel>
      </div>
    </div>
  );
}
