import { STOCK_CATALOG } from './stock-catalog.ts';
// Ethereum deployments are synced from the issuer-maintained token list.
// Never infer a token address from a stock ticker or use paper-book balances here.
export const STOCK_CHAIN_ID = 1;
export const STOCK_USDC = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
export const STOCK_PERMIT2 = '0x000000000022d473030f116ddee9f6b43ac78ba3';
export const STOCK_ASSETS = STOCK_CATALOG;

export type StockIntent = {
  symbol: string;
  side: 'buy' | 'sell';
  amount: string;
  wallet: string;
};

export function stockUnits(value: string, decimals: number): string {
  if (!/^(0|[1-9]\d{0,40})(\.\d+)?$/.test(value))
    throw new Error('Enter a positive decimal amount.');
  const [whole, fraction = ''] = value.split('.');
  if (fraction.length > decimals) throw new Error(`Use at most ${decimals} decimal places.`);
  const units = BigInt(whole + fraction.padEnd(decimals, '0'));
  if (units <= 0n || units >= 2n ** 160n) throw new Error('Amount is outside the supported range.');
  return units.toString();
}

export function stockDisplay(units: string, decimals: number): string {
  if (!/^\d+$/.test(units)) throw new Error('Invalid token amount.');
  const value = units.padStart(decimals + 1, '0');
  const tail = value.slice(-decimals).replace(/0+$/, '');
  return value.slice(0, -decimals) + (tail ? '.' + tail : '');
}

export function stockPair(intent: StockIntent) {
  const asset = STOCK_ASSETS.find((item) => item.symbol === intent.symbol);
  if (!asset || !['buy', 'sell'].includes(intent.side)) throw new Error('Unsupported stock pair.');
  if (!/^0x[0-9a-fA-F]{40}$/.test(intent.wallet) || /^0x0{40}$/.test(intent.wallet))
    throw new Error('Connect a valid wallet.');
  const buy = intent.side === 'buy';
  return {
    asset,
    input: buy ? STOCK_USDC : asset.address,
    output: buy ? asset.address : STOCK_USDC,
    inputDecimals: buy ? 6 : asset.decimals,
    outputDecimals: buy ? asset.decimals : 6,
    amount: stockUnits(intent.amount, buy ? 6 : asset.decimals),
  };
}

export type StockQuote = {
  ticket: string;
  statusTicket: string;
  orderId: string;
  intent: StockIntent;
  expiresAt: number;
  deadline: number;
  minimum: string;
  outputSymbol: string;
  typedData: Record<string, unknown>;
};

export type StockOrderStatus = {
  orderId: string;
  status:
    | 'open'
    | 'unverified'
    | 'filled'
    | 'expired'
    | 'error'
    | 'cancelled'
    | 'insufficient-funds'
    | 'unknown';
  txHash?: string;
};
