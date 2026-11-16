/**
 * NIGHTWIRE — city dressing (.mjs)
 * Presentation-only layer on top of the authored layout (assets/maps/city.json and layout.mjs stay
 * untouched, no new collision): layered skyline with depth staging and aviation lights, balconies,
 * AC units and vertical neon signs on the strip facades, cables + string lights over the lane,
 * gullies, manholes, steam vents, trash, graffiti, weeds and courtyard trees, and a curated colour
 * composition per zone (fog / ambient tint crossfade: HAFEN cold teal, STRIP magenta haze,
 * HOF sodium-green). Counts scale with profile.dressing / profile.skyline.
 */

import * as THREE from 'three';
import { STRIP_BUILDINGS, SLABS } from './layout.mjs';
import { LOOK } from '../fx/look.mjs';

const tmpM = new THREE.Matrix4();
const tmpQ = new THREE.Quaternion();
const tmpS = new THREE.Vector3();
const tmpP = new THREE.Vector3();
const UP = new THREE.Vector3(0, 1, 0);

function rng(seed) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}
function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return [c, c.getContext('2d')];
}
function ctex(c, srgb = true) {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
function inst(geo, mat, n) {
  const m = new THREE.InstancedMesh(geo, mat, Math.max(1, n));
  m.count = 0;
  m.castShadow = false;
  m.receiveShadow = true;
  return m;
}
function put(im, x, y, z, ry = 0, sx = 1, sy = 1, sz = 1, rx = 0, rz = 0) {
  if (im.count >= im.instanceMatrix.count) return;
  tmpQ.setFromEuler(new THREE.Euler(rx, ry, rz));
  tmpM.compose(tmpP.set(x, y, z), tmpQ, tmpS.set(sx, sy, sz));
  im.setMatrixAt(im.count++, tmpM);
}

/* ---------- textures ---------- */

function windowsTexture(seed, lit = 0.18, hue = 'warm') {
  const [c, g] = canvas(128, 256);
  const r = rng(seed);
  g.fillStyle = '#050608';
  g.fillRect(0, 0, 128, 256);
  for (let y = 6; y < 256; y += 10) {
    for (let x = 4; x < 128; x += 8) {
      if (r() > lit) continue;
      const warm = hue === 'warm' ? r() > 0.25 : r() > 0.75;
      const v = 0.45 + r() * 0.55;
      g.fillStyle = warm ? `rgba(255,${170 + r() * 50},${90 + r() * 40},${v})` : `rgba(${150 + r() * 60},${210 + r() * 40},255,${v})`;
      g.fillRect(x, y, 5, 6);
    }
  }
  const t = ctex(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

const SIGN_WORDS = ['HOTEL', 'BAR', 'KIOSK 24', 'SPIELHALLE', 'PFANDHAUS', 'DÖNER', 'SHISHA', 'TATTOO', 'NACHTCAFÉ', 'PENSION', 'RHEIN-BAR', 'APOTHEKE'];
function signTexture(word, color) {
  const [c, g] = canvas(64, 320);
  g.fillStyle = '#07060a';
  g.fillRect(0, 0, 64, 320);
  g.strokeStyle = color; g.lineWidth = 3;
  g.strokeRect(4, 4, 56, 312);
  g.font = 'bold 34px "Barlow Condensed", Arial Narrow, sans-serif';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.shadowColor = color; g.shadowBlur = 14;
  g.fillStyle = '#fff';
  const letters = [...word.replace(' ', '')].slice(0, 8);
  const step = 300 / letters.length;
  letters.forEach((ch, i) => g.fillText(ch, 32, 14 + step * (i + 0.5)));
  g.globalCompositeOperation = 'source-atop';
  g.fillStyle = color; g.globalAlpha = 0.55;
  g.fillRect(0, 0, 64, 320);
  return ctex(c);
}

const TAGS = ['WIRE', 'KAI', 'RHEIN', 'B17', 'NW', 'COLD', '4B', 'HAFEN', 'RUHR', 'KITE?'];
function graffitiTexture(seed) {
  const [c, g] = canvas(256, 128);
  const r = rng(seed);
  const cols = ['#ff2d6a', '#3ee0ff', '#ffb35a', '#9cff57', '#e8e8e8', '#b45cff'];
  const word = TAGS[Math.floor(r() * TAGS.length)];
  const col = cols[Math.floor(r() * cols.length)];
  const out = cols[Math.floor(r() * cols.length)];
  g.translate(128, 66);
  g.rotate((r() - 0.5) * 0.25);
  g.font = `900 ${58 + r() * 22}px Impact, "Arial Black", sans-serif`;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.lineJoin = 'round';
  g.lineWidth = 12; g.strokeStyle = '#0a0a0a'; g.strokeText(word, 0, 0);
  g.lineWidth = 6; g.strokeStyle = out; g.strokeText(word, 0, 0);
  g.fillStyle = col; g.fillText(word, 0, 0);
  // drips + overspray
  g.fillStyle = col;
  for (let i = 0; i < 10; i++) g.fillRect((r() - 0.5) * 200, 10 + r() * 10, 2, 8 + r() * 30);
  for (let i = 0; i < 400; i++) { g.globalAlpha = 0.25; g.fillRect((r() - 0.5) * 240, (r() - 0.5) * 110, 1.5, 1.5); }
  g.globalAlpha = 1;
  return ctex(c);
}

function grateTexture() {
  const [c, g] = canvas(64, 64);
  g.fillStyle = '#2a2c2e'; g.fillRect(0, 0, 64, 64);
  g.fillStyle = '#050505';
  for (let x = 6; x < 60; x += 8) g.fillRect(x, 6, 4, 52);
  g.strokeStyle = '#3a3c3e'; g.lineWidth = 3; g.strokeRect(2, 2, 60, 60);
  return ctex(c);
}
function manholeTexture() {
  const [c, g] = canvas(128, 128);
  g.fillStyle = '#1e2022'; g.fillRect(0, 0, 128, 128);
  g.strokeStyle = '#34373a'; g.lineWidth = 6;
  g.beginPath(); g.arc(64, 64, 58, 0, Math.PI * 2); g.stroke();
  g.lineWidth = 3;
  for (let i = -40; i <= 40; i += 10) { g.beginPath(); g.moveTo(24, 64 + i); g.lineTo(104, 64 + i); g.stroke(); }
  g.fillStyle = '#4a4d50'; g.font = 'bold 13px sans-serif'; g.textAlign = 'center'; g.fillText('KANAL', 64, 68);
  return ctex(c);
}
function weedTexture() {
  const [c, g] = canvas(64, 64);
  const r = rng(5);
  g.clearRect(0, 0, 64, 64);
  for (let i = 0; i < 28; i++) {
    const x = 8 + r() * 48;
    g.strokeStyle = `rgba(${40 + r() * 40},${70 + r() * 60},${30 + r() * 20},1)`;
    g.lineWidth = 1 + r() * 1.5;
    g.beginPath(); g.moveTo(x, 64); g.quadraticCurveTo(x + (r() - 0.5) * 20, 40, x + (r() - 0.5) * 26, 10 + r() * 30); g.stroke();
  }
  return ctex(c);
}

/* ---------- builders ---------- */

function skyline(world, layers, game) {
  const out = [];
  const lights = [];
  const horizon = new THREE.Color(LOOK.skyHorizon);
  const fog = new THREE.Color(LOOK.fog);
  const defs = [
    { r: 165, n: 52, h: [18, 55], w: [10, 22], k: 0.0, lit: 0.13 },
    { r: 225, n: 60, h: [30, 90], w: [14, 30], k: 0.45, lit: 0.09 },
    { r: 295, n: 64, h: [40, 130], w: [18, 40], k: 0.75, lit: 0.06 },
  ].slice(0, layers);
  defs.forEach((d, li) => {
    const tex = windowsTexture(40 + li * 7, d.lit, li === 1 ? 'cold' : 'warm');
    const tint = new THREE.Color(0x07080c).lerp(horizon.clone().lerp(fog, 0.5), d.k);
    const mat = new THREE.MeshBasicMaterial({ color: tint, fog: false });
    const winMat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, opacity: 0.75 - d.k * 0.45 });
    const box = new THREE.BoxGeometry(1, 1, 1);
    box.translate(0, 0.5, 0);
    const im = inst(box, mat, d.n);
    const imW = inst(box, winMat, d.n);
    im.receiveShadow = imW.receiveShadow = false;
    const r = rng(100 + li);
    for (let i = 0; i < d.n; i++) {
      const a = (i / d.n) * Math.PI * 2 + r() * 0.05;
      const rad = d.r + (r() - 0.5) * 24;
      const x = Math.sin(a) * rad; const z = Math.cos(a) * rad + 20;
      if (z < -95 && Math.abs(x) < 110 && li === 0) continue; // keep the river open on the near layer
      const h = d.h[0] + r() * (d.h[1] - d.h[0]) * (z < -60 ? 0.55 : 1);
      const w = d.w[0] + r() * (d.w[1] - d.w[0]);
      const ry = -a;
      put(im, x, -2, z, ry, w, h, w * (0.6 + r() * 0.5));
      put(imW, x, -2, z, ry, w * 1.003, h * 0.98, w * (0.6 + r() * 0.5) * 1.003);
      if (h > 60 && lights.length < 40) lights.push(new THREE.Vector3(x, h - 1, z));
    }
    tex.repeat.set(1, 1);
    world.group.add(im, imW);
    out.push(im, imW);
  });
  // harbour side: distant cranes + chimneys across the river
  const steel = new THREE.MeshBasicMaterial({ color: new THREE.Color(0x0a0c10), fog: false });
  const cr = rng(9);
  for (let i = 0; i < 6; i++) {
    const g = new THREE.Group();
    const x = -150 + i * 58 + cr() * 20; const z = -205 - cr() * 30;
    const tower = new THREE.Mesh(new THREE.BoxGeometry(2.4, 46, 2.4), steel); tower.position.y = 23;
    const jib = new THREE.Mesh(new THREE.BoxGeometry(44, 2, 2), steel); jib.position.set(10, 46, 0);
    g.add(tower, jib);
    g.position.set(x, -2, z); g.rotation.y = cr() * 2;
    world.group.add(g);
    lights.push(new THREE.Vector3(x + Math.cos(g.rotation.y) * 31, 46, z - Math.sin(g.rotation.y) * 31));
    lights.push(new THREE.Vector3(x, 48, z));
  }
  for (let i = 0; i < 3; i++) {
    const ch = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 3.4, 80, 10), steel);
    const x = -60 + i * 70; const z = -250 - i * 12;
    ch.position.set(x, 38, z);
    world.group.add(ch);
    lights.push(new THREE.Vector3(x, 79, z));
  }
  // aviation lights (blink in update)
  const pts = new THREE.BufferGeometry().setFromPoints(lights);
  const avMat = new THREE.PointsMaterial({ color: 0xff2a1a, size: 2.2, sizeAttenuation: true, fog: false, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const av = new THREE.Points(pts, avMat);
  world.group.add(av);
  return { av, avMat };
}

function facades(world, dens, r) {
  const T = world.game.textures;
  const inner = STRIP_BUILDINGS.filter((b) => b.row === 'inner');
  const slabMat = new THREE.MeshStandardMaterial({ color: 0x2a2d32, roughness: 0.8, map: T.concrete || null });
  const railMat = new THREE.MeshStandardMaterial({ color: 0x141618, metalness: 0.7, roughness: 0.4 });
  const acMat = new THREE.MeshStandardMaterial({ color: 0x8a8e90, metalness: 0.35, roughness: 0.55, map: grateTexture() });
  const slabs = inst(new THREE.BoxGeometry(1, 1, 1), slabMat, 120);
  const rails = inst(new THREE.BoxGeometry(1, 1, 1), railMat, 240);
  const acs = inst(new THREE.BoxGeometry(1, 1, 1), acMat, 80);
  slabs.castShadow = rails.castShadow = true;
  const palette = ['#ff2d6a', '#3ee0ff', '#ffb35a', '#b45cff', '#ff5a3a', '#57ffb0'];
  inner.forEach((b, bi) => {
    const side = b.x < 0 ? 1 : -1; // street direction (+X for the left row)
    const fx = b.x + side * (b.w / 2);
    const floors = b.floors;
    for (let f = 1; f < floors; f++) {
      const y = 1.2 + f * 3.2;
      for (let zz = b.z - b.d / 2 + 2.2; zz < b.z + b.d / 2 - 1.5; zz += 4.4) {
        if (r() > 0.55 * dens + 0.15) continue;
        if (r() < 0.6) {
          put(slabs, fx + side * 0.6, y - 1.1, zz, 0, 1.2, 0.12, 2.6);
          put(rails, fx + side * 1.18, y - 0.6, zz, 0, 0.04, 0.9, 2.6);
          put(rails, fx + side * 0.6, y - 0.6, zz - 1.28, 0, 1.2, 0.9, 0.04);
          put(rails, fx + side * 0.6, y - 0.6, zz + 1.28, 0, 1.2, 0.9, 0.04);
        } else {
          put(acs, fx + side * 0.25, y - 1.6 + r() * 0.4, zz + (r() - 0.5) * 1.6, 0, 0.45, 0.55, 0.8);
        }
      }
    }
    // vertical neon sign at the street corner
    if (r() < 0.8 * dens + 0.2) {
      const col = palette[(bi * 5 + 1) % palette.length];
      const word = SIGN_WORDS[(bi * 7 + 3) % SIGN_WORDS.length];
      const h = Math.min(7.5, floors * 3.2 - 2);
      const st = signTexture(word, col);
      const face = new THREE.MeshStandardMaterial({ map: st, emissive: new THREE.Color(col), emissiveMap: st, emissiveIntensity: 2.2, roughness: 0.4 });
      const sign = new THREE.Mesh(new THREE.BoxGeometry(0.16, h, 1.1), [railMat, railMat, railMat, railMat, face, face]);
      // faces ±Z show the text, so the sign sticks out of the facade into the street
      sign.position.set(fx + side * 0.9, 3.2 + h / 2, b.z + (bi % 2 ? -1 : 1) * (b.d / 2 - 1.2));
      sign.rotation.y = 0;
      world.add(sign, 'strip');
    }
  });
  slabs.instanceMatrix.needsUpdate = rails.instanceMatrix.needsUpdate = acs.instanceMatrix.needsUpdate = true;
  world.add(slabs, 'strip'); world.add(rails, 'strip'); world.add(acs, 'strip');
}

function lane(world, dens, r) {
  // cables + string lights across the strip
  const cableMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.6 });
  const bulbs = [];
  for (let z = 12; z < 92; z += 13 + r() * 6) {
    if (r() > 0.6 * dens + 0.3) continue;
    const y0 = 6.5 + r() * 3; const sag = 0.8 + r() * 1.2;
    const pts = [];
    for (let i = 0; i <= 16; i++) {
      const t = i / 16;
      pts.push(new THREE.Vector3(-17.8 + t * 35.6, y0 - Math.sin(t * Math.PI) * sag + (r() - 0.5) * 0.02, z + (t - 0.5) * (r() - 0.5) * 3));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    world.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 32, 0.014, 4, false), cableMat), 'strip');
    if (r() < 0.55) for (let i = 1; i < 14; i++) bulbs.push(curve.getPoint(i / 14).add(new THREE.Vector3(0, -0.06, 0)));
  }
  if (bulbs.length) {
    const bulbMat = new THREE.MeshStandardMaterial({ color: 0xffd49a, emissive: 0xffb35a, emissiveIntensity: 2.6 });
    const im = inst(new THREE.SphereGeometry(0.045, 8, 6), bulbMat, bulbs.length);
    bulbs.forEach((p) => put(im, p.x, p.y, p.z));
    im.instanceMatrix.needsUpdate = true;
    world.add(im, 'strip');
  }

  // gullies along the facades, manholes on the lane, vents at the steam spots
  const grateMat = new THREE.MeshStandardMaterial({ map: grateTexture(), metalness: 0.75, roughness: 0.45 });
  const gullies = inst(new THREE.BoxGeometry(1, 1, 1), grateMat, 40);
  for (let z = 6; z < 94; z += 11) { put(gullies, -17.2, 0.012, z, 0, 0.5, 0.03, 0.9); put(gullies, 17.2, 0.012, z + 5, 0, 0.5, 0.03, 0.9); }
  [[2, -48], [-8, -104], [6, -60]].forEach(([x, z]) => put(gullies, x, 0.015, z, 0.3, 1.2, 0.03, 1.2));
  gullies.instanceMatrix.needsUpdate = true;
  world.add(gullies, 'strip');
  const mh = new THREE.MeshStandardMaterial({ map: manholeTexture(), metalness: 0.8, roughness: 0.38 });
  const holes = inst(new THREE.CylinderGeometry(0.42, 0.42, 0.03, 20), mh, 10);
  [[-3, 16], [4, 38], [-1, 58], [3, 80], [1, -32], [-4, 140], [3, 170]].forEach(([x, z]) => put(holes, x, 0.01, z, r() * 3));
  holes.instanceMatrix.needsUpdate = true;
  world.add(holes, 'strip');
}

