import type { StockWallet } from "./stock-wallet";

export const ARC_CHAIN = "0x13b2";
export const ARC_USDC = "0x3600000000000000000000000000000000000000";
export const ARC_BRIDGE = "0xB3FA262d0fB521cc93bE83d87b322b8A23DAf3F0";
export const FUNDING_STORAGE = "arcwell.arc-stock-funding.v1";
export const isHash = (v: unknown): v is string =>
  typeof v === "string" && /^0x[\da-f]{64}$/i.test(v);
export const isAddress = (v: unknown): v is string =>
  typeof v === "string" && /^0x[\da-f]{40}$/i.test(v);
export function usdcUnits(value: string): bigint {
  if (!/^(0|[1-9]\d{0,12})(\.\d{1,6})?$/.test(value))
    throw new Error("Enter a USDC amount with up to six decimals.");
  const [whole, fraction = ""] = value.split(".");
  return BigInt(whole) * 1000000n + BigInt(fraction.padEnd(6, "0"));
}
export function usdcDisplay(value: bigint): string {
  return (
    `${value / 1000000n}.${(value % 1000000n).toString().padStart(6, "0")}`.replace(/\.?0+$/, "") ||
    "0"
  );
}
export type FundingRecord = {
  wallet: string;
  amount: string;
  maxFee: string;
  startedAt: number;
  burnHash?: string;
  approvalHash?: string;
  mintHash?: string;
  stage: "submitting" | "pending" | "complete" | "reverted";
};
export function parseFundingRecord(raw: string | null): FundingRecord | null {
  if (!raw) return null;
  const r = JSON.parse(raw) as FundingRecord;
  if (
    !r ||
    !isAddress(r.wallet) ||
    !Number.isFinite(r.startedAt) ||
    !["submitting", "pending", "complete", "reverted"].includes(r.stage) ||
    usdcUnits(r.amount) <= 0n ||
    usdcUnits(r.maxFee) >= usdcUnits(r.amount) ||
    [r.burnHash, r.approvalHash, r.mintHash].some((h) => h !== undefined && !isHash(h))
  )
    throw new Error("Saved funding information could not be verified.");
  return r;
}
export async function verifyArcWallet(wallet: StockWallet, address: string) {
  const [chain, accounts] = await Promise.all([
    wallet.request({ method: "eth_chainId" }),
    wallet.request({ method: "eth_accounts" }),
  ]);
  if (
    chain !== ARC_CHAIN ||
    !Array.isArray(accounts) ||
    String(accounts[0]).toLowerCase() !== address.toLowerCase()
  )
    throw new Error("Reconnect the same wallet on Arc Mainnet and review fees again.");
}
export function forwardingHash(data: unknown, record: FundingRecord): string | null {
  const payload = data as {
    messages?: Array<{
      forwardState?: string;
      forwardTxHash?: string;
      decodedMessage?: {
        sourceDomain?: string;
        destinationDomain?: string;
        decodedMessageBody?: {
          mintRecipient?: string;
          amount?: string;
          burnToken?: string;
          messageSender?: string;
        };
      };
    }>;
  };
  for (const m of payload?.messages || []) {
    const d = m.decodedMessage,
      b = d?.decodedMessageBody;
    const addr = (s?: string) => s?.toLowerCase().replace(/^0x0{24}/, "0x");
    if (
      String(d?.sourceDomain) === "26" &&
      String(d?.destinationDomain) === "0" &&
      addr(b?.mintRecipient) === record.wallet.toLowerCase() &&
      addr(b?.messageSender) === ARC_BRIDGE.toLowerCase() &&
      addr(b?.burnToken) === ARC_USDC.toLowerCase() &&
      b?.amount === usdcUnits(record.amount).toString() &&
      ["CONFIRMED", "COMPLETE"].includes(m.forwardState || "") &&
      isHash(m.forwardTxHash)
    )
      return m.forwardTxHash;
  }
  return null;
}

// Fixed Circle Bridge Kit route: no developer fee, same wallet, Ethereum domain 0.
export function fundingCalldata(record: Pick<FundingRecord, "wallet" | "amount" | "maxFee">) {
  const word = (value: bigint | string) =>
    typeof value === "bigint"
      ? value.toString(16).padStart(64, "0")
      : value.slice(2).toLowerCase().padStart(64, "0");
  return (
    "0x513e1175" +
    [
      usdcUnits(record.amount),
      usdcUnits(record.maxFee),
      0n,
      record.wallet,
      0n,
      ARC_USDC,
      ARC_BRIDGE,
      0n,
      2000n,
      320n,
      32n,
    ]
      .map(word)
      .join("") +
    "636374702d666f7277617264".padEnd(64, "0")
  );
}
export function assertFundingTransaction(
  tx: { from?: string; to?: string; value?: string; data?: string },
  record: Pick<FundingRecord, "wallet" | "amount" | "maxFee">,
): "approval" | "burn" {
  if (tx.from?.toLowerCase() !== record.wallet.toLowerCase() || BigInt(tx.value || "0") !== 0n)
    throw new Error("Unexpected funding sender or native value.");
  const approval =
    "0x095ea7b3" +
    ARC_BRIDGE.slice(2).toLowerCase().padStart(64, "0") +
    usdcUnits(record.amount).toString(16).padStart(64, "0");
  if (tx.to?.toLowerCase() === ARC_USDC.toLowerCase() && tx.data?.toLowerCase() === approval)
    return "approval";
  if (
    tx.to?.toLowerCase() === ARC_BRIDGE.toLowerCase() &&
    tx.data?.toLowerCase() === fundingCalldata(record)
  )
    return "burn";
  throw new Error(
    "Funding transaction did not match the reviewed recipient, amount, fees and Circle route.",
  );
}
