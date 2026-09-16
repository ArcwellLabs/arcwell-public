import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
const policy = JSON.parse(readFileSync(new URL('./privacy-policy.json', import.meta.url)));
for (const [key, value] of [
  ['user.name', policy.name],
  ['user.email', policy.email],
  ['user.useConfigOnly', 'true'],
  ['core.hooksPath', '.githooks'],
])
  execFileSync('git', ['config', '--local', key, value], { stdio: 'inherit' });
console.log('Repository-local contributor identity and privacy hooks installed.');
