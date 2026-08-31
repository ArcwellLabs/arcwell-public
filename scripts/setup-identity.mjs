import { execFileSync } from 'node:child_process';

for (const [key, value] of [
  ['user.name', 'ARCWELL Contributors'],
  ['user.email', 'contributors@arcwell.invalid'],
  ['core.hooksPath', '.githooks'],
]) {
  execFileSync('git', ['config', '--local', key, value], { stdio: 'inherit' });
}
console.log('Repository-local ARCWELL identity and commit/push guards installed.');
