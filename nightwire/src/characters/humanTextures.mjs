/**
 * NIGHTWIRE — procedural character surface maps (.mjs)
 * Height fields drawn on a canvas and converted to tangent-space normal maps (Sobel).
 *  - fabric: weave + soft fold streaks (jacket / hoodie / pants)
 *  - skin: pores + fine creases
 *  - iris: eye colour disc with pupil and limbal ring
 * Cached; no image files.
 */

import * as THREE from 'three';

const cache = new Map();

function canvas(size) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  return [c, c.getContext('2d')];
}

function rand(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function heightToNormal(src, strength) {
  const size = src.width;
  const g = src.getContext('2d');
  const h = g.getImageData(0, 0, size, size).data;
  const [dst, dg] = canvas(size);
  const out = dg.createImageData(size, size);
  const at = (x, y) => h[(((y + size) % size) * size + ((x + size) % size)) * 4] / 255;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * strength;
      const dy = (at(x, y + 1) - at(x, y - 1)) * strength;
      const len = Math.hypot(dx, dy, 1);
      const i = (y * size + x) * 4;
      out.data[i] = ((-dx / len) * 0.5 + 0.5) * 255;
      out.data[i + 1] = ((dy / len) * 0.5 + 0.5) * 255;
      out.data[i + 2] = ((1 / len) * 0.5 + 0.5) * 255;
      out.data[i + 3] = 255;
    }
  }
  dg.putImageData(out, 0, 0);
  return dst;
}

function tex(c, repeat, srgb = false) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat, repeat);
  t.anisotropy = 4;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.needsUpdate = true;
  return t;
}

export function fabricNormal() {
  if (cache.has('fabric')) return cache.get('fabric');
  const size = 256;
  const [c, g] = canvas(size);
  const r = rand(7);
  g.fillStyle = '#808080';
  g.fillRect(0, 0, size, size);
  // weave
  for (let y = 0; y < size; y += 2) {
    g.fillStyle = `rgba(${y % 4 ? 150 : 110},${y % 4 ? 150 : 110},${y % 4 ? 150 : 110},0.35)`;
    g.fillRect(0, y, size, 1);
  }
  for (let x = 0; x < size; x += 2) {
    g.fillStyle = `rgba(${x % 4 ? 140 : 115},0,0,0.25)`;
    g.fillRect(x, 0, 1, size);
  }
  // folds: long soft diagonal / vertical streaks
  for (let i = 0; i < 26; i++) {
    const x = r() * size;
    const w = 6 + r() * 22;
    const grd = g.createLinearGradient(x - w, 0, x + w, 0);
    const v = r() > 0.5 ? 255 : 0;
    grd.addColorStop(0, 'rgba(128,128,128,0)');
    grd.addColorStop(0.5, `rgba(${v},${v},${v},${0.12 + r() * 0.18})`);
    grd.addColorStop(1, 'rgba(128,128,128,0)');
    g.save();
    g.translate(size / 2, size / 2);
    g.rotate((r() - 0.5) * 0.7);
    g.translate(-size / 2, -size / 2);
    g.fillStyle = grd;
    g.fillRect(x - w, -size * 0.2, w * 2, size * 1.4);
    g.restore();
  }
  const t = tex(heightToNormal(c, 2.2), 3);
  cache.set('fabric', t);
  return t;
}

export function skinNormal() {
  if (cache.has('skin')) return cache.get('skin');
  const size = 256;
  const [c, g] = canvas(size);
  const r = rand(19);
  g.fillStyle = '#808080';
  g.fillRect(0, 0, size, size);
  for (let i = 0; i < 5200; i++) {
    const v = r() > 0.5 ? 70 : 170;
    g.fillStyle = `rgba(${v},${v},${v},${0.25 + r() * 0.3})`;
    const s = 0.6 + r() * 1.4;
    g.beginPath();
    g.arc(r() * size, r() * size, s, 0, Math.PI * 2);
    g.fill();
  }
  g.strokeStyle = 'rgba(90,90,90,0.25)';
  for (let i = 0; i < 60; i++) {
    g.lineWidth = 0.6;
    g.beginPath();
    const x = r() * size; const y = r() * size;
    g.moveTo(x, y);
    g.lineTo(x + (r() - 0.5) * 30, y + (r() - 0.5) * 8);
    g.stroke();
  }
  const t = tex(heightToNormal(c, 1.4), 6);
  cache.set('skin', t);
  return t;
}

