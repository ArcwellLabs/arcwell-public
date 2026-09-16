import { createContext, useContext } from "react";
import type { WalletProvider } from "./arc-wallet";

export type WalletSession = {
  ready: boolean;
  address: string;
  chainId: number | undefined;
  walletName: string;
  provider: WalletProvider | null;
  busy: boolean;
  locked: boolean;
  openWallet: () => void;
  disconnect: () => Promise<void>;
  setTransactionLock: (key: string, locked: boolean) => void;
};
export const WalletSessionContext = createContext<WalletSession>({
  ready: false,
  address: "",
  chainId: undefined,
  walletName: "",
  provider: null,
  busy: false,
  locked: false,
  openWallet: () => {},
  disconnect: async () => {},
  setTransactionLock: () => {},
});
export const useWalletSession = () => useContext(WalletSessionContext);
