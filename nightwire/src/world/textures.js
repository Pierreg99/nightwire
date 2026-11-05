import * as THREE from 'three';
import { LOOK } from '../fx/look.js';

function canvas(size = 512) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  return [c, c.getContext('2d')];
}

function noise(g, n, color, size) {
  for (let i = 0; i < n; i++) {
    g.fillStyle = color(Math.random());
    g.fillRect(Math.random() * size, Math.random() * size, 1 + Math.random() * 2, 1 + Math.random() * 2);
  }
}

function tex(c, repeat = 1) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  t.repeat.set(repeat, repeat);
  t.needsUpdate = true;
  return t;
}

function hydrate(target, url) {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    target.image = img;
    target.needsUpdate = true;
  };
  img.src = url;
  return target;
}

export function makeAsphalt() {
  const [c, g] = canvas(1024);
  g.fillStyle = '#14161c';
  g.fillRect(0, 0, 512, 512);
  noise(g, 24000, (n) => `rgba(${30 + n * 40},${30 + n * 38},${34 + n * 40},${0.45})`, 1024);
  g.strokeStyle = 'rgba(200,200,180,0.18)';
  g.lineWidth = 12;
  g.beginPath(); g.moveTo(500, 0); g.lineTo(524, 1024); g.stroke();
  g.setLineDash([56, 44]);
  g.strokeStyle = 'rgba(210,200,140,0.35)';
  g.beginPath(); g.moveTo(512, 0); g.lineTo(512, 1024); g.stroke();
  const t = tex(c, 8);
  return hydrate(t, '/assets/tex/asphalt.jpg');
}

export function makeConcrete() {
  const [c, g] = canvas(1024);
  g.fillStyle = '#2a2d32';
  g.fillRect(0, 0, 1024, 1024);
  noise(g, 18000, (n) => `rgba(${70 + n * 50},${72 + n * 48},${74 + n * 46},0.4)`, 1024);
  g.strokeStyle = 'rgba(0,0,0,0.25)';
  for (let i = 0; i < 16; i++) {
    g.beginPath();
    g.moveTo(Math.random() * 1024, Math.random() * 1024);
    g.lineTo(Math.random() * 1024, Math.random() * 1024);
    g.stroke();
  }
  const t = tex(c, 4);
  return hydrate(t, '/assets/tex/concrete.jpg');
}

export function makeMetal(hue = '#3a4248') {
  const [c, g] = canvas(256);
  g.fillStyle = hue;
  g.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 10) {
    g.fillStyle = y % 20 === 0 ? 'rgba(0,0,0,0.18)' : 'rgba(255,255,255,0.05)';
    g.fillRect(0, y, 256, 3);
  }
  noise(g, 1200, (n) => `rgba(20,20,20,${0.2 + n * 0.2})`, 256);
  return tex(c, 2);
}

export function makeContainer() {
  const t = makeMetal('#3a4a4c');
  t.repeat.set(1, 1);
  return hydrate(t, '/assets/tex/container.jpg');
}

export function makeFacade(seed, floors, bays, wall, lit) {
  const [c, g] = canvas(1024);
  const em = document.createElement('canvas');
  em.width = em.height = 1024;
  const eg = em.getContext('2d');
  g.fillStyle = wall;
  g.fillRect(0, 0, 1024, 1024);
  eg.fillStyle = '#000';
  eg.fillRect(0, 0, 1024, 1024);
  const rng = mulberry(seed);
  const fh = 1024 / (floors + 1);
  const bw = 1024 / bays;
  for (let f = 0; f < floors; f++) {
    for (let b = 0; b < bays; b++) {
      const on = rng() > 0.62;
      const x = b * bw + bw * 0.28;
      const y = 48 + f * fh + 18;
      const ww = bw * 0.4;
      const wh = fh * 0.34;
      g.fillStyle = '#07080c';
      g.fillRect(x - 3, y - 3, ww + 6, wh + 6);
      g.fillStyle = on ? lit : '#0c1016';
      g.fillRect(x, y, ww, wh);
      if (on) {
        eg.fillStyle = lit;
        eg.fillRect(x, y, ww, wh);
      }
    }
  }
  g.fillStyle = lit;
  g.globalAlpha = 0.9;
  g.fillRect(0, 996, 1024, 20);
  g.globalAlpha = 1;
  eg.fillStyle = lit;
  eg.fillRect(0, 1004, 1024, 12);
  const map = tex(c, 1);
  map.userData.emissiveMap = tex(em, 1);
  return map;
}

export function makeNeon(text, color) {
  const [c, g] = canvas(512);
  g.fillStyle = '#05060a';
  g.fillRect(0, 0, 512, 512);
  g.font = '700 72px Arial Narrow, Arial, sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.shadowColor = color;
  g.shadowBlur = 28;
  g.fillStyle = color;
  const lines = text.split('\n');
  lines.forEach((ln, i) => g.fillText(ln, 256, 256 + (i - (lines.length - 1) / 2) * 78));
  const t = tex(c, 1);
  t.repeat.set(1, 1);
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
}

