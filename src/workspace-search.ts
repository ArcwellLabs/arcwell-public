import { STOCK_CATALOG } from './stock-catalog.ts';

export function searchStocks(query: string) {
  const term = query.trim().toLowerCase();
  if (!term) return STOCK_CATALOG;
  const rank = (item: (typeof STOCK_CATALOG)[number]) => {
    const symbol = item.symbol.toLowerCase();
    if (symbol === term || symbol.replace(/on$/, '') === term || item.address === term) return 0;
    if (item.name.toLowerCase() === term) return 1;
    if (symbol.startsWith(term) || item.name.toLowerCase().startsWith(term)) return 2;
    return 3;
  };
  return STOCK_CATALOG.filter((item) =>
    `${item.symbol} ${item.name} ${item.address}`.toLowerCase().includes(term),
  ).sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name));
}
