import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Paths are relative to this file so the build works in any checkout, CI runner or container.
const project = path.dirname(fileURLToPath(import.meta.url));
const nmCandidates = [
  path.join(project, 'node_modules'),
  path.join(os.homedir(), '.grok/nightwire-app/node_modules'),
  '/tmp/nw-nm/node_modules',
];
const nm = nmCandidates.find((dir) => fs.existsSync(path.join(dir, 'three/build/three.module.js')))
  || nmCandidates[0];

// Packaged builds (Capacitor, Electron) do not ship source maps. Set NIGHTWIRE_SOURCEMAP=1 to keep them.
const sourcemap = process.env.NIGHTWIRE_SOURCEMAP === '1';

export default {
  root: project,
  // Absolute '/' stays: Capacitor serves https://localhost/ and Electron serves app://nightwire/,
  // so '/assets/...' and '/manifest.webmanifest' resolve in every target.
  base: '/',
  publicDir: path.join(project, 'public'),
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    fs: { allow: [project, path.dirname(nm)] },
  },
  preview: { host: '127.0.0.1', port: 5173, strictPort: true },
  resolve: {
    alias: [
      { find: /^three\/examples\/jsm/, replacement: path.join(nm, 'three/examples/jsm') },
      { find: /^three\/addons/, replacement: path.join(nm, 'three/examples/jsm') },
      { find: /^three$/, replacement: path.join(nm, 'three/build/three.module.js') },
    ],
  },
  cacheDir: process.env.NIGHTWIRE_VITE_CACHE || path.join(project, 'node_modules/.vite'),
  optimizeDeps: { exclude: ['three'] },
  build: {
    target: 'es2022',
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap,
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: { manualChunks: { three: ['three'] } },
    },
  },
};
