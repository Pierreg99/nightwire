import * as THREE from 'three';
import { makeFacade } from './textures.js';
import { wetAsphaltMaterial } from '../fx/wetAsphalt.js';

export function mat(tex, opts = {}) {
  return new THREE.MeshStandardMaterial({
    map: tex || null,
    color: opts.color ?? 0xffffff,
    roughness: opts.roughness ?? 0.72,
    metalness: opts.metalness ?? 0.12,
    emissive: opts.emissive ?? 0x000000,
    emissiveMap: opts.emissiveMap || null,
    emissiveIntensity: opts.emissiveIntensity ?? 1,
    transparent: opts.transparent ?? false,
    opacity: opts.opacity ?? 1,
    side: opts.side ?? THREE.FrontSide,
    envMapIntensity: opts.envMapIntensity ?? 0.8,
  });
}

export function boxMesh(w, h, d, material) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  m.castShadow = true;
  m.receiveShadow = true;
  m.position.y = h / 2;
  return m;
}

export function glowSprite(map, size) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({
    map, color: 0xffffff, transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending, opacity: 0.85,
  }));
  s.scale.set(size, size, 1);
  return s;
}

export function addGround(world, tex, x, z, w, d, y = 0, zone = 'docks', wet = false) {
  const material = wet ? wetAsphaltMaterial(tex) : mat(tex, { roughness: 0.7, metalness: 0.08 });
  const geo = new THREE.PlaneGeometry(w, d);
  const m = new THREE.Mesh(geo, material);
  m.rotation.x = -Math.PI / 2;
  m.position.set(x, y + 0.002, z);
  m.receiveShadow = true;
  world.add(m, zone);
  world.collision.addBox(x, y - 0.4, z, w, 0.42, d, 'solid');
  return m;
}

export function addBuilding(world, { x, z, w, d, floors, zone, wall, lit, seed, yaw = 0 }) {
  const h = floors * 3.2 + 1.2;
  const facade = world.game.textures.facades || (world.game.textures.facades = {});
  const key = `${seed}-${floors}-${wall}`;
  if (!facade[key]) {
    facade[key] = makeFacade(seed, floors, Math.max(3, Math.round(w / 3)), wall, lit);
  }
  const facadeTex = facade[key];
  const mesh = boxMesh(w, h, d, mat(facadeTex, {
    roughness: 0.78, metalness: 0.12, envMapIntensity: 0.45,
    emissive: lit, emissiveMap: facadeTex.userData.emissiveMap, emissiveIntensity: 0.55,
  }));
  mesh.rotation.y = yaw;
  world.solid(mesh, x, 0, z, w, h, d, zone);

  const roof = boxMesh(w + 0.55, 0.28, d + 0.55, mat(world.game.textures.concrete, { color: 0x2a2e34, roughness: 0.7 }));
  roof.position.set(x, h + 0.14, z);
  world.add(roof, zone);
  const cornice = boxMesh(w + 0.4, 0.18, d + 0.4, mat(null, { color: 0x16181c, roughness: 0.55, metalness: 0.2 }));
  cornice.position.set(x, h - 0.12, z);
  world.add(cornice, zone);
  const skirt = boxMesh(w + 0.08, 0.1, d + 0.08, mat(null, {
    color: lit, emissive: lit, emissiveIntensity: 0.9, roughness: 0.35,
  }));
  skirt.position.set(x, 0.06, z);
  world.add(skirt, zone);

  const face = x < 0 ? 1 : -1;
  const glass = mat(null, {
    color: 0x0a1016, emissive: lit, emissiveIntensity: 0.42,
    roughness: 0.12, metalness: 0.55, transparent: true, opacity: 0.82, envMapIntensity: 1.2,
  });
  const shop = boxMesh(0.06, 2.15, Math.min(d * 0.62, 8), glass);
  shop.position.set(x + face * (w / 2 + 0.04), 1.18, z);
  world.add(shop, zone);
  const lintel = boxMesh(0.12, 0.16, Math.min(d * 0.66, 8.2), mat(null, { color: 0x1a1c20 }));
  lintel.position.set(x + face * (w / 2 + 0.05), 2.32, z);
  world.add(lintel, zone);

  const ac = boxMesh(1.35, 0.62, 1.05, mat(world.game.textures.metal, { color: 0x3a4248, metalness: 0.45, roughness: 0.4 }));
  ac.position.set(x + w * 0.18, h + 0.58, z - d * 0.12);
  world.add(ac, zone);
  const pipe = boxMesh(0.12, h * 0.55, 0.12, mat(world.game.textures.metal, { color: 0x2a3034, metalness: 0.5 }));
  pipe.position.set(x + face * (w / 2 - 0.2), h * 0.35, z + d / 2 - 0.2);
  world.add(pipe, zone);
  return mesh;
}

