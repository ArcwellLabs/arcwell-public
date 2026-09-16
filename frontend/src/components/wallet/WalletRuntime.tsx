import { useCallback, useEffect, useMemo, useRef, useState, type PropsWithChildren } from "react";
import {
  WagmiProvider,
  useConnection,
  useConnect,
  useConnectors,
  useDisconnect,
  type Connector,
} from "wagmi";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowUpRight, Check, Copy, LogOut, Wallet, X } from "lucide-react";
import { createWalletConfig } from "@/lib/wallet-config";
import { WalletSessionContext } from "@/lib/wallet-session";
import { switchArcNetwork, type WalletProvider } from "@/lib/arc-wallet";
import { ARC_MAINNET } from "@/lib/arc";
import { resolveSelectedWallet } from "../../../../src/wallet-session";
import "./wallet.css";

const popular = [
  { name: "Rabby", id: "rabby", url: "https://rabby.io" },
  { name: "Phantom", id: "phantom", url: "https://phantom.com/download" },
  { name: "Trust Wallet", id: "trust", url: "https://trustwallet.com/download" },
];
function WalletSession({ children }: PropsWithChildren) {
  const connection = useConnection();
  const connectors = useConnectors();
  const connect = useConnect();
  const { mutateAsync: disconnectAsync } = useDisconnect();
  const [provider, setProvider] = useState<WalletProvider | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [locks, setLocks] = useState<string[]>([]);
  const lockedRef = useRef(false);
  const busyRef = useRef(false);
  const address = connection.address || "";
  const connector = connection.connector;
  const locked = locks.length > 0;
  const setTransactionLock = useCallback((key: string, value: boolean) => {
    setLocks((current) => {
      const next = value ? [...new Set([...current, key])] : current.filter((item) => item !== key);
      lockedRef.current = next.length > 0;
      return next;
    });
  }, []);
  useEffect(() => {
    let active = true;
    setProvider(null);
    if (connector && address && connection.chainId)
      void resolveSelectedWallet(connector, address, connection.chainId)
        .then((value) => {
          if (active) setProvider(value);
        })
        .catch(() => {
          if (active) setError("The selected wallet is unavailable. Reconnect to continue.");
        });
    return () => {
      active = false;
    };
  }, [connector, address, connection.chainId]);

  const openWallet = useCallback(() => {
    setError("");
    setCopied(false);
    setOpen(true);
  }, []);
  const disconnect = useCallback(async () => {
    if (lockedRef.current || busyRef.current) return;
    await disconnectAsync();
    setProvider(null);
    setError("");
    setOpen(false);
  }, [disconnectAsync]);
  const run = async (work: () => Promise<void>) => {
    if (lockedRef.current || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError("");
    try {
      await work();
    } catch (e) {
      const code = e && typeof e === "object" && "code" in e ? e.code : undefined;
      setError(
        code === 4001 || (e instanceof Error && /reject|denied/i.test(e.message))
          ? "Connection was declined. Choose a wallet to try again."
          : "Could not connect. Unlock your wallet and approve the connection request, then try again.",
      );
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };
  const choose = (selected: Connector) =>
    run(async () => {
      await connect.mutateAsync({ connector: selected });
      // Network switching is a separate explicit action; connection never signs a transaction.
    });
  const listed = connectors.filter((item) => {
    if (item.id === "injected")
      return (
        Boolean((window as Window & { ethereum?: unknown }).ethereum) &&
        !connectors.some((other) => other.type === "injected" && other.id !== "injected")
      );
    if (item.type === "metaMask")
      return !connectors.some((other) => other.type === "injected" && /metamask/i.test(other.name));
    if (item.type === "coinbaseWallet")
      return !connectors.some((other) => other.type === "injected" && /coinbase/i.test(other.name));
    return true;
  });
  const value = useMemo(
    () => ({
      ready: true,
      address,
      chainId: connection.chainId,
      walletName: connector?.name || "",
      provider,
      busy,
      locked,
      openWallet,
      disconnect,
      setTransactionLock,
    }),
    [
      address,
      connection.chainId,
      connector?.name,
      provider,
      busy,
      locked,
      openWallet,
      disconnect,
      setTransactionLock,
    ],
  );
  return (
    <WalletSessionContext value={value}>
      {children}
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="aw-wallet-overlay" />
          <Dialog.Content
            data-lenis-prevent
            className="aw-wallet-dialog"
            onOpenAutoFocus={() => setError("")}
          >
            <div className="aw-wallet-kicker">
              <Wallet size={16} /> ARCWELL / WALLET
            </div>
            <Dialog.Title>{address ? "Your wallet." : "Connect your wallet."}</Dialog.Title>
            <Dialog.Description>
              {address
                ? `${connector?.name} · ${connection.chainId === 5042 ? "Arc Mainnet" : connection.chainId === 1 ? "Ethereum" : `Chain ${connection.chainId}`}`
                : "Choose a wallet to use your funds on Arc."}
            </Dialog.Description>
            <Dialog.Close className="aw-wallet-close" aria-label="Close wallet dialog">
              <X size={19} />
            </Dialog.Close>
            {address ? (
              <div className="aw-wallet-connected">
                <p className="aw-wallet-address">{address}</p>
                <button
                  className="aw-wallet-row"
                  onClick={() => {
                    void navigator.clipboard
                      .writeText(address)
                      .then(() => setCopied(true))
                      .catch(() =>
                        setError("Could not copy. Select the address above to copy it."),
                      );
                  }}
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}{" "}
                  {copied ? "Address copied" : "Copy address"}
                </button>
                {connection.chainId !== ARC_MAINNET.chainId && (
                  <button
                    className="aw-wallet-primary"
                    disabled={busy || locked || !provider}
                    onClick={() =>
                      void run(async () => {
                        await switchArcNetwork(provider!, ARC_MAINNET);
                      })
                    }
                  >
                    Switch to Arc Mainnet
                  </button>
                )}
                <button
                  className="aw-wallet-row"
                  disabled={busy || locked}
                  onClick={() =>
                    void disconnect().catch(() => setError("Could not disconnect. Try again."))
                  }
                >
                  <LogOut size={16} /> Disconnect
                </button>
              </div>
            ) : (
              <div className="aw-wallet-options">
                {listed.map((item) => (
                  <button
                    className="aw-wallet-row"
                    key={item.uid}
                    disabled={busy || locked}
                    onClick={() => void choose(item)}
                  >
                    <span className="aw-wallet-avatar" aria-hidden="true">
                      {item.name.slice(0, 1)}
                    </span>
                    <span>
                      {item.name === "Injected" ? "Browser wallet" : item.name}
                      <small>
                        {item.type === "injected" ? "Browser extension" : "Extension or mobile"}
                      </small>
                    </span>
                    <ArrowUpRight size={16} />
                  </button>
                ))}
                <div className="aw-wallet-downloads">
                  <p>More wallets</p>
                  {popular
                    .filter(
                      (item) =>
                        !connectors.some((c) =>
                          `${c.id} ${c.name}`.toLowerCase().includes(item.id),
                        ),
                    )
                    .map((item) => (
                      <a key={item.id} href={item.url} target="_blank" rel="noreferrer">
                        Get {item.name}
                        <ArrowUpRight size={12} />
                      </a>
                    ))}
                </div>
              </div>
            )}
            {busy && (
              <p className="aw-wallet-notice" role="status">
                Check your wallet to continue…
              </p>
            )}
            {locked && (
              <p className="aw-wallet-notice" role="status">
                A transaction is in progress. Finish it before changing wallets.
              </p>
            )}
            {error && (
              <p className="aw-wallet-error" role="alert">
                {error}
              </p>
            )}
            <p className="aw-wallet-footnote">
              Connecting shares your public address. Every transaction needs your approval.
            </p>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </WalletSessionContext>
  );
}
export default function WalletRuntime({ children }: PropsWithChildren) {
  const [config] = useState(createWalletConfig);
  return (
    <WagmiProvider config={config} reconnectOnMount>
      <WalletSession>{children}</WalletSession>
    </WagmiProvider>
  );
}
