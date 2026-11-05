import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const candidates = [
  path.join(root, 'node_modules/vite/bin/vite.js'),
  '/root/.grok/nightwire-app/node_modules/vite/bin/vite.js',
  '/tmp/nw-nm/node_modules/vite/bin/vite.js',
];
const bin = candidates.find((p) => existsSync(p));
if (!bin) {
  console.error('vite missing. Run npm install where symlinks are allowed, or install into ~/.grok/nightwire-app.');
  process.exit(1);
}

const cmd = process.argv[2] || 'dev';
const extra = cmd === 'build'
  ? ['build']
  : cmd === 'preview'
    ? ['preview', '--host', '127.0.0.1', '--port', '5173']
    : ['--host', '127.0.0.1', '--port', '5173'];
const child = spawnSync(process.execPath, [bin, ...extra, ...process.argv.slice(3)], {
  cwd: root,
  stdio: 'inherit',
});
process.exit(child.status ?? 1);
