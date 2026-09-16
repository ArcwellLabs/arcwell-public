import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ARC,
  ARC_MAINNET,
  readNativeUsdcBalance,
  readNetwork,
  readReceipt,
  estimateNativeUsdcTransfer,
} from '../src/arc.ts';
import {
  connectArcWallet,
  switchArcNetwork,
  walletChainId,
  type WalletProvider,
} from '../src/arc-wallet.ts';

const address = '0x1111111111111111111111111111111111111111';
function rpc(
  handler: (method: string, params: unknown[]) => unknown,
  urls: string[] = [],
): typeof fetch {
  return (async (url, init) => {
    urls.push(String(url));
    const { method, params } = JSON.parse(String(init?.body));
    return new Response(JSON.stringify({ jsonrpc: '2.0', id: 1, result: handler(method, params) }));
  }) as typeof fetch;
}

test('mainnet balance uses one native USDC balance, exact 18-decimal arithmetic, and a pinned block', async () => {
  const urls: string[] = [];
  const calls: string[] = [];
  const result = await readNativeUsdcBalance(
    address,
    rpc((method, params) => {
      calls.push(method);
      if (method === 'eth_chainId') return '0x13b2';
      if (method === 'eth_blockNumber') return '0x100';
      assert.deepEqual(params, [address, '0x100']);
      return '0x1158e460913d0001'; // 1.250000000000000001 USDC
    }, urls),
    ARC_MAINNET,
  );
  assert.equal(result.amount, '1.250000000000000001');
  assert.equal(result.chainId, 5042);
  assert.equal(result.block, '256');
  assert.deepEqual(calls, ['eth_chainId', 'eth_blockNumber', 'eth_getBalance']);
  assert.ok(urls.every((url) => url === ARC_MAINNET.rpcUrl));
});

test('mainnet readers reject testnet responses before showing a balance or block', async () => {
  const calls: string[] = [];
  const wrong = rpc((method) => {
    calls.push(method);
    return `0x${ARC.chainId.toString(16)}`;
  });
  await assert.rejects(readNativeUsdcBalance(address, wrong, ARC_MAINNET), /Wrong chain/);
  await assert.rejects(readNetwork(wrong, ARC_MAINNET), /Wrong chain/);
  assert.deepEqual(calls, ['eth_chainId', 'eth_chainId']);
});

test('mainnet receipts use mainnet RPC and reconcile the finalized block', async () => {
  const hash = '0x' + 'a'.repeat(64),
    blockHash = '0x' + 'b'.repeat(64),
    urls: string[] = [];
  const result = await readReceipt(
    hash,
    rpc((method) => {
      if (method === 'eth_chainId') return '0x13b2';
      if (method === 'eth_getTransactionReceipt')
        return {
          transactionHash: hash,
          blockHash,
          blockNumber: '0x100',
          status: '0x1',
          gasUsed: '0x5208',
          effectiveGasPrice: '0x3b9aca00',
        };
      return { hash: blockHash, number: '0x100' };
    }, urls),
    ARC_MAINNET,
  );
  assert.equal(result.state, 'finalized');
  assert.equal(result.gasFeeUsdc, '0.000021');
  assert.ok(urls.every((url) => url === ARC_MAINNET.rpcUrl));
});

test('wallet connection requests only account access and reads', async () => {
  const methods: string[] = [];
  const wallet: WalletProvider = {
    request: async ({ method }) => {
      methods.push(method);
      return method === 'eth_chainId' ? '0x13b2' : [address];
    },
  };
  assert.deepEqual(await connectArcWallet(wallet), { address, chainId: 5042 });
  assert.deepEqual(methods, ['eth_requestAccounts', 'eth_chainId', 'eth_accounts', 'eth_chainId']);
  await assert.rejects(connectArcWallet({ request: async () => [] }), /valid account/);
});

test('a wallet account change during authorization cannot restore the previous account', async () => {
  await assert.rejects(
    connectArcWallet({
      request: async ({ method }) => {
        if (method === 'eth_requestAccounts') return [address];
        if (method === 'eth_chainId') return '0x13b2';
        return ['0x2222222222222222222222222222222222222222'];
      },
    }),
    /account changed/,
  );
});

