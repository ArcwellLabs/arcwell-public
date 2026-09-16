import { createConfig, http } from "wagmi";
import { injected, metaMask, coinbaseWallet } from "wagmi/connectors";
import { mainnet } from "viem/chains";
import { ARC_MAINNET, ARC } from "./arc";
const arcChain = (network: typeof ARC_MAINNET) => ({
  id: network.chainId,
  name: network.name,
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
  rpcUrls: { default: { http: [network.rpcUrl] } },
  blockExplorers: { default: { name: "Arc Explorer", url: network.explorerUrl } },
});
export function createWalletConfig() {
  return createConfig({
    chains: [arcChain(ARC_MAINNET), mainnet, { ...arcChain(ARC), testnet: true }],
    connectors: [
      injected(),
      metaMask({
        dappMetadata: {
          name: "ARCWELL",
          url: "https://www.arcwellfi.com",
          iconUrl: "https://www.arcwellfi.com/logo-mark.png",
        },
      }),
      coinbaseWallet({
        appName: "ARCWELL",
        appLogoUrl: "https://www.arcwellfi.com/logo-mark.png",
        preference: { options: "eoaOnly" },
      }),
    ],
    multiInjectedProviderDiscovery: true,
    ssr: true,
    transports: {
      [ARC_MAINNET.chainId]: http(ARC_MAINNET.rpcUrl),
      [mainnet.id]: http(),
      [ARC.chainId]: http(ARC.rpcUrl),
    },
  });
}
