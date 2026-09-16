import { Wallet } from "lucide-react";
import { useWalletSession } from "@/lib/wallet-session";
import "./wallet.css";
export default function WalletButton({ className = "" }: { className?: string }) {
  const wallet = useWalletSession();
  return (
    <button
      type="button"
      className={`aw-wallet-button ${className}`}
      disabled={!wallet.ready || wallet.busy || wallet.locked}
      onClick={wallet.openWallet}
      aria-label={
        wallet.address ? `Manage ${wallet.walletName} wallet ${wallet.address}` : "Connect wallet"
      }
      title={wallet.locked ? "A wallet operation is in progress" : undefined}
    >
      <Wallet size={15} aria-hidden="true" />
      <span>
        {wallet.busy
          ? "Connecting…"
          : wallet.address
            ? `${wallet.address.slice(0, 6)}…${wallet.address.slice(-4)}`
            : "Connect wallet"}
      </span>
    </button>
  );
}
