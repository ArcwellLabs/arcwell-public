import { createHmac, timingSafeEqual } from "node:crypto";
import sdk from "./stock-sdk.cjs";
const { UnsignedV2DutchOrder, REACTOR_ADDRESS_MAPPING, OrderType } = sdk;
import { z } from "zod";
import {
  STOCK_CHAIN_ID,
  STOCK_PERMIT2,
  stockPair,
  stockDisplay,
  type StockIntent,
} from "../../../src/stock-trading.ts";

const API = "https://trade-api.gateway.uniswap.org/v1";
const ZERO = "0x0000000000000000000000000000000000000000";
const intentSchema = z
  .object({
    symbol: z.string().max(10),
    side: z.enum(["buy", "sell"]),
    amount: z.string().max(65),
    wallet: z.string().regex(/^0x[\da-fA-F]{40}$/),
  })
  .strict();
const bodySchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("quote"), intent: intentSchema }).strict(),
  z
    .object({
      action: z.literal("order"),
      ticket: z.string().max(65000),
      signature: z.string().regex(/^0x[\da-fA-F]{130}$/),
    })
    .strict(),
  z.object({ action: z.literal("status"), ticket: z.string().max(2000) }).strict(),
]);
const providerQuoteSchema = z
  .object({
    routing: z.literal("DUTCH_V2"),
    quote: z
      .object({
        encodedOrder: z
          .string()
          .regex(/^0x[\da-fA-F]+$/)
          .max(30000),
        orderId: z.string().min(1).max(200),
      })
      .passthrough(),
  })
  .passthrough();
const ticketSchema = z.object({
  kind: z.literal("quote"),
  expiresAt: z.number(),
  intent: intentSchema,
  response: providerQuoteSchema,
});
const statusSchema = z.object({
  kind: z.literal("status"),
  expiresAt: z.number(),
  orderId: z.string().min(1).max(200),
  wallet: z.string(),
});
const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

// Derive what the wallet signs and what the customer reviews from the SAME encoded order.
// Do not trust provider display fields or a caller-supplied EIP-712 payload.
export function validateStockQuote(raw: unknown, intent: StockIntent, now = Date.now()) {
  const response = providerQuoteSchema.parse(raw);
  const pair = stockPair(intent);
  const order = UnsignedV2DutchOrder.parse(
    response.quote.encodedOrder,
    STOCK_CHAIN_ID,
    STOCK_PERMIT2,
  );
  const info = order.toJSON();
  if (
    !same(info.reactor, REACTOR_ADDRESS_MAPPING[1][OrderType.Dutch_V2] || "") ||
    !same(info.swapper, intent.wallet) ||
    !same(info.input.token, pair.input) ||
    info.input.startAmount !== pair.amount ||
    info.input.endAmount !== pair.amount ||
    !same(info.additionalValidationContract, ZERO) ||
    info.additionalValidationData !== "0x" ||
    !Number.isSafeInteger(info.deadline) ||
    info.deadline * 1000 <= now + 10000 ||
    info.deadline * 1000 > now + 1800000 ||
    !info.outputs.length ||
    info.outputs.length > 4
  ) {
    throw new Error("Provider order does not match this trade.");
  }
  let minimum = 0n;
  for (const output of info.outputs) {
    if (
      !same(output.token, pair.output) ||
      !same(output.recipient, intent.wallet) ||
      BigInt(output.endAmount) <= 0n ||
      BigInt(output.startAmount) < BigInt(output.endAmount)
    )
      throw new Error("Provider output does not match this trade.");
    minimum += BigInt(output.endAmount);
  }
  const permit = order.permitData();
  // ethers BigNumbers need decimal strings for eth_signTypedData_v4.
  const plain = (value: unknown): unknown => {
    if (value && typeof value === "object") {
      if ("_isBigNumber" in value && value._isBigNumber) return String(value);
      if (Array.isArray(value)) return value.map(plain);
      return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, plain(entry)]));
    }
    return value;
  };
  const typedData = plain({
    ...permit,
    message: permit.values,
    values: undefined,
    primaryType: "PermitWitnessTransferFrom",
    types: {
      ...permit.types,
      EIP712Domain: [
        { name: "name", type: "string" },
        { name: "chainId", type: "uint256" },
        { name: "verifyingContract", type: "address" },
      ],
    },
  });
  return {
    response,
    order,
    typedData,
    deadline: info.deadline * 1000,
    minimum: stockDisplay(minimum.toString(), pair.outputDecimals),
    outputSymbol: intent.side === "buy" ? pair.asset.symbol : "USDC",
  };
}