export function makePortrait(name) {
  const [c, g] = canvas(256);
  const grd = g.createLinearGradient(0, 0, 256, 256);
  grd.addColorStop(0, '#102028');
  grd.addColorStop(1, '#1a0c14');
  g.fillStyle = grd;
  g.fillRect(0, 0, 256, 256);
  g.fillStyle = '#1c242c';
  g.beginPath(); g.ellipse(128, 168, 70, 90, 0, 0, 7); g.fill();
  g.fillStyle = '#0e1216';
  g.beginPath(); g.ellipse(128, 108, 48, 58, 0, 0, 7); g.fill();
  g.strokeStyle = '#3ee0ff';
  g.lineWidth = 2;
  g.beginPath(); g.arc(168, 118, 6, 0, 7); g.stroke();
  g.fillStyle = '#3ee0ff';
  g.font = '12px Arial';
  g.fillText(name, 16, 240);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  return hydrate(t, '/assets/tex/kite.jpg');
}

export function makePuddle() {
  const [c, g] = canvas(128);
  const grd = g.createRadialGradient(64, 64, 10, 64, 64, 64);
  grd.addColorStop(0, 'rgba(40,60,80,0.85)');
  grd.addColorStop(1, 'rgba(10,12,16,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 128, 128);
  const t = tex(c, 1);
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
}

export function makeBrick() {
  const t = makeMetal('#4a403c');
  t.repeat.set(2, 2);
  return hydrate(t, '/assets/tex/brick.jpg');
}

export function makePlatten() {
  const [c, g] = canvas(1024);
  g.fillStyle = '#6a6e72';
  g.fillRect(0, 0, 1024, 1024);
  g.strokeStyle = 'rgba(20,20,22,0.45)';
  g.lineWidth = 8;
  for (let x = 0; x <= 1024; x += 256) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 1024); g.stroke(); }
  for (let y = 0; y <= 1024; y += 128) { g.beginPath(); g.moveTo(0, y); g.lineTo(1024, y); g.stroke(); }
  noise(g, 12000, (n) => `rgba(90,90,80,${n * 0.3})`, 1024);
  const t = tex(c, 2);
  return hydrate(t, '/assets/tex/platten.jpg');
}

export function makeNightEnv() {
  const c = document.createElement('canvas');
  c.width = 2048;
  c.height = 1024;
  const g = c.getContext('2d');
  const sky = g.createLinearGradient(0, 0, 0, 512);
  sky.addColorStop(0, LOOK.css.zenith);
  sky.addColorStop(0.42, LOOK.css.mid);
  sky.addColorStop(0.55, LOOK.css.horizon);
  sky.addColorStop(1, '#05060a');
  g.fillStyle = sky;
  g.fillRect(0, 0, 1024, 512);
  const blob = (x, y, r, color) => {
    const grd = g.createRadialGradient(x, y, 2, x, y, r);
    grd.addColorStop(0, color);
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grd;
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
  };
  blob(440, 600, 320, LOOK.css.cyan);
  blob(1560, 620, 280, LOOK.css.mag);
  blob(1020, 560, 180, LOOK.css.amber);
  blob(180, 160, 80, 'rgba(180,200,255,0.18)');
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.mapping = THREE.EquirectangularReflectionMapping;
  t.needsUpdate = true;
  return t;
}

export function makeGlow(color = '#3ee0ff') {
  const [c, g] = canvas(64);
  const grd = g.createRadialGradient(32, 32, 2, 32, 32, 32);
  grd.addColorStop(0, color);
  grd.addColorStop(0.35, color);
  grd.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function mulberry(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createTextures() {
  return {
    asphalt: makeAsphalt(),
    concrete: makeConcrete(),
    metal: makeMetal(),
    rust: makeMetal('#5a3224'),
    tealMetal: makeMetal('#1e3a40'),
    container: makeContainer(),
    platten: makePlatten(),
    brick: makeBrick(),
    puddle: makePuddle(),
    kite: makePortrait('KITE'),
    neonWH: makeNeon('WAREHOUSE\n09', '#3ee0ff'),
    neonRL: makeNeon('RHEINLICHT', '#ff2d6a'),
    neonB17: makeNeon('BLOCK 17', '#d8ffe0'),
    neonFood: makeNeon('NACHTIMBISS', '#ffb35a'),
    neonHafen: makeNeon('HAFEN 09', '#3ee0ff'),
    neonKai: makeNeon('KAI LINE', '#3ee0ff'),
    env: makeNightEnv(),
    glowCyan: makeGlow('#3ee0ff'),
    glowMag: makeGlow('#ff2d6a'),
    glowWarm: makeGlow('#ffcc88'),
  };
}
