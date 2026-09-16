import { isAssetAddress, NATIVE_USDC, type AssetDetail } from './asset-data.ts';

export const ARC_EURC = '0xbef5f6d51cb62b58e6a8f77868681825c6fe21c1';
export type SwapDirection = 'buy' | 'sell';
// Official custom-interface links. The provider obtains the executable quote and signatures.
// No arbitrary origin, redirect target, recipient, approval, or wallet address is accepted.
export function createSwapHandoff(detail: AssetDetail, direction: SwapDirection, amount: string) {
  if (detail.network !== 'mainnet' || !detail.contractRead || !isAssetAddress(detail.asset.address))
    throw new Error('Inspect a deployed Arc Mainnet token before continuing.');
  if (detail.asset.address.toLowerCase() === NATIVE_USDC)
    throw new Error('Choose another asset to exchange with USDC.');
  if (detail.asset.address.toLowerCase() === '0x8a5d989bbb96929f689b0200f435f53da42bf490')
    throw new Error(
      'USYC requires issuer eligibility and allowlisting. A public swap route is not enabled here.',
    );
  if (direction !== 'buy' && direction !== 'sell') throw new Error('Choose a swap direction.');
  if (
    detail.decimals === null ||
    !Number.isInteger(detail.decimals) ||
    detail.decimals < 0 ||
    detail.decimals > 36
  )
    throw new Error('Token precision could not be verified.');
  const precision = direction === 'buy' ? 6 : detail.decimals;
  const value = amount.trim();
  if (
    value.length > 78 ||
    !/^(0|[1-9]\d*)(\.\d+)?$/.test(value) ||
    (value.split('.')[1]?.length || 0) > precision
  )
    throw new Error(`Enter a positive amount with at most ${precision} decimal places.`);
  const [whole, fraction = ''] = value.split('.');
  const units = BigInt(whole + fraction.padEnd(precision, '0'));
  if (units <= 0n || units >= 2n ** 256n) throw new Error('Enter a valid positive token amount.');
  const asset = detail.asset.address.toLowerCase();
  const input = direction === 'buy' ? NATIVE_USDC : asset;
  const output = direction === 'buy' ? asset : NATIVE_USDC;
  const url = new URL('https://app.uniswap.org/swap');
  url.search = new URLSearchParams({
    chain: 'arc',
    inputCurrency: input,
    outputCurrency: output,
    value,
    field: 'input',
  }).toString();
  return { url: url.toString(), input, output, amount: value, chainId: 5042 as const };
}
