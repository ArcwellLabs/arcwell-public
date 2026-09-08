import { execFileSync } from 'node:child_process';

const expectedName = 'ARCWELL Contributors';
const expectedEmail = 'contributors@arcwell.invalid';
const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();

for (const role of ['AUTHOR', 'COMMITTER']) {
  const identity = git('var', `GIT_${role}_IDENT`);
  if (!identity.startsWith(`${expectedName} <${expectedEmail}> `)) {
    console.error(
      `Identity guard: ${role.toLowerCase()} must use the ARCWELL project identity. Run npm run identity:setup.`,
    );
    process.exit(1);
  }
}

if (process.argv.includes('--history')) {
  const commits = git('log', '--format=%H%x09%an%x09%ae%x09%cn%x09%ce');
  for (const commit of commits.split('\n')) {
    const [sha, author, authorEmail, committer, committerEmail] = commit.split('\t');
    if (
      author !== expectedName ||
      authorEmail !== expectedEmail ||
      committer !== expectedName ||
      committerEmail !== expectedEmail
    ) {
      console.error(`Identity guard: commit ${sha} does not use the ARCWELL project identity.`);
      process.exit(1);
    }
  }
}

console.log('ARCWELL commit identity verified.');
