import test from 'node:test';
import assert from 'node:assert/strict';
import { ARC_EURC, createSwapHandoff } from '../src/arc-swap.ts';
import { NATIVE_USDC, type AssetDetail } from '../src/asset-data.ts';
const asset = {
  network: 'mainnet',
  contractRead: true,
  decimals: 6,
  asset: { address: ARC_EURC, symbol: 'EURC' },
} as AssetDetail;

test('swap handoff binds the official provider, Arc network, contracts and exact input amount', () => {
  const buy = createSwapHandoff(asset, 'buy', '12.123456');
  const url = new URL(buy.url);
  assert.equal(url.origin, 'https://app.uniswap.org');
  assert.equal(url.pathname, '/swap');
  assert.equal(url.searchParams.get('chain'), 'arc');
  assert.equal(url.searchParams.get('inputCurrency'), NATIVE_USDC);
  assert.equal(url.searchParams.get('outputCurrency'), ARC_EURC);
  assert.equal(url.searchParams.get('value'), '12.123456');
  assert.equal(url.searchParams.get('field'), 'input');
  const sell = createSwapHandoff({ ...asset, decimals: 18 }, 'sell', '0.000000000000000001');
  assert.equal(sell.input, ARC_EURC);
  assert.equal(sell.output, NATIVE_USDC);
  assert.equal(sell.amount, '0.000000000000000001');
});
test('swap rejects unverified, wrong-chain, permissioned and same-token selections', () => {
  for (const invalid of [
    { ...asset, network: 'testnet' },
    { ...asset, contractRead: false },
    { ...asset, decimals: null },
    { ...asset, decimals: 37 },
    { ...asset, asset: { address: NATIVE_USDC } },
    { ...asset, asset: { address: 'https://untrusted.example' } },
    { ...asset, asset: { address: '0x8a5d989bbb96929f689b0200f435f53da42bf490' } },
  ])
    assert.throws(() => createSwapHandoff(invalid as AssetDetail, 'buy', '1'));
});
test('swap input cannot inject URLs, lose precision, overflow or create zero/negative orders', () => {
  for (const amount of [
    '',
    '0',
    '0.000000',
    '-1',
    '1e6',
    'NaN',
    'Infinity',
    '1.0000001',
    '01',
    '.5',
    '1&recipient=0x1',
    '9'.repeat(78),
  ])
    assert.throws(() => createSwapHandoff(asset, 'buy', amount));
  assert.throws(() => createSwapHandoff(asset, 'invalid' as 'buy', '1'));
});
