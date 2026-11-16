// Android packages via Capacitor 8 + Gradle.
//   node scripts/apk.mjs debug    -> release/nightwire-<v>-debug.apk     (installable, debug-signed)
//   node scripts/apk.mjs release  -> release/nightwire-<v>-release[-unsigned].apk
//   node scripts/apk.mjs bundle   -> release/nightwire-<v>-release[-unsigned].aab (Play Store)
// Needs JDK 21 (JAVA_HOME or java on PATH) and the Android SDK (ANDROID_HOME / ANDROID_SDK_ROOT,
// or sdk.dir in android/local.properties). Release signing: see docs/BUILDS.md (env vars only).
// Exits 1 with the reason when a tool is missing or Gradle fails. It never writes a fake package.
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const android = path.join(root, 'android');
const release = path.join(root, 'release');
const { version } = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));

const MODES = {
  debug: { task: 'assembleDebug', dir: 'apk/debug', file: 'app-debug.apk', out: `nightwire-${version}-debug.apk` },
  release: { task: 'assembleRelease', dir: 'apk/release', file: ['app-release.apk', 'app-release-unsigned.apk'], out: `nightwire-${version}-release.apk` },
  bundle: { task: 'bundleRelease', dir: 'bundle/release', file: 'app-release.aab', out: `nightwire-${version}-release.aab` },
};
const mode = process.argv[2] || 'debug';
const spec = MODES[mode];
if (!spec) {
  console.error(`Unknown mode "${mode}". Use debug, release or bundle.`);
  process.exit(1);
}

function run(cmd, args, cwd = root) {
  const r = spawnSync(cmd, args, { cwd, stdio: 'inherit', shell: process.platform === 'win32' });
  return r.status === 0;
}
const has = (name) => spawnSync(process.platform === 'win32' ? 'where' : 'sh',
  process.platform === 'win32' ? [name] : ['-c', `command -v ${name}`]).status === 0;

// 1. Web bundle
if (!run(process.execPath, ['scripts/vite.mjs', 'build'])) process.exit(1);

// 2. Copy into the native project (also regenerates capacitor.settings.gradle for this checkout)
const cap = path.join(root, 'node_modules/@capacitor/cli/bin/capacitor');
if (!existsSync(cap)) {
  console.error('@capacitor/cli is missing. Run npm install (or npm ci) in nightwire/ first.');
  process.exit(1);
}
if (!run(process.execPath, [cap, 'sync', 'android'])) {
  console.error('npx cap sync android failed.');
  process.exit(1);
}

// 3. Toolchain check
const localProps = path.join(android, 'local.properties');
const sdk = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT || '';
const sdkFromProps = existsSync(localProps) && /^sdk\.dir=/m.test(readFileSync(localProps, 'utf8'));
const missing = [];
if (!(process.env.JAVA_HOME || has('java'))) missing.push('JDK 21 (JAVA_HOME or java on PATH)');
if (!((sdk && existsSync(sdk)) || sdkFromProps)) missing.push('Android SDK (ANDROID_HOME or android/local.properties sdk.dir)');
if (missing.length) {
  console.error(`Android ${mode} was not built. Missing: ${missing.join(', ')}.`);
  console.error('The web bundle is in dist/ and was synced into android/. See docs/BUILDS.md.');
  process.exit(1);
}

// 4. Gradle
const gradlew = path.join(android, process.platform === 'win32' ? 'gradlew.bat' : 'gradlew');
if (!run(gradlew, [spec.task, '--no-daemon', '--console=plain'], android)) {
  console.error(`gradlew ${spec.task} failed.`);
  process.exit(1);
}

// 5. Collect
const outDir = path.join(android, 'app/build/outputs', spec.dir);
const built = [].concat(spec.file).map((f) => path.join(outDir, f)).find((f) => existsSync(f));
if (!built) {
  console.error(`Gradle finished but no ${[].concat(spec.file).join(' / ')} in ${outDir}.`);
  process.exit(1);
}
const unsigned = /unsigned/.test(built) || (mode !== 'debug' && !process.env.NIGHTWIRE_KEYSTORE && !process.env.NIGHTWIRE_KEYSTORE_PROPERTIES);
const outName = unsigned && mode !== 'debug' ? spec.out.replace(/\.(apk|aab)$/, '-unsigned.$1') : spec.out;
mkdirSync(release, { recursive: true });
const out = path.join(release, outName);
cpSync(built, out);
console.log(`${out}  ${(statSync(out).size / 1048576).toFixed(1)} MB`);
if (unsigned && mode !== 'debug') console.log('Unsigned: sign it (apksigner / Play App Signing) or set the NIGHTWIRE_KEYSTORE* env vars and rebuild.');
