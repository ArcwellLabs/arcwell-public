// Read-only Arc research. Provider observations are never executable quotes.
export type AssetNetwork = 'mainnet' | 'testnet';
export const ASSET_NETWORKS = {
  mainnet: {
    name: 'Arc Mainnet',
    chainId: 5042,
    rpc: 'https://rpc.mainnet.arc.io',
    explorer: 'https://explorer.arc.io',
  },
  testnet: {
    name: 'Arc Testnet',
    chainId: 5042002,
    rpc: 'https://rpc.testnet.arc.io',
    explorer: 'https://explorer.testnet.arc.io',
  },
} as const;
const GT = 'https://api.geckoterminal.com/api/v2';
const DEX = 'https://api.dexscreener.com';
export const NATIVE_USDC = '0x3600000000000000000000000000000000000000';
// Identity references only, verified against Arc documentation on 2026-09-16.
// Live discovery is not limited to these contracts; no prices are stored here.
const REFERENCE_URL = 'https://docs.arc.io/arc/references/contract-addresses';
const references = (network: AssetNetwork) => [
  {
    address: NATIVE_USDC,
    name: 'USDC',
    symbol: 'USDC',
    issuer: 'Circle',
    access: 'Native USDC and its ERC-20 interface represent the same funds.',
  },
  {
    address:
      network === 'mainnet'
        ? '0xbef5f6d51cb62b58e6a8f77868681825c6fe21c1'
        : '0x89b50855aa3be2f677cd6303cec089b5f319d72a',
    name: 'EURC',
    symbol: 'EURC',
    issuer: 'Circle',
    access: 'Euro-denominated stablecoin. Market price is not assumed to equal one dollar.',
  },
  {
    address:
      network === 'mainnet'
        ? '0x8a5d989bbb96929f689b0200f435f53da42bf490'
        : '0xe9185f0c5f296ed1797aae4238d26ccabeadb86c',
    name: 'USYC',
    symbol: 'USYC',
    issuer: 'Circle International Bermuda Ltd.',
    access:
      'Permissioned money-market fund token. Issuer eligibility and allowlisting apply; lookup does not establish eligibility. Fund NAV and redemption quotes are not connected.',
  },
];
type ObjectValue = Record<string, any>;
const obj = (v: unknown): ObjectValue =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as ObjectValue) : {};
const list = (v: unknown): ObjectValue[] => (Array.isArray(v) ? v.map(obj) : []);
export const isAssetAddress = (v: string): boolean =>
  /^0x[0-9a-f]{40}$/i.test(v) && !/^0x0{40}$/i.test(v);
const poolAddress = (v: unknown): v is string =>
  typeof v === 'string' && /^0x(?:[0-9a-f]{40}|[0-9a-f]{64})$/i.test(v);
