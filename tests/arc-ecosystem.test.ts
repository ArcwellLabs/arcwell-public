import test from 'node:test';
import assert from 'node:assert/strict';
import { createEcosystemService, parseEcosystemPage, ECOSYSTEM_URL } from '../src/arc-ecosystem.ts';
const card = (name: string, path: string) =>
  `<div data-check="${name}"><a href="/ecosystem/${path}"></a><p class="subhead-large u-mb-0">${name}</p></div>`;
test('ecosystem walks every directory page, deduplicates, and searches beyond page one', async () => {
  const calls: string[] = [];
  const service = createEcosystemService(async (input) => {
    calls.push(String(input));
    return new Response(
      calls.length === 1
        ? card('First', 'first') + '<a href="?abc_page=2" aria-label="Next Page">Next</a>'
        : card('Last', 'last') + card('First', 'first'),
    );
  });
  const result = await service('Last');
  assert.equal(result.status, 'current');
  assert.equal(result.items[0].name, 'Last');
  assert.equal(result.items[0].status, 'ecosystem-listed');
  assert.equal(result.items[0].evidenceDate, null);
  assert.deepEqual(calls, [ECOSYSTEM_URL, ECOSYSTEM_URL + '?abc_page=2']);
  const all = await service();
  assert.equal(all.items.filter((x) => x.name === 'First').length, 1);
  assert.equal(calls.length, 2);
  assert.ok(all.items.some((x) => x.name === 'Pump.fun'));
  assert.ok(!('address' in result.items[0]));
});
test('directory pagination cannot request another host or endpoint', () => {
  for (const href of [
    'https://untrusted.example/x',
    '//untrusted.example/x',
    '?abc_page=2&amp;redirect=x',
    '/admin',
  ])
    assert.throws(() =>
      parseEcosystemPage(
        card('Good', 'good') + `<a href="${href}" aria-label="Next Page">Next</a>`,
      ),
    );
  assert.equal(
    parseEcosystemPage(
      '<div data-check="Bad"><a href="javascript:alert(1)"></a><p class="subhead-large u-mb-0">Bad</p>',
    ).items.length,
    0,
  );
});
test('refresh is shared, failed refresh preserves dated snapshot and backs off', async () => {
  let time = 0,
    calls = 0,
    fail = false;
  const service = createEcosystemService(
    async () => {
      calls++;
      if (fail) return new Response('', { status: 503 });
      return new Response(card('Project', 'project'));
    },
    () => time,
  );
  await Promise.all([service('Project'), service('Proj')]);
  assert.equal(calls, 1);
  fail = true;
  time = 3600001;
  const stale = await service('Project');
  assert.equal(stale.status, 'stale');
  assert.equal(stale.observedAt, new Date(0).toISOString());
  assert.equal(stale.items.length, 1);
  await service();
  assert.equal(calls, 2);
});
test('partial directory fetch does not claim complete current coverage', async () => {
  let calls = 0;
  const service = createEcosystemService(async () =>
    ++calls === 1
      ? new Response(
          card('Partial', 'partial') + '<a href="?abc_page=2" aria-label="Next Page">Next</a>',
        )
      : new Response('', { status: 503 }),
  );
  const result = await service();
  assert.equal(result.status, 'unavailable');
  assert.equal(result.observedAt, null);
  assert.ok(!result.items.some((x) => x.name === 'Partial'));
});
