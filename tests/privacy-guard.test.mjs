import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, copyFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

function fixture(run) {
  const dir = mkdtempSync(join(tmpdir(), 'arcwell-guard-'));
  const git = (...args) => {
    const result = spawnSync('git', args, { cwd: dir, encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    return result.stdout.trim();
  };
  const guard = (...args) =>
    spawnSync(process.execPath, ['scripts/identity-guard.mjs', ...args], {
      cwd: dir,
      encoding: 'utf8',
    });
  try {
    mkdirSync(join(dir, 'scripts'));
    for (const file of ['identity-guard.mjs', 'privacy-policy.json'])
      copyFileSync(new URL(`../scripts/${file}`, import.meta.url), join(dir, 'scripts', file));
    git('init', '-q');
    git('config', 'user.name', 'ARCWELL Contributors');
    git('config', 'user.email', 'contributors@arcwell.invalid');
    git('config', 'core.hooksPath', '/dev/null');
    run({ dir, git, guard });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test('accepts the public identity and clean staged content', () =>
  fixture(({ dir, git, guard }) => {
    writeFileSync(join(dir, 'sample.txt'), 'Example research data.');
    git('add', 'sample.txt');
    assert.equal(guard().status, 0);
  }));
test('rejects staged private data even when working tree has been cleaned', () =>
  fixture(({ dir, git, guard }) => {
    writeFileSync(join(dir, 'sample.txt'), ['person', 'example.net'].join('@'));
    git('add', 'sample.txt');
    writeFileSync(join(dir, 'sample.txt'), 'Clean working tree copy.');
    assert.notEqual(guard().status, 0);
  }));
test('rejects credentials and restricted document paths', () =>
  fixture(({ dir, git, guard }) => {
    writeFileSync(join(dir, 'notes.pdf'), 'gh' + 'p_' + 'a'.repeat(36));
    git('add', 'notes.pdf');
    const r = guard();
    assert.notEqual(r.status, 0);
    assert.match(r.stderr, /document path/);
    assert.match(r.stderr, /credential/);
  }));
test('detects a personal committer despite an approved author', () =>
  fixture(({ dir, git, guard }) => {
    writeFileSync(join(dir, 'sample.txt'), 'clean');
    git('add', 'sample.txt');
    git(
      '-c',
      'user.name=Example Person',
      '-c',
      'user.email=person@example.com',
      'commit',
      '-qm',
      'Example',
      '--author=ARCWELL Contributors <contributors@arcwell.invalid>',
    );
    assert.notEqual(guard('--history').status, 0);
  }));
test('finds old content deleted from the latest tree', () =>
  fixture(({ dir, git, guard }) => {
    writeFileSync(join(dir, 'sample.txt'), ['person', 'example.net'].join('@'));
    git('add', 'sample.txt');
    git('commit', '-qm', 'First snapshot');
    git('rm', 'sample.txt');
    git('commit', '-qm', 'Remove sample');
    assert.notEqual(guard('--history').status, 0);
  }));
test('checks non-current branches as well as HEAD', () =>
  fixture(({ dir, git, guard }) => {
    writeFileSync(join(dir, 'sample.txt'), 'clean');
    git('add', 'sample.txt');
    git('commit', '-qm', 'Root');
    const base = git('rev-parse', 'HEAD');
    git('switch', '-c', 'topic');
    git('-c', 'user.name=Example Person', 'commit', '--allow-empty', '-qm', 'Other branch');
    git('checkout', '--detach', base);
    assert.notEqual(guard('--history').status, 0);
  }));
test('rejects personal attribution in commit messages', () =>
  fixture(({ dir, guard }) => {
    writeFileSync(
      join(dir, 'message'),
      'Co-authored-by: Example Person <' + ['person', 'example.net'].join('@') + '>',
    );
    assert.notEqual(guard('--message', join(dir, 'message')).status, 0);
  }));

test('accepts only the reviewed issuer catalog URL and still blocks unrelated profiles', () =>
  fixture(({ dir, git, guard }) => {
    const base = ['https://github.com', 'ondoprotocol'].join('/');
    writeFileSync(join(dir, 'source.txt'), base + '/ondo-global-markets-token-list');
    git('add', 'source.txt');
    assert.equal(guard().status, 0);
    for (const suffix of [
      '',
      '/other',
      '/ondo-global-markets-token-list-extra',
      '/ondo-global-markets-token-list/private',
    ]) {
      writeFileSync(join(dir, 'source.txt'), base + suffix);
      git('add', 'source.txt');
      assert.notEqual(guard().status, 0);
    }
  }));
