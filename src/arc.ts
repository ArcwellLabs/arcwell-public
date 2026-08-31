// Source: https://docs.arc.io/integrate/connect-to-arc (2026-09-07).
export const ARC = Object.freeze({
  name: 'Arc Testnet',
  chainId: 5042002,
  rpcUrl: 'https://rpc.testnet.arc.io',
  explorerUrl: 'https://testnet.arcscan.app',
  faucetUrl: 'https://faucet.circle.com',
  nativeDecimals: 18,
  usdcDecimals: 6,
  usdcAddress: '0x3600000000000000000000000000000000000000',
  cctpDomain: 26,
  source: 'https://docs.arc.io/arc/references/contract-addresses',
});

export type Asset = {
  symbol: string;
  name: string;
  type: string;
  address: string;
  decimals: number;
  access: string;
  description: string;
};

export const ASSETS: readonly Asset[] = [
  {
    symbol: 'USDC',
    name: 'US Dollar Coin',
    type: 'Dollar stablecoin',
    address: ARC.usdcAddress,
    decimals: 6,
    access: 'Network transfer rules apply',
    description:
      'Arc’s native gas asset and dollar settlement currency. The native balance and ERC-20 balance represent the same funds; never add them together.',
  },
  {
    symbol: 'EURC',
    name: 'Euro Coin',
    type: 'Euro stablecoin',
    address: '0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a',
    decimals: 6,
    access: 'Network transfer rules apply',
    description:
      'A euro-denominated stablecoin for multi-currency balances and future FX workflows. No live exchange rate or executable quote is provided in this starter.',
  },
  {
    symbol: 'USYC',
    name: 'Tokenized money market fund',
    type: 'Permissioned fund',
    address: '0xe9185F0c5F296Ed1797AaE4238D26CCaBEadb86C',
    decimals: 6,
    access: 'Issuer eligibility and allowlisting required',
    description:
      'A fund token with restricted access. This directory entry does not establish eligibility, offer fund shares, or enable subscription or redemption.',
  },
];

export function parseUnits(value: string, decimals: number): bigint {
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 18)
    throw new Error('Invalid decimals.');
  if (value.length > 80 || !/^(0|[1-9]\d*)(\.\d+)?$/.test(value))
    throw new Error('Enter a plain positive decimal amount.');
  const [whole, fraction = ''] = value.split('.');
  if (fraction.length > decimals) throw new Error(`Use at most ${decimals} decimal places.`);
  const result =
    BigInt(whole) * 10n ** BigInt(decimals) + BigInt(fraction.padEnd(decimals, '0') || '0');
  if (result > 2n ** 256n - 1n) throw new Error('Amount exceeds the token limit.');
  return result;
}

export function formatUnits(value: bigint, decimals: number): string {
  const scale = 10n ** BigInt(decimals);
  const tail = (value % scale).toString().padStart(decimals, '0').replace(/0+$/, '');
  return `${value / scale}${tail ? `.${tail}` : ''}`;
}

export function validAddress(value: string): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(value) && !/^0x0{40}$/i.test(value);
}

export type PaymentDraft = {
  kind: 'local-preview';
  chainId: number;
  asset: 'USDC';
  token: string;
  recipient: string;
  amount: string;
  amountBaseUnits: string;
  reference: string;
  broadcast: false;
};

export function preparePayment(recipient: string, amount: string, reference: string): PaymentDraft {
  if (!validAddress(recipient))
    throw new Error('Enter a non-zero EVM recipient address (0x plus 40 hexadecimal characters).');
  const units = parseUnits(amount, ARC.usdcDecimals);
  if (units <= 0n) throw new Error('Amount must be greater than zero.');
  if (reference.length > 80) throw new Error('Reference must be 80 characters or fewer.');
  return {
    kind: 'local-preview',
    chainId: ARC.chainId,
    asset: 'USDC',
    token: ARC.usdcAddress,
    recipient,
    amount: formatUnits(units, 6),
    amountBaseUnits: units.toString(),
    reference,
    broadcast: false,
  };
}

