import * as THREE from 'three';
import { addCover, addNeon, boxMesh, mat } from './props.js';
import { makeFacade } from './textures.js';
import { ANCHORS, BLOCK_HALL, BLOCK_SLAB, DOORS, WAREHOUSE } from './layout.js';

export function buildWarehouse(world) {
  const { x, z } = WAREHOUSE;
  const wall = mat(world.game.textures.metal, { color: 0x2a3036, roughness: 0.7, metalness: 0.35 });
  const floor = mat(world.game.textures.concrete, { color: 0x3a3e44, roughness: 0.55, metalness: 0.12 });

  const shell = [
    { px: x - 8, pz: z - 11, w: 12, h: 8.5, d: 0.5 },
    { px: x + 8, pz: z - 11, w: 12, h: 8.5, d: 0.5 },
    { px: x, pz: z + 11, w: 28, h: 8.5, d: 0.5 },
    { px: x - 14, pz: z, w: 0.5, h: 8.5, d: 22 },
    { px: x + 14, pz: z - 6.5, w: 0.5, h: 8.5, d: 9 },
    { px: x + 14, pz: z + 6.5, w: 0.5, h: 8.5, d: 9 },
  ];
  const aisle = boxMesh(0.4, 3.4, 8.2, wall);
  world.solid(aisle, x, 0, z - 6, 0.4, 3.4, 8.2, 'docks');
  const aisle2 = boxMesh(0.4, 3.4, 8.2, wall);
  world.solid(aisle2, x, 0, z + 6, 0.4, 3.4, 8.2, 'docks');
  for (const s of shell) {
    const m = boxMesh(s.w, s.h, s.d, wall);
    world.solid(m, s.px, 0, s.pz, s.w, s.h, s.d, 'docks');
  }
  const roof = boxMesh(28.4, 0.3, 22.4, wall);
  roof.position.set(x, 8.55, z);
  world.add(roof, 'docks');
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(27, 21), floor);
  fl.rotation.x = -Math.PI / 2;
  fl.position.set(x, 0.04, z);
  fl.receiveShadow = true;
  world.add(fl, 'docks');

  addCover(world, x - 6, z - 4, 2.4, 1.4, 1.2, 'docks', 0x4a3a28);
  addCover(world, x - 6, z + 3, 2.4, 1.4, 1.2, 'docks', 0x4a3a28);
  addCover(world, x + 4, z - 5, 3.2, 1.6, 1.4, 'docks', 0x3a4048);
  addCover(world, x + 5, z + 4, 1.8, 1.2, 2.6, 'docks', 0x3a4048);
  addCover(world, x - 2, z + 6, 4.2, 1.3, 1.1, 'docks', 0x2a2e32);

  const lampMat = mat(null, { color: 0xffcc88, emissive: 0xffaa66, emissiveIntensity: 2, roughness: 0.4 });
  for (const lz of [z - 5, z + 5]) {
    const lamp = boxMesh(3.2, 0.12, 0.4, lampMat);
    lamp.position.set(x, 7.6, lz);
    world.add(lamp, 'docks');
  }
  const il = new THREE.PointLight(0xffc080, 3.2, 22, 1.6);
  il.position.set(x, 7.2, z);
  world.add(il, 'docks');
  world.game.lights.points.push(il);

  addNeon(world, world.game.textures.neonWH, x + 13.7, 5.4, z, 5.5, 2.4, 'docks', 0x3ee0ff, -Math.PI / 2);

  const crate = boxMesh(1.1, 0.7, 0.8, mat(world.game.textures.metal, { color: 0x2a2010, metalness: 0.3 }));
  crate.position.set(x - 10.5, 0.35, z - 7.5);
  world.add(crate, 'docks');
  world.interact({
    id: 'package',
    label: '[F] Take VIP package',
    position: new THREE.Vector3(x - 10.5, 0.6, z - 7.5),
    kind: 'package',
  });

  const laptop = boxMesh(0.4, 0.04, 0.28, mat(null, { color: 0x111, emissive: 0x113322, emissiveIntensity: 0.8 }));
  laptop.position.set(x + 4, 1.65, z - 5);
  world.add(laptop, 'docks');
  world.interact({
    id: 'wh-laptop',
    label: '[F] Read skim file',
    position: new THREE.Vector3(x + 4, 1.2, z - 5),
    kind: 'intel',
  });

  world.trigger({
    id: 'warehouse',
    box: { minx: x - 13, maxx: x + 13, miny: 0, maxy: 8, minz: z - 10, maxz: z + 10 },
    kind: 'story',
  });

  world.spawns.npc.push(
    { type: 'crew', x: x - 4, z: z - 2, yaw: 1.2, hostile: true },
    { type: 'crew', x: x + 6, z: z - 3, yaw: 2.4, hostile: true },
    { type: 'crew', x: x + 3, z: z + 6, yaw: -0.4, hostile: true },
    { type: 'crew', x: x - 8, z: z + 5, yaw: 0.6, hostile: true },
    { type: 'crew', x: x + 8, z: z + 1, yaw: 3.1, hostile: true },
    { type: 'crew', x: x - 1, z: z - 7, yaw: 0.2, hostile: true },
    { type: 'crew', x: x + 1, z: z + 2, yaw: 2.0, hostile: true },
    { type: 'crew', x: x - 9, z: z - 1, yaw: 1.7, hostile: true },
  );

  world.interact({
    id: 'wh-door-in',
    label: '[F] Enter Warehouse 09',
    position: new THREE.Vector3(x + 15.2, 1.2, z),
    kind: 'door',
    to: new THREE.Vector3(x + 10, 0, z),
    notify: 'WAREHOUSE 09',
  });
  world.interact({
    id: 'wh-door-out',
    label: '[F] Exit to docks',
    position: new THREE.Vector3(x + 12.2, 1.2, z),
    kind: 'door',
    to: new THREE.Vector3(x + 18, 0, z),
    notify: 'HAFEN',
  });
  world.interact({
    id: 'wh-rear-out',
    label: '[F] Rear bay door',
    position: new THREE.Vector3(x, 1.2, z - 9.6),
    kind: 'door',
    to: new THREE.Vector3(x, 0, z - 14),
    notify: 'REAR BAY',
  });
  world.interact({
    id: 'wh-rear-in',
    label: '[F] Enter rear bay',
    position: new THREE.Vector3(x, 1.2, z - 12.4),
    kind: 'door',
    to: new THREE.Vector3(x, 0, z - 8),
    notify: 'WAREHOUSE 09',
  });
  const bay = boxMesh(3.2, 3.6, 0.12, mat(null, {
    color: 0x0a1218, emissive: 0x3ee0ff, emissiveIntensity: 0.18, roughness: 0.45, transparent: true, opacity: 0.55,
  }));
  bay.position.set(x + 13.92, 1.8, z);
  world.add(bay, 'docks');

  world.landmark('WAREHOUSE 09', new THREE.Vector3(x, 8, z), 'docks');
  return { x, z };
}

