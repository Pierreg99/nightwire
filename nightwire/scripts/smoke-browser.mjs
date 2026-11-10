// Headless browser smoke test for the production build (no extra npm dependencies).
// Serves dist/ on 127.0.0.1, opens it in headless Chrome/Chromium via the DevTools protocol,
// optionally emulates a phone (--mobile), clicks JACK IN, prints console errors and saves a frame.
//   node scripts/smoke-browser.mjs [--mobile] [--out /tmp/nightwire-smoke.png] [--wait ms] [--quality mobile] [--phone]
// Also fails on shader compile errors logged by three.js.
// Exit 1 on uncaught exceptions, BOOT FAILED, or a missing WebGL2 context.
import { spawn, spawnSync } from 'node:child_process';
import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync, writeFileSync, mkdtempSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const args = process.argv.slice(2);
const mobile = args.includes('--mobile');
const outIdx = args.indexOf('--out');
const out = outIdx >= 0 ? args[outIdx + 1] : path.join(os.tmpdir(), `nightwire-smoke${mobile ? '-mobile' : ''}.png`);
const opt = (name, def) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : def; };
const waitMs = Number(opt('--wait', 5000));       // time after JACK IN before the frame
const forceQuality = opt('--quality', '');        // e.g. --quality mobile (written to settings first)
const openPhone = args.includes('--phone');       // open the phone before the frame (touch overlap check)

if (!existsSync(path.join(dist, 'index.html'))) {
  console.error('dist/index.html missing. Run npm run build first.');
  process.exit(1);
}
const chrome = [process.env.CHROME_BIN, 'google-chrome', 'chromium', 'chromium-browser']
  .filter(Boolean)
  .find((c) => spawnSync('sh', ['-c', `command -v ${c}`]).status === 0);
if (!chrome) {
  console.error('No Chrome/Chromium found. Set CHROME_BIN.');
  process.exit(1);
}

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml' };
const notFound = [];
const server = createServer((req, res) => {
  const rel = decodeURIComponent(new URL(req.url, 'http://x').pathname).replace(/^\/+/, '') || 'index.html';
  const file = path.normalize(path.join(dist, rel));
  if (!file.startsWith(dist) || !existsSync(file) || !statSync(file).isFile()) {
    notFound.push(`/${rel}`);
    res.writeHead(404).end();
    return;
  }
  res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' });
  res.end(readFileSync(file));
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const url = `http://127.0.0.1:${server.address().port}/${mobile ? '?apk=1' : ''}`;

const profile = mkdtempSync(path.join(os.tmpdir(), 'nw-chrome-'));
const browser = spawn(chrome, [
  '--headless=new', '--no-sandbox', '--remote-debugging-port=0', `--user-data-dir=${profile}`,
  '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist',
  '--window-size=1280,720', 'about:blank',
], { stdio: ['ignore', 'ignore', 'pipe'] });
const wsUrl = await new Promise((resolve, reject) => {
  let buf = '';
  browser.stderr.on('data', (d) => {
    buf += d;
    const m = buf.match(/DevTools listening on (ws:\/\/\S+)/);
    if (m) resolve(m[1]);
  });
  setTimeout(() => reject(new Error('Chrome did not start')), 15000);
});
const port = new URL(wsUrl).port;
const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
const page = targets.find((t) => t.type === 'page');
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r, { once: true }));
let seq = 0;
const pending = new Map();
const errors = [];
const logs = [];
ws.addEventListener('message', (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg);
    pending.delete(msg.id);
    return;
  }
  if (msg.method === 'Runtime.exceptionThrown') errors.push(msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text);
  if (msg.method === 'Runtime.consoleAPICalled') {
    const text = msg.params.args.map((a) => a.value ?? a.description ?? '').join(' ');
    logs.push(`[${msg.params.type}] ${text}`);
  }
});
const send = (method, params = {}) => new Promise((resolve) => {
  const id = ++seq;
  pending.set(id, resolve);
  ws.send(JSON.stringify({ id, method, params }));
});
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

await send('Runtime.enable');
await send('Page.enable');
if (mobile) {
  await send('Emulation.setDeviceMetricsOverride', { width: 915, height: 412, deviceScaleFactor: 2.6, mobile: true });
  await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await send('Emulation.setUserAgentOverride', { userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/130.0 Mobile Safari/537.36' });
}
await send('Page.navigate', { url });
await sleep(6000);
const evalJs = async (expr) => (await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })).result?.result?.value;
if (forceQuality) {
  await evalJs(`(() => { const k = 'nightwire.settings.v1'; const s = JSON.parse(localStorage.getItem(k) || '{}'); s.quality = ${JSON.stringify(forceQuality)}; localStorage.setItem(k, JSON.stringify(s)); })()`);
  await send('Page.reload', {});
  await sleep(6000);
}
await evalJs(`document.getElementById('btn-jack')?.click()`);
await sleep(waitMs);
if (openPhone) {
  await evalJs(`window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Tab' }))`);
  await sleep(800);
}
const state = await evalJs(`JSON.stringify({
  webgl2: !!document.getElementById('c').getContext('webgl2'),
  bootError: document.getElementById('boot-error')?.classList.contains('hidden') ? '' : document.getElementById('boot-error')?.textContent,
  hud: !document.getElementById('hud')?.classList.contains('hidden'),
  touch: !document.getElementById('touch')?.classList.contains('hidden'),
  quality: document.getElementById('quality-readout')?.textContent || '',
  phoneOpen: document.body.classList.contains('phone-open'),
  fireVisible: !!document.getElementById('t-fire')?.offsetParent,
})`);
const shot = await send('Page.captureScreenshot', { format: 'png' });
if (shot.result?.data) writeFileSync(out, Buffer.from(shot.result.data, 'base64'));
ws.close();
browser.kill('SIGKILL');
server.close();

const s = JSON.parse(state || '{}');
console.log(`url      ${url}`);
console.log(`state    ${JSON.stringify(s)}`);
console.log(`404      ${[...new Set(notFound)].join(', ') || 'none'}`);
console.log(`errors   ${errors.length ? errors.join('\n         ') : 'none'}`);
for (const l of logs.filter((x) => /^\[(error|warning|warn)\]/.test(x)).slice(0, 20)) console.log(`console  ${l}`);
console.log(`frame    ${out}`);
const shaderErrors = logs.filter((x) => /Shader Error|WebGLProgram|not compiled/i.test(x));
if (shaderErrors.length) console.log(`shader   ${shaderErrors.length} shader compile error(s)`);
const fail = errors.length > 0 || shaderErrors.length > 0 || !!s.bootError || !s.webgl2 || !s.hud;
process.exit(fail ? 1 : 0);
