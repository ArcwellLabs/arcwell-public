import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

const policy = JSON.parse(readFileSync(new URL('./privacy-policy.json', import.meta.url)));
const args = process.argv.slice(2);
const git = (...a) => execFileSync('git', a, { maxBuffer: 128 * 1024 * 1024 });
const text = (...a) =>
  git(...a)
    .toString('utf8')
    .trim();
let failures = 0;
const fail = (where, reason) => {
  console.error(`Privacy guard: ${where}: ${reason}`);
  failures++;
};
const forbiddenPaths =
  /(^|\/)(?:\.env(?:\..+)?|\.lovable|\.codex|\.ssh|private|internal|node_modules|artifacts)(?:\/|$)|\.(?:docx?|xlsx?|pdf|pem|p12|key|bundle|zip)$/i;
const internalDocs =
  /^docs\/(?:ARCHITECTURE|FRONTEND-INTEGRATION|PRODUCT|ROADMAP|VERIFICATION|PROJECT-OVERVIEW|INVESTING-WORKSPACE|ARCWELL-Project-Overview)\./i;
const secretPatterns = [
  /gh[pousr]_[a-zA-Z0-9]{20,}/,
  /github_pat_[a-zA-Z0-9_]{20,}/,
  /sk-(?:proj-)?[a-zA-Z0-9_-]{20,}/,
  /AKIA[A-Z0-9]{16}/,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?):\/\/[^\s]+:[^\s]+@/i,
  /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/,
];
const tokenHashes = new Set(policy.blockedTokenHashes);
function inspect(where, bytes, path = '') {
  const data = bytes.toString('utf8');
  for (const token of data.match(/[A-Za-z0-9_.@+-]+/g) ?? []) {
    if (tokenHashes.has(createHash('sha256').update(token.toLowerCase()).digest('hex'))) {
      fail(where, 'restricted identity or project token');
      break;
    }
  }
  if (secretPatterns.some((p) => p.test(data))) fail(where, 'credential-shaped content');
  if (bytes.includes(0)) return; // Binary asset metadata is reviewed separately at release.
  if (
    /(?:^|[\s"'`=])\/(?:Users|home)\/[^\s/]+\//m.test(data) ||
    /[A-Z]:\\Users\\[^\\]+\\/.test(data)
  )
    fail(where, 'personal filesystem path');
  if (/"(?:asset_id|project_id|r2_key)"\s*:/.test(data)) fail(where, 'private asset provenance');
  for (const email of data.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g) ?? []) {
    if (
      !path.startsWith('third-party/') &&
      email !== policy.email &&
      !email.endsWith('@example.com')
    )
      fail(where, 'unapproved email address');
  }
  // Upstream package funding/source links remain intact; they are third-party attribution.
  if (
    !path.startsWith('third-party/') &&
    !/(?:^|\/)(?:package-lock\.json|bun\.lock|THIRD_PARTY_NOTICES\.md)$/.test(path)
  ) {
    for (const match of data.matchAll(
      /https?:\/\/(?:www\.)?(github\.com|x\.com|twitter\.com|linkedin\.com)\/([A-Za-z0-9_-]+)/g,
    )) {
      const allowed =
        match[1] === 'github.com' ? ['ArcwellLabs', 'actions', 'polyformproject'] : ['ARCWELLFI'];
      // Approved issuer source: permit this repository URL only, not personal profiles.
      const issuerSource =
        /^https:\/\/github\.com\/ondoprotocol\/ondo-global-markets-token-list(?=[\s"'<>)]|$)/.test(
          data.slice(match.index),
        );
      if (!allowed.includes(match[2]) && !issuerSource)
        fail(where, 'unapproved profile or repository owner');
    }
  }
}
function inspectPath(path, where) {
  if (
    (forbiddenPaths.test(path) && !/(?:^|\/)\.env\.example$/.test(path)) ||
    internalDocs.test(path)
  )
    fail(where, 'private or unreviewed document path');
  inspect(where, Buffer.from(path));
}
function inspectIdentity() {
  for (const role of ['AUTHOR', 'COMMITTER']) {
    if (!text('var', `GIT_${role}_IDENT`).startsWith(`${policy.name} <${policy.email}> `))
      fail(role.toLowerCase(), 'run npm run identity:setup before committing');
  }
}
function inspectIndex() {
  for (const row of git('ls-files', '--stage', '-z').toString().split('\0').filter(Boolean)) {
    const [meta, path] = row.split('\t');
    const [mode, oid, stage] = meta.split(' ');
    inspectPath(path, 'index path');
    if (stage !== '0' || mode === '160000') {
      fail('index', 'unmerged entry or unreviewed submodule');
      continue;
    }
    inspect(`index ${path}`, git('cat-file', 'blob', oid), path);
  }
}
function inspectHistory() {
  if (text('rev-parse', '--is-shallow-repository') === 'true') {
    fail('history', 'full history required; fetch with --unshallow');
    return;
  }
  const commits = text('rev-list', '--all').split('\n').filter(Boolean);
  for (const sha of commits) {
    const fields = text('show', '-s', '--format=%an%x00%ae%x00%cn%x00%ce', sha).split('\0');
    if (
      fields[0] !== policy.name ||
      fields[1] !== policy.email ||
      fields[2] !== policy.name ||
      fields[3] !== policy.email
    )
      fail(sha.slice(0, 12), 'unapproved author or committer');
    inspect(`commit ${sha.slice(0, 12)}`, git('cat-file', 'commit', sha));
  }
  const seen = new Set();
  for (const line of text('rev-list', '--objects', '--all').split('\n').filter(Boolean)) {
    const [oid, ...tail] = line.split(' ');
    const path = tail.join(' ');
    if (path) inspectPath(path, 'history path');
    const type = text('cat-file', '-t', oid);
    if (type === 'blob' && !seen.has(oid)) {
      inspect(`blob ${oid.slice(0, 12)}`, git('cat-file', 'blob', oid), path);
      seen.add(oid);
    }
    if (type === 'tag') inspect('tag', git('cat-file', 'tag', oid));
  }
  for (const ref of text('for-each-ref', '--format=%(refname)').split('\n').filter(Boolean))
    inspect('ref', Buffer.from(ref));
  console.log(`Audited ${commits.length} commits and ${seen.size} historical blobs.`);
}
if (args.includes('--message'))
  inspect('commit message', readFileSync(args[args.indexOf('--message') + 1]));
else if (args.includes('--history')) inspectHistory();
else {
  inspectIdentity();
  inspectIndex();
}
if (failures) process.exit(1);
console.log('ARCWELL identity and privacy checks passed.');