export function buildApartment4B(world) {
  const { x, z, y } = ANCHORS.apartment;
  const wall = mat(world.game.textures.platten, { color: 0x8a8884, roughness: 0.85 });
  const warm = mat(world.game.textures.concrete, { color: 0x4a4038, roughness: 0.7 });

  const walls = [
    { px: x, pz: z - 3.6, w: 8.2, h: 2.8, d: 0.2 },
    { px: x, pz: z + 3.6, w: 8.2, h: 2.8, d: 0.2 },
    { px: x - 4.1, pz: z, w: 0.2, h: 2.8, d: 7.2 },
    { px: x + 4.1, pz: z + 1.6, w: 0.2, h: 2.8, d: 4.0 },
    { px: x + 4.1, pz: z - 2.4, w: 0.2, h: 2.8, d: 2.2 },
  ];
  for (const s of walls) {
    const m = boxMesh(s.w, s.h, s.d, wall);
    m.position.y = y + s.h / 2;
    world.add(m, 'hof');
    world.collision.addBox(s.px, y, s.pz, s.w, s.h, s.d);
  }
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(8, 7), warm);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(x, y + 0.02, z);
  floor.receiveShadow = true;
  world.add(floor, 'hof');
  world.collision.addBox(x, y - 0.2, z, 8, 0.24, 7);

  const window = new THREE.Mesh(
    new THREE.PlaneGeometry(2.4, 1.4),
    new THREE.MeshStandardMaterial({ color: 0x66aacc, emissive: 0x112233, roughness: 0.15, metalness: 0.6, transparent: true, opacity: 0.45 }),
  );
  window.position.set(x, y + 1.6, z - 3.48);
  world.add(window, 'hof');

  const mirror = new THREE.Mesh(
    new THREE.PlaneGeometry(1.1, 2.0),
    new THREE.MeshStandardMaterial({ color: 0x99aacc, roughness: 0.05, metalness: 1, envMapIntensity: 1.4 }),
  );
  mirror.position.set(x - 3.95, y + 1.4, z);
  mirror.rotation.y = Math.PI / 2;
  world.add(mirror, 'hof');

  const rack = boxMesh(1.6, 0.7, 0.4, mat(world.game.textures.metal, { color: 0x222, metalness: 0.6 }));
  rack.position.set(x + 2.4, y + 0.35, z + 2.4);
  world.add(rack, 'hof');

  const lamp = new THREE.PointLight(0xffd0a8, 1.6, 8, 2);
  lamp.position.set(x, y + 2.4, z);
  world.add(lamp, 'hof');
  world.game.lights.points.push(lamp);

  world.interact({
    id: 'extract-4b',
    label: '[F] Extract via Wohnung 4B',
    position: new THREE.Vector3(x, y + 1, z),
    kind: 'extract',
    extract: 'apt4b',
  });
  world.interact({
    id: 'wardrobe-mirror',
    label: '[F] Wardrobe mirror',
    position: new THREE.Vector3(x - 3.4, y + 1, z),
    kind: 'wardrobe',
  });
  world.interact({
    id: 'gun-rack',
    label: '[F] Restock ammo',
    position: new THREE.Vector3(x + 2.4, y + 1, z + 2.4),
    kind: 'ammo',
  });

  const laptop = boxMesh(0.35, 0.03, 0.22, mat(null, { color: 0x0a0a0a, emissive: 0x224466, emissiveIntensity: 1.2 }));
  laptop.position.set(x - 1.2, y + 0.82, z + 2.2);
  world.add(laptop, 'hof');
  const table = boxMesh(1.2, 0.7, 0.6, mat(world.game.textures.concrete, { color: 0x3a2a22 }));
  table.position.set(x - 1.2, y + 0.35, z + 2.2);
  world.add(table, 'hof');
  world.interact({
    id: 'laptop',
    label: '[F] Read KITE file',
    position: new THREE.Vector3(x - 1.2, y + 1, z + 2.2),
    kind: 'intel',
  });

  world.spawns.extract.apt4b = new THREE.Vector3(x, y, z);
  world.landmark('WOHNUNG 4B', new THREE.Vector3(x, y + 2, z), 'hof');
}

