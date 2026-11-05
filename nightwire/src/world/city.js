import * as THREE from 'three';
import {
  addGround, addBuilding, addContainer, addLamp, addNeon, addCover,
  addPuddle, addCrane, addDumpster, addBarrel, addFence, addAwning, addBollard, boxMesh, mat,
} from './props.js';
import { buildWarehouse, buildApartment4B, buildStairwell, buildParking, buildBlock17 } from './interiors.js';
import {
  SLABS, ANCHORS, STRIP_BUILDINGS, STRIP_COVER, CONTAINER_ISLANDS, BOLLARD_Z,
  HOF_POINTS, DUMMY_POS, PARKED_SEDAN,
} from './layout.js';

export function buildCity(world) {
  const t = world.game.textures;
  const docks = SLABS.docks;
  const strip = SLABS.strip;
  const hof = SLABS.hof;

  addGround(world, t.asphalt, docks.x, docks.z, docks.w, docks.d, 0, 'docks', true);
  addGround(world, t.asphalt, strip.x, strip.z, strip.w, strip.d, 0, 'strip', true);
  addGround(world, t.asphalt, hof.x, hof.z, hof.w, hof.d, 0, 'hof', false);

  const waterMat = new THREE.MeshPhysicalMaterial({
    color: 0x041018, roughness: 0.08, metalness: 0.72, transparent: true, opacity: 0.92,
    envMapIntensity: 1.6, clearcoat: 0.65, clearcoatRoughness: 0.12,
  });
  const water = new THREE.Mesh(new THREE.PlaneGeometry(180, 40), waterMat);
  water.rotation.x = -Math.PI / 2;
  water.position.set(0, -0.55, -130);
  world.add(water, 'docks');

  addCrane(world, ANCHORS.crane.x, ANCHORS.crane.z);
  buildWarehouse(world);

  for (const island of CONTAINER_ISLANDS) {
    island.cols.forEach((color, i) => {
      addContainer(world, island.x + i * 7.2, island.z, color, 'docks', 0, i === 1 ? 1 : 0);
    });
  }

  addCover(world, 8, -40, 1.6, 1.2, 1.6, 'docks');
  addCover(world, 12, -36, 2.4, 1.1, 0.8, 'docks');
  addCover(world, -6, -34, 1.8, 1.3, 1.2, 'docks');
  addBarrel(world, 7.4, -38, 'docks');
  addBarrel(world, 5.2, -41, 'docks');
  addFence(world, docks.w / 2 - 2, docks.z, docks.d, 'docks', Math.PI / 2);
  addFence(world, -docks.w / 2 + 2, docks.z, docks.d, 'docks', Math.PI / 2);

  addLamp(world, 10, -30, 0xff9944, 'docks', 2.6);
  addLamp(world, -12, -44, 0xff9944, 'docks', 2.2);
  addPuddle(world, 6, -28, 2.8, 'docks');
  addPuddle(world, 2, -48, 1.8, 'docks');
  addPuddle(world, 8, -22, 2.2, 'docks');
  addPuddle(world, 5.2, -26.2, 1.4, 'docks');
  addAwning(world, 10.4, -24.8, 4.8, 2.4, 'docks');
  for (const [cx, cz] of [[-18, -46], [18, -46], [-22, -30], [22, -30], [0, -70]]) {
    addCover(world, cx, cz, 1.8, 1.2, 1.4, 'docks');
  }

  const boat = boatMesh(t);
  boat.position.set(ANCHORS.boat.x, 0.2, ANCHORS.boat.z);
  world.add(boat, 'docks');
  world.interact({
    id: 'extract-boat',
    label: '[F] Extract via dock boat',
    position: new THREE.Vector3(ANCHORS.boat.x, 0.8, ANCHORS.boat.z),
    kind: 'extract',
    extract: 'boat',
  });
  world.spawns.extract.boat = new THREE.Vector3(ANCHORS.boat.x, 0.6, ANCHORS.boat.z);

  world.spawns.vehicle.push({ type: 'van', x: 6.5, z: -22, yaw: 0.4, zone: 'docks' });
  world.spawns.npc.push(
    { type: 'street', x: 9.5, z: -24.5, yaw: 2.2, hostile: false },
    { type: 'street', x: 11.2, z: -25.2, yaw: -1.1, hostile: false },
    { type: 'civil', x: 4, z: -18, yaw: 0, hostile: false, wander: true },
  );
  world.spawns.player = { ...ANCHORS.player };

  DUMMY_POS.forEach(([x, z], i) => {
    world.spawns.npc.push({ type: 'dummy', x, z, yaw: i, hostile: false, dummy: true });
  });

  for (const b of STRIP_BUILDINGS) addBuilding(world, b);

  const rl = ANCHORS.rheinlicht;
  addNeon(world, t.neonRL, rl.x, rl.y, rl.z, 7.2, 2.0, 'strip', 0xff2d6a, Math.PI / 2);
  addNeon(world, t.neonFood, -17.6, 3.4, 32, 6.4, 1.4, 'strip', 0xffb35a, Math.PI / 2);
  addNeon(world, t.neonKai, 17.7, 5.2, 30, 6.4, 1.5, 'strip', 0x3ee0ff, -Math.PI / 2);

  const club = boxMesh(6, 3.2, 1.2, mat(null, { color: 0x12080c, emissive: 0xff2d6a, emissiveIntensity: 0.35, roughness: 0.5 }));
  world.solid(club, -18.2, 0, 8, 6, 3.2, 1.2, 'strip');
  const imbiss = boxMesh(4.4, 2.6, 3.2, mat(t.metal, { color: 0x3a2a18, roughness: 0.6 }));
  world.solid(imbiss, -17.4, 0, 32, 4.4, 2.6, 3.2, 'strip');

  const signLight = new THREE.PointLight(0xff2d6a, 4.2, 26, 1.7);
  signLight.userData.keep = true;
  signLight.position.set(-14, 4.4, 10);
  world.add(signLight, 'strip');
  world.game.lights.points.push(signLight);
  world.game.lights.budget += 1;
  world.landmark('RHEINLICHT', new THREE.Vector3(rl.x, rl.y, rl.z), 'strip');

  for (const c of STRIP_COVER) addCover(world, c.x, c.z, c.w, c.h, c.d, 'strip');
  addPuddle(world, 0, 12, 2.2, 'strip');
  addPuddle(world, 1.4, 40, 1.5, 'strip');
  addPuddle(world, -1, 62, 1.8, 'strip');
  addLamp(world, 12, 22, 0xff66aa, 'strip', 1.6);
  addPuddle(world, -2.2, 22, 1.3, 'strip');
  addPuddle(world, 2.4, 48, 1.1, 'strip');
  for (const bz of BOLLARD_Z) {
    addBollard(world, -15, bz, 'strip');
    addBollard(world, 15, bz, 'strip');
  }
  const cable = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.02, 28, 5),
    mat(world.game.textures.metal, { color: 0x111, metalness: 0.4 }),
  );
  cable.rotation.z = Math.PI / 2;
  cable.position.set(0, 8.4, 30);
  world.add(cable, 'strip');
  addFence(world, strip.w / 2 - 2, strip.z, strip.d, 'strip', Math.PI / 2);
  addFence(world, -strip.w / 2 + 2, strip.z, strip.d, 'strip', Math.PI / 2);
  const curbMat = mat(t.concrete, { color: 0x3a4048, roughness: 0.78 });
  for (const cx of [-(strip.w / 2 - 6), strip.w / 2 - 6]) {
    const curb = boxMesh(0.38, 0.22, strip.d, curbMat);
    world.solid(curb, cx, 0, strip.z, 0.38, 0.22, strip.d, 'strip');
  }

  for (let i = 0; i < 4; i++) {
    const fire = boxMesh(0.08, 8, 1.6, mat(t.metal, { color: 0x222, metalness: 0.7 }));
    fire.position.set(17.6, 4, 14 + i * 16);
    world.add(fire, 'strip');
  }

  world.spawns.vehicle.push({ type: 'sedan', x: 3.2, z: 20, yaw: 0, zone: 'strip' });
  world.spawns.npc.push(
    { type: 'civil', x: -2, z: 14, yaw: 0.3, wander: true },
    { type: 'civil', x: 2.4, z: 26, yaw: 3, wander: true },
    { type: 'street', x: -4, z: 34, yaw: 1, wander: true },
    { type: 'civil', x: 1, z: 48, yaw: 0.2, wander: true },
  );
  world.interact({
    id: 'club-door',
    label: '[F] Club door (locked)',
    position: new THREE.Vector3(-18.2, 1.2, 9.2),
    kind: 'locked',
  });
  world.interact({
    id: 'switch-strip',
    label: '[F] Toggle alley light',
    position: new THREE.Vector3(8.4, 1.2, 18),
    kind: 'light',
  });

  buildBlock17(world);
  addNeon(world, t.neonB17, -10.8, 14, HOF_POINTS.neon, 8, 2.6, 'hof', 0xddeecc, Math.PI / 2);
  const fl = new THREE.PointLight(0xddeecc, 2.4, 28, 1.8);
  fl.userData.keep = true;
  fl.position.set(0, 6, HOF_POINTS.keyLight);
  world.add(fl, 'hof');
  world.game.lights.points.push(fl);
  for (const [lx, lz] of [[-8, HOF_POINTS.tubeA], [6, HOF_POINTS.tubeB]]) {
    const tube = boxMesh(2.8, 0.08, 0.16, mat(null, { color: 0xe8f0c8, emissive: 0xcce8a8, emissiveIntensity: 1.6, roughness: 0.4 }));
    tube.position.set(lx, 4.6, lz);
    world.add(tube, 'hof');
  }
  const fl2 = new THREE.PointLight(0xc8e0a8, 1.6, 16, 1.8);
  fl2.position.set(-8, 4.4, HOF_POINTS.fill);
  world.add(fl2, 'hof');
  world.game.lights.points.push(fl2);
  addPuddle(world, -1.2, HOF_POINTS.puddle, 2.6, 'hof');
  addDumpster(world, 4, HOF_POINTS.puddle, 'hof');
  addDumpster(world, 6.4, HOF_POINTS.puddle, 'hof');
  const trash = boxMesh(4.2, 2.4, 3.2, mat(t.metal, { color: 0x2a2e28, roughness: 0.7 }));
  world.solid(trash, 8, 0, HOF_POINTS.trash, 4.2, 2.4, 3.2, 'hof');
  for (const [cx, cz] of HOF_POINTS.covers) addCover(world, cx, cz, 1.6, 1.1, 1.4, 'hof');

  buildParking(world);
  buildStairwell(world);
  buildApartment4B(world);

  for (const npc of HOF_POINTS.npcs) world.spawns.npc.push(npc);
  world.spawns.vehicle.push({ ...PARKED_SEDAN });

  const heli = boxMesh(1.6, 0.4, 4.2, mat(t.metal, { color: 0x222, emissive: 0x334, emissiveIntensity: 0.4 }));
  heli.position.set(80, 42, -40);
  heli.name = 'heli';
  world.group.add(heli);
  world.game.heli = heli;
  const spot = new THREE.SpotLight(0xffffee, 2.2, 80, 0.18, 0.6);
  spot.position.set(80, 40, -40);
  spot.target.position.set(70, 0, -40);
  world.group.add(spot);
  world.group.add(spot.target);
  world.game.heliSpot = spot;

  world.interact({
    id: 'crate-loot',
    label: '[F] Loot crate',
    position: new THREE.Vector3(8, 1, -40),
    kind: 'loot',
  });
}

function boatMesh(t) {
  const g = new THREE.Group();
  const hull = boxMesh(3.2, 0.7, 7.4, mat(t.metal, { color: 0x1a242c, metalness: 0.5 }));
  hull.position.y = 0.2;
  g.add(hull);
  const cabin = boxMesh(2.0, 1.1, 2.2, mat(t.metal, { color: 0x243038, metalness: 0.4 }));
  cabin.position.set(0, 1.1, -1.2);
  g.add(cabin);
  return g;
}
