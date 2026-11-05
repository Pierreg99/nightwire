import { spawnSync } from 'node:child_process';
import { chmodSync, cpSync, mkdirSync, readdirSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const out = path.join(dist, 'nightwire_1.0.0_all.deb');

function run(cmd, args) {
  const r = spawnSync(cmd, args, { cwd: root, stdio: 'inherit' });
  return r.status === 0;
}

if (!run(process.execPath, ['scripts/vite.mjs', 'build'])) process.exit(1);

if (spawnSync('sh', ['-c', 'command -v dpkg-deb'], { encoding: 'utf8' }).status !== 0) {
  console.error('DEB was not built. Missing: dpkg-deb.');
  process.exit(1);
}

const stage = '/tmp/nw-deb/nightwire_1.0.0_all';
rmSync(stage, { recursive: true, force: true });
const payload = path.join(stage, 'usr/share/nightwire');
mkdirSync(path.join(stage, 'DEBIAN'), { recursive: true });
mkdirSync(path.join(stage, 'usr/bin'), { recursive: true });
mkdirSync(payload, { recursive: true });
cpSync(dist, payload, {
  recursive: true,
  filter: (src) => !/\.(apk|deb|exe)$/.test(src),
});

writeFileSync(path.join(stage, 'DEBIAN/control'), `Package: nightwire
Version: 1.0.0
Section: games
Priority: optional
Architecture: all
Depends: python3
Maintainer: NIGHTWIRE <nightwire@localhost>
Description: Neo-Duisburg night district
 Browser build of the NIGHTWIRE tactical slice.
 The nightwire command serves it on 127.0.0.1 and opens a browser.
`);

const bin = path.join(stage, 'usr/bin/nightwire');
writeFileSync(bin, `#!/bin/sh
ROOT=/usr/share/nightwire
PORT=41731
if ! command -v python3 >/dev/null 2>&1; then
  echo "nightwire needs python3" >&2
  exit 1
fi
python3 -m http.server "$PORT" --bind 127.0.0.1 --directory "$ROOT" >/tmp/nightwire-http.log 2>&1 &
sleep 0.3
if command -v xdg-open >/dev/null 2>&1; then
  xdg-open "http://127.0.0.1:$PORT/" >/dev/null 2>&1 || true
else
  echo "Open http://127.0.0.1:$PORT/"
fi
`);
chmodSync(bin, 0o755);
const relax = (dir) => {
  chmodSync(dir, 0o755);
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) relax(p);
    else if (p !== bin) chmodSync(p, 0o644);
  }
};
relax(stage);

const built = run('dpkg-deb', ['--build', '--root-owner-group', stage, out])
  || run('dpkg-deb', ['--build', stage, out]);
if (!built || !existsSync(out)) {
  console.error('dpkg-deb --build failed.');
  process.exit(1);
}
if (!run('dpkg-deb', ['-I', out]) || !run('dpkg-deb', ['-c', out])) process.exit(1);
console.log(out);