type Fetcher = typeof fetch;
async function rpc(method: string, params: unknown[], fetcher: Fetcher): Promise<unknown> {
  const response = await fetcher(ARC.rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error('Arc RPC is unavailable. Try again later.');
  const body = await response.json();
  if (body.jsonrpc !== '2.0' || body.id !== 1 || body.error || body.result === undefined)
    throw new Error('Arc RPC returned an invalid response.');
  return body.result;
}

function hex(value: unknown): bigint {
  if (typeof value !== 'string' || !/^0x[0-9a-f]+$/i.test(value) || value.length > 66)
    throw new Error('Arc RPC returned an invalid value.');
  return BigInt(value);
}

async function assertChain(fetcher: Fetcher) {
  if (hex(await rpc('eth_chainId', [], fetcher)) !== BigInt(ARC.chainId))
    throw new Error('Wrong chain returned by RPC. Read stopped.');
}

export async function readNetwork(fetcher: Fetcher = fetch) {
  await assertChain(fetcher);
  const block = hex(await rpc('eth_blockNumber', [], fetcher));
  return { block: block.toString(), observedAt: new Date().toISOString() };
}

export async function readUsdcBalance(address: string, fetcher: Fetcher = fetch) {
  if (!validAddress(address)) throw new Error('Enter a valid non-zero public address.');
  await assertChain(fetcher);
  // Pin decimals and balance reads to the same observed block.
  const block = await rpc('eth_blockNumber', [], fetcher);
  hex(block);
  const [decimals, balance] = await Promise.all([
    rpc('eth_call', [{ to: ARC.usdcAddress, data: '0x313ce567' }, block], fetcher),
    rpc(
      'eth_call',
      [
        {
          to: ARC.usdcAddress,
          data: `0x70a08231${address.slice(2).toLowerCase().padStart(64, '0')}`,
        },
        block,
      ],
      fetcher,
    ),
  ]);
  if (hex(decimals) !== 6n) throw new Error('Unexpected USDC decimals. Balance hidden.');
  return {
    address,
    amount: formatUnits(hex(balance), 6),
    block: hex(block).toString(),
    observedAt: new Date().toISOString(),
  };
}

type Receipt = {
  transactionHash: string;
  blockNumber: string;
  blockHash: string;
  status: string;
  gasUsed: string;
  effectiveGasPrice: string;
};

export type ReceiptObservation = {
  hash: string;
  observedAt: string;
  state: 'not-found' | 'included' | 'finalized' | 'failed';
  finality: 'unverified' | 'finalized';
  block?: string;
  gasFeeUsdc?: string;
};

function validHash(value: unknown): value is string {
  return typeof value === 'string' && /^0x[0-9a-fA-F]{64}$/.test(value);
}

export async function readReceipt(
  hash: string,
  fetcher: Fetcher = fetch,
): Promise<ReceiptObservation> {
  if (!validHash(hash))
    throw new Error('Enter a transaction hash (0x plus 64 hexadecimal characters).');
  await assertChain(fetcher);
  const receipt = (await rpc('eth_getTransactionReceipt', [hash], fetcher)) as Receipt | null;
  const observedAt = new Date().toISOString();
  if (receipt === null) return { hash, observedAt, state: 'not-found', finality: 'unverified' };
  if (
    !validHash(receipt.transactionHash) ||
    receipt.transactionHash.toLowerCase() !== hash.toLowerCase() ||
    !validHash(receipt.blockHash)
  )
    throw new Error('Receipt identity mismatch. Read stopped.');
  const status = hex(receipt.status);
  if (status !== 0n && status !== 1n) throw new Error('Receipt has an unknown execution status.');
  const blockNumber = hex(receipt.blockNumber);
  const gasFeeUsdc = formatUnits(
    hex(receipt.gasUsed) * hex(receipt.effectiveGasPrice),
    ARC.nativeDecimals,
  );
  const block = (await rpc('eth_getBlockByNumber', [receipt.blockNumber, false], fetcher)) as {
    hash: string;
    number: string;
  } | null;
  if (
    !block ||
    !validHash(block.hash) ||
    block.hash.toLowerCase() !== receipt.blockHash.toLowerCase() ||
    hex(block.number) !== blockNumber
  )
    throw new Error('Receipt block could not be reconciled. Read stopped.');
  let finality: ReceiptObservation['finality'] = 'unverified';
  try {
    const finalized = (await rpc('eth_getBlockByNumber', ['finalized', false], fetcher)) as {
      number: string;
      hash: string;
    } | null;
    if (finalized && validHash(finalized.hash)) {
      const finalizedNumber = hex(finalized.number);
      if (
        finalizedNumber > blockNumber ||
        (finalizedNumber === blockNumber &&
          finalized.hash.toLowerCase() === receipt.blockHash.toLowerCase())
      )
        finality = 'finalized';
    }
  } catch {
    /* Unsupported finalized reads do not invalidate an included receipt. */
  }
  return {
    hash,
    observedAt,
    state: status === 0n ? 'failed' : finality === 'finalized' ? 'finalized' : 'included',
    finality,
    block: blockNumber.toString(),
    gasFeeUsdc,
  };
}
