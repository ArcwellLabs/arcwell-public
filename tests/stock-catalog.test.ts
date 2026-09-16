import test from 'node:test';
import assert from 'node:assert/strict';
import { parseStockCatalog } from '../src/stock-catalog-source.ts';
import { STOCK_ASSETS, stockPair } from '../src/stock-trading.ts';

const token = {
  chainId: 1,
  symbol: 'MSFTon',
  name: 'Microsoft (Ondo Tokenized)',
  address: '0x' + 'a'.repeat(40),
  decimals: 18,
  logoURI: 'https://cdn.ondo.finance/tokens/logos/msfton_160x160.png',
  tags: ['ondo'],
};
test('issuer import excludes other networks and dollar tokens without inferring contracts', () => {
  const assets = parseStockCatalog({
    tokens: [
      token,
      { ...token, chainId: 56 },
      { ...token, chainId: 5042 },
      { ...token, symbol: 'USDon' },
      { ...token, symbol: 'USDY' },
    ],
  });
  assert.deepEqual(assets, [
    {
      symbol: token.symbol,
      name: 'Microsoft',
      address: token.address,
      decimals: 18,
      logoURI: token.logoURI,
    },
  ]);
  assert.throws(() => parseStockCatalog({ tokens: [{ ...token, chainId: 5042 }] }));
});
test('issuer import rejects ambiguous identities and unsafe token metadata', () => {
  for (const change of [
    { symbol: 'MSFT' },
    { address: '0x' + '0'.repeat(40) },
    { address: '0x123' },
    { decimals: -1 },
    { decimals: 18.5 },
    { decimals: 37 },
    { logoURI: 'https://untrusted.example/logo.png' },
    { tags: [] },
    { name: 'Microsoft' },
  ])
    assert.throws(() => parseStockCatalog({ tokens: [{ ...token, ...change }] }));
  assert.throws(() =>
    parseStockCatalog({ tokens: [token, { ...token, address: '0x' + 'b'.repeat(40) }] }),
  );
  assert.throws(() => parseStockCatalog({ tokens: [token, { ...token, symbol: 'METAon' }] }));
});
test('expanded catalog binds buy/sell inputs to issuer contracts beyond the original four', () => {
  assert.ok(STOCK_ASSETS.length > 400);
  assert.equal(
    STOCK_ASSETS.some((asset) => ['USDon', 'USDY'].includes(asset.symbol)),
    false,
  );
  for (const symbol of ['MSFTon', 'GOOGLon', 'METAon', 'AMZNon', 'QQQon']) {
    const asset = STOCK_ASSETS.find((item) => item.symbol === symbol);
    assert.ok(asset);
    const intent = { symbol, side: 'buy' as const, amount: '1.25', wallet: '0x' + 'b'.repeat(40) };
    assert.equal(stockPair(intent).output, asset.address);
    assert.equal(stockPair(intent).amount, '1250000');
    assert.equal(stockPair({ ...intent, side: 'sell' }).input, asset.address);
    assert.equal(stockPair({ ...intent, side: 'sell' }).amount, '1250000000000000000');
  }
});
