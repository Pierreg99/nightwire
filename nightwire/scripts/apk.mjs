import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');

function run(cmd, args, cwd = root) {
  const r = spawnSync(cmd, args, { cwd, stdio: 'inherit' });
  return r.status === 0;
}

function commandExists(name) {
  return spawnSync('sh', ['-c', `command -v ${name}`], { encoding: 'utf8' }).status === 0;
}

if (!run(process.execPath, ['scripts/vite.mjs', 'build'])) process.exit(1);

const assets = path.join(root, 'android/app/src/main/assets/public');
rmSync(assets, { recursive: true, force: true });
mkdirSync(assets, { recursive: true });
cpSync(dist, assets, {
  recursive: true,
  filter: (src) => !/\.(apk|deb|exe|map)$/.test(src),
});

const sdk = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT || '';
const missing = [];
if (!(process.env.JAVA_HOME || commandExists('java'))) missing.push('java (or JAVA_HOME)');
if (!sdk || !existsSync(sdk)) missing.push('ANDROID_HOME');
if (missing.length) {
  console.error(`APK was not assembled. Missing: ${missing.join(', ')}.`);
  console.error('Web bundle is in dist/. Android project assets were updated.');
  process.exit(1);
}

const android = path.join(root, 'android');
if (!run(path.join(android, 'gradlew'), ['assembleDebug'], android)) {
  console.error('gradlew assembleDebug failed.');
  process.exit(1);
}

const built = path.join(android, 'app/build/outputs/apk/debug/app-debug.apk');
if (!existsSync(built)) {
  console.error(`Gradle finished but ${built} is missing.`);
  process.exit(1);
}
const out = path.join(dist, 'nightwire-debug.apk');
cpSync(built, out);
console.log(out);
