import { useEffect, useMemo } from "react";
import { LiFiWidget, useWidgetEvents, WidgetEvent, type WidgetConfig } from "@lifi/widget";
import { EthereumProvider } from "@lifi/widget-provider-ethereum";
import type { StockAsset } from "../../../../src/stock-catalog-source";

const ARC_USDC = "0x3600000000000000000000000000000000000000";
const providers = [EthereumProvider({ walletConnect: false, coinbase: false, baseAccount: false })];

function ExecutionEvents({ onLockChange }: { onLockChange: (locked: boolean) => void }) {
  const events = useWidgetEvents();
  useEffect(() => {
    const lock = () => onLockChange(true);
    const release = () => onLockChange(false);
    events.on(WidgetEvent.RouteExecutionStarted, lock);
    events.on(WidgetEvent.RouteExecutionCompleted, release);
    events.on(WidgetEvent.RouteExecutionFailed, release);
    return () => {
      events.off(WidgetEvent.RouteExecutionStarted, lock);
      events.off(WidgetEvent.RouteExecutionCompleted, release);
      events.off(WidgetEvent.RouteExecutionFailed, release);
    };
  }, [events, onLockChange]);
  return null;
}

export default function ArcStockCheckout({
  asset,
  onLockChange,
}: {
  asset: StockAsset;
  onLockChange: (locked: boolean) => void;
}) {
  const config = useMemo<WidgetConfig>(
    () => ({
      integrator: "arcwell",
      providers,
      variant: "compact",
      appearance: "light",
      fromChain: 5042,
      fromToken: ARC_USDC,
      toChain: 1,
      toToken: asset.address,
      formUpdateKey: asset.address,
      buildUrl: false,
      keyPrefix: "arcwell-stock-purchase",
      chains: { allow: [5042, 1], from: { allow: [5042] }, to: { allow: [1] } },
      tokens: {
        from: { allow: [{ chainId: 5042, address: ARC_USDC }] },
        to: { allow: [{ chainId: 1, address: asset.address }] },
        include: [
          {
            chainId: 5042,
            address: ARC_USDC,
            symbol: "USDC",
            name: "USDC",
            decimals: 6,
            priceUSD: "1",
          },
          { ...asset, chainId: 1, priceUSD: "0" },
        ],
      },
      // Only request routes that do not ask the buyer to transact on Ethereum.
      sdkConfig: {
        routeOptions: { allowSwitchChain: false },
        rpcUrls: { 5042: ["https://rpc.mainnet.arc.io"] },
      },
      disabledUI: { fromToken: true, toToken: true, toAddress: true },
      hiddenUI: {
        reverseTokensButton: true,
        toAddress: true,
        appearance: true,
        language: true,
        chainSelect: true,
      },
      theme: {
        container: {
          width: "100%",
          maxWidth: "100%",
          border: "none",
          borderRadius: 0,
          boxShadow: "none",
        },
        shape: { borderRadius: 10 },
        typography: { fontFamily: "inherit" },
        colorSchemes: {
          light: {
            palette: {
              primary: { main: "#293c2b" },
              secondary: { main: "#566447" },
              background: { default: "#eeede8", paper: "#f7f7f2" },
              text: { primary: "#191a18", secondary: "#676960" },
            },
          },
        },
      },
    }),
    [asset],
  );
  return (
    <div className="st-arc-checkout" aria-label="Buy stock with Arc USDC">
      <ExecutionEvents onLockChange={onLockChange} />
      <LiFiWidget integrator="arcwell" config={config} />
      <p className="st-caption">
        Pay USDC on Arc. Receive {asset.symbol} in the same wallet on Ethereum. Route fees and
        minimum received are shown before you confirm.
      </p>
    </div>
  );
}
