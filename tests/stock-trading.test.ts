import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import {
  STOCK_ASSETS,
  STOCK_USDC,
  STOCK_PERMIT2,
  stockPair,
  stockUnits,
  stockDisplay,
} from '../src/stock-trading.ts';
import {
  createStockTradingHandler,
  validateStockQuote,
} from '../frontend/src/server/stock-trading.ts';
import {
  stockApproval,
  stockFunding,
  verifyStockWallet,
} from '../frontend/src/lib/stock-wallet.ts';

const require = createRequire(new URL('../frontend/package.json', import.meta.url));
const {
  UnsignedV2DutchOrder,
  REACTOR_ADDRESS_MAPPING,
  OrderType,
} = require('@uniswap/uniswapx-sdk');
const { Wallet } = require('ethers');
const signer = Wallet.createRandom();
const other = Wallet.createRandom();
const now = 1789586400000;
const intent = {
  symbol: 'AAPLon',
  side: 'buy' as const,
  amount: '12.000001',
  wallet: signer.address,
};
function fixture(changes: Record<string, unknown> = {}) {
  const order = UnsignedV2DutchOrder.fromJSON(
    {
      reactor: REACTOR_ADDRESS_MAPPING[1][OrderType.Dutch_V2],
      swapper: signer.address,
      nonce: '1',
      deadline: now / 1000 + 300,
      additionalValidationContract: '0x' + '0'.repeat(40),
      additionalValidationData: '0x',
      cosigner: other.address,
      input: { token: STOCK_USDC, startAmount: '12000001', endAmount: '12000001' },
      outputs: [
        {
          token: STOCK_ASSETS[0].address,
          recipient: signer.address,
          startAmount: '60000000000000000',
          endAmount: '59700000000000000',
        },
      ],
      ...changes,
    },
    1,
  );
  return {
    order,
    response: {
      routing: 'DUTCH_V2',
      permitData: null,
      quote: { orderId: order.hash(), encodedOrder: order.serialize() },
    },
  };
}
function request(body: unknown, origin = 'https://www.arcwellfi.com') {
  return new Request('https://www.arcwellfi.com/api/stock-trading', {
    method: 'POST',
    headers: { origin, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

test('stock amounts retain decimal precision and pair selection is issuer-allowlisted', () => {
  assert.equal(stockUnits('0.000000000000000001', 18), '1');
  assert.equal(stockDisplay('1000001', 6), '1.000001');
  assert.equal(stockPair(intent).amount, '12000001');
  assert.equal(stockPair({ ...intent, side: 'sell' }).input, STOCK_ASSETS[0].address);
  for (const amount of ['0', '-1', '1e6', 'NaN', '0.0000001', '01', '1&chain=5042'])
    assert.throws(() => stockPair({ ...intent, amount }));
  assert.throws(() => stockPair({ ...intent, symbol: 'AAPL' }));
  assert.throws(() => stockPair({ ...intent, wallet: '0x' + '0'.repeat(40) }));
});

test('wallet approval is exact amount, zero ETH, canonical Permit2 and the selected input token', async () => {
  const tx = stockApproval(intent);
  assert.equal(tx.to, STOCK_USDC);
  assert.equal(tx.value, '0x0');
  assert.equal(tx.chainId, '0x1');
  assert.equal(tx.data.slice(10, 74), STOCK_PERMIT2.slice(2).padStart(64, '0'));
  assert.equal(BigInt('0x' + tx.data.slice(74)), 12000001n);
  const wallet = {
    request: async ({ method }: { method: string }) =>
      method === 'eth_chainId'
        ? '0x1'
        : method === 'eth_accounts'
          ? [signer.address]
          : '0x' + 12000001n.toString(16).padStart(64, '0'),
  };
  assert.deepEqual(await stockFunding(wallet, intent), {
    sufficient: true,
    approved: true,
    balance: '12000001',
  });
  await assert.rejects(verifyStockWallet({ request: async () => '0x13b2' }, signer.address));
  await assert.rejects(verifyStockWallet(wallet, other.address));
});

test('review and signature come from encoded order, with wrong recipients, spend, chain reactor and expiry rejected', () => {
  const { response } = fixture();
  const checked = validateStockQuote(response, intent, now);
  assert.equal(checked.minimum, '0.0597');
  const data = checked.typedData as {
    domain: { chainId: number };
    message: { permitted: { amount: string } };
  };
  assert.equal(data.domain.chainId, 1);
  assert.equal(data.message.permitted.amount, '12000001');
  for (const changes of [
    { swapper: other.address },
    { reactor: other.address },
    { deadline: now / 1000 },
    { additionalValidationContract: other.address },
    { input: { token: STOCK_USDC, startAmount: '12000001', endAmount: '9999999999' } },
    {
      outputs: [
        {
          token: STOCK_ASSETS[0].address,
          recipient: other.address,
          startAmount: '6000',
          endAmount: '5000',
        },
      ],
    },
    {
      outputs: [
        { token: STOCK_USDC, recipient: signer.address, startAmount: '6000', endAmount: '5000' },
      ],
    },
  ])
    assert.throws(() => validateStockQuote(fixture(changes).response, intent, now));
  assert.throws(() => validateStockQuote({ ...response, routing: 'CLASSIC' }, intent, now));
});

test('missing credentials, disabled rollout, foreign origins and forged tickets cannot reach the provider', async () => {
  let calls = 0;
  const fetcher = async () => {
    calls++;
    return Response.json({});
  };
  for (const options of [{ enabled: true }, { apiKey: 'test', enabled: false }]) {
    const handler = createStockTradingHandler({ ...options, fetcher });
    assert.equal((await handler(request({ action: 'quote', intent }))).status, 503);
  }
  const handler = createStockTradingHandler({ apiKey: 'test', enabled: true, fetcher });
  assert.equal(
    (await handler(request({ action: 'quote', intent }, 'https://untrusted.example'))).status,
    403,
  );
  assert.equal((await handler(request({ action: 'status', ticket: 'forged.mac' }))).status, 400);
  assert.equal(
    (await handler(request({ action: 'quote', intent, url: 'https://untrusted.example' }))).status,
    400,
  );
  assert.equal(calls, 0);
});

test('signed quote is bound to intent, provider order and signer; status reconciles without inventing a fill', async () => {
  const { response, order } = fixture();
  let time = now;
  const calls: { url: string; body: Record<string, unknown> | null }[] = [];
  const handler = createStockTradingHandler({
    apiKey: 'private-test-key',
    enabled: true,
    now: () => time,
    fetcher: async (url, init) => {
      const body = init?.body ? JSON.parse(String(init.body)) : null;
      calls.push({ url: String(url), body });
      if (String(url).endsWith('/quote')) return Response.json(response);
      if (String(url).endsWith('/order'))
        return Response.json({ orderId: response.quote.orderId, orderStatus: 'open' });
      return Response.json({
        orders: [
          {
            orderId: response.quote.orderId,
            chainId: 1,
            swapper: signer.address,
            orderStatus: 'filled',
            txHash: '0x' + 'a'.repeat(64),
          },
        ],
      });
    },
  });
  const result = await handler(request({ action: 'quote', intent }));
  assert.equal(result.status, 200);
  const quote = await result.json();
  assert.equal(JSON.stringify(quote).includes('private-test-key'), false);
  assert.deepEqual(calls[0].body?.protocols, ['UNISWAPX_V2']);
  assert.equal(calls[0].body?.tokenInChainId, 1);
  const permit = order.permitData();
  const browserTypes = { ...quote.typedData.types };
  delete browserTypes.EIP712Domain;
  const browserSignature = await signer._signTypedData(
    quote.typedData.domain,
    browserTypes,
    quote.typedData.message,
  );
  assert.equal(order.getSigner(browserSignature).toLowerCase(), signer.address.toLowerCase());
  const badSig = await other._signTypedData(permit.domain, permit.types, permit.values);
  assert.equal(
    (await handler(request({ action: 'order', ticket: quote.ticket, signature: badSig }))).status,
    400,
  );
  const signature = await signer._signTypedData(permit.domain, permit.types, permit.values);
  const accepted = await handler(request({ action: 'order', ticket: quote.ticket, signature }));
  assert.deepEqual(await accepted.json(), { orderId: response.quote.orderId, status: 'open' });
  const status = await handler(request({ action: 'status', ticket: quote.statusTicket }));
  assert.equal((await status.json()).status, 'filled');
  time += 61000;
  assert.equal(
    (await handler(request({ action: 'order', ticket: quote.ticket, signature }))).status,
    409,
  );
  assert.equal(calls.filter((call) => call.url.endsWith('/order')).length, 1);
});

test('provider rejection never becomes a paper quote or fabricated accepted order', async () => {
  const handler = createStockTradingHandler({
    apiKey: 'test',
    enabled: true,
    now: () => now,
    fetcher: async () => Response.json({ message: 'secret provider diagnostic' }, { status: 404 }),
  });
  const response = await handler(request({ action: 'quote', intent }));
  assert.equal(response.status, 422);
  assert.equal((await response.text()).includes('secret provider diagnostic'), false);
});

test('a client cannot modify the quote amount and status lookup survives an execution kill switch', async () => {
  const { response } = fixture();
  let calls = 0;
  const options = {
    apiKey: 'test-key',
    now: () => now,
    fetcher: async () => {
      calls++;
      return Response.json(calls === 1 ? response : { orders: [] });
    },
  };
  const active = createStockTradingHandler({ ...options, enabled: true });
  const quote = await (await active(request({ action: 'quote', intent }))).json();
  const [payload, mac] = quote.ticket.split('.');
  const changed = JSON.parse(Buffer.from(payload, 'base64url').toString());
  changed.intent.amount = '999';
  const forged = Buffer.from(JSON.stringify(changed)).toString('base64url') + '.' + mac;
  const signature = '0x' + 'a'.repeat(130);
  assert.equal((await active(request({ action: 'order', ticket: forged, signature }))).status, 400);
  assert.equal(calls, 1);
  const paused = createStockTradingHandler({ ...options, enabled: false });
  assert.equal(
    (await paused(request({ action: 'order', ticket: quote.ticket, signature }))).status,
    503,
  );
  const status = await paused(request({ action: 'status', ticket: quote.statusTicket }));
  assert.equal(status.status, 200);
  assert.equal((await status.json()).status, 'unknown');
});
