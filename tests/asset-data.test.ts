import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createAssetService,
  decodeTokenText,
  finiteValue,
  normalizeCandles,
  normalizePools,
  NATIVE_USDC,
} from '../src/asset-data.ts';
import { createAssetHandler } from '../src/asset-api.ts';
const A = '0x1111111111111111111111111111111111111111';
const B = '0x2222222222222222222222222222222222222222';
const P = '0x3333333333333333333333333333333333333333';
const answer = (v: unknown, status = 200) => Response.json(v, { status });
const pair = {
  chainId: 'arc',
  pairAddress: P,
  baseToken: { address: A, name: 'Example Asset', symbol: 'SAME' },
  quoteToken: { address: B, name: 'Example Dollar', symbol: 'SAME' },
  priceUsd: '10',
  priceNative: '5',
  liquidity: { usd: 100000 },
  volume: { h24: 1000 },
  priceChange: { h24: 10 },
};
const abi = (s: string) =>
  '0x' +
  '20'.padStart(64, '0') +
  s.length.toString(16).padStart(64, '0') +
  Buffer.from(s).toString('hex').padEnd(64, '0');

test('numeric fields preserve missing values and reject non-finite or negative values', () => {
  for (const v of [null, undefined, '', ' ', true, {}, 'NaN', 'Infinity', -1])
    assert.equal(finiteValue(v), null);
  assert.equal(finiteValue('0'), 0);
  assert.equal(finiteValue('-2', true), -2);
});
test('pool identity is network plus contract, never symbol; quote prices are not base prices', () => {
  const wrong = { ...pair, chainId: 'ethereum' };
  const result = normalizePools(null, [wrong, pair], B);
  assert.equal(result.length, 1);
  assert.equal(result[0].priceUsd, 2);
  assert.equal(result[0].change24h, null);
  assert.equal(normalizePools(null, [pair], NATIVE_USDC).length, 0);
  assert.equal(normalizePools(null, [{ ...pair, priceNative: '0' }], B)[0].priceUsd, null);
});
test('Gecko pools require chain, pool and token identity; quote price stays oriented', () => {
  const pool = {
    id: 'arc_' + P,
    attributes: {
      address: P,
      base_token_price_usd: '10',
      quote_token_price_usd: '2',
      reserve_in_usd: '100',
      price_change_percentage: { h24: '4' },
    },
    relationships: {
      base_token: { data: { id: 'arc_' + A } },
      quote_token: { data: { id: 'arc_' + B } },
    },
  };
  assert.equal(normalizePools({ data: [pool] }, null, B)[0].priceUsd, 2);
  assert.equal(normalizePools({ data: [{ ...pool, id: 'eth_' + P }] }, null, B).length, 0);
  assert.equal(normalizePools({ data: [pool] }, null, NATIVE_USDC).length, 0);
});
test('OHLCV rejects invalid bounds, future data and missing values; sorts and deduplicates', () => {
  const good = [1700000000, 2, 3, 1, 2.5, 10];
  const rows = normalizeCandles([
    good,
    good,
    [1700000001, 2, 1, 1, 2, 10],
    [1700000002, null, 3, 1, 2, 10],
    [Date.now() / 1000 + 3600, 2, 3, 1, 2, 10],
  ]);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].close, 2.5);
});
test('metadata decoder handles strings and bytes32 without trusting offsets', () => {
  assert.equal(decodeTokenText(abi('Example')), 'Example');
  assert.equal(decodeTokenText('0x' + Buffer.from('TOK').toString('hex').padEnd(64, '0')), 'TOK');
  assert.equal(decodeTokenText('0x' + 'ff'.repeat(96)), '');
});
test('search merges by address, retains duplicate symbols and rejects other chains', async () => {
  const service = createAssetService(async (input) => {
    const u = String(input);
    if (u.includes('dexscreener'))
      return answer({
        pairs: [pair, { ...pair, chainId: 'ethereum', baseToken: { address: P, symbol: 'SAME' } }],
      });
    if (u.includes('/search?'))
      return answer({
        items: [{ type: 'token', address_hash: A, name: 'Example Asset', symbol: 'SAME' }],
      });
    return answer({ data: [], included: [] });
  });
  const result = await service.search('mainnet', 'SAME');
  assert.equal(result.items.length, 2);
  assert.equal(result.items[0].sources.length, 2);
  assert.ok(result.items.every((t) => t.address !== P));
});
test('testnet never requests mainnet market data; arbitrary contract reads are pinned to one block', async () => {
  const calls: { method: string; params: unknown[] }[] = [];
  const service = createAssetService(async (input, init) => {
    assert.ok(!String(input).includes('geckoterminal') && !String(input).includes('dexscreener'));
    if (!init?.body) return answer({}, 404);
    const body = JSON.parse(String(init.body));
    calls.push(body);
    const values: Record<string, string> = {
      eth_chainId: '0x4cef52',
      eth_blockNumber: '0x10',
      eth_getCode: '0x6000',
    };
    const selector = body.params[0]?.data;
    const result =
      values[body.method] ||
      (selector === '0x06fdde03'
        ? abi('Unlisted Asset')
        : selector === '0x95d89b41'
          ? abi('NEW')
          : selector === '0x313ce567'
            ? '0x06'
            : '0x1e8480');
    return answer({ jsonrpc: '2.0', id: 1, result });
  });
  const result = await service.inspect('testnet', A);
  assert.equal(result.asset.name, 'Unlisted Asset');
  assert.equal(result.supply, '2');
  assert.equal(result.priceUsd, null);
  assert.equal(result.history.length, 0);
  assert.ok(
    calls
      .filter((c) => c.method === 'eth_call' || c.method === 'eth_getCode')
      .every((c) => c.params[1] === '0x10'),
  );
});
test('wrong-chain RPC stops before contract reads and does not pretend successful validation', async () => {
  let reads = 0;
  const service = createAssetService(async (input, init) => {
    if (init?.body) {
      reads++;
      return answer({ jsonrpc: '2.0', id: 1, result: '0x1' });
    }
    return answer({}, 404);
  });
  const result = await service.inspect('mainnet', A);
  assert.equal(reads, 1);
  assert.equal(result.contractRead, false);
  assert.equal(result.priceUsd, null);
  assert.ok(result.sources.find((s) => s.name === 'Arc RPC')?.status === 'unavailable');
});
test('confirmed undeployed address suppresses stale indexer prices', async () => {
  const service = createAssetService(async (input, init) => {
    if (init?.body) {
      const q = JSON.parse(String(init.body));
      return answer({
        jsonrpc: '2.0',
        id: 1,
        result:
          q.method === 'eth_chainId' ? '0x13b2' : q.method === 'eth_blockNumber' ? '0x10' : '0x',
      });
    }
    return String(input).includes('dexscreener') ? answer([pair]) : answer({}, 404);
  });
  const result = await service.inspect('mainnet', A);
  assert.equal(result.priceUsd, null);
  assert.equal(result.pools.length, 0);
  assert.equal(result.asset.sources.length, 0);
});
test('provider outage returns explicit unavailable status, not fake quotes', async () => {
  const service = createAssetService(async () => answer({}, 503));
  const result = await service.inspect('mainnet', A);
  assert.equal(result.priceUsd, null);
  assert.ok(result.sources.every((s) => s.status === 'unavailable'));
});
test('API rejects invalid networks, SSRF inputs, malformed addresses and oversized queries', async () => {
  let requests = 0;
  const service = createAssetService(async () => {
    requests++;
    return answer({});
  });
  const handler = createAssetHandler(service);
  for (const q of [
    'network=ethereum&q=USDC',
    'address=https://example.com',
    'q=a',
    'q=' + 'a'.repeat(101),
    'q=USDC&page=99',
  ])
    assert.equal((await handler(new Request('https://example.com/api/assets?' + q))).status, 400);
  assert.equal(requests, 0);
});
test('API coalesces concurrent requests, caches, and limits unique misses', async () => {
  let calls = 0;
  let clock = 0;
  const service = {
    search: async () => {
      calls++;
      return { items: [] };
    },
    inspect: async () => ({}),
  } as unknown as ReturnType<typeof createAssetService>;
  const handler = createAssetHandler(service, () => clock);
  const req = () => new Request('https://example.com/api/assets?q=EXAMPLE');
  await Promise.all([handler(req()), handler(req())]);
  await handler(req());
  assert.equal(calls, 1);
  for (let i = 0; i < 11; i++)
    assert.equal(
      (await handler(new Request('https://example.com/api/assets?q=token' + i))).status,
      200,
    );
  assert.equal(
    (await handler(new Request('https://example.com/api/assets?q=overflow'))).status,
    429,
  );
  clock = 61000;
  assert.equal((await handler(req())).status, 200);
});

