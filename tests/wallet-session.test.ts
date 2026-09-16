import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveSelectedWallet } from '../src/wallet-session.ts';
const address = '0x' + 'a'.repeat(40);
test('wallet session resolves only the selected connector using passive reads', async () => {
  const calls: string[] = [];
  const selected = {
    request: async ({ method }: { method: string }) => {
      calls.push(method);
      if (method === 'eth_accounts') return [address.toUpperCase()];
      if (method === 'eth_chainId') return '0x13b2';
      throw new Error('Unexpected write or authorization request');
    },
  };
  assert.equal(
    await resolveSelectedWallet({ getProvider: async () => selected }, address, 5042),
    selected,
  );
  assert.deepEqual(calls, ['eth_accounts', 'eth_chainId']);
});
test('disconnected, changed-account and changed-chain sessions cannot supply a signing provider', async () => {
  for (const [accounts, chain] of [
    [[], '0x13b2'],
    [['0x' + 'b'.repeat(40)], '0x13b2'],
    [[address], '0x1'],
    [[address], 'invalid'],
  ]) {
    await assert.rejects(
      resolveSelectedWallet(
        {
          getProvider: async () => ({
            request: async ({ method }: { method: string }) =>
              method === 'eth_accounts' ? accounts : chain,
          }),
        },
        address,
        5042,
      ),
    );
  }
  for (const value of [null, {}, { request: 'not-a-function' }])
    await assert.rejects(resolveSelectedWallet({ getProvider: async () => value }, address, 5042));
});
