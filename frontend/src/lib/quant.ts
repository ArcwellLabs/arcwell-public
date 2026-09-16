// Deterministic research fixtures. These are not market feeds or investment forecasts.
export const SNAPSHOT = "2026-09-08";
export type Instrument = {
  symbol: string;
  name: string;
  sector: string;
  price: number;
  quantity: number;
  seed: number;
  sigma: number;
  drift: number;
};
export const INSTRUMENTS: Instrument[] = [
  {
    symbol: "NVDA",
    name: "NVIDIA",
    sector: "Technology",
    price: 172.4,
    quantity: 50,
    seed: 41,
    sigma: 0.025,
    drift: 0.0015,
  },
  {
    symbol: "AAPL",
    name: "Apple",
    sector: "Technology",
    price: 230,
    quantity: 20,
    seed: 62,
    sigma: 0.016,
    drift: 0.0006,
  },
  {
    symbol: "SPY",
    name: "S&P 500 fund",
    sector: "Equity funds",
    price: 520,
    quantity: 20,
    seed: 83,
    sigma: 0.011,
    drift: 0.0005,
  },
  {
    symbol: "TBILL",
    name: "Treasury fund",
    sector: "Fixed income",
    price: 100,
    quantity: 61.2,
    seed: 104,
    sigma: 0.0003,
    drift: 0.00016,
  },
  {
    symbol: "MSFT",
    name: "Microsoft",
    sector: "Technology",
    price: 425,
    quantity: 0,
    seed: 125,
    sigma: 0.017,
    drift: 0.0009,
  },
  {
    symbol: "GOOGL",
    name: "Alphabet",
    sector: "Technology",
    price: 185,
    quantity: 0,
    seed: 146,
    sigma: 0.021,
    drift: 0.0007,
  },
  {
    symbol: "AMZN",
    name: "Amazon",
    sector: "Consumer",
    price: 215,
    quantity: 0,
    seed: 167,
    sigma: 0.022,
    drift: 0.0006,
  },
  {
    symbol: "TSLA",
    name: "Tesla",
    sector: "Consumer",
    price: 310,
    quantity: 0,
    seed: 188,
    sigma: 0.033,
    drift: 0.0003,
  },
  {
    symbol: "GLD",
    name: "Gold fund",
    sector: "Commodities",
    price: 245,
    quantity: 0,
    seed: 209,
    sigma: 0.01,
    drift: 0.0004,
  },
  {
    symbol: "SLV",
    name: "Silver fund",
    sector: "Commodities",
    price: 32,
    quantity: 0,
    seed: 230,
    sigma: 0.022,
    drift: 0.0003,
  },
  {
    symbol: "JPM",
    name: "JPMorgan Chase",
    sector: "Financials",
    price: 265,
    quantity: 0,
    seed: 251,
    sigma: 0.015,
    drift: 0.0004,
  },
  {
    symbol: "V",
    name: "Visa",
    sector: "Financials",
    price: 340,
    quantity: 0,
    seed: 272,
    sigma: 0.012,
    drift: 0.0005,
  },
  {
    symbol: "XOM",
    name: "Exxon Mobil",
    sector: "Energy",
    price: 110,
    quantity: 0,
    seed: 293,
    sigma: 0.017,
    drift: 0.0001,
  },
  {
    symbol: "XLV",
    name: "Healthcare fund",
    sector: "Equity funds",
    price: 150,
    quantity: 0,
    seed: 314,
    sigma: 0.009,
    drift: 0.0003,
  },
  {
    symbol: "QQQ",
    name: "Nasdaq 100 fund",
    sector: "Equity funds",
    price: 540,
    quantity: 0,
    seed: 335,
    sigma: 0.015,
    drift: 0.0007,
  },
  {
    symbol: "IWM",
    name: "Small-cap fund",
    sector: "Equity funds",
    price: 225,
    quantity: 0,
    seed: 356,
    sigma: 0.018,
    drift: 0.0002,
  },
];
export function rng(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function normal(random: () => number) {
  return Math.sqrt(-2 * Math.log(Math.max(1e-12, random()))) * Math.cos(2 * Math.PI * random());
}
export const mean = (a: number[]) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : 0);
export const deviation = (a: number[]) => {
  const m = mean(a);
  return a.length > 1 ? Math.sqrt(a.reduce((s, v) => s + (v - m) ** 2, 0) / (a.length - 1)) : 0;
};
export function correlation(a: number[], b: number[]) {
  const n = Math.min(a.length, b.length);
  if (n < 2) return 0;
  const x = a.slice(-n),
    y = b.slice(-n),
    mx = mean(x),
    my = mean(y);
  const denominator = Math.sqrt(
    x.reduce((s, v) => s + (v - mx) ** 2, 0) * y.reduce((s, v) => s + (v - my) ** 2, 0),
  );
  return denominator ? x.reduce((s, v, i) => s + (v - mx) * (y[i] - my), 0) / denominator : 0;
}
export function quantile(a: number[], q: number) {
  const s = [...a].sort((x, y) => x - y);
  if (!s.length) return 0;
  const pos = Math.max(0, Math.min(1, q)) * (s.length - 1),
    i = Math.floor(pos);
  return s[i] + (s[Math.min(i + 1, s.length - 1)] - s[i]) * (pos - i);
}
export type Candle = {
  day: number;
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};
const SAMPLE_DATES: string[] = [];
for (
  const date = new Date(`${SNAPSHOT}T00:00:00Z`);
  SAMPLE_DATES.length < 253;
  date.setUTCDate(date.getUTCDate() - 1)
) {
  if (date.getUTCDay() !== 0 && date.getUTCDay() !== 6)
    SAMPLE_DATES.push(date.toISOString().slice(0, 10));
}
SAMPLE_DATES.reverse();
function history(asset: Instrument): Candle[] {
  const random = rng(asset.seed),
    market = rng(709);
  const values = [100];
  for (let i = 1; i < 253; i++)
    values.push(
      values[i - 1] *
        Math.exp(asset.drift + asset.sigma * (normal(random) * 0.7 + normal(market) * 0.7)),
    );
  const scale = asset.price / values[252];
  return values.map((value, i) => {
    const close = value * scale,
      open = values[Math.max(0, i - 1)] * scale;
    const date = SAMPLE_DATES[i];
    return {
      day: i,
      date,
      open,
      close,
      high: Math.max(open, close) * (1 + random() * asset.sigma * 0.5),
      low: Math.min(open, close) * (1 - random() * asset.sigma * 0.5),
      volume: Math.round(20000 + random() * 1800000),
    };
  });
}
export const HISTORIES = Object.fromEntries(
  INSTRUMENTS.map((a) => [a.symbol, history(a)]),
) as Record<string, Candle[]>;
export const returns = (values: number[]) =>
  values.slice(1).map((v, i) => (values[i] ? v / values[i] - 1 : 0));