test('verified history survives transient outages with original time, expires, and never crosses networks', async () => {
  let clock = Date.now();
  const initial = clock;
  let outage = false;
  let historyReads = 0;
  const service = createAssetService(
    async (input, init) => {
      const url = String(input);
      if (init?.body) {
        const q = JSON.parse(String(init.body));
        return answer({
          jsonrpc: '2.0',
          id: 1,
          result:
            q.method === 'eth_chainId'
              ? url.includes('testnet')
                ? '0x4cef52'
                : '0x13b2'
              : q.method === 'eth_blockNumber'
                ? '0x10'
                : q.method === 'eth_getCode'
                  ? '0x6000'
                  : q.params[0]?.data === '0x313ce567'
                    ? '0x06'
                    : q.params[0]?.data === '0x18160ddd'
                      ? '0x01'
                      : abi('Example'),
        });
      }
      if (url.includes('/ohlcv/')) {
        historyReads++;
        if (outage) return answer({}, 503);
        return answer({
          meta: { base: { address: A } },
          data: {
            attributes: {
              ohlcv_list: [
                [1700000000, 2, 3, 1, 2.5, 10],
                [1700086400, 2.5, 3, 2, 2.8, 20],
              ],
            },
          },
        });
      }
      if (url.includes('/pools'))
        return answer({
          data: [
            {
              id: 'arc_' + P,
              attributes: {
                address: P,
                base_token_price_usd: '2.8',
                reserve_in_usd: '100000',
              },
              relationships: {
                base_token: { data: { id: 'arc_' + A } },
                quote_token: { data: { id: 'arc_' + B } },
              },
            },
          ],
        });
      return answer({}, 404);
    },
    () => clock,
  );
  const first = await service.inspect('mainnet', A);
  assert.equal(first.historyStatus, 'live');
  assert.equal(first.history.length, 2);
  clock += 61_000;
  outage = true;
  const cached = await service.inspect('mainnet', A);
  assert.equal(cached.historyStatus, 'cached');
  assert.equal(historyReads, 1);
  clock += 300_000;
  const stale = await service.inspect('mainnet', A);
  assert.equal(stale.historyStatus, 'stale');
  assert.equal(stale.historyObservedAt, new Date(initial).toISOString());
  assert.equal(stale.history.length, 2);
  assert.equal(stale.sources.find((s) => s.name.includes('history'))?.reason, 'upstream-error');
  assert.equal((await service.inspect('testnet', A)).history.length, 0);
  clock = initial + 3_600_001;
  const expired = await service.inspect('mainnet', A);
  assert.equal(expired.historyStatus, 'unavailable');
  assert.equal(expired.history.length, 0);
});