test('wallet chain registration uses only the selected official Arc configuration', async () => {
  const methods: string[] = [];
  let switched = false;
  await switchArcNetwork(
    {
      request: async ({ method, params }) => {
        methods.push(method);
        if (method === 'wallet_switchEthereumChain' && !switched) {
          switched = true;
          throw { code: 4902 };
        }
        if (method === 'wallet_addEthereumChain') {
          assert.deepEqual(params, [
            {
              chainId: '0x13b2',
              chainName: 'Arc Mainnet',
              nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
              rpcUrls: [ARC_MAINNET.rpcUrl],
              blockExplorerUrls: [ARC_MAINNET.explorerUrl],
            },
          ]);
        }
        return method === 'eth_chainId' ? '0x13b2' : null;
      },
    },
    ARC_MAINNET,
  );
  assert.deepEqual(methods, [
    'wallet_switchEthereumChain',
    'wallet_addEthereumChain',
    'wallet_switchEthereumChain',
    'eth_chainId',
  ]);
});

test('wallet rejection never falls through to network registration or signing', async () => {
  const methods: string[] = [];
  await assert.rejects(
    switchArcNetwork(
      {
        request: async ({ method }) => {
          methods.push(method);
          throw new Error('User rejected');
        },
      },
      ARC_MAINNET,
    ),
    /rejected/,
  );
  assert.deepEqual(methods, ['wallet_switchEthereumChain']);
  await assert.rejects(
    switchArcNetwork(
      { request: async ({ method }) => (method === 'eth_chainId' ? '0x1' : null) },
      ARC_MAINNET,
    ),
    /different network/,
  );
  for (const value of [null, 'garbage', '0x0', '0xffffffffffffffffffffffff'])
    assert.throws(() => walletChainId(value), /invalid network/);
});

test('gas estimate uses native USDC units, exact fees, and never broadcasts', async () => {
  const methods: string[] = [];
  const result = await estimateNativeUsdcTransfer(
    address,
    '0x2222222222222222222222222222222222222222',
    '1.000000000000000001',
    rpc((method, params) => {
      methods.push(method);
      if (method === 'eth_chainId') return '0x13b2';
      if (method === 'eth_blockNumber') return '0x100';
      if (method === 'eth_gasPrice') return '0x3b9aca00';
      if (method === 'eth_getBalance') {
        assert.deepEqual(params, [address, '0x100']);
        return '0x1bc16d674ec80000';
      }
      assert.equal(method, 'eth_estimateGas');
      assert.deepEqual(params, [
        {
          from: address,
          to: '0x2222222222222222222222222222222222222222',
          value: '0xde0b6b3a7640001',
        },
      ]);
      return '0x5208';
    }),
    ARC_MAINNET,
  );
  assert.equal(result.feeUsdc, '0.000021');
  assert.equal(result.totalUsdc, '1.000021000000000001');
  assert.equal(result.broadcast, false);
  assert.equal(result.hasEstimatedFunds, true);
  assert.deepEqual(methods, [
    'eth_chainId',
    'eth_blockNumber',
    'eth_estimateGas',
    'eth_gasPrice',
    'eth_getBalance',
  ]);
});

test('gas estimate rejects malformed amounts, invalid chain, and provider refusal', async () => {
  let requests = 0;
  const unavailable = (async () => {
    requests++;
    return new Response('{}', { status: 503 });
  }) as typeof fetch;
  for (const amount of ['0', '-1', '1e18', '0.0000000000000000001'])
    await assert.rejects(estimateNativeUsdcTransfer(address, address, amount, unavailable));
  assert.equal(requests, 0);
  await assert.rejects(
    estimateNativeUsdcTransfer(
      address,
      address,
      '1',
      rpc(() => '0x1'),
    ),
    /Wrong chain/,
  );
  await assert.rejects(
    estimateNativeUsdcTransfer(address, address, '1', unavailable),
    /unavailable/,
  );
});

test('wallet connection detects a network change during account confirmation', async () => {
  let reads = 0;
  await assert.rejects(
    connectArcWallet({
      request: async ({ method }) =>
        method === 'eth_chainId' ? (++reads === 1 ? '0x13b2' : '0x1') : [address],
    }),
    /network changed/,
  );
});