export function irisTexture(hex = '#5a3e26') {
  const key = `iris${hex}`;
  if (cache.has(key)) return cache.get(key);
  const size = 128;
  const [c, g] = canvas(size);
  g.fillStyle = '#e9e4dc';
  g.fillRect(0, 0, size, size);
  // sphere UV: u around, v pole to pole. Iris sits at the front (u ≈ 0.25 on SphereGeometry +Z).
  const cx = size * 0.25; const cy = size * 0.5;
  const grd = g.createRadialGradient(cx, cy, 2, cx, cy, size * 0.11);
  grd.addColorStop(0, '#050505');
  grd.addColorStop(0.32, '#080606');
  grd.addColorStop(0.36, hex);
  grd.addColorStop(0.85, hex);
  grd.addColorStop(1, '#1a1410');
  g.fillStyle = grd;
  g.beginPath();
  g.ellipse(cx, cy, size * 0.11, size * 0.22, 0, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = 'rgba(160,40,40,0.18)';
  for (let i = 0; i < 14; i++) {
    g.beginPath();
    g.moveTo(cx + size * 0.5 + Math.random() * 30, Math.random() * size);
    g.lineTo(cx + size * 0.2, cy + (Math.random() - 0.5) * 40);
    g.stroke();
  }
  const t = tex(c, 1, true);
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  t.repeat.set(1, 1);
  cache.set(key, t);
  return t;
}

/**
 * Face detail map in the head sphere's UV space (u around, v pole to pole; +Z face at u = 0.25).
 * Painted in head-local unit directions so it lines up with the sculpt: socket shading, lids,
 * brows, lips, nostrils, blush, optional stubble and a buzz-cut hairline. Multiplied by skin colour.
 */
export function faceTexture({ brow = '#1a120c', stubble = 0, buzz = false, hair = '#15110e', seed = 1 } = {}) {
  const key = `face${brow}${stubble}${buzz}${hair}${seed}`;
  if (cache.has(key)) return cache.get(key);
  const W = 512; const H = 256;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  const r = rand(seed * 31 + 5);
  // unit direction → canvas px
  const P = (x, y, z) => {
    const l = Math.hypot(x, y, z); x /= l; y /= l; z /= l;
    let u = Math.atan2(z, -x) / (Math.PI * 2); if (u < 0) u += 1;
    return [u * W, (Math.acos(y) / Math.PI) * H];
  };
  const blob = (x, y, z, rx, ry, color) => {
    const [px, py] = P(x, y, z);
    const grd = g.createRadialGradient(0, 0, 0, 0, 0, 1);
    grd.addColorStop(0, color);
    grd.addColorStop(1, color.replace(/[\d.]+\)$/, '0)'));
    g.save(); g.translate(px, py); g.scale(rx, ry);
    g.fillStyle = grd; g.beginPath(); g.arc(0, 0, 1, 0, Math.PI * 2); g.fill(); g.restore();
  };
  g.fillStyle = '#f2ece8';
  g.fillRect(0, 0, W, H);
  for (let i = 0; i < 2500; i++) { // mottling
    g.fillStyle = `rgba(${150 + r() * 80},${90 + r() * 60},${80 + r() * 50},0.05)`;
    g.fillRect(r() * W, r() * H, 2 + r() * 6, 2 + r() * 6);
  }
  if (buzz) {
    g.fillStyle = hair;
    g.globalAlpha = 0.85;
    const [, top] = P(0, 0.42, 0.9);
    g.fillRect(0, 0, W, top);
    const [, back] = P(0, -0.25, -0.9);
    g.fillRect(W * 0.55, 0, W * 0.4, back);
    g.globalAlpha = 1;
    for (let i = 0; i < 2600; i++) { g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(r() * W, r() * top, 1, 1); }
  }
  for (const s of [1, -1]) {
    blob(s * 0.37, 0.1, 0.92, 26, 16, 'rgba(90,50,45,0.55)');   // socket shading
    blob(s * 0.37, 0.16, 0.92, 18, 6, 'rgba(70,40,36,0.5)');    // upper lid crease
    blob(s * 0.4, 0.0, 0.92, 16, 5, 'rgba(110,60,60,0.35)');    // under-eye
    blob(s * 0.5, -0.25, 0.83, 30, 22, 'rgba(210,90,80,0.18)'); // cheek blush
    // brow: a row of short strokes
    g.strokeStyle = brow; g.lineCap = 'round';
    for (let k = 0; k < 26; k++) {
      const t = k / 25;
      const x = s * (0.16 + t * 0.42); const y = 0.29 + Math.sin(t * Math.PI) * 0.05 - t * 0.04;
      const [px, py] = P(x, y, 0.88);
      g.globalAlpha = 0.55 + r() * 0.35; g.lineWidth = 1.2 + (1 - t) * 1.6;
      g.beginPath(); g.moveTo(px, py + 2); g.lineTo(px + s * 3, py - 2); g.stroke();
    }
    g.globalAlpha = 1;
    blob(s * 0.1, -0.27, 0.95, 4, 3, 'rgba(40,20,18,0.8)'); // nostril
  }
  blob(0, -0.43, 0.88, 22, 6, 'rgba(160,60,62,0.8)');  // upper lip
  blob(0, -0.55, 0.84, 24, 7, 'rgba(170,70,72,0.75)'); // lower lip
  blob(0, -0.49, 0.86, 26, 2.4, 'rgba(50,20,20,0.85)'); // mouth line
  if (stubble > 0) {
    for (let i = 0; i < 2200 * stubble; i++) {
      const a = (r() - 0.5) * 1.6; const y = -0.35 - r() * 0.55;
      const [px, py] = P(Math.sin(a) * 0.9, y, Math.cos(a) * 0.9);
      if (Math.abs(y + 0.52) < 0.06 && Math.abs(a) < 0.35) continue;
      g.fillStyle = `rgba(30,22,18,${0.25 + r() * 0.3})`;
      g.fillRect(px, py, 1, 1);
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  t.needsUpdate = true;
  cache.set(key, t);
  return t;
}