export function addContainer(world, x, z, color, zone = 'docks', yaw = 0, stacked = 0) {
  const y = stacked * 2.62;
  const mesh = boxMesh(6.1, 2.6, 2.5, mat(world.game.textures.container, {
    color, roughness: 0.42, metalness: 0.58, envMapIntensity: 0.7,
  }));
  mesh.rotation.y = yaw;
  world.solid(mesh, x, y, z, 6.1, 2.6, 2.5, zone, 'cover');
  const rib = boxMesh(6.12, 0.08, 2.52, mat(null, { color: 0x111, roughness: 0.4, metalness: 0.6 }));
  rib.position.set(x, y + 2.5, z);
  rib.rotation.y = yaw;
  world.add(rib, zone);
  return mesh;
}

export function addLamp(world, x, z, color, zone, intensity = 2.4) {
  const pole = boxMesh(0.12, 5.2, 0.12, mat(world.game.textures.metal, { color: 0x1a1c20, metalness: 0.7 }));
  world.add(pole, zone);
  pole.position.x = x;
  pole.position.z = z;
  const head = boxMesh(0.5, 0.12, 0.18, mat(null, { color, emissive: color, emissiveIntensity: 2.2, roughness: 0.3 }));
  head.position.set(x, 5.15, z);
  world.add(head, zone);
  const glow = glowSprite(world.game.textures.glowWarm, 2.4);
  glow.position.set(x, 5.15, z);
  world.add(glow, zone);
  if (world.game.lights.budget < 8) {
    const l = new THREE.PointLight(color, intensity, 18, 1.8);
    l.position.set(x, 5.0, z);
    world.add(l, zone);
    world.game.lights.budget += 1;
    world.game.lights.points.push(l);
  }
}

export function addNeon(world, tex, x, y, z, w, h, zone, color, yaw = 0) {
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshStandardMaterial({
      map: tex, emissiveMap: tex, emissive: color, emissiveIntensity: 2.4,
      roughness: 0.35, metalness: 0.1, transparent: true,
    }),
  );
  m.position.set(x, y, z);
  m.rotation.y = yaw;
  world.add(m, zone);
  return m;
}

export function addBollard(world, x, z, zone = 'strip') {
  const post = boxMesh(0.16, 0.85, 0.16, mat(world.game.textures.metal, { color: 0x2a2e32, metalness: 0.55, roughness: 0.4 }));
  world.solid(post, x, 0, z, 0.16, 0.85, 0.16, zone);
  const cap = boxMesh(0.2, 0.06, 0.2, mat(null, { color: 0x3ee0ff, emissive: 0x3ee0ff, emissiveIntensity: 0.55, roughness: 0.3 }));
  cap.position.set(x, 0.88, z);
  world.add(cap, zone);
}

export function addCover(world, x, z, w, h, d, zone, color = 0x3a3f44) {
  const m = boxMesh(w, h, d, mat(world.game.textures.concrete, { color, roughness: 0.8 }));
  world.solid(m, x, 0, z, w, h, d, zone, 'cover');
  world.cover.push({ x, z, w, h, d, zone });
  return m;
}

export function addPuddle(world, x, z, s, zone) {
  const m = new THREE.Mesh(
    new THREE.CircleGeometry(s, 20),
    new THREE.MeshPhysicalMaterial({
      color: 0x1a2830, roughness: 0.04, metalness: 0.82,
      transparent: true, opacity: 0.78, envMapIntensity: 1.8,
      clearcoat: 1, clearcoatRoughness: 0.08,
      depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4,
    }),
  );
  m.rotation.x = -Math.PI / 2;
  m.position.set(x, 0.045, z);
  m.renderOrder = 2;
  m.receiveShadow = true;
  world.add(m, zone);
}

