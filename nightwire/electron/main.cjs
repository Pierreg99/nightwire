// NIGHTWIRE desktop shell (Windows / Linux). Serves the Vite build from app://nightwire/
// so absolute '/assets/...' URLs, pointer lock, fullscreen and WebGL2 behave like on https.
const { app, BrowserWindow, protocol, net, shell, ipcMain, powerSaveBlocker, session } = require('electron');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const fs = require('node:fs');

const SCHEME = 'app';
const HOST = 'nightwire';
const ORIGIN = `${SCHEME}://${HOST}`;
const WEB_ROOT = path.join(__dirname, '..', 'dist');
const ALLOWED_PERMISSIONS = new Set(['pointerLock', 'fullscreen', 'keyboardLock']);

protocol.registerSchemesAsPrivileged([{
  scheme: SCHEME,
  privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true },
}]);

// GPU: keep WebGL on hardware even on blocklisted drivers; the game has its own quality presets.
app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('disable-renderer-backgrounding');

let win = null;
let blockerId = null;

function resolveAsset(requestUrl) {
  const { pathname } = new URL(requestUrl);
  const rel = decodeURIComponent(pathname).replace(/^\/+/, '') || 'index.html';
  const file = path.normalize(path.join(WEB_ROOT, rel));
  if (!file.startsWith(WEB_ROOT)) return null; // no path traversal out of dist/
  if (fs.existsSync(file) && fs.statSync(file).isFile()) return file;
  return path.extname(rel) ? null : path.join(WEB_ROOT, 'index.html');
}

function registerProtocol() {
  protocol.handle(SCHEME, (request) => {
    const file = resolveAsset(request.url);
    if (!file) return new Response('not found', { status: 404 });
    return net.fetch(pathToFileURL(file).toString());
  });
}

function lockDownSession() {
  const ses = session.defaultSession;
  ses.setPermissionRequestHandler((_wc, permission, callback) => callback(ALLOWED_PERMISSIONS.has(permission)));
  ses.setPermissionCheckHandler((_wc, permission) => ALLOWED_PERMISSIONS.has(permission));
}

function keepAwake(on) {
  if (on && blockerId === null) blockerId = powerSaveBlocker.start('prevent-display-sleep');
  if (!on && blockerId !== null) {
    powerSaveBlocker.stop(blockerId);
    blockerId = null;
  }
}

function createWindow() {
  win = new BrowserWindow({
    width: 1600,
    height: 900,
    minWidth: 960,
    minHeight: 540,
    show: false,
    title: 'NIGHTWIRE',
    backgroundColor: '#07080c',
    autoHideMenuBar: true,
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      spellcheck: false,
      backgroundThrottling: false,
      devTools: !app.isPackaged || process.env.NIGHTWIRE_DEVTOOLS === '1',
    },
  });
  win.setMenu(null);
  win.once('ready-to-show', () => {
    win.show();
    if (process.argv.includes('--fullscreen') || process.env.NIGHTWIRE_FULLSCREEN === '1') win.setFullScreen(true);
  });
  win.on('focus', () => keepAwake(true));
  win.on('blur', () => keepAwake(false));
  win.on('closed', () => { keepAwake(false); win = null; });

  // Stay inside the game. External https links open in the system browser, everything else is dropped.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://')) shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith(ORIGIN)) event.preventDefault();
  });
  win.webContents.on('before-input-event', (event, input) => {
    if (input.type !== 'keyDown') return;
    const toggle = input.key === 'F11' || (input.alt && input.key === 'Enter');
    if (toggle) {
      event.preventDefault();
      win.setFullScreen(!win.isFullScreen());
    }
  });
  win.webContents.on('render-process-gone', (_e, details) => {
    console.error('renderer gone:', details.reason);
    if (details.reason !== 'clean-exit' && win) win.reload();
  });

  if (process.env.NIGHTWIRE_SMOKE) attachSmoke(win, process.env.NIGHTWIRE_SMOKE);
  win.loadURL(`${ORIGIN}/index.html`);
}

// Packaging self-check: NIGHTWIRE_SMOKE=/path/shot.png prints renderer console output,
// clicks JACK IN, saves a frame and quits. Used by CI / local smoke runs only.
function attachSmoke(w, shotPath) {
  w.webContents.on('console-message', (event) => {
    const { level, message } = event;
    console.log(`[renderer:${level}] ${message}`);
  });
  w.webContents.once('did-finish-load', () => {
    setTimeout(async () => {
      try {
        // hyperreal asset pass (app:// protocol): wait for it, report loaded / failed files
        const assets = await w.webContents.executeJavaScript(`Promise.race([
          (window.__nightwire?.assetsReady || Promise.resolve(null)).then((r) => JSON.stringify(r && { ...r, lib: undefined, failed: r.lib?.failed, loadErrors: r.lib?.errors })),
          new Promise((r) => setTimeout(() => r('"timeout"'), 90000)),
        ])`, true);
        console.log(`[smoke] assets ${assets}`);
        if (/timeout|"failed":[1-9]|"error"/.test(assets || '')) process.exitCode = 1;
        const state = await w.webContents.executeJavaScript(`(() => {
          document.getElementById('btn-jack')?.click();
          const gl = document.getElementById('c').getContext('webgl2');
          return JSON.stringify({ native: !!window.nightwireNative, webgl2: !!gl,
            bootError: document.getElementById('boot-error')?.textContent || '' });
        })()`, true);
        console.log(`[smoke] ${state}`);
        await new Promise((r) => setTimeout(r, 4000));
        const img = await w.webContents.capturePage();
        fs.writeFileSync(shotPath, img.toPNG());
        console.log(`[smoke] frame ${shotPath}`);
      } catch (err) {
        console.error('[smoke] failed', err);
        process.exitCode = 1;
      }
      app.quit();
    }, 3000);
  });
}

ipcMain.handle('nightwire:fullscreen', (_e, on) => {
  if (!win) return false;
  win.setFullScreen(typeof on === 'boolean' ? on : !win.isFullScreen());
  return win.isFullScreen();
});
ipcMain.handle('nightwire:quit', () => app.quit());

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (!win) return;
    if (win.isMinimized()) win.restore();
    win.focus();
  });
  app.whenReady().then(() => {
    registerProtocol();
    lockDownSession();
    createWindow();
    app.on('activate', () => { if (!BrowserWindow.getAllWindows().length) createWindow(); });
  });
  app.on('window-all-closed', () => app.quit());
}
