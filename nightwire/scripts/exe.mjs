import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const web = '/tmp/nw-web';
const prefix = '/tmp/nw-electron';
const appDir = '/tmp/nw-electron-app';

function run(cmd, args, cwd = root) {
  const r = spawnSync(cmd, args, { cwd, stdio: 'inherit' });
  return r.status === 0;
}

function fail(reason) {
  console.error(`EXE was not built. ${reason}`);
  process.exit(1);
}

if (!run(process.execPath, ['scripts/vite.mjs', 'build', '--outDir', web, '--emptyOutDir'])) process.exit(1);
mkdirSync(dist, { recursive: true });
rmSync(path.join(dist, 'assets'), { recursive: true, force: true });
cpSync(web, dist, { recursive: true, filter: (src) => !src.endsWith('.map') });

const electronPkg = path.join(prefix, 'node_modules/electron/package.json');
const packager = path.join(prefix, 'node_modules/@electron/packager/bin/electron-packager.js');
if (!existsSync(electronPkg) || !existsSync(packager)) {
  mkdirSync(prefix, { recursive: true });
  const npm = spawnSync('sh', ['-c', 'command -v npm'], { encoding: 'utf8' });
  if (npm.status !== 0) fail('Missing: npm, so Electron could not be installed.');
  const ok = run('npm', ['install', '--prefix', prefix, 'electron@33.4.11', '@electron/packager@18.3.5']);
  if (!ok) fail('npm install of electron and @electron/packager failed. No zip was renamed to an exe.');
}

rmSync(appDir, { recursive: true, force: true });
mkdirSync(appDir, { recursive: true });
cpSync(web, appDir, {
  recursive: true,
  filter: (src) => !src.endsWith('.map'),
});
writeFileSync(path.join(appDir, 'package.json'), JSON.stringify({
  name: 'nightwire',
  productName: 'NIGHTWIRE',
  author: 'NIGHTWIRE',
  version: '1.0.0',
  main: 'electron-main.cjs',
}, null, 2));
writeFileSync(path.join(appDir, 'electron-main.cjs'), `const { app, BrowserWindow } = require('electron');
app.whenReady().then(() => {
  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    autoHideMenuBar: true,
    backgroundColor: '#07080c',
    webPreferences: { contextIsolation: true, nodeIntegration: false },
  });
  win.loadFile('index.html');
});
app.on('window-all-closed', () => app.quit());
`);

const outParent = '/tmp/nw-win';
rmSync(outParent, { recursive: true, force: true });
const packed = run(process.execPath, [
  packager,
  appDir,
  'nightwire',
  '--platform=win32',
  '--arch=x64',
  `--out=${outParent}`,
  '--overwrite',
  '--no-asar',
  '--electron-version=33.4.11',
]);
if (!packed) fail('electron-packager failed. No file was renamed to .exe.');

const dirs = readdirSync(outParent, { withFileTypes: true }).filter((d) => d.isDirectory());
const builtDir = dirs.map((d) => path.join(outParent, d.name)).find((dir) => existsSync(path.join(dir, 'nightwire.exe')));
if (!builtDir) fail(`Packager finished but nightwire.exe was not in ${outParent}.`);

const dest = path.join(dist, 'nightwire-win');
rmSync(dest, { recursive: true, force: true });
cpSync(builtDir, dest, { recursive: true });
const exe = path.join(dest, 'nightwire.exe');
if (!existsSync(exe)) fail('Copy finished without nightwire.exe.');
console.log(exe);
console.log('The exe needs the rest of dist/nightwire-win beside it.');
