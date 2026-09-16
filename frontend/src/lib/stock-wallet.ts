import { STOCK_PERMIT2, stockPair, type StockIntent } from "../../../src/stock-trading.ts";

export type StockWallet = {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
  on?: (event: string, listener: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, listener: (...args: unknown[]) => void) => void;
};
const padAddress = (address: string) => address.slice(2).toLowerCase().padStart(64, "0");

export async function verifyStockWallet(wallet: StockWallet, address: string) {
  const [chain, accounts] = await Promise.all([
    wallet.request({ method: "eth_chainId" }),
    wallet.request({ method: "eth_accounts" }),
  ]);
  if (chain !== "0x1")
    throw new Error(
      "Switch to Ethereum Mainnet to place the stock order. Use the Arc funding panel first to transfer Arc USDC.",
    );
  if (!Array.isArray(accounts) || String(accounts[0]).toLowerCase() !== address.toLowerCase())
    throw new Error("Your wallet account changed. Reconnect and request a fresh quote.");
}

export async function stockFunding(wallet: StockWallet, intent: StockIntent) {
  await verifyStockWallet(wallet, intent.wallet);
  const pair = stockPair(intent);
  const read = async (data: string) => {
    const value = await wallet.request({
      method: "eth_call",
      params: [{ to: pair.input, data }, "latest"],
    });
    if (typeof value !== "string" || !/^0x[\da-fA-F]{64}$/.test(value))
      throw new Error("Could not read the token balance or allowance.");
    return BigInt(value);
  };
  const [balance, allowance] = await Promise.all([
    read("0x70a08231" + padAddress(intent.wallet)),
    read("0xdd62ed3e" + padAddress(intent.wallet) + padAddress(STOCK_PERMIT2)),
  ]);
  return {
    sufficient: balance >= BigInt(pair.amount),
    approved: allowance >= BigInt(pair.amount),
    balance: balance.toString(),
  };
}

// Only the selected input token and canonical Permit2 may receive an approval.
// No transaction calldata or spender is accepted from a remote quote or caller.
export function stockApproval(intent: StockIntent) {
  const pair = stockPair(intent);
  return {
    from: intent.wallet,
    to: pair.input,
    value: "0x0",
    chainId: "0x1",
    data:
      "0x095ea7b3" + padAddress(STOCK_PERMIT2) + BigInt(pair.amount).toString(16).padStart(64, "0"),
  };
}