export function drawdowns(values: number[]) {
  let peak = values[0] || 1;
  return values.map((v) => {
    peak = Math.max(peak, v);
    return v / peak - 1;
  });
}
export function statistics(values: number[]) {
  const r = returns(values);
  return {
    total: values.length > 1 ? values[values.length - 1] / values[0] - 1 : 0,
    volatility: deviation(r) * Math.sqrt(252),
    annualReturn: mean(r) * 252,
    drawdown: Math.min(0, ...drawdowns(values)),
    var95: Math.max(0, -quantile(r, 0.05)),
    sharpe: deviation(r) ? (mean(r) * 252 - 0.04) / (deviation(r) * Math.sqrt(252)) : 0,
  };
}
export function sma(values: number[], period: number) {
  return values.map((_, i) => (i < period - 1 ? null : mean(values.slice(i - period + 1, i + 1))));
}
export function rsi(values: number[], period = 14) {
  return values.map((_, i) => {
    if (i < period) return null;
    const differences = values
      .slice(i - period + 1, i + 1)
      .map((v, j) => v - values[i - period + j]);
    const up = mean(differences.map((v) => Math.max(0, v))),
      down = mean(differences.map((v) => Math.max(0, -v)));
    return down === 0 ? (up === 0 ? 50 : 100) : 100 - 100 / (1 + up / down);
  });
}
export type PaperTrade = {
  id: string;
  at: string;
  symbol: string;
  side: "buy" | "sell";
  quantity: number;
  price: number;
  total: number;
  status: "paper fill";
};
export type PaperBook = {
  version: 1;
  cash: number;
  positions: Record<string, number>;
  trades: PaperTrade[];
};
export function initialBook(): PaperBook {
  return {
    version: 1,
    cash: 2740,
    positions: Object.fromEntries(INSTRUMENTS.map((a) => [a.symbol, a.quantity])),
    trades: [],
  };
}
export function validBook(value: unknown): value is PaperBook {
  if (!value || typeof value !== "object") return false;
  const b = value as PaperBook;
  return (
    b.version === 1 &&
    Number.isFinite(b.cash) &&
    b.cash >= 0 &&
    !!b.positions &&
    INSTRUMENTS.every(
      (a) => Number.isFinite(b.positions[a.symbol]) && b.positions[a.symbol] >= 0,
    ) &&
    Array.isArray(b.trades) &&
    b.trades.length <= 500 &&
    b.trades.every(
      (t) =>
        !!t &&
        typeof t === "object" &&
        INSTRUMENTS.some((a) => a.symbol === t.symbol) &&
        ["buy", "sell"].includes(t.side) &&
        t.status === "paper fill" &&
        typeof t.id === "string" &&
        typeof t.at === "string" &&
        [t.quantity, t.price, t.total].every((n) => Number.isFinite(n) && n > 0),
    )
  );
}
export function fillPaperOrder(
  book: PaperBook,
  symbol: string,
  side: "buy" | "sell",
  quantity: number,
  id: string,
  at: string,
): PaperBook {
  const a = INSTRUMENTS.find((x) => x.symbol === symbol);
  if (!["buy", "sell"].includes(side)) throw new Error("Invalid order side.");
  if (!a || !Number.isFinite(quantity) || quantity <= 0 || quantity > 1e7)
    throw new Error("Enter a valid quantity.");
  const units = Math.round(quantity * 1e6) / 1e6;
  if (Math.abs(units - quantity) > 1e-10) throw new Error("Use at most six decimal places.");
  if (units <= 0) throw new Error("Minimum quantity is 0.000001.");
  const total = Math.round(units * a.price * 1e6) / 1e6;
  if (side === "buy" && total > book.cash + 1e-8) throw new Error("Insufficient paper cash.");
  if (side === "sell" && units > (book.positions[symbol] || 0) + 1e-8)
    throw new Error("Insufficient paper holdings.");
  if (book.trades.length >= 500) throw new Error("Export and reset the paper account to continue.");
  return {
    ...book,
    cash: Math.max(0, Math.round((book.cash + (side === "buy" ? -total : total)) * 1e6) / 1e6),
    positions: {
      ...book.positions,
      [symbol]: Math.max(
        0,
        Math.round(((book.positions[symbol] || 0) + (side === "buy" ? units : -units)) * 1e6) / 1e6,
      ),
    },
    trades: [
      { id, at, symbol, side, quantity: units, price: a.price, total, status: "paper fill" },
      ...book.trades,
    ],
  };
}
export const bookValue = (book: PaperBook) =>
  book.cash + INSTRUMENTS.reduce((s, a) => s + (book.positions[a.symbol] || 0) * a.price, 0);