test('provider rate limits honor bounded retry time and do not expose upstream response bodies', async () => {
  let clock = Date.now();
  let requests = 0;
  const service = createAssetService(
    async () => {
      requests++;
      return new Response('private upstream diagnostics', {
        status: 429,
        headers: { 'Retry-After': '120' },
      });
    },
    () => clock,
  );
  const first = await service.search('mainnet', 'asset');
  const count = requests;
  const second = await service.search('mainnet', 'another');
  assert.equal(requests, count);
  assert.ok(second.sources.every((s) => s.reason === 'rate-limited' && s.retryAt));
  assert.ok(!JSON.stringify(first).includes('private upstream'));
  clock += 121_000;
  await service.search('mainnet', 'third');
  assert.ok(requests > count);
});

test('explorer cursor exposes further search pages and keeps network and query pinned', async () => {
  const seen: string[] = [];
  const service = createAssetService(async (input) => {
    const url = new URL(String(input));
    seen.push(url.href);
    assert.equal(url.origin, 'https://explorer.testnet.arc.io');
    assert.equal(url.searchParams.get('q'), 'Asset');
    return answer(
      url.searchParams.has('items_count')
        ? {
            items: [{ type: 'token', address_hash: B, name: 'Asset Later', symbol: 'LATER' }],
            next_page_params: null,
          }
        : {
            items: [{ type: 'token', address_hash: A, name: 'Asset First', symbol: 'FIRST' }],
            next_page_params: { q: 'injected', items_count: 50 },
          },
    );
  });
  const first = await service.search('testnet', 'Asset');
  assert.equal(first.nextPage, 2);
  const second = await service.search('testnet', 'Asset', 2);
  assert.equal(second.items[0].address, B);
  assert.equal(second.nextPage, null);
  assert.equal(seen.length, 2);
});
