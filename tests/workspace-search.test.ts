import test from 'node:test';
import assert from 'node:assert/strict';
import { searchStocks } from '../src/workspace-search.ts';
import { STOCK_ASSETS } from '../src/stock-trading.ts';

test('workspace search covers the full execution catalog, including names outside local instruments', () => {
  assert.equal(searchStocks('').length, STOCK_ASSETS.length);
  assert.ok(searchStocks('').length > 400);
  for (const name of ['Alibaba', 'Coinbase', 'Palantir', 'Spotify']) {
    const results = searchStocks(name);
    assert.ok(results.some((asset) => asset.name.toLowerCase().includes(name.toLowerCase())));
    assert.ok(
      results.every((asset) => STOCK_ASSETS.some((allowed) => allowed.address === asset.address)),
    );
  }
});

test('exact tickers and contract addresses outrank partial name matches without inventing identities', () => {
  const nvidia = STOCK_ASSETS.find((asset) => asset.symbol === 'NVDAon')!;
  assert.equal(searchStocks(' nvda ')[0].address, nvidia.address);
  assert.equal(searchStocks('NVDAon')[0].address, nvidia.address);
  assert.deepEqual(searchStocks(nvidia.address.toUpperCase()), [nvidia]);
  assert.equal(searchStocks('this-stock-does-not-exist').length, 0);
});