const clean = (v: unknown, max = 120): string =>
  typeof v === 'string'
    ? v.replace(/[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/g, '').slice(0, max)
    : '';
export function finiteValue(v: unknown, signed = false): number | null {
  if ((typeof v !== 'number' && typeof v !== 'string') || (typeof v === 'string' && !v.trim()))
    return null;
  const n = Number(v);
  return Number.isFinite(n) && (signed || n >= 0) ? n : null;
}
function uint(v: unknown): bigint {
  if (typeof v !== 'string' || !/^0x[0-9a-f]{1,64}$/i.test(v))
    throw new Error('Invalid onchain integer');
  return BigInt(v);
}
export function decodeTokenText(v: unknown): string {
  if (typeof v !== 'string' || !/^0x(?:[0-9a-f]{2}){1,2048}$/i.test(v)) return '';
  const hex = v.slice(2);
  let value = hex;
  if (hex.length > 64) {
    const offset = Number(BigInt('0x' + hex.slice(0, 64))) * 2;
    if (!Number.isSafeInteger(offset) || offset < 64 || offset + 64 > hex.length) return '';
    const length = Number(BigInt('0x' + hex.slice(offset, offset + 64))) * 2;
    if (!Number.isSafeInteger(length) || length > 1024 || offset + 64 + length > hex.length)
      return '';
    value = hex.slice(offset + 64, offset + 64 + length);
  }
  try {
    return clean(
      new TextDecoder('utf-8', { fatal: true }).decode(
        Uint8Array.from(value.match(/../g) || [], (x) => parseInt(x, 16)),
      ),
    );
  } catch {
    return '';
  }
}
export type SourceStatus = {
  name: string;
  url: string;
  status: 'ok' | 'unavailable';
  observedAt: string;
  reason?:
    | 'rate-limited'
    | 'budget-limited'
    | 'timeout'
    | 'not-found'
    | 'upstream-error'
    | 'invalid-data'
    | 'network-error';
  retryAt?: string;
  httpStatus?: number;
};
export type AssetHit = {
  address: string;
  name: string;
  symbol: string;
  type: string;
  sources: string[];
};
export type AssetSearch = {
  network: AssetNetwork;
  query: string;
  items: AssetHit[];
  sources: SourceStatus[];
  nextPage: number | null;
  observedAt: string;
};
export type MarketPool = {
  address: string;
  source: 'GeckoTerminal' | 'DEX Screener';
  url: string;
  dex: string;
  pair: string;
  priceUsd: number | null;
  liquidityUsd: number | null;
  volume24hUsd: number | null;
  change24h: number | null;
  observedAt: string;
};
export type AssetDetail = {
  network: AssetNetwork;
  asset: AssetHit;
  observedAt: string;
  block: string | null;
  contractRead: boolean;
  decimals: number | null;
  supply: string | null;
  holders: number | null;
  holdersUpdatedAt: string | null;
  description: string;
  reference: { issuer: string; url: string; access: string } | null;
  pools: MarketPool[];
  sources: SourceStatus[];
  warnings: string[];
  priceUsd: number | null;
  priceSource: string | null;
  priceSpreadPercent: number | null;
  history: {
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }[];
  historyPool: string | null;
  historyUrl: string | null;
  historyObservedAt: string | null;
  historyStatus: 'live' | 'cached' | 'stale' | 'unavailable';
};
type Fetcher = typeof fetch;
class ProviderFailure extends Error {
  reason: NonNullable<SourceStatus['reason']>;
  retryAt?: string;
  httpStatus?: number;
  constructor(reason: NonNullable<SourceStatus['reason']>, retryAt?: string, httpStatus?: number) {
    super(reason);
    this.reason = reason;
    this.retryAt = retryAt;
    this.httpStatus = httpStatus;
  }
}
export function createAssetService(fetcher: Fetcher = fetch, now = Date.now) {
  const cooldowns = new Map<string, number>();
  const historyCache = new Map<
    string,
    {
      time: number;
      history: AssetDetail['history'];
      pool: string;
      url: string;
    }
  >();
  const budgets = new Map<string, { start: number; count: number }>();
  async function json(url: string, init?: RequestInit): Promise<ObjectValue | ObjectValue[]> {
    const host = new URL(url).hostname;
    const retry = cooldowns.get(host) || 0;
    if (retry > now()) throw new ProviderFailure('rate-limited', new Date(retry).toISOString());
    let budget = budgets.get(host);
    if (!budget || now() - budget.start >= 60_000) {
      budget = { start: now(), count: 0 };
      budgets.set(host, budget);
    }
    const limit = host === 'api.geckoterminal.com' ? 27 : host.startsWith('rpc.') ? 240 : 100;
    if (budget.count >= limit)
      throw new ProviderFailure('budget-limited', new Date(budget.start + 60_000).toISOString());
    budget.count++;
    const response = await fetcher(url, {
      ...init,
      redirect: 'error',
      headers: { 'User-Agent': 'ARCWELL-research', Accept: 'application/json', ...init?.headers },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) {
      if (response.status === 429) {
        const header = response.headers.get('Retry-After') || '';
        const delay = /^\d+$/.test(header) ? Number(header) * 1000 : Date.parse(header) - now();
        const until =
          now() + Math.min(300_000, Math.max(1000, Number.isFinite(delay) ? delay : 60_000));
        cooldowns.set(host, until);
        throw new ProviderFailure('rate-limited', new Date(until).toISOString(), 429);
      }
      throw new ProviderFailure(
        response.status === 404 ? 'not-found' : 'upstream-error',
        undefined,
        response.status,
      );
    }
    // Bound memory even when an upstream omits Content-Length.
    const reader = response.body?.getReader();
    if (!reader) throw new Error('Empty provider response');
    const chunks: Uint8Array[] = [];
    let length = 0;
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        length += value.length;
        if (length > 2_000_000) {
          await reader.cancel();
          throw new Error('Provider response too large');
        }
        chunks.push(value);
      }
    } finally {
      reader.releaseLock();
    }
    const bytes = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.length;
    }
    return JSON.parse(new TextDecoder().decode(bytes));
  }
  async function source(
    name: string,
    url: string,
    sources: SourceStatus[],
    work: () => Promise<unknown>,
  ) {
    try {
      const data = await work();
      sources.push({ name, url, status: 'ok', observedAt: new Date(now()).toISOString() });
      return data;
    } catch (error) {
      const reason =
        error instanceof ProviderFailure
          ? error.reason
          : error instanceof Error && ['TimeoutError', 'AbortError'].includes(error.name)
            ? 'timeout'
            : error instanceof SyntaxError
              ? 'invalid-data'
              : 'network-error';
      sources.push({
        name,
        url,
        status: 'unavailable',
        observedAt: new Date(now()).toISOString(),
        reason,
        ...(error instanceof ProviderFailure && error.retryAt ? { retryAt: error.retryAt } : {}),
        ...(error instanceof ProviderFailure && error.httpStatus
          ? { httpStatus: error.httpStatus }
          : {}),
      });
      return null;
    }
  }
  async function rpc(network: AssetNetwork, method: string, params: unknown[]) {
    const body = obj(
      await json(ASSET_NETWORKS[network].rpc, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
      }),
    );
    if (
      body['error'] ||
      body['id'] !== 1 ||
      body['jsonrpc'] !== '2.0' ||
      body['result'] === undefined
    )
      throw new Error('Invalid RPC response');
    return body['result'];
  }
  async function contract(network: AssetNetwork, address: string) {
    if (uint(await rpc(network, 'eth_chainId', [])) !== BigInt(ASSET_NETWORKS[network].chainId))
      throw new Error('Wrong network');
    const block = await rpc(network, 'eth_blockNumber', []);
    const blockNumber = uint(block).toString();
    const code = await rpc(network, 'eth_getCode', [address, block]);
    if (typeof code !== 'string' || !/^0x[0-9a-f]+$/i.test(code) || /^0x0*$/i.test(code))
      return { exists: false, block: blockNumber };
    const selectors = ['0x06fdde03', '0x95d89b41', '0x313ce567', '0x18160ddd'];
    const values = await Promise.allSettled(
      selectors.map((data) => rpc(network, 'eth_call', [{ to: address, data }, block])),
    );
    const value = (i: number) => (values[i].status === 'fulfilled' ? values[i].value : null);
    let decimals: number | null = null;
    let supply: string | null = null;
    try {
      const n = uint(value(2));
      if (n <= 255n) decimals = Number(n);
    } catch {
      /* Optional metadata. */
    }
    try {
      const units = uint(value(3));
      if (decimals !== null) {
        const scale = 10n ** BigInt(decimals);
        const fraction = decimals
          ? (units % scale).toString().padStart(decimals, '0').replace(/0+$/, '')
          : '';
        supply = (units / scale).toString() + (fraction ? '.' + fraction : '');
      }
    } catch {
      /* Optional metadata. */
    }
    return {
      exists: true,
      block: blockNumber,
      name: decodeTokenText(value(0)),
      symbol: decodeTokenText(value(1)),
      decimals,
      supply,
    };
  }
  async function search(network: AssetNetwork, query: string, page = 1): Promise<AssetSearch> {
    const q = query.trim();
    if (
      q.length < 2 ||
      q.length > 100 ||
      /[\u0000-\u001f]/.test(q) ||
      !Number.isInteger(page) ||
      page < 1 ||
      page > 10
    )
      throw new Error('Invalid search');
    const sources: SourceStatus[] = [];
    const items = new Map<string, AssetHit>();
    const add = (address: unknown, name: unknown, symbol: unknown, type: unknown, from: string) => {
      if (typeof address !== 'string' || !isAssetAddress(address)) return;
      if (
        !isAssetAddress(q) &&
        !`${clean(name)} ${clean(symbol)}`.toLowerCase().includes(q.toLowerCase())
      )
        return;
      const key = address.toLowerCase();
      const existing = items.get(key);
      items.set(
        key,
        existing
          ? { ...existing, sources: [...new Set([...existing.sources, from])] }
          : {
              address: key,
              name: clean(name) || 'Unnamed contract',
              symbol: clean(symbol, 32),
              type: clean(type, 32) || 'Token',
              sources: [from],
            },
      );
    };
    if (isAssetAddress(q)) {
      const detail = await inspect(network, q);
      return {
        network,
        query: q,
        items: detail.asset.sources.length ? [detail.asset] : [],
        sources: detail.sources,
        nextPage: null,
        observedAt: detail.observedAt,
      };
    }
    const explorer = ASSET_NETWORKS[network].explorer;
    const [bs, gt, dex] = await Promise.all([
      page === 1
        ? source('Arc explorer', explorer, sources, () =>
            json(`${explorer}/api/v2/search?q=${encodeURIComponent(q)}`),
          )
        : null,
      network === 'mainnet'
        ? source('GeckoTerminal', 'https://www.geckoterminal.com/arc/pools', sources, () =>
            json(
              `${GT}/search/pools?query=${encodeURIComponent(q)}&network=arc&include=base_token,quote_token&page=${page}`,
            ),
          )
        : null,
      network === 'mainnet' && page === 1
        ? source('DEX Screener', 'https://dexscreener.com/arc', sources, () =>
            json(`${DEX}/latest/dex/search?q=${encodeURIComponent(q)}`),
          )
        : null,
    ]);
    for (const token of list(obj(bs)['items']))
      if (token['type'] === 'token')
        add(
          token['address_hash'],
          token['name'],
          token['symbol'],
          token['token_type'],
          'Arc explorer',
        );
    const included = list(obj(gt)['included']);
    for (const token of included)
      if (
        token['type'] === 'token' &&
        typeof token['id'] === 'string' &&
        token['id'].startsWith('arc_')
      ) {
        const a = obj(token['attributes']);
        if (token['id'].slice(4).toLowerCase() === String(a['address']).toLowerCase())
          add(a['address'], a['name'], a['symbol'], 'Token', 'GeckoTerminal');
      }
    for (const pair of list(obj(dex)['pairs']))
      if (pair['chainId'] === 'arc')
        for (const side of ['baseToken', 'quoteToken']) {
          const a = obj(pair[side]);
          add(a['address'], a['name'], a['symbol'], 'Token', 'DEX Screener');
        }
    if (page === 1)
      for (const ref of references(network))
        add(ref.address, ref.name, ref.symbol, 'ERC-20', 'Arc network reference');
    const referenced = new Set(references(network).map((r) => r.address));
    const hits = [...items.values()].sort(
      (a, b) =>
        Number(referenced.has(b.address)) - Number(referenced.has(a.address)) ||
        a.name.localeCompare(b.name),
    );
    return {
      network,
      query: q,
      items: hits.slice(0, 100),
      sources,
      nextPage:
        network === 'mainnet' && list(obj(gt)['data']).length >= 20 && page < 10 ? page + 1 : null,
      observedAt: new Date().toISOString(),
    };
  }
  async function inspect(network: AssetNetwork, address: string): Promise<AssetDetail> {
    if (!isAssetAddress(address)) throw new Error('Invalid contract address');
    address = address.toLowerCase();
    const sources: SourceStatus[] = [];
    const explorer = ASSET_NETWORKS[network].explorer;
    const [chain, bs, token, info, gt, dex] = await Promise.all([
      source('Arc RPC', explorer + '/address/' + address, sources, () =>
        contract(network, address),
      ),
      source('Arc explorer', explorer + '/token/' + address, sources, () =>
        json(`${explorer}/api/v2/tokens/${address}`),
      ),
      network === 'mainnet'
        ? source(
            'GeckoTerminal token',
            `https://www.geckoterminal.com/arc/tokens/${address}`,
            sources,
            () => json(`${GT}/networks/arc/tokens/${address}`),
          )
        : null,
      network === 'mainnet'
        ? source(
            'GeckoTerminal profile',
            `https://www.geckoterminal.com/arc/tokens/${address}`,
            sources,
            () => json(`${GT}/networks/arc/tokens/${address}/info`),
          )
        : null,
      network === 'mainnet'
        ? source(
            'GeckoTerminal pools',
            `https://www.geckoterminal.com/arc/tokens/${address}`,
            sources,
            () =>
              json(
                `${GT}/networks/arc/tokens/${address}/pools?include=base_token,quote_token&sort=h24_volume_usd_desc`,
              ),
          )
        : null,
      network === 'mainnet'
        ? source('DEX Screener', `https://dexscreener.com/arc/${address}`, sources, () =>
            json(`${DEX}/token-pairs/v1/arc/${address}`),
          )
        : null,
    ]);
    const c = obj(chain);
    const b = obj(bs);
    const t = obj(obj(token)['data']);
    const i = obj(obj(info)['data']);
    const tokenAttrs = t['id'] === 'arc_' + address ? obj(t['attributes']) : {};
    const profile = i['id'] === 'arc_' + address ? obj(i['attributes']) : {};
    const explorerAttrs = String(b['address_hash']).toLowerCase() === address ? b : {};
    const pools = network === 'mainnet' ? normalizePools(gt, dex, address) : [];
    const candidates = pools
      .filter((p) => p.priceUsd !== null && p.priceUsd > 0 && (p.liquidityUsd || 0) > 0)
      .sort((a, b) => (b.liquidityUsd || 0) - (a.liquidityUsd || 0));
    const best = candidates[0];
    const identitySources = [
      c['exists'] ? 'Arc RPC' : '',
      explorerAttrs['address_hash'] ? 'Arc explorer' : '',
      tokenAttrs['address'] ? 'GeckoTerminal' : '',
      pools.length ? 'DEX market index' : '',
    ].filter(Boolean);
    // A confirmed empty address must never inherit an indexer's price or identity.
    const absent = c['exists'] === false;
    const dexToken =
      list(dex)
        .filter((p) => p['chainId'] === 'arc')
        .flatMap((p) => [obj(p['baseToken']), obj(p['quoteToken'])])
        .find((t) => String(t['address']).toLowerCase() === address) || {};
    const metadata = c['exists']
      ? c
      : Object.keys(explorerAttrs).length
        ? explorerAttrs
        : tokenAttrs;
    const asset = {
      address,
      name: absent
        ? 'No deployed contract'
        : clean(metadata['name']) ||
          clean(tokenAttrs['name']) ||
          clean(dexToken['name']) ||
          'Unknown contract',
      symbol: absent
        ? ''
        : clean(metadata['symbol'], 32) ||
          clean(tokenAttrs['symbol'], 32) ||
          clean(dexToken['symbol'], 32),
      type:
        clean(explorerAttrs['type']) ||
        (c['decimals'] !== null && c['decimals'] !== undefined ? 'ERC-20 compatible' : 'Contract'),
      sources: absent ? [] : identitySources,
    };
    const ref = references(network).find((r) => r.address === address);
    const detail: AssetDetail = {
      network,
      asset,
      observedAt: new Date().toISOString(),
      block: c['block'] || null,
      contractRead: c['exists'] === true,
      decimals: finiteValue(metadata['decimals']),
      supply: c['supply'] || null,
      holders: finiteValue(obj(profile['holders'])['count'] ?? explorerAttrs['holders_count']),
      holdersUpdatedAt: clean(obj(profile['holders'])['last_updated']) || null,
      description: clean(profile['description'], 1200),
      reference: ref ? { issuer: ref.issuer, url: REFERENCE_URL, access: ref.access } : null,
      pools: absent ? [] : pools,
      sources,
      warnings: [],
      priceUsd: absent ? null : (best?.priceUsd ?? null),
      priceSource: absent || !best ? null : `${best.source} · ${best.dex} · ${best.address}`,
      priceSpreadPercent: null,
      history: [],
      historyPool: null,
      historyUrl: null,
      historyObservedAt: null,
      historyStatus: 'unavailable',
    };
    if (absent)
      detail.warnings.push(
        'No deployed contract was found at this address on the selected network.',
      );
    else if (!detail.contractRead)
      detail.warnings.push(
        'Contract could not be independently checked through Arc RPC. Indexer metadata is unconfirmed.',
      );
    if (network === 'testnet')
      detail.warnings.push(
        'Testnet tokens have no investment value. Mainnet prices are never applied to testnet assets.',
      );
    if (!best || absent)
      detail.warnings.push('No liquid, priced market is available from the connected sources.');
    if (best && (best.liquidityUsd || 0) < 10000)
      detail.warnings.push(
        'Low pool liquidity: the displayed price may be easy to move and is not an execution quote.',
      );
    const comparisons = ['GeckoTerminal', 'DEX Screener']
      .map((name) => candidates.find((p) => p.source === name)?.priceUsd)
      .filter((p): p is number => p !== undefined && p !== null && p > 0);
    if (!absent && comparisons.length === 2) {
      detail.priceSpreadPercent = (Math.max(...comparisons) / Math.min(...comparisons) - 1) * 100;
      if (detail.priceSpreadPercent > 5)
        detail.warnings.push(
          'Provider prices differ by more than 5%. Review the individual markets before relying on this quote.',
        );
    }
    const historyKey = network + ':' + address;
    const previous = historyCache.get(historyKey);
    if (previous && now() - previous.time >= 3_600_000) historyCache.delete(historyKey);
    const cachedHistory = historyCache.get(historyKey);
    const applyHistory = (
      cached: NonNullable<typeof cachedHistory>,
      status: 'cached' | 'stale',
    ) => {
      detail.history = cached.history;
      detail.historyPool = cached.pool;
      detail.historyUrl = cached.url;
      detail.historyObservedAt = new Date(cached.time).toISOString();
      detail.historyStatus = status;
    };
    if (!absent && cachedHistory && now() - cachedHistory.time < 300_000) {
      applyHistory(cachedHistory, 'cached');
    } else {
      const historyPools = candidates.filter((p) => p.source === 'GeckoTerminal').slice(0, 3);
      for (const [index, historyPool] of historyPools.entries()) {
        if (absent || detail.history.length >= 2) break;
        const url = `${GT}/networks/arc/pools/${historyPool.address}/ohlcv/day?aggregate=1&limit=30&currency=usd&token=${address}`;
        const candles = (await source(
          `GeckoTerminal history ${index + 1}`,
          historyPool.url,
          sources,
          async () => {
            const data = obj(await json(url));
            if (String(obj(data['meta'])['base']?.address).toLowerCase() !== address)
              throw new ProviderFailure('invalid-data');
            const rows = normalizeCandles(obj(obj(data['data'])['attributes'])['ohlcv_list']);
            if (!rows.length) throw new ProviderFailure('invalid-data');
            return rows;
          },
        )) as AssetDetail['history'] | null;
        if (candles && candles.length > detail.history.length) {
          detail.history = candles;
          detail.historyPool = historyPool.address;
          detail.historyUrl = historyPool.url;
          detail.historyObservedAt = new Date(now()).toISOString();
          detail.historyStatus = 'live';
        }
      }
      if (detail.history.length && detail.historyPool && detail.historyUrl) {
        if (historyCache.size >= 100) historyCache.delete(historyCache.keys().next().value!);
        historyCache.set(historyKey, {
          time: now(),
          history: detail.history,
          pool: detail.historyPool,
          url: detail.historyUrl,
        });
      } else if (!absent && cachedHistory) {
        applyHistory(cachedHistory, 'stale');
        detail.warnings.push(
          'History refresh failed. Showing previously verified candles from the displayed retrieval time, retained for at most one hour.',
        );
      }
    }
    if (absent) historyCache.delete(historyKey);
    if (!detail.history.length)
      detail.warnings.push('Historical prices are unavailable. No sample chart is substituted.');
    return detail;
  }
  return { search, inspect };
}
export function normalizePools(gecko: unknown, dex: unknown, address: string): MarketPool[] {
  const result: MarketPool[] = [];
  const now = new Date().toISOString();
  address = address.toLowerCase();
  for (const pool of list(obj(gecko)['data'])) {
    const a = obj(pool['attributes']);
    const r = obj(pool['relationships']);
    if (pool['id'] !== 'arc_' + String(a['address']).toLowerCase() || !poolAddress(a['address']))
      continue;
    const base = obj(obj(r['base_token'])['data'])['id'];
    const quote = obj(obj(r['quote_token'])['data'])['id'];
    if (base !== 'arc_' + address && quote !== 'arc_' + address) continue;
    result.push({
      address: a['address'].toLowerCase(),
      source: 'GeckoTerminal',
      url: `https://www.geckoterminal.com/arc/pools/${a['address']}`,
      dex: clean(obj(obj(r['dex'])['data'])['id']),
      pair: clean(a['name']),
      priceUsd: finiteValue(
        a[base === 'arc_' + address ? 'base_token_price_usd' : 'quote_token_price_usd'],
      ),
      liquidityUsd: finiteValue(a['reserve_in_usd']),
      volume24hUsd: finiteValue(obj(a['volume_usd'])['h24']),
      change24h:
        base === 'arc_' + address
          ? finiteValue(obj(a['price_change_percentage'])['h24'], true)
          : null,
      observedAt: now,
    });
  }
  for (const pool of list(dex)) {
    if (pool['chainId'] !== 'arc' || !poolAddress(pool['pairAddress'])) continue;
    const base = obj(pool['baseToken']);
    const quote = obj(pool['quoteToken']);
    const isBase = String(base['address']).toLowerCase() === address;
    if (!isBase && String(quote['address']).toLowerCase() !== address) continue;
    const price = finiteValue(pool['priceUsd']);
    const ratio = finiteValue(pool['priceNative']);
    result.push({
      address: pool['pairAddress'].toLowerCase(),
      source: 'DEX Screener',
      url: `https://dexscreener.com/arc/${pool['pairAddress']}`,
      dex: clean(pool['dexId']),
      pair: `${clean(base['symbol'], 32)} / ${clean(quote['symbol'], 32)}`,
      priceUsd: isBase
        ? price
        : price !== null && ratio !== null && ratio > 0
          ? finiteValue(price / ratio)
          : null,
      liquidityUsd: finiteValue(obj(pool['liquidity'])['usd']),
      volume24hUsd: finiteValue(obj(pool['volume'])['h24']),
      change24h: isBase ? finiteValue(obj(pool['priceChange'])['h24'], true) : null,
      observedAt: now,
    });
  }
  return [...new Map(result.map((p) => [p.source + ':' + p.address, p])).values()]
    .sort((a, b) => (b.liquidityUsd || 0) - (a.liquidityUsd || 0))
    .slice(0, 40);
}
export function normalizeCandles(value: unknown): AssetDetail['history'] {
  if (!Array.isArray(value)) return [];
  const rows = new Map<number, AssetDetail['history'][number]>();
  for (const row of value.slice(0, 100)) {
    if (!Array.isArray(row) || row.length < 6) continue;
    const values = row.slice(0, 6).map((v) => finiteValue(v));
    if (values.some((v) => v === null)) continue;
    const [timestamp, open, high, low, close, volume] = values as number[];
    if (
      !Number.isInteger(timestamp) ||
      timestamp < 1 ||
      timestamp > Date.now() / 1000 + 300 ||
      Math.min(open, close, low) <= 0 ||
      high < Math.max(open, close, low) ||
      low > Math.min(open, close)
    )
      continue;
    rows.set(timestamp, { timestamp, open, high, low, close, volume });
  }
  return [...rows.values()].sort((a, b) => a.timestamp - b.timestamp);
}