class TradingError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export function createStockTradingHandler(
  options: {
    apiKey?: string;
    enabled?: boolean;
    fetcher?: typeof fetch;
    now?: () => number;
    development?: boolean;
  } = {},
) {
  const fetcher = options.fetcher || fetch;
  const now = options.now || Date.now;
  const key = options.apiKey;
  const ready = Boolean(key && options.enabled);
  const sign = (text: string) =>
    createHmac("sha256", key!)
      .update("arcwell-stock-v1\0" + text)
      .digest("base64url");
  const seal = (data: unknown) => {
    const value = Buffer.from(JSON.stringify(data)).toString("base64url");
    return value + "." + sign(value);
  };
  const unseal = (ticket: string): unknown => {
    const [value, mac, extra] = ticket.split(".");
    if (!value || !mac || extra)
      throw new TradingError("Invalid trade session. Request a new quote.", 400);
    const expected = Buffer.from(sign(value));
    const actual = Buffer.from(mac);
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual))
      throw new TradingError("Invalid trade session. Request a new quote.", 400);
    return JSON.parse(Buffer.from(value, "base64url").toString());
  };
  let windowStart = 0,
    requestCount = 0;
  const upstream = async (path: string, body?: unknown, onDispatch?: () => void) => {
    if (now() - windowStart >= 1000) {
      windowStart = now();
      requestCount = 0;
    }
    if (++requestCount > 5)
      throw new TradingError("Trading is busy. Please try again shortly.", 429);
    onDispatch?.();
    const response = await fetcher(API + path, {
      method: body ? "POST" : "GET",
      headers: {
        "x-api-key": key!,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(15000),
      redirect: "error",
    });
    if (!response.ok) {
      if ([401, 403].includes(response.status))
        throw new TradingError("Trading is currently unavailable for this request.", 503);
      if ([400, 404, 422].includes(response.status))
        throw new TradingError(
          "Uniswap could not provide or accept this trade. Check the amount, funds and current availability.",
          422,
        );
      throw new TradingError(
        "Uniswap is temporarily unavailable. Check order status before retrying a submission.",
        502,
      );
    }
    return response.json();
  };
  const json = (data: unknown, status = 200) =>
    Response.json(data, {
      status,
      headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
    });
  return async (request: Request) => {
    if (request.method === "GET") return json({ ready, network: "Ethereum", chainId: 1 });
    if (request.method !== "POST") return json({ error: "Method not allowed." }, 405);
    const allowed = ["https://www.arcwellfi.com", "https://arcwellfi.com"];
    if (options.development) allowed.push("http://127.0.0.1:5180", "http://localhost:5180");
    if (
      !allowed.includes(request.headers.get("origin") || "") ||
      !request.headers.get("content-type")?.startsWith("application/json")
    )
      return json(
        { error: "Request origin or content type is not supported.", notSubmitted: true },
        403,
      );
    if (!key)
      return json(
        { error: "Tokenized stock trading is not connected yet.", notSubmitted: true },
        503,
      );
    let orderSent = false;
    try {
      const reader = request.body?.getReader();
      if (!reader) throw new TradingError("Missing request body.", 400);
      const chunks: Uint8Array[] = [];
      let size = 0;
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        size += value.length;
        if (size > 96000) {
          await reader.cancel();
          throw new TradingError("Request is too large.", 413);
        }
        chunks.push(value);
      }
      const body = bodySchema.parse(JSON.parse(Buffer.concat(chunks).toString()));
      if (!ready && body.action !== "status")
        return json(
          { error: "Tokenized stock trading is not connected yet.", notSubmitted: true },
          503,
        );
      if (body.action === "quote") {
        const pair = stockPair(body.intent);
        const raw = await upstream("/quote", {
          type: "EXACT_INPUT",
          tokenInChainId: 1,
          tokenOutChainId: 1,
          tokenIn: pair.input,
          tokenOut: pair.output,
          amount: pair.amount,
          swapper: body.intent.wallet,
          recipient: body.intent.wallet,
          protocols: ["UNISWAPX_V2"],
          permitAmount: "EXACT",
          slippageTolerance: 0.5,
        });
        const checked = validateStockQuote(raw, body.intent, now());
        const expiresAt = Math.min(now() + 60000, checked.deadline - 10000);
        const ticket = seal({
          kind: "quote",
          expiresAt,
          intent: body.intent,
          response: checked.response,
        });
        const statusTicket = seal({
          kind: "status",
          expiresAt: now() + 7 * 86400000,
          orderId: checked.response.quote.orderId,
          wallet: body.intent.wallet,
        });
        return json({
          ticket,
          statusTicket,
          intent: body.intent,
          orderId: checked.response.quote.orderId,
          expiresAt,
          deadline: checked.deadline,
          typedData: checked.typedData,
          minimum: checked.minimum,
          outputSymbol: checked.outputSymbol,
        });
      }
      if (body.action === "order") {
        const ticket = ticketSchema.parse(unseal(body.ticket));
        if (ticket.expiresAt <= now())
          throw new TradingError("Quote expired. Request a new quote.", 409);
        const checked = validateStockQuote(ticket.response, ticket.intent, now());
        if (!same(checked.order.getSigner(body.signature), ticket.intent.wallet))
          throw new TradingError("The signature does not match the quoted wallet.", 400);
        const raw = await upstream(
          "/order",
          {
            quote: checked.response.quote,
            routing: "DUTCH_V2",
            signature: body.signature,
          },
          () => {
            orderSent = true;
          },
        );
        if (raw.orderId !== checked.response.quote.orderId)
          throw new TradingError(
            "Submission needs reconciliation. Check the existing order status.",
            502,
          );
        return json({ orderId: raw.orderId, status: "open" });
      }
      const ticket = statusSchema.parse(unseal(body.ticket));
      if (ticket.expiresAt <= now()) throw new TradingError("Order lookup session expired.", 409);
      const raw = await upstream(
        "/orders?" +
          new URLSearchParams({ orderId: ticket.orderId, orderType: "Dutch_V2", limit: "1" }),
      );
      const order = Array.isArray(raw.orders)
        ? raw.orders.find((entry: { orderId?: string }) => entry.orderId === ticket.orderId)
        : null;
      if (!order) return json({ orderId: ticket.orderId, status: "unknown" });
      if (order.chainId !== 1 || (order.swapper && !same(order.swapper, ticket.wallet)))
        throw new TradingError("Order status could not be verified.", 502);
      const statuses = [
        "open",
        "unverified",
        "filled",
        "expired",
        "error",
        "cancelled",
        "insufficient-funds",
      ];
      return json({
        orderId: ticket.orderId,
        status: statuses.includes(order.orderStatus) ? order.orderStatus : "unknown",
        txHash: /^0x[\da-fA-F]{64}$/.test(order.txHash || "") ? order.txHash : undefined,
      });
    } catch (error) {
      if (error instanceof TradingError)
        return json({ error: error.message, notSubmitted: !orderSent }, error.status);
      if (error instanceof z.ZodError || error instanceof SyntaxError)
        return json(
          {
            error: "The trading request or provider response is invalid.",
            notSubmitted: !orderSent,
          },
          400,
        );
      return json(
        {
          error:
            "Trade verification failed. Check order status if you already signed, otherwise request a new quote.",
          notSubmitted: !orderSent,
        },
        502,
      );
    }
  };
}

export const handleStockTrading = createStockTradingHandler({
  apiKey: process.env["UNISWAP_API_KEY"],
  enabled: process.env["STOCK_TRADING_ENABLED"] === "true",
  development: process.env["NODE_ENV"] !== "production",
});
