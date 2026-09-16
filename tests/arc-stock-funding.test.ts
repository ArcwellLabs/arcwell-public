import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ARC_USDC,
  ARC_BRIDGE,
  fundingCalldata,
  assertFundingTransaction,
  forwardingHash,
  parseFundingRecord,
  usdcDisplay,
  usdcUnits,
  verifyArcWallet,
  type FundingRecord,
} from '../frontend/src/lib/arc-stock-funding.ts';
const wallet = '0x1111111111111111111111111111111111111111';
const record: FundingRecord = {
  wallet,
  amount: '100',
  maxFee: '1.2',
  startedAt: 123,
  stage: 'pending',
  burnHash: '0x' + 'a'.repeat(64),
};
test('USDC precision and fee arithmetic do not round user funds', () => {
  assert.equal(usdcUnits('100.000001'), 100000001n);
  assert.equal(usdcDisplay(100000000n), '100');
  assert.equal(usdcDisplay(0n), '0');
  assert.equal(usdcDisplay(usdcUnits('100') - usdcUnits('1.2')), '98.8');
  for (const amount of ['-1', '1e6', '0.0000001', 'NaN', 'Infinity', '1.', '01'])
    assert.throws(() => usdcUnits(amount));
});
test('recovery only accepts bounded canonical transfer records', () => {
  assert.deepEqual(parseFundingRecord(JSON.stringify(record)), record);
  for (const patch of [
    { amount: '0' },
    { maxFee: '101' },
    { burnHash: 'javascript:alert(1)' },
    { stage: 'fake' },
    { wallet: '0x12' },
    { startedAt: null },
  ])
    assert.throws(() => parseFundingRecord(JSON.stringify({ ...record, ...patch })));
});
test('forwarding confirmation must match source, destination, owner and transferred token/amount', () => {
  const message = {
    forwardState: 'CONFIRMED',
    forwardTxHash: '0x' + 'b'.repeat(64),
    decodedMessage: {
      sourceDomain: '26',
      destinationDomain: '0',
      decodedMessageBody: {
        mintRecipient: wallet,
        messageSender: ARC_BRIDGE,
        burnToken: ARC_USDC,
        amount: '100000000',
      },
    },
  };
  assert.equal(forwardingHash({ messages: [message] }, record), message.forwardTxHash);
  for (const patch of [
    { forwardState: 'PENDING' },
    { forwardTxHash: 'invalid' },
    { decodedMessage: { ...message.decodedMessage, destinationDomain: '1' } },
    {
      decodedMessage: {
        ...message.decodedMessage,
        decodedMessageBody: {
          ...message.decodedMessage.decodedMessageBody,
          mintRecipient: '0x' + '2'.repeat(40),
        },
      },
    },
    {
      decodedMessage: {
        ...message.decodedMessage,
        decodedMessageBody: { ...message.decodedMessage.decodedMessageBody, amount: '1' },
      },
    },
  ])
    assert.equal(forwardingHash({ messages: [{ ...message, ...patch }] }, record), null);
});
test('funding requires Arc mainnet and the exact connected account', async () => {
  const provider = (chain: string, account: string) => ({
    request: async ({ method }: { method: string }) =>
      method === 'eth_chainId' ? chain : [account],
  });
  await verifyArcWallet(provider('0x13b2', wallet), wallet);
  await assert.rejects(verifyArcWallet(provider('0x1', wallet), wallet));
  await assert.rejects(verifyArcWallet(provider('0x13b2', '0x' + '2'.repeat(40)), wallet));
});

test('wallet transactions are bound to reviewed amount, recipient, fee, chain route and canonical contracts', () => {
  const tx = { from: wallet, to: ARC_BRIDGE, value: '0x0', data: fundingCalldata(record) };
  assert.equal(assertFundingTransaction(tx, record), 'burn');
  for (const patch of [
    { from: '0x' + '2'.repeat(40) },
    { to: wallet },
    { value: '0x1' },
    { data: fundingCalldata({ ...record, amount: '101' }) },
    { data: fundingCalldata({ ...record, maxFee: '2' }) },
    { data: fundingCalldata({ ...record, wallet: '0x' + '2'.repeat(40) }) },
  ])
    assert.throws(() => assertFundingTransaction({ ...tx, ...patch }, record));
});
