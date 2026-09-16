import { type ArcNetwork, validAddress } from './arc.ts';

export type WalletProvider = {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
  on?: (event: string, listener: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, listener: (...args: unknown[]) => void) => void;
};

export function walletChainId(value: unknown): number {
  if (typeof value !== 'string' || !/^0x[0-9a-f]+$/i.test(value))
    throw new Error('The wallet returned an invalid network.');
  const id = Number(BigInt(value));
  if (!Number.isSafeInteger(id) || id <= 0)
    throw new Error('The wallet returned an invalid network.');
  return id;
}

export async function connectArcWallet(provider: WalletProvider) {
  const accounts = await provider.request({ method: 'eth_requestAccounts' });
  if (!Array.isArray(accounts) || typeof accounts[0] !== 'string' || !validAddress(accounts[0]))
    throw new Error('The wallet did not share a valid account.');
  const chainId = walletChainId(await provider.request({ method: 'eth_chainId' }));
  const current = await provider.request({ method: 'eth_accounts' });
  if (
    !Array.isArray(current) ||
    typeof current[0] !== 'string' ||
    current[0].toLowerCase() !== accounts[0].toLowerCase()
  )
    throw new Error('Wallet account changed. Connect again.');
  if (walletChainId(await provider.request({ method: 'eth_chainId' })) !== chainId)
    throw new Error('Wallet network changed. Connect again.');
  return { address: accounts[0] as string, chainId };
}

export async function switchArcNetwork(provider: WalletProvider, network: ArcNetwork) {
  const chainId = `0x${network.chainId.toString(16)}`;
  const switchChain = () =>
    provider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId }] });
  try {
    await switchChain();
  } catch (error) {
    // Only add a chain when the wallet explicitly reports it as unknown.
    if (!error || typeof error !== 'object' || !('code' in error) || error.code !== 4902)
      throw error;
    await provider.request({
      method: 'wallet_addEthereumChain',
      params: [
        {
          chainId,
          chainName: network.name,
          nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
          rpcUrls: [network.rpcUrl],
          blockExplorerUrls: [network.explorerUrl],
        },
      ],
    });
    await switchChain();
  }
  if (walletChainId(await provider.request({ method: 'eth_chainId' })) !== network.chainId)
    throw new Error('The wallet is still on a different network.');
}
