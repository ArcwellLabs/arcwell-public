export type StockAsset = {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  logoURI: string;
};
export const STOCK_CATALOG_URL =
  'https://raw.githubusercontent.com/ondoprotocol/ondo-global-markets-token-list/main/tokenlist.json';

// Only issuer-listed equity tokens on the execution chain enter the allowlist.
// Reject ambiguous identities instead of accepting a symbol/address collision.
export function parseStockCatalog(raw: unknown): StockAsset[] {
  if (!raw || typeof raw !== 'object' || !('tokens' in raw) || !Array.isArray(raw.tokens))
    throw new Error('Invalid issuer token list.');
  const symbols = new Set<string>();
  const addresses = new Set<string>();
  const assets: StockAsset[] = [];
  for (const value of raw.tokens) {
    if (!value || typeof value !== 'object') throw new Error('Invalid issuer token entry.');
    const token = value as Record<string, unknown>;
    if (token['chainId'] !== 1) continue;
    // The official list also includes dollar/yield tokens, which are not stocks/ETFs.
    if (token['symbol'] === 'USDon' || token['symbol'] === 'USDY') continue;
    if (
      typeof token['symbol'] !== 'string' ||
      !/^[A-Z0-9.]{1,12}on$/.test(token['symbol']) ||
      typeof token['name'] !== 'string' ||
      !token['name'].endsWith(' (Ondo Tokenized)') ||
      token['name'].length > 200 ||
      typeof token['address'] !== 'string' ||
      !/^0x[0-9a-fA-F]{40}$/.test(token['address']) ||
      /^0x0{40}$/.test(token['address']) ||
      !Number.isInteger(token['decimals']) ||
      Number(token['decimals']) < 0 ||
      Number(token['decimals']) > 36 ||
      typeof token['logoURI'] !== 'string' ||
      !/^https:\/\/cdn\.ondo\.finance\/tokens\/logos\/[a-z0-9_]+\.png$/.test(token['logoURI']) ||
      !Array.isArray(token['tags']) ||
      !token['tags'].includes('ondo')
    )
      throw new Error('Invalid Ethereum stock metadata in issuer list.');
    const symbol = token['symbol'];
    const address = token['address'].toLowerCase();
    if (symbols.has(symbol.toLowerCase()) || addresses.has(address))
      throw new Error('Duplicate issuer stock identity.');
    symbols.add(symbol.toLowerCase());
    addresses.add(address);
    assets.push({
      symbol,
      address,
      decimals: Number(token['decimals']),
      name: token['name'].replace(/ \(Ondo Tokenized\)$/, ''),
      logoURI: token['logoURI'],
    });
  }
  if (!assets.length) throw new Error('Issuer list has no Ethereum stock assets.');
  return assets.sort((a, b) => a.name.localeCompare(b.name, 'en'));
}
