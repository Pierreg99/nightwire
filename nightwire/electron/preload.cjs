// Minimal, read-mostly bridge. No Node APIs reach the page.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('nightwireNative', Object.freeze({
  shell: 'electron',
  platform: process.platform,
  setFullscreen: (on) => ipcRenderer.invoke('nightwire:fullscreen', on),
  quit: () => ipcRenderer.invoke('nightwire:quit'),
}));