export function portfolioHistory(book: PaperBook) {
  return HISTORIES["SPY"].map((c, i) => ({
    date: c.date,
    value:
      book.cash +
      INSTRUMENTS.reduce(
        (s, a) => s + (book.positions[a.symbol] || 0) * HISTORIES[a.symbol][i].close,
        0,
      ),
  }));
}
export function allocationCloud(count = 240) {
  const random = rng(875),
    assets = INSTRUMENTS.slice(0, 4),
    rr = assets.map((a) => returns(HISTORIES[a.symbol].map((c) => c.close)));
  return Array.from({ length: count }, (_, i) => {
    const raw = assets.map(() => -Math.log(Math.max(1e-9, random()))),
      sum = raw.reduce((a, b) => a + b, 0),
      weights = raw.map((v) => v / sum);
    const daily = rr[0].map((_, d) => rr.reduce((s, r, j) => s + r[d] * weights[j], 0));
    return {
      id: `mix-${i}`,
      weights,
      volatility: deviation(daily) * Math.sqrt(252) * 100,
      annualReturn: mean(daily) * 252 * 100,
    };
  });
}
function cdf(x: number) {
  const t = 1 / (1 + 0.2316419 * Math.abs(x)),
    d = 0.3989422804 * Math.exp((-x * x) / 2);
  const p =
    1 -
    d *
      t *
      (0.31938153 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  return x >= 0 ? p : 1 - p;
}
export function optionPrice(
  spot: number,
  strike: number,
  days: number,
  volatility: number,
  rate = 0.04,
) {
  if (days <= 0) return Math.max(spot - strike, 0);
  if (volatility <= 0) return Math.max(spot - strike * Math.exp((-rate * days) / 365), 0);
  const t = days / 365,
    d1 =
      (Math.log(spot / strike) + (rate + (volatility * volatility) / 2) * t) /
      (volatility * Math.sqrt(t)),
    d2 = d1 - volatility * Math.sqrt(t);
  return spot * cdf(d1) - strike * Math.exp(-rate * t) * cdf(d2);
}
export function simulatePaths(
  initial: number,
  annualReturn: number,
  volatility: number,
  days: number,
  count = 240,
) {
  const random = rng(4711);
  const paths = Array.from({ length: count }, () => {
    const p = [initial];
    for (let d = 1; d <= days; d++)
      p.push(
        p[d - 1] *
          Math.exp(
            (annualReturn - (volatility * volatility) / 2) / 252 +
              (volatility / Math.sqrt(252)) * normal(random),
          ),
      );
    return p;
  });
  return Array.from({ length: days + 1 }, (_, day) => {
    const v = paths.map((p) => p[day]);
    return { day, low: quantile(v, 0.1), median: quantile(v, 0.5), high: quantile(v, 0.9) };
  });
}
export function downloadCsv(name: string, rows: (string | number)[][]) {
  const text = rows
    .map((row) => row.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(","))
    .join("\n");
  const url = URL.createObjectURL(new Blob([text], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const INVESTING_VIEWS = [
  "portfolio",
  "markets",
  "trading",
  "risk",
  "quant",
  "funding",
  "ledger",
];
