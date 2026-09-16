// Projects are separate from token contracts: a listing never establishes tradability.
export const ECOSYSTEM_URL = 'https://www.arc.io/ecosystem';
const LAUNCH_URL =
  'https://www.circle.com/pressroom/circle-launches-arc-mainnet-an-economic-operating-system-for-the-internet';
export type ArcProject = {
  id: string;
  name: string;
  status: 'ecosystem-listed' | 'launch-announced';
  sourceUrl: string;
  evidenceDate: string | null;
};
export type EcosystemSearch = {
  items: ArcProject[];
  total: number;
  observedAt: string | null;
  status: 'current' | 'stale' | 'unavailable';
  coverage: string;
};
const launchNames = [
  '1inch',
  'Aero',
  'Bankr',
  'Dinari',
  'Doppler',
  'edgeX',
  'Extended',
  'fomo',
  'Hibachi',
  'LI.FI',
  'o1.exchange',
  'pools.trade',
  'Pump.fun',
  'Robinhood',
  'Uniswap',
  'Aave',
  'Morpho',
];
const announcements: ArcProject[] = launchNames.map((name) => ({
  id: name.toLowerCase(),
  name,
  status: 'launch-announced',
  sourceUrl: LAUNCH_URL,
  evidenceDate: '2026-09-16',
}));
const decode = (s: string) =>
  s
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/g, '')
    .trim()
    .slice(0, 120);
export function parseEcosystemPage(html: string) {
  const items: ArcProject[] = [];
  // Parse only the observed official CMS card structure, never arbitrary external links.
  const cards = html.split(/<div\s+data-check=/).slice(1);
  for (const card of cards) {
    const path = card.match(/href="(\/ecosystem\/[a-z0-9-]+)"/i)?.[1];
    const name = decode(card.match(/<p class="subhead-large u-mb-0">([\s\S]*?)<\/p>/)?.[1] || '');
    if (path && name)
      items.push({
        id: name.toLowerCase(),
        name,
        status: 'ecosystem-listed',
        sourceUrl: 'https://www.arc.io' + path,
        evidenceDate: null,
      });
  }
  const nextLink = [...html.matchAll(/<a\b[^>]*>/g)].find((m) =>
    /aria-label="Next Page"/.test(m[0]),
  )?.[0];
  const candidate = nextLink?.match(/href="([^"]+)"/)?.[1];
  // Pagination cannot change host or endpoint, even if the upstream markup changes.
  if (candidate && !/^\?[a-z0-9]+_page=\d+$/.test(candidate))
    throw new Error('Invalid directory pagination');
  return { items, next: candidate ? ECOSYSTEM_URL + candidate : null };
}
export function createEcosystemService(fetcher: typeof fetch = fetch, now = Date.now) {
  let snapshot: ArcProject[] = [];
  let observedAt: string | null = null;
  let refreshAfter = 0;
  let available = false;
  let pending: Promise<void> | null = null;
  async function refresh() {
    try {
      const found = new Map<string, ArcProject>();
      const seen = new Set<string>();
      let url: string | null = ECOSYSTEM_URL;
      for (let page = 0; url && page < 10; page++) {
        if (seen.has(url)) throw new Error('Repeated directory page');
        seen.add(url);
        const response = await fetcher(url, {
          redirect: 'error',
          signal: AbortSignal.timeout(8000),
          headers: { Accept: 'text/html' },
        });
        if (!response.ok) throw new Error('Directory unavailable');
        const reader = response.body?.getReader();
        if (!reader) throw new Error('Empty directory response');
        const decoder = new TextDecoder();
        let html = '',
          length = 0;
        try {
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            length += value.length;
            if (length > 2_000_000) {
              await reader.cancel();
              throw new Error('Directory response too large');
            }
            html += decoder.decode(value, { stream: true });
          }
          html += decoder.decode();
        } finally {
          reader.releaseLock();
        }
        const parsed = parseEcosystemPage(html);
        if (!parsed.items.length) throw new Error('Directory format changed');
        for (const item of parsed.items) found.set(item.id, item);
        url = parsed.next;
      }
      if (url) throw new Error('Directory pagination limit reached');
      snapshot = [...found.values()];
      observedAt = new Date(now()).toISOString();
      available = true;
      refreshAfter = now() + 60 * 60_000;
    } catch {
      available = false;
      refreshAfter = now() + 5 * 60_000;
    }
  }
  return async (query = ''): Promise<EcosystemSearch> => {
    if (query.length > 100 || /[\u0000-\u001f]/.test(query)) throw new Error('Invalid search');
    if (now() >= refreshAfter) {
      pending ||= refresh().finally(() => {
        pending = null;
      });
      await pending;
    }
    const merged = new Map(snapshot.map((item) => [item.id, item]));
    for (const item of announcements) merged.set(item.id, item);
    const all = [...merged.values()].sort((a, b) => a.name.localeCompare(b.name));
    const q = query.trim().toLowerCase();
    return {
      items: all.filter((item) => item.name.toLowerCase().includes(q)),
      total: all.length,
      observedAt,
      status: available ? 'current' : observedAt ? 'stale' : 'unavailable',
      coverage:
        'Official Arc directory plus reviewed Circle launch announcements. Directory membership does not confirm a launch date, token contract, or trading availability. Unannounced and unlisted projects are not covered.',
    };
  };
}