function litter(world, dens, r, col) {
  const bagMat = new THREE.MeshPhysicalMaterial({ color: 0x0b0c0e, roughness: 0.25, clearcoat: 0.8, clearcoatRoughness: 0.2 });
  const canMat = new THREE.MeshStandardMaterial({ color: 0xb0b4b8, metalness: 0.9, roughness: 0.3 });
  const boxMat = new THREE.MeshStandardMaterial({ color: 0x5a4630, roughness: 0.9 });
  const paperMat = new THREE.MeshStandardMaterial({ color: 0xcfc8b8, roughness: 0.95, side: THREE.DoubleSide });
  const n = Math.round(90 * dens);
  const bags = inst(new THREE.SphereGeometry(0.3, 10, 8), bagMat, n);
  const cans = inst(new THREE.CylinderGeometry(0.033, 0.033, 0.12, 8), canMat, n);
  const boxes = inst(new THREE.BoxGeometry(1, 1, 1), boxMat, n);
  const paper = inst(new THREE.PlaneGeometry(0.22, 0.3), paperMat, n * 2);
  bags.castShadow = boxes.castShadow = true;
  const spots = [];
  // along the strip facades, hof dumpsters, dock fences
  for (let i = 0; i < n; i++) {
    const zone = r();
    let x; let z;
    if (zone < 0.5) { x = (r() < 0.5 ? -1 : 1) * (16.6 + r() * 1.0); z = 4 + r() * 90; } else if (zone < 0.8) { x = -30 + r() * 60; z = 120 + r() * 70; } else { x = -40 + r() * 80; z = -90 + r() * 60; }
    if (col.overlaps(x, 0.05, z, 0.25, 0.4)) continue;
    spots.push([x, z]);
  }
  spots.forEach(([x, z]) => {
    const k = r();
    if (k < 0.3) put(bags, x, 0.2, z, r() * 6, 1, 0.75 + r() * 0.3, 0.9 + r() * 0.3);
    else if (k < 0.55) put(cans, x, 0.033, z, r() * 6, 1, 1, 1, Math.PI / 2, 0);
    else if (k < 0.7) put(boxes, x, 0.12, z, r() * 6, 0.5 + r() * 0.3, 0.24 + r() * 0.2, 0.4 + r() * 0.3, 0, (r() - 0.5) * 0.3);
    else put(paper, x, 0.012, z, r() * 6, 1, 1, 1, -Math.PI / 2, 0);
    if (r() < 0.6) put(paper, x + (r() - 0.5) * 2, 0.011, z + (r() - 0.5) * 2, 0, 1, 1, 1, -Math.PI / 2, r() * 6);
  });
  [bags, cans, boxes, paper].forEach((m) => { m.instanceMatrix.needsUpdate = true; world.add(m, 'strip'); });
}

