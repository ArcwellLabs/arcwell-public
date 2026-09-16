import { walletChainId, type WalletProvider } from './arc-wallet.ts';

// Resolve the chosen connector, never a competing window.ethereum provider.
// Passive reads also catch an account/network change while its SDK is loading.
export async function resolveSelectedWallet(
  connector: { getProvider(): Promise<unknown> },
  address: string,
  chainId: number,
): Promise<WalletProvider> {
  const raw = await connector.getProvider();
  if (!raw || typeof raw !== 'object' || !('request' in raw) || typeof raw.request !== 'function')
    throw new Error('The selected wallet is unavailable.');
  const provider = raw as WalletProvider;
  const accounts = await provider.request({ method: 'eth_accounts' });
  if (
    !Array.isArray(accounts) ||
    typeof accounts[0] !== 'string' ||
    accounts[0].toLowerCase() !== address.toLowerCase()
  )
    throw new Error('The selected wallet account changed. Reconnect to continue.');
  if (walletChainId(await provider.request({ method: 'eth_chainId' })) !== chainId)
    throw new Error('The selected wallet network changed. Reconnect to continue.');
  return provider;
}
