import { createAssetService, isAssetAddress, type AssetNetwork } from './asset-data.ts';

// Bounded per-process cache and admission control. No wallet or user identity is collected.
export function createAssetHandler(service = createAssetService(), now = Date.now) {
  const cache = new Map<string, { expires: number; value: unknown }>();
  const pending = new Map<string, Promise<unknown>>();
  let windowStart = now();
  let misses = 0;
  const response = (value: unknown, status = 200) =>
    Response.json(value, {
      status,
      headers: {
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
        ...(status === 429 ? { 'Retry-After': '60' } : {}),
      },
    });
  return async (request: Request): Promise<Response> => {
    if (request.method !== 'GET') return response({ error: 'Use GET for asset research.' }, 405);
    const url = new URL(request.url);
    const network = url.searchParams.get('network') || 'mainnet';
    const address = url.searchParams.get('address');
    const q = (url.searchParams.get('q') || '').trim();
    const page = Number(url.searchParams.get('page') || 1);
    if (
      !['mainnet', 'testnet'].includes(network) ||
      (address !== null
        ? !isAssetAddress(address)
        : q.length < 2 || q.length > 100 || /[\u0000-\u001f]/.test(q)) ||
      !Number.isInteger(page) ||
      page < 1 ||
      page > 10
    )
      return response(
        { error: 'Choose a network and enter a name, symbol, or valid contract address.' },
        400,
      );
    const key = JSON.stringify([network, address?.toLowerCase() || null, q.toLowerCase(), page]);
    const cached = cache.get(key);
    if (cached && cached.expires > now()) return response(cached.value);
    let work = pending.get(key);
    if (!work) {
      if (now() - windowStart >= 60_000) {
        windowStart = now();
        misses = 0;
      }
      if (pending.size >= 6 || misses >= 12)
        return response({ error: 'Asset providers are busy. Please retry in a minute.' }, 429);
      misses++;
      work = address
        ? service.inspect(network as AssetNetwork, address)
        : isAssetAddress(q)
          ? service.inspect(network as AssetNetwork, q).then((detail) => {
              if (cache.size >= 100) cache.delete(cache.keys().next().value!);
              // The detail request uses an empty query component in its cache key.
              cache.set(JSON.stringify([network, q.toLowerCase(), '', 1]), {
                expires: now() + 60_000,
                value: detail,
              });
              return {
                network,
                query: q,
                items: detail.asset.sources.length ? [detail.asset] : [],
                sources: detail.sources,
                nextPage: null,
                observedAt: detail.observedAt,
              };
            })
          : service.search(network as AssetNetwork, q, page);
      pending.set(key, work);
    }
    try {
      const value = await work;
      if (cache.size >= 100) cache.delete(cache.keys().next().value!);
      cache.set(key, { expires: now() + 60_000, value });
      return response(value);
    } catch {
      return response({ error: 'Asset data is temporarily unavailable. Please retry.' }, 502);
    } finally {
      if (pending.get(key) === work) pending.delete(key);
    }
  };
}
