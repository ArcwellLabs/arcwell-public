import assert from 'node:assert/strict';
import test from 'node:test';
import {
  SNAPSHOT,
  INSTRUMENTS,
  HISTORIES,
  initialBook,
  validBook,
  bookValue,
  fillPaperOrder,
  portfolioHistory,
  correlation,
  quantile,
  statistics,
  drawdowns,
  rsi,
  sma,
  optionPrice,
  simulatePaths,
  allocationCloud,
} from '../frontend/src/lib/quant.ts';
const close = (a: number, b: number, tolerance = 1e-8) =>
  assert.ok(Math.abs(a - b) < tolerance, `${a} ≈ ${b}`);

test('synthetic OHLC histories are aligned, positive and end on the declared snapshot', () => {
  for (const asset of INSTRUMENTS) {
    const rows = HISTORIES[asset.symbol];
    assert.equal(rows.length, 253);
    assert.equal(rows.at(-1)?.date, SNAPSHOT);
    close(rows.at(-1)!.close, asset.price);
    assert.equal(new Set(rows.map((r) => r.date)).size, 253);
    for (const [i, row] of rows.entries()) {
      assert.ok(row.low > 0 && row.low <= Math.min(row.open, row.close));
      assert.ok(row.high >= Math.max(row.open, row.close));
      assert.ok(row.volume > 0);
      assert.equal(row.date, HISTORIES['SPY'][i].date);
      assert.ok(![0, 6].includes(new Date(row.date).getUTCDay()));
      if (i) assert.ok(row.date > rows[i - 1].date);
    }
  }
});
test('sample return, risk and indicators obey known cases', () => {
  const stats = statistics([100, 120, 90, 108]);
  close(stats.total, 0.08);
  close(stats.drawdown, -0.25);
  close(stats.var95, 0.205);
  assert.deepEqual(drawdowns([100, 120, 90, 108]), [0, 0, -0.25, -0.09999999999999998]);
  close(quantile([0, 10, 20, 30], 0.25), 7.5);
  assert.deepEqual(sma([1, 2, 3, 4], 3), [null, null, 2, 3]);
  assert.equal(rsi(Array(20).fill(1)).at(-1), 50);
  assert.equal(rsi(Array.from({ length: 20 }, (_, i) => i + 1)).at(-1), 100);
  assert.equal(rsi(Array.from({ length: 20 }, (_, i) => 20 - i)).at(-1), 0);
});
test('Pearson correlation handles mirrored and constant series', () => {
  close(correlation([1, 2, 3], [2, 4, 6]), 1);
  close(correlation([1, 2, 3], [6, 4, 2]), -1);
  assert.equal(correlation([1, 1, 1], [2, 4, 6]), 0);
  assert.equal(correlation([], []), 0);
});
test('paper buys and sells preserve account value and do not mutate the source book', () => {
  const original = initialBook();
  const buy = fillPaperOrder(original, 'NVDA', 'buy', 2.125, 'buy-1', SNAPSHOT);
  close(buy.cash, 2373.65);
  close(buy.positions['NVDA'], 52.125);
  close(bookValue(buy), bookValue(original));
  assert.equal(original.trades.length, 0);
  assert.equal(original.positions['NVDA'], 50);
  const sell = fillPaperOrder(buy, 'NVDA', 'sell', 2.125, 'sell-1', SNAPSHOT);
  close(sell.cash, original.cash);
  close(sell.positions['NVDA'], 50);
  assert.equal(sell.trades.length, 2);
  assert.ok(validBook(JSON.parse(JSON.stringify(sell))));
  close(portfolioHistory(sell).at(-1)!.value, bookValue(sell));
});
test('paper execution rejects overdraws, bad precision, unknown assets and invalid quantities', () => {
  const book = initialBook();
  assert.throws(() => fillPaperOrder(book, 'NVDA', 'buy', 1000, 'x', SNAPSHOT), /cash/);
  assert.throws(() => fillPaperOrder(book, 'NVDA', 'sell', 51, 'x', SNAPSHOT), /holdings/);
  assert.throws(() => fillPaperOrder(book, 'MISSING', 'buy', 1, 'x', SNAPSHOT));
  for (const quantity of [0, -1, NaN, Infinity, 0.0000001, 1.0000001])
    assert.throws(() => fillPaperOrder(book, 'NVDA', 'buy', quantity, 'x', SNAPSHOT));
  const fractional = fillPaperOrder(book, 'TBILL', 'buy', 0.000001, 'x', SNAPSHOT);
  close(fractional.trades[0].total, 0.0001);
  close(fractional.cash, 2739.9999);
});
test('malformed browser storage is rejected without throwing', () => {
  for (const value of [
    null,
    {},
    [],
    { ...initialBook(), cash: -1 },
    { ...initialBook(), trades: [null] },
    { ...initialBook(), positions: {} },
    { ...initialBook(), trades: [{ symbol: 'NVDA' }] },
  ])
    assert.equal(validBook(value), false);
});
test('European call model matches a standard benchmark and expiry boundaries', () => {
  close(optionPrice(100, 100, 365, 0.2, 0.05), 10.4506, 0.0001);
  close(optionPrice(110, 100, 0, 0.3), 10);
  close(optionPrice(90, 100, 0, 0.3), 0);
  close(optionPrice(100, 100, 365, 0, 0.05), 100 - 100 * Math.exp(-0.05));
  assert.ok(optionPrice(100, 100, 180, 0.5) > optionPrice(100, 100, 180, 0.2));
});
test('scenario bands are reproducible, ordered and flat without drift or volatility', () => {
  const flat = simulatePaths(1000, 0, 0, 21, 30);
  assert.ok(flat.every((p) => p.low === 1000 && p.median === 1000 && p.high === 1000));
  const sample = simulatePaths(1000, 0.07, 0.2, 21, 30);
  assert.deepEqual(sample, simulatePaths(1000, 0.07, 0.2, 21, 30));
  assert.ok(sample.every((p) => p.low > 0 && p.low <= p.median && p.median <= p.high));
});
test('allocation samples are long-only fully invested mixes with finite risk', () => {
  const cloud = allocationCloud(60);
  assert.equal(cloud.length, 60);
  for (const point of cloud) {
    close(
      point.weights.reduce((a, b) => a + b),
      1,
    );
    assert.ok(point.weights.every((w) => w >= 0 && w <= 1));
    assert.ok(Number.isFinite(point.volatility) && point.volatility >= 0);
    assert.ok(Number.isFinite(point.annualReturn));
  }
});
