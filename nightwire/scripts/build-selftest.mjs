// Static checks for the packaging setup. Fast, no network, no SDK needed. Run: npm run test:builds
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(path.join(root, p), 'utf8');
const pkg = JSON.parse(read('package.json'));
const cap = JSON.parse(read('capacitor.config.json'));
const eb = read('electron-builder.yml');
const gradle = read('android/app/build.gradle');
const manifest = read('android/app/src/main/AndroidManifest.xml');
const main = read('electron/main.cjs');

// Versions and entry points line up.
assert.match(pkg.version, /^\d+\.\d+\.\d+$/, 'package.json version must be x.y.z (Android versionCode is derived from it)');
assert.equal(pkg.main, 'electron/main.cjs');
assert.ok(existsSync(path.join(root, pkg.main)) && existsSync(path.join(root, 'electron/preload.cjs')));
assert.match(gradle, /JsonSlurper\(\)\.parse\(rootProject\.file\('\.\.\/package\.json'\)\)/, 'Gradle reads the version from package.json');
assert.doesNotMatch(gradle, /versionCode 1\b/, 'no hard-coded versionCode');

// Web output is dist/ everywhere, packaging output is release/.
assert.equal(cap.webDir, 'dist');
assert.equal(cap.server?.androidScheme, 'https');
assert.match(eb, /output: release/);
assert.match(eb, /- dist\/\*\*\/\*/);
assert.match(main, /path\.join\(__dirname, '\.\.', 'dist'\)/);

// Electron hardening stays on.
for (const flag of ['contextIsolation: true', 'nodeIntegration: false', 'sandbox: true', 'requestSingleInstanceLock']) {
  assert.ok(main.includes(flag), `electron/main.cjs must keep ${flag}`);
}

// Android: landscape, GLES3, no secrets, wrapper complete.
assert.match(manifest, /screenOrientation="sensorLandscape"/);
assert.match(manifest, /glEsVersion="0x00030000"/);
assert.match(gradle, /System\.getenv\('NIGHTWIRE_KEYSTORE'\)/);
assert.doesNotMatch(gradle, /storePassword\s+["']/, 'no literal store password in Gradle');
const wrapper = path.join(root, 'android/gradle/wrapper/gradle-wrapper.jar');
assert.ok(existsSync(wrapper) && statSync(wrapper).size > 40000, 'gradle-wrapper.jar present');
const mode = execSync('git ls-files -s android/gradlew', { cwd: root, encoding: 'utf8' }).split(' ')[0];
assert.equal(mode, '100755', 'android/gradlew must be committed executable');
const tracked = execSync('git ls-files', { cwd: root, encoding: 'utf8' }).split('\n');
assert.deepEqual(tracked.filter((f) => /\.(jks|keystore|apk|aab|AppImage|deb)$|keystore\.properties$/.test(f)), [], 'no keystores or packages in git');

// The vite config must not depend on one machine's absolute paths.
assert.doesNotMatch(read('vite.config.js'), /\/root\//);

console.log('build config self-test ok');