export function buildStairwell(world) {
  const { x, z } = ANCHORS.stairwell;
  const wall = mat(world.game.textures.platten, { color: 0x6a6e70, roughness: 0.85 });
  const sides = [
    { px: x - 2.1, pz: z, w: 0.22, h: 6.2, d: 3.4 },
    { px: x + 2.1, pz: z, w: 0.22, h: 6.2, d: 3.4 },
  ];
  for (const s of sides) {
    const m = boxMesh(s.w, s.h, s.d, wall);
    world.solid(m, s.px, 0, s.pz, s.w, s.h, s.d, 'hof');
  }
  const landing = boxMesh(3.6, 0.16, 2.2, mat(world.game.textures.concrete, { color: 0x555 }));
  world.solid(landing, x, 3.05, z + 0.4, 3.6, 0.16, 2.2, 'hof');
  for (let i = 0; i < 12; i++) {
    const sy = i * 0.26;
    const sz = z - 1.1 + (i % 2 === 0 ? 0.35 : 1.15);
    const step = boxMesh(1.6, 0.12, 0.85, mat(world.game.textures.concrete, { color: 0x555 }));
    world.solid(step, x, sy, sz, 1.6, 0.12, 0.85, 'hof');
  }
  const lamp = new THREE.PointLight(0xe8f0c8, 1.1, 8, 2);
  lamp.position.set(x, 4.4, z);
  world.add(lamp, 'hof');
  world.game.lights.points.push(lamp);
  const door = (id, label, spec, notify) => world.interact({
    id,
    label,
    position: new THREE.Vector3(spec.x, spec.y, spec.z),
    kind: 'door',
    to: new THREE.Vector3(spec.to.x, spec.to.y, spec.to.z),
    notify,
  });
  door('door-4b-landing', '[F] Enter Wohnung 4B', DOORS.landing, 'WOHNUNG 4B');
  door('door-4b', '[F] Enter Wohnung 4B', DOORS.enter, 'WOHNUNG 4B');
  door('door-4b-out', '[F] Stairwell', DOORS.out, 'STAIRWELL');
}

