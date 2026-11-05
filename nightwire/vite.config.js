import fs from 'node:fs';
import path from 'node:path';

const project = path.resolve('/root/projects/callof/nightwire');
const nmCandidates = [
  path.resolve('/root/.grok/nightwire-app/node_modules'),
  path.resolve('/tmp/nw-nm/node_modules'),
  path.resolve(project, 'node_modules'),
];
const nm = nmCandidates.find((dir) => fs.existsSync(path.join(dir, 'three/build/three.module.js')))
  || nmCandidates[nmCandidates.length - 1];

export default {
  root: project,
  publicDir: path.join(project, 'public'),
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    fs: { allow: [project, '/root/.grok/nightwire-app', '/tmp/nw-nm'] },
  },
  preview: { host: '127.0.0.1', port: 5173, strictPort: true },
  resolve: {
    alias: [
      { find: /^three\/examples\/jsm/, replacement: path.join(nm, 'three/examples/jsm') },
      { find: /^three\/addons/, replacement: path.join(nm, 'three/examples/jsm') },
      { find: 'three', replacement: path.join(nm, 'three/build/three.module.js') },
    ],
  },
  cacheDir: '/root/.grok/nightwire-callof/.vite',
  optimizeDeps: { exclude: ['three'] },
  build: { target: 'esnext', sourcemap: true },
};