function graffiti(world, dens, r) {
  const inner = STRIP_BUILDINGS.filter((b) => b.row === 'inner');
  let k = 0;
  inner.forEach((b, i) => {
    if (r() > 0.7 * dens + 0.3) return;
    const side = b.x < 0 ? 1 : -1;
    const tex = graffitiTexture(30 + i * 3);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1.6), new THREE.MeshStandardMaterial({
      map: tex, transparent: true, roughness: 0.7, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, depthWrite: false,
    }));
    m.position.set(b.x + side * (b.w / 2 + 0.02), 1.3 + r() * 0.5, b.z + (r() - 0.5) * (b.d - 4));
    m.rotation.y = side > 0 ? Math.PI / 2 : -Math.PI / 2;
    world.add(m, 'strip');
    k++;
  });
  return k;
}

function vegetation(world, dens, r, col) {
  const weedMat = new THREE.MeshStandardMaterial({ map: weedTexture(), alphaTest: 0.4, side: THREE.DoubleSide, roughness: 0.85 });
  const cross = new THREE.PlaneGeometry(0.6, 0.6);
  cross.translate(0, 0.3, 0);
  const cross2 = cross.clone().rotateY(Math.PI / 2);
  const geo = new THREE.BufferGeometry();
  const merged = [cross, cross2];
  const pos = []; const uv = []; const nrm = []; const idx = []; let base = 0;
  merged.forEach((g) => {
    pos.push(...g.attributes.position.array); uv.push(...g.attributes.uv.array); nrm.push(...g.attributes.normal.array);
    idx.push(...Array.from(g.index.array, (v) => v + base)); base += g.attributes.position.count;
  });
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
  geo.setIndex(idx);
  const n = Math.round(160 * dens);
  const weeds = inst(geo, weedMat, n);
  for (let i = 0; i < n * 3 && weeds.count < n; i++) {
    const hof = r() < 0.6;
    const x = hof ? -45 + r() * 90 : -60 + r() * 120;
    const z = hof ? 108 + r() * 90 : -110 + r() * 90;
    if (col.overlaps(x, 0.05, z, 0.3, 0.3)) continue;
    // weeds like edges: keep only spots that have something solid within 1.5 m
    if (!col.overlaps(x, 0.05, z, 1.5, 0.5)) continue;
    put(weeds, x, 0, z, r() * 6, 0.6 + r() * 0.8, 0.5 + r() * 0.9, 0.6 + r() * 0.8);
  }
  weeds.instanceMatrix.needsUpdate = true;
  world.add(weeds, 'hof');

  // courtyard trees in raised planters
  const bark = new THREE.MeshStandardMaterial({ color: 0x2a2018, roughness: 0.95 });
  const leafMat = new THREE.MeshPhysicalMaterial({ color: 0x1f3a1c, roughness: 0.75, sheen: 0.5, sheenColor: new THREE.Color(0x4a7a3a), flatShading: true });
  const planter = new THREE.MeshStandardMaterial({ color: 0x3a3d40, roughness: 0.85, map: world.game.textures.concrete || null });
  let trees = 0;
  for (let i = 0; i < 40 && trees < Math.round(6 * dens + 1); i++) {
    const x = -36 + r() * 72; const z = 115 + r() * 80;
    if (col.overlaps(x, 0.1, z, 1.6, 4)) continue;
    const t = new THREE.Group();
    const box = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.5, 1.4), planter); box.position.y = 0.25;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.12, 3.2, 7), bark); trunk.position.y = 2.0;
    trunk.rotation.z = (r() - 0.5) * 0.12;
    t.add(box, trunk);
    for (let k = 0; k < 7; k++) {
      const g = new THREE.IcosahedronGeometry(0.7 + r() * 0.5, 1);
      const p = g.attributes.position;
      for (let v = 0; v < p.count; v++) { const s = 0.8 + r() * 0.4; p.setXYZ(v, p.getX(v) * s, p.getY(v) * s, p.getZ(v) * s); }
      g.computeVertexNormals();
      const leaf = new THREE.Mesh(g, leafMat);
      leaf.position.set((r() - 0.5) * 1.6, 3.3 + r() * 1.2, (r() - 0.5) * 1.6);
      leaf.castShadow = true;
      t.add(leaf);
    }
    box.castShadow = trunk.castShadow = true;
    t.position.set(x, 0, z);
    world.add(t, 'hof');
    trees++;
  }
  return trees;
}