export function buildBlock17(world) {
  const { x, z, w, d, h } = ANCHORS.block17;
  const t = world.game.textures;
  const facade = makeFacade(101, 8, 6, '#6a6e72', '#e8f0c8');
  const wall = mat(facade, {
    roughness: 0.82, metalness: 0.08, envMapIntensity: 0.35,
    emissive: 0xe8f0c8, emissiveMap: facade.userData.emissiveMap, emissiveIntensity: 0.4,
  });
  const inner = mat(t.platten, { color: 0x6a6e72, roughness: 0.85 });

  const north = boxMesh(w, h, 0.55, wall);
  world.solid(north, x, 0, z + d / 2 - 0.28, w, h, 0.55, 'hof');
  const west = boxMesh(0.55, h, d, wall);
  world.solid(west, x - w / 2 + 0.28, 0, z, 0.55, h, d, 'hof');

  const eastN = boxMesh(0.55, h, 16, wall);
  world.solid(eastN, x + w / 2 - 0.28, 0, z + 6, 0.55, h, 16, 'hof');
  const eastS = boxMesh(0.55, h, 4.2, wall);
  world.solid(eastS, x + w / 2 - 0.28, 0, z - 12.2, 0.55, h, 4.2, 'hof');

  const southW = boxMesh(17, h, 0.55, wall);
  world.solid(southW, -24.5, 0, z - d / 2 + 0.28, 17, h, 0.55, 'hof');
  const southE = boxMesh(1.2, h, 0.55, wall);
  world.solid(southE, -10.6, 0, z - d / 2 + 0.28, 1.2, h, 0.55, 'hof');

  const roof = boxMesh(w + 0.4, 0.4, d + 0.4, inner);
  roof.position.set(x, h + 0.2, z);
  world.add(roof, 'hof');

  const slab = boxMesh(BLOCK_SLAB.w, BLOCK_SLAB.h, BLOCK_SLAB.d, mat(t.concrete, { color: 0x4a4e52, roughness: 0.8 }));
  world.solid(slab, BLOCK_SLAB.x, BLOCK_SLAB.y, BLOCK_SLAB.z, BLOCK_SLAB.w, BLOCK_SLAB.h, BLOCK_SLAB.d, 'hof');
  const hall = boxMesh(BLOCK_HALL.w, BLOCK_HALL.h, BLOCK_HALL.d, mat(t.concrete, { color: 0x4a4e52, roughness: 0.8 }));
  world.solid(hall, BLOCK_HALL.x, BLOCK_HALL.y, BLOCK_HALL.z, BLOCK_HALL.w, BLOCK_HALL.h, BLOCK_HALL.d, 'hof');

  world.landmark('BLOCK 17', new THREE.Vector3(x, 16, z), 'hof');
}

export function buildParking(world) {
  const { x, z } = ANCHORS.parking;
  addCover(world, x, z, 18, 0.4, 12, 'hof', 0x2a2e32);
  world.collision.addBox(x, 3.15, z, 18, 0.35, 12);
  const deck = new THREE.Mesh(
    new THREE.BoxGeometry(18, 0.35, 12),
    mat(world.game.textures.concrete, { color: 0x33363c, roughness: 0.7 }),
  );
  deck.position.set(x, 3.3, z);
  deck.receiveShadow = true;
  world.add(deck, 'hof');
  for (let i = 0; i < 8; i++) {
    const t = i / 7;
    world.collision.addBox(x - 10 + i * 0.9, t * 3.15, z - 8, 1.1, 0.28, 2.2);
    const ramp = boxMesh(1.1, 0.12, 2.2, mat(world.game.textures.asphalt, { roughness: 0.5 }));
    ramp.position.set(x - 10 + i * 0.9, t * 3.15 + 0.06, z - 8);
    world.add(ramp, 'hof');
  }
}