export function addAwning(world, x, z, w, d, zone = 'docks') {
  const roof = boxMesh(w, 0.08, d, mat(world.game.textures.metal, { color: 0x2a2420, metalness: 0.5, roughness: 0.4 }));
  roof.position.set(x, 2.55, z);
  roof.rotation.z = 0.04;
  world.add(roof, zone);
  for (const sx of [-w / 2 + 0.12, w / 2 - 0.12]) {
    const post = boxMesh(0.08, 2.5, 0.08, mat(world.game.textures.metal, { color: 0x1a1a1c, metalness: 0.6 }));
    post.position.x = x + sx;
    post.position.z = z + d / 2 - 0.1;
    world.add(post, zone);
  }
  const l = new THREE.PointLight(0xff9944, 1.55, 9, 2);
  l.position.set(x, 2.35, z);
  world.add(l, zone);
  world.game.lights.points.push(l);
  world.game.lights.budget += 1;
  const glow = glowSprite(world.game.textures.glowWarm, 3.2);
  glow.position.set(x, 2.4, z);
  world.add(glow, zone);
}

export function addCrane(world, x, z) {
  const metal = mat(world.game.textures.metal, { color: 0x3a4048, metalness: 0.72, roughness: 0.32, envMapIntensity: 0.9 });
  const tower = boxMesh(2.2, 28, 2.2, metal);
  world.solid(tower, x, 0, z, 2.2, 28, 2.2, 'docks');
  for (let i = 4; i < 26; i += 4) {
    const cross = boxMesh(2.4, 0.18, 0.18, metal);
    cross.position.set(x, i, z);
    world.add(cross, 'docks');
  }
  const jib = boxMesh(38, 0.7, 1.2, metal);
  jib.position.set(x - 10, 27.4, z);
  world.add(jib, 'docks');
  const cab = boxMesh(3.2, 2.2, 2.4, mat(world.game.textures.metal, { color: 0x1c2228, metalness: 0.5 }));
  cab.position.set(x, 25.6, z);
  world.add(cab, 'docks');
  const hook = boxMesh(0.2, 8, 0.2, metal);
  hook.position.set(x - 22, 22, z);
  world.add(hook, 'docks');
  addNeon(world, world.game.textures.neonHafen, x + 1.2, 20, z, 6, 2.2, 'docks', 0x3ee0ff, Math.PI / 2);
  const l = new THREE.PointLight(0x3ee0ff, 6.4, 48, 1.45);
  l.userData.keep = true;
  l.position.set(x, 21, z + 2);
  world.add(l, 'docks');
  world.game.lights.budget += 1;
  world.game.lights.points.push(l);
  const key = new THREE.SpotLight(0x88e8ff, 3.6, 70, 0.55, 0.45);
  key.position.set(x, 26, z + 4);
  key.target.position.set(6, 0, -28);
  world.add(key, 'docks');
  world.add(key.target, 'docks');
  const glow = glowSprite(world.game.textures.glowCyan, 14);
  glow.position.set(x, 20.5, z + 1.4);
  world.add(glow, 'docks');
  world.landmark('HAFEN CRANE', new THREE.Vector3(x, 28, z), 'docks');
}

export function addDumpster(world, x, z, zone) {
  addCover(world, x, z, 2.2, 1.15, 1.1, zone, 0x1d4a32);
}

export function addBarrel(world, x, z, zone) {
  const m = new THREE.Mesh(
    new THREE.CylinderGeometry(0.32, 0.34, 0.9, 10),
    mat(world.game.textures.rust, { color: 0x8a4030, metalness: 0.4, roughness: 0.5 }),
  );
  m.castShadow = true;
  m.position.set(x, 0.45, z);
  world.add(m, zone);
  world.collision.addBox(x, 0, z, 0.7, 0.9, 0.7, 'cover');
}

export function addFence(world, x, z, w, zone, yaw = 0) {
  const m = boxMesh(w, 2.1, 0.08, mat(world.game.textures.metal, {
    color: 0x2a3036, metalness: 0.6, roughness: 0.4, transparent: true, opacity: 0.75,
  }));
  m.rotation.y = yaw;
  world.solid(m, x, 0, z, yaw ? 0.2 : w, 2.1, yaw ? w : 0.2, zone);
}
