// Desktop packages via electron-builder.
//   node scripts/desktop.mjs win       -> Windows x64 portable exe + zip (works on Linux without wine)
//   node scripts/desktop.mjs win-setup -> Windows x64 NSIS setup.exe (Windows host, or Linux with wine)
//   node scripts/desktop.mjs linux     -> Linux x64 AppImage + deb
//   node scripts/desktop.mjs appimage  -> AppImage only
//   node scripts/desktop.mjs deb       -> deb only
// Artifacts land in release/. The script exits 1 if electron-builder fails or produced nothing,
// it never renames or fakes a file.
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const release = path.join(root, 'release');
const TARGETS = {
  win: { args: ['--win', 'portable', 'zip', '--x64'], match: /win-x64(-portable\.exe|\.zip)$/ },
  'win-setup': { args: ['--win', 'nsis', '--x64'], match: /-setup\.exe$/, needs: 'wine' },
  linux: { args: ['--linux', 'AppImage', 'deb', '--x64'], match: /\.(AppImage|deb)$/ },
  appimage: { args: ['--linux', 'AppImage', '--x64'], match: /\.AppImage$/ },
  deb: { args: ['--linux', 'deb', '--x64'], match: /\.deb$/ },
};

const which = process.argv[2] || 'linux';
const target = TARGETS[which];
if (!target) {
  console.error(`Unknown target "${which}". Use one of: ${Object.keys(TARGETS).join(', ')}`);
  process.exit(1);
}

function run(cmd, args, env = {}) {
  const r = spawnSync(cmd, args, { cwd: root, stdio: 'inherit', env: { ...process.env, ...env } });
  return r.status === 0;
}

if (target.needs && process.platform !== 'win32'
  && spawnSync('sh', ['-c', `command -v ${target.needs}`]).status !== 0) {
  console.error(`"${which}" needs ${target.needs} on ${process.platform} (electron-builder runs the NSIS installer to extract the uninstaller).`);
  console.error('Build it on Windows, install wine, or use "npm run exe" for the portable exe + zip.');
  process.exit(1);
}

if (!run(process.execPath, ['scripts/vite.mjs', 'build'])) process.exit(1);

const builder = path.join(root, 'node_modules/electron-builder/cli.js');
if (!existsSync(builder)) {
  console.error('electron-builder is missing. Run npm install (or npm ci) in nightwire/ first.');
  process.exit(1);
}

const started = Date.now();
if (!run(process.execPath, [builder, ...target.args, '--publish', 'never'], { CSC_IDENTITY_AUTO_DISCOVERY: 'false' })) {
  console.error(`electron-builder failed for "${which}".`);
  process.exit(1);
}

const fresh = existsSync(release)
  ? readdirSync(release)
    .filter((f) => target.match.test(f))
    .map((f) => path.join(release, f))
    .filter((f) => statSync(f).mtimeMs >= started - 1000)
  : [];
if (!fresh.length) {
  console.error(`electron-builder finished but no ${target.match} artifact appeared in ${release}.`);
  process.exit(1);
}
for (const f of fresh) console.log(`${f}  ${(statSync(f).size / 1048576).toFixed(1)} MB`);
