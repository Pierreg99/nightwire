/**
 * NIGHTWIRE v2.0.1 — Procedural Textures (.mjs)
 * Night-city texture generation and environment maps.
 */

import * as THREE from 'three';
import { LOOK } from '../fx/look.mjs';

function createCanvas(size = 512) {
  const canvasElement = document.createElement('canvas');
  canvasElement.width = size;
  canvasElement.height = size;
  return [canvasElement, canvasElement.getContext('2d')];
}

function addNoise(context, count, color, size) {
  for (let index = 0; index < count; index += 1) {
    context.fillStyle = color(Math.random());
    context.fillRect(
      Math.random() * size,
      Math.random() * size,
      1 + Math.random() * 2,
      1 + Math.random() * 2
    );
  }
}

function createTexture(canvasElement, repeat = 1) {
  const texture = new THREE.CanvasTexture(canvasElement);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 8;
  texture.repeat.set(repeat, repeat);
  texture.needsUpdate = true;
  return texture;
}

function hydrate(target, url) {
  const image = new Image();
  image.crossOrigin = 'anonymous';
  image.onload = () => {
    target.image = image;
    target.needsUpdate = true;
  };
  image.src = url;
  return target;
}

export function makeAsphalt() {
  const [canvasElement, context] = createCanvas(1024);
  context.fillStyle = '#14161c';
  context.fillRect(0, 0, 512, 512);
  addNoise(context, 24000, (value) => `rgba(${30 + value * 40},${30 + value * 38},${34 + value * 40},0.45)`, 1024);

  context.strokeStyle = 'rgba(200,200,180,0.18)';
  context.lineWidth = 12;
  context.beginPath();
  context.moveTo(500, 0);
  context.lineTo(524, 1024);
  context.stroke();

  context.setLineDash([56, 44]);
  context.strokeStyle = 'rgba(210,200,140,0.35)';
  context.beginPath();
  context.moveTo(512, 0);
  context.lineTo(512, 1024);
  context.stroke();

  return hydrate(createTexture(canvasElement, 8), '/assets/tex/asphalt.jpg');
}

export function makeConcrete() {
  const [canvasElement, context] = createCanvas(1024);
  context.fillStyle = '#2a2d32';
  context.fillRect(0, 0, 1024, 1024);
  addNoise(context, 18000, (value) => `rgba(${70 + value * 50},${72 + value * 48},${74 + value * 46},0.4)`, 1024);

  context.strokeStyle = 'rgba(0,0,0,0.25)';
  for (let index = 0; index < 16; index += 1) {
    context.beginPath();
    context.moveTo(Math.random() * 1024, Math.random() * 1024);
    context.lineTo(Math.random() * 1024, Math.random() * 1024);
    context.stroke();
  }

  return hydrate(createTexture(canvasElement, 4), '/assets/tex/concrete.jpg');
}

export function makeMetal(hue = '#3a4248') {
  const [canvasElement, context] = createCanvas(256);
  context.fillStyle = hue;
  context.fillRect(0, 0, 256, 256);

  for (let y = 0; y < 256; y += 10) {
    context.fillStyle = y % 20 === 0 ? 'rgba(0,0,0,0.18)' : 'rgba(255,255,255,0.05)';
    context.fillRect(0, y, 256, 3);
  }

  addNoise(context, 1200, (value) => `rgba(20,20,20,${0.2 + value * 0.2})`, 256);
  return createTexture(canvasElement, 2);
}

export function makeContainer() {
  const texture = makeMetal('#3a4a4c');
  texture.repeat.set(1, 1);
  return hydrate(texture, '/assets/tex/container.jpg');
}

export function makeFacade(seed, floors, bays, wall, lit) {
  const [canvasElement, context] = createCanvas(1024);
  const emissiveCanvas = document.createElement('canvas');
  emissiveCanvas.width = 1024;
  emissiveCanvas.height = 1024;
  const emissiveContext = emissiveCanvas.getContext('2d');

  context.fillStyle = wall;
  context.fillRect(0, 0, 1024, 1024);
  emissiveContext.fillStyle = '#000000';
  emissiveContext.fillRect(0, 0, 1024, 1024);

  const random = mulberry(seed);
  const floorHeight = 1024 / (floors + 1);
  const bayWidth = 1024 / bays;

  for (let floor = 0; floor < floors; floor += 1) {
    for (let bay = 0; bay < bays; bay += 1) {
      const isLit = random() > 0.62;
      const x = bay * bayWidth + bayWidth * 0.28;
      const y = 48 + floor * floorHeight + 18;
      const width = bayWidth * 0.4;
      const height = floorHeight * 0.34;

      context.fillStyle = '#07080c';
      context.fillRect(x - 3, y - 3, width + 6, height + 6);
      context.fillStyle = isLit ? lit : '#0c1016';
      context.fillRect(x, y, width, height);

      if (isLit) {
        emissiveContext.fillStyle = lit;
        emissiveContext.fillRect(x, y, width, height);
      }
    }
  }

  context.fillStyle = lit;
  context.globalAlpha = 0.9;
  context.fillRect(0, 996, 1024, 20);
  context.globalAlpha = 1;

  emissiveContext.fillStyle = lit;
  emissiveContext.fillRect(0, 1004, 1024, 12);

  const map = createTexture(canvasElement, 1);
  map.userData.emissiveMap = createTexture(emissiveCanvas, 1);
  return map;
}

