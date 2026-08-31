import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ARC,
  parseUnits,
  formatUnits,
  preparePayment,
  readNetwork,
  readUsdcBalance,
  readReceipt,
} from '../src/arc.ts';

const recipient = '0x1111111111111111111111111111111111111111';

test('native and ERC-20 USDC use different scales for the same balance', () => {
  assert.equal(parseUnits('1.25', 18), 1250000000000000000n);
  assert.equal(parseUnits('1.25', 6), 1250000n);
  assert.equal(formatUnits(1250000n, 6), '1.25');
  assert.equal(formatUnits(1n, 6), '0.000001');
});

test('amounts reject floating point notation, excess precision, negatives, and overflow', () => {
  for (const value of [
    '-1',
    '1e6',
    '1.0000001',
    'NaN',
    '1,000',
    '',
    ' 1',
    '.5',
    '01',
    '9'.repeat(79),
  ]) {
    assert.throws(() => parseUnits(value, 6));
  }
  assert.equal(parseUnits('9007199254740993.000001', 6), 9007199254740993000001n);
});

test('payment drafts bind Arc Testnet and remain non-broadcast previews', () => {
  const draft = preparePayment(recipient, '12.500000', 'Invoice 42');
  assert.equal(draft.chainId, 5042002);
  assert.equal(draft.amountBaseUnits, '12500000');
  assert.equal(draft.amount, '12.5');
  assert.equal(draft.token, ARC.usdcAddress);
  assert.equal(draft.broadcast, false);
  assert.equal(draft.kind, 'local-preview');
  assert.throws(() => preparePayment('0x' + '0'.repeat(40), '1', ''));
  assert.throws(() => preparePayment(recipient, '0', ''));
  assert.throws(() => preparePayment(recipient, '1', 'x'.repeat(81)));
});

function mockRpc(handler: (method: string, params: unknown[]) => unknown): typeof fetch {
  return (async (_url, init) => {
    const { method, params } = JSON.parse(String(init?.body));
    return new Response(JSON.stringify({ jsonrpc: '2.0', id: 1, result: handler(method, params) }));
  }) as typeof fetch;
}

test('network reads reject the wrong chain before reading block data', async () => {
  const methods: string[] = [];
  await assert.rejects(
    readNetwork(
      mockRpc((method) => {
        methods.push(method);
        return '0x1';
      }),
    ),
    /Wrong chain/,
  );
  assert.deepEqual(methods, ['eth_chainId']);
});

test('balance reads verify decimals and pin both calls to a block', async () => {
  const blocks: unknown[] = [];
  const result = await readUsdcBalance(
    recipient,
    mockRpc((method, params) => {
      if (method === 'eth_chainId') return `0x${ARC.chainId.toString(16)}`;
      if (method === 'eth_blockNumber') return '0x100';
      blocks.push(params[1]);
      const call = params[0] as { data: string; to: string };
      assert.equal(call.to, ARC.usdcAddress);
      if (call.data === '0x313ce567') return '0x06';
      assert.equal(call.data, '0x70a08231' + recipient.slice(2).padStart(64, '0'));
      return '0x1312d0';
    }),
  );
  assert.equal(result.amount, '1.25');
  assert.equal(result.block, '256');
  assert.deepEqual(blocks, ['0x100', '0x100']);
});

test('malformed data and unexpected decimals never become a balance', async () => {
  await assert.rejects(readNetwork(mockRpc(() => 'garbage')), /invalid value/);
  await assert.rejects(
    readUsdcBalance(
      recipient,
      mockRpc((method) => {
        if (method === 'eth_chainId') return `0x${ARC.chainId.toString(16)}`;
        return '0x12';
      }),
    ),
    /Unexpected USDC decimals/,
  );
});

test('RPC failures are explicit', async () => {
  await assert.rejects(
    readNetwork((async () => new Response('', { status: 503 })) as typeof fetch),
    /unavailable/,
  );
  await assert.rejects(
    readNetwork(
      (async () => new Response(JSON.stringify({ error: { code: -1 } }))) as typeof fetch,
    ),
    /invalid response/,
  );
});

const hash = '0x' + 'a'.repeat(64);
const blockHash = '0x' + 'b'.repeat(64);
function receiptRpc(status = '0x1', finalized = true, mismatch = false): typeof fetch {
  return mockRpc((method, params) => {
    if (method === 'eth_chainId') return `0x${ARC.chainId.toString(16)}`;
    if (method === 'eth_getTransactionReceipt')
      return {
        transactionHash: mismatch ? blockHash : hash,
        blockNumber: '0x100',
        blockHash,
        status,
        gasUsed: '0x5208',
        effectiveGasPrice: '0x3b9aca00',
      };
    if (params[0] === 'finalized' && !finalized) return null;
    return { hash: blockHash, number: '0x100' };
  });
}

test('receipt finality uses block reconciliation and native 18-decimal fees', async () => {
  const receipt = await readReceipt(hash, receiptRpc());
  assert.equal(receipt.state, 'finalized');
  assert.equal(receipt.finality, 'finalized');
  assert.equal(receipt.gasFeeUsdc, '0.000021');
});

test('failed execution stays failed even if the block is finalized', async () => {
  const receipt = await readReceipt(hash, receiptRpc('0x0'));
  assert.equal(receipt.state, 'failed');
  assert.equal(receipt.finality, 'finalized');
});

test('missing finality proof is included, not finalized', async () => {
  assert.equal((await readReceipt(hash, receiptRpc('0x1', false))).state, 'included');
});

test('receipt identity mismatch and malformed hashes are rejected', async () => {
  await assert.rejects(readReceipt(hash, receiptRpc('0x1', true, true)), /identity mismatch/);
  await assert.rejects(readReceipt('0x123', receiptRpc()), /transaction hash/);
});

test('missing receipt is not interpreted as a pending or successful transaction', async () => {
  const result = await readReceipt(
    hash,
    mockRpc((method) => (method === 'eth_chainId' ? `0x${ARC.chainId.toString(16)}` : null)),
  );
  assert.equal(result.state, 'not-found');
  assert.equal(result.finality, 'unverified');
});

test('a finalized block with the same height but different identity is not accepted', async () => {
  const base = receiptRpc();
  const contradictory = (async (url, init) => {
    const { method, params } = JSON.parse(String(init?.body));
    if (method === 'eth_getBlockByNumber' && params[0] === 'finalized')
      return new Response(
        JSON.stringify({ jsonrpc: '2.0', id: 1, result: { number: '0x100', hash } }),
      );
    return base(url, init);
  }) as typeof fetch;
  assert.equal((await readReceipt(hash, contradictory)).finality, 'unverified');
});