/* ---------- zone composition ---------- */

const ZONE_GRADE = {
  docks: { fog: 0x0c1822, hemi: 0x24405c, k: 0.5 },
  strip: { fog: 0x1c0d1e, hemi: 0x3c2652, k: 0.5 },
  hof: { fog: 0x161a10, hemi: 0x34402a, k: 0.45 },
};

export function dressCity(world, profile) {
  const game = world.game;
  const dens = profile?.dressing ?? 1;
  const r = rng(1717);
  const col = world.collision;
  const sky = skyline(world, profile?.skyline ?? 3, game);
  facades(world, dens, r);
  lane(world, dens, r);
  litter(world, dens, r, col);
  const tags = graffiti(world, dens, r);
  const trees = vegetation(world, dens, r, col);

  const baseFog = new THREE.Color(LOOK.fog);
  const baseHemi = game.hemi ? game.hemi.color.clone() : new THREE.Color(0x2a3a58);
  const targetFog = new THREE.Color(); const targetHemi = new THREE.Color();
  let t = 0;
  return {
    stats: { tags, trees },
    update(dt, zone) {
      t += dt;
      sky.avMat.opacity = Math.sin(t * 2.4) > 0.55 ? 1 : 0.12;
      const z = ZONE_GRADE[zone] || ZONE_GRADE.docks;
      targetFog.copy(baseFog).lerp(new THREE.Color(z.fog), z.k);
      targetHemi.copy(baseHemi).lerp(new THREE.Color(z.hemi), z.k);
      const a = 1 - Math.exp(-0.8 * dt);
      game.scene.fog?.color.lerp(targetFog, a);
      game.hemi?.color.lerp(targetHemi, a);
    },
  };
}