export function makeNeon(text, color) {
  const [canvasElement, context] = createCanvas(512);
  context.fillStyle = '#05060a';
  context.fillRect(0, 0, 512, 512);
  context.font = '700 72px Arial Narrow, Arial, sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.shadowColor = color;
  context.shadowBlur = 28;
  context.fillStyle = color;

  const lines = text.split('\n');
  lines.forEach((line, index) => {
    context.fillText(line, 256, 256 + (index - (lines.length - 1) / 2) * 78);
  });

  const texture = createTexture(canvasElement, 1);
  texture.repeat.set(1, 1);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

export function makePortrait(name) {
  const [canvasElement, context] = createCanvas(256);
  const gradient = context.createLinearGradient(0, 0, 256, 256);
  gradient.addColorStop(0, '#102028');
  gradient.addColorStop(1, '#1a0c14');

  context.fillStyle = gradient;
  context.fillRect(0, 0, 256, 256);

  context.fillStyle = '#1c242c';
  context.beginPath();
  context.ellipse(128, 168, 70, 90, 0, 0, 7);
  context.fill();

  context.fillStyle = '#0e1216';
  context.beginPath();
  context.ellipse(128, 108, 48, 58, 0, 0, 7);
  context.fill();

  context.strokeStyle = '#3ee0ff';
  context.lineWidth = 2;
  context.beginPath();
  context.arc(168, 118, 6, 0, 7);
  context.stroke();

  context.fillStyle = '#3ee0ff';
  context.font = '12px Arial';
  context.fillText(name, 16, 240);

  const texture = new THREE.CanvasTexture(canvasElement);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;

  return hydrate(texture, '/assets/tex/kite.jpg');
}

export function makePuddle() {
  const [canvasElement, context] = createCanvas(128);
  const gradient = context.createRadialGradient(64, 64, 10, 64, 64, 64);
  gradient.addColorStop(0, 'rgba(40,60,80,0.85)');
  gradient.addColorStop(1, 'rgba(10,12,16,0)');

  context.fillStyle = gradient;
  context.fillRect(0, 0, 128, 128);

  const texture = createTexture(canvasElement, 1);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

export function makeBrick() {
  const texture = makeMetal('#4a403c');
  texture.repeat.set(2, 2);
  return hydrate(texture, '/assets/tex/brick.jpg');
}

export function makePlatten() {
  const [canvasElement, context] = createCanvas(1024);
  context.fillStyle = '#6a6e72';
  context.fillRect(0, 0, 1024, 1024);
  context.strokeStyle = 'rgba(20,20,22,0.45)';
  context.lineWidth = 8;

  for (let x = 0; x <= 1024; x += 256) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, 1024);
    context.stroke();
  }

  for (let y = 0; y <= 1024; y += 128) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(1024, y);
    context.stroke();
  }

  addNoise(context, 12000, (value) => `rgba(90,90,80,${value * 0.3})`, 1024);
  return hydrate(createTexture(canvasElement, 2), '/assets/tex/platten.jpg');
}

export function makeNightEnv() {
  const canvasElement = document.createElement('canvas');
  canvasElement.width = 2048;
  canvasElement.height = 1024;
  const context = canvasElement.getContext('2d');

  const sky = context.createLinearGradient(0, 0, 0, 512);
  sky.addColorStop(0, LOOK.css.zenith);
  sky.addColorStop(0.42, LOOK.css.mid);
  sky.addColorStop(0.55, LOOK.css.horizon);
  sky.addColorStop(1, '#05060a');

  context.fillStyle = sky;
  context.fillRect(0, 0, 1024, 512);

  const blob = (x, y, radius, color) => {
    const gradient = context.createRadialGradient(x, y, 2, x, y, radius);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    context.fillStyle = gradient;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
  };

  blob(440, 600, 320, LOOK.css.cyan);
  blob(1560, 620, 280, LOOK.css.mag);
  blob(1020, 560, 180, LOOK.css.amber);
  blob(180, 160, 80, 'rgba(180,200,255,0.18)');

  const texture = new THREE.CanvasTexture(canvasElement);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.needsUpdate = true;
  return texture;
}

export function makeGlow(color = '#3ee0ff') {
  const [canvasElement, context] = createCanvas(64);
  const gradient = context.createRadialGradient(32, 32, 2, 32, 32, 32);
  gradient.addColorStop(0, color);
  gradient.addColorStop(0.35, color);
  gradient.addColorStop(1, 'rgba(0,0,0,0)');

  context.fillStyle = gradient;
  context.fillRect(0, 0, 64, 64);

  const texture = new THREE.CanvasTexture(canvasElement);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function mulberry(seed) {
  return function () {
    let value = seed += 0x6d2b79f5;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
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
    glowWarm: makeGlow('#ffcc88')
  };
}
