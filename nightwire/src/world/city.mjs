/**
 * NIGHTWIRE v2.0.1 — City Builder (.mjs)
 * Builds docks, strip, Hof and all major world landmarks.
 */

import * as THREE from 'three';
import {
  addGround,
  addBuilding,
  addContainer,
  addLamp,
  addNeon,
  addCover,
  addPuddle,
  addCrane,
  addDumpster,
  addBarrel,
  addFence,
  addAwning,
  addBollard,
  boxMesh,
  mat
} from './props.mjs';
import {
  buildWarehouse,
  buildApartment4B,
  buildStairwell,
  buildParking,
  buildBlock17
} from './interiors.mjs';
import {
  SLABS,
  ANCHORS,
  STRIP_BUILDINGS,
  STRIP_COVER,
  CONTAINER_ISLANDS,
  BOLLARD_Z,
  HOF_POINTS,
  DUMMY_POS,
  PARKED_SEDAN
} from './layout.mjs';

export function buildCity(world) {
  const textures = world.game.textures;
  const docks = SLABS.docks;
  const strip = SLABS.strip;
  const hof = SLABS.hof;

  addGround(world, textures.asphalt, docks.x, docks.z, docks.w, docks.d, 0, 'docks', true);
  addGround(world, textures.asphalt, strip.x, strip.z, strip.w, strip.d, 0, 'strip', true);
  addGround(world, textures.asphalt, hof.x, hof.z, hof.w, hof.d, 0, 'hof', false);

  const waterMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x041018,
    roughness: 0.08,
    metalness: 0.72,
    transparent: true,
    opacity: 0.92,
    envMapIntensity: 1.6,
    clearcoat: 0.65,
    clearcoatRoughness: 0.12
  });

  const water = new THREE.Mesh(new THREE.PlaneGeometry(180, 40), waterMaterial);
  water.rotation.x = -Math.PI / 2;
  water.position.set(0, -0.55, -130);
  world.add(water, 'docks');

  addCrane(world, ANCHORS.crane.x, ANCHORS.crane.z);
  buildWarehouse(world);

  CONTAINER_ISLANDS.forEach((island) => {
    island.cols.forEach((color, index) => {
      addContainer(
        world,
        island.x + index * 7.2,
        island.z,
        color,
        'docks',
        0,
        index === 1 ? 1 : 0
      );
    });
  });

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

  [[-18, -46], [18, -46], [-22, -30], [22, -30], [0, -70]].forEach(([x, z]) => {
    addCover(world, x, z, 1.8, 1.2, 1.4, 'docks');
  });

  const boat = boatMesh(textures);
  boat.position.set(ANCHORS.boat.x, 0.2, ANCHORS.boat.z);
  world.add(boat, 'docks');

  world.interact({
    id: 'extract-boat',
    label: '[F] Extract via dock boat',
    position: new THREE.Vector3(ANCHORS.boat.x, 0.8, ANCHORS.boat.z),
    kind: 'extract',
    extract: 'boat'
  });

  world.spawns.extract.boat = new THREE.Vector3(ANCHORS.boat.x, 0.6, ANCHORS.boat.z);

  world.spawns.vehicle.push({ type: 'van', x: 6.5, z: -22, yaw: 0.4, zone: 'docks' });
  world.spawns.npc.push(
    { type: 'street', x: 9.5, z: -24.5, yaw: 2.2, hostile: false },
    { type: 'street', x: 11.2, z: -25.2, yaw: -1.1, hostile: false },
    { type: 'civil', x: 4, z: -18, yaw: 0, hostile: false, wander: true }
  );
  world.spawns.player = { ...ANCHORS.player };

  DUMMY_POS.forEach(([x, z], index) => {
    world.spawns.npc.push({
      type: 'dummy',
      x,
      z,
      yaw: index,
      hostile: false,
      dummy: true
    });
  });

  STRIP_BUILDINGS.forEach((building) => addBuilding(world, building));

  const rheinlicht = ANCHORS.rheinlicht;
  addNeon(world, textures.neonRL, rheinlicht.x, rheinlicht.y, rheinlicht.z, 7.2, 2.0, 'strip', 0xff2d6a, Math.PI / 2);
  addNeon(world, textures.neonFood, -17.6, 3.4, 32, 6.4, 1.4, 'strip', 0xffb35a, Math.PI / 2);
  addNeon(world, textures.neonKai, 17.7, 5.2, 30, 6.4, 1.5, 'strip', 0x3ee0ff, -Math.PI / 2);

  const club = boxMesh(6, 3.2, 1.2, mat(null, {
    color: 0x12080c,
    emissive: 0xff2d6a,
    emissiveIntensity: 0.35,
    roughness: 0.5
  }));
  world.solid(club, -18.2, 0, 8, 6, 3.2, 1.2, 'strip');

  const foodStand = boxMesh(4.4, 2.6, 3.2, mat(textures.metal, {
    color: 0x3a2a18,
    roughness: 0.6
  }));
  world.solid(foodStand, -17.4, 0, 32, 4.4, 2.6, 3.2, 'strip');

  const signLight = new THREE.PointLight(0xff2d6a, 4.2, 26, 1.7);
  signLight.userData.keep = true;
  signLight.position.set(-14, 4.4, 10);
  world.add(signLight, 'strip');
  world.game.lights.points.push(signLight);
  world.game.lights.budget += 1;
  world.landmark('RHEINLICHT', new THREE.Vector3(rheinlicht.x, rheinlicht.y, rheinlicht.z), 'strip');

  STRIP_COVER.forEach((cover) => addCover(world, cover.x, cover.z, cover.w, cover.h, cover.d, 'strip'));
  addPuddle(world, 0, 12, 2.2, 'strip');
  addPuddle(world, 1.4, 40, 1.5, 'strip');
  addPuddle(world, -1, 62, 1.8, 'strip');
  addLamp(world, 12, 22, 0xff66aa, 'strip', 1.6);
  addPuddle(world, -2.2, 22, 1.3, 'strip');
  addPuddle(world, 2.4, 48, 1.1, 'strip');

  BOLLARD_Z.forEach((z) => {
    addBollard(world, -15, z, 'strip');
    addBollard(world, 15, z, 'strip');
  });

  const cable = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.02, 28, 5),
    mat(textures.metal, {
      color: 0x111111,
      metalness: 0.4
    })
  );
  cable.rotation.z = Math.PI / 2;
  cable.position.set(0, 8.4, 30);
  world.add(cable, 'strip');

  addFence(world, strip.w / 2 - 2, strip.z, strip.d, 'strip', Math.PI / 2);
  addFence(world, -strip.w / 2 + 2, strip.z, strip.d, 'strip', Math.PI / 2);

  const curbMaterial = mat(textures.concrete, {
    color: 0x3a4048,
    roughness: 0.78
  });

  [-(strip.w / 2 - 6), strip.w / 2 - 6].forEach((x) => {
    const curb = boxMesh(0.38, 0.22, strip.d, curbMaterial);
    world.solid(curb, x, 0, strip.z, 0.38, 0.22, strip.d, 'strip');
  });

  for (let index = 0; index < 4; index += 1) {
    const fireEscape = boxMesh(0.08, 8, 1.6, mat(textures.metal, {
      color: 0x222222,
      metalness: 0.7
    }));
    fireEscape.position.set(17.6, 4, 14 + index * 16);
    world.add(fireEscape, 'strip');
  }

  world.spawns.vehicle.push({ type: 'sedan', x: 3.2, z: 20, yaw: 0, zone: 'strip' });
  world.spawns.npc.push(
    { type: 'civil', x: -2, z: 14, yaw: 0.3, wander: true },
    { type: 'civil', x: 2.4, z: 26, yaw: 3, wander: true },
    { type: 'street', x: -4, z: 34, yaw: 1, wander: true },
    { type: 'civil', x: 1, z: 48, yaw: 0.2, wander: true }
  );

  world.interact({
    id: 'club-door',
    label: '[F] Club door (locked)',
    position: new THREE.Vector3(-18.2, 1.2, 9.2),
    kind: 'locked'
  });

  world.interact({
    id: 'switch-strip',
    label: '[F] Toggle alley light',
    position: new THREE.Vector3(8.4, 1.2, 18),
    kind: 'light'
  });

  buildBlock17(world);
  addNeon(world, textures.neonB17, -10.8, 14, HOF_POINTS.neon, 8, 2.6, 'hof', 0xddeecc, Math.PI / 2);

  const keyLight = new THREE.PointLight(0xddeecc, 2.4, 28, 1.8);
  keyLight.userData.keep = true;
  keyLight.position.set(0, 6, HOF_POINTS.keyLight);
  world.add(keyLight, 'hof');
  world.game.lights.points.push(keyLight);

  [[-8, HOF_POINTS.tubeA], [6, HOF_POINTS.tubeB]].forEach(([x, z]) => {
    const tube = boxMesh(2.8, 0.08, 0.16, mat(null, {
      color: 0xe8f0c8,
      emissive: 0xcce8a8,
      emissiveIntensity: 1.6,
      roughness: 0.4
    }));
    tube.position.set(x, 4.6, z);
    world.add(tube, 'hof');
  });

  const fillLight = new THREE.PointLight(0xc8e0a8, 1.6, 16, 1.8);
  fillLight.position.set(-8, 4.4, HOF_POINTS.fill);
  world.add(fillLight, 'hof');
  world.game.lights.points.push(fillLight);

  addPuddle(world, -1.2, HOF_POINTS.puddle, 2.6, 'hof');
  addDumpster(world, 4, HOF_POINTS.puddle, 'hof');
  addDumpster(world, 6.4, HOF_POINTS.puddle, 'hof');

  const trash = boxMesh(4.2, 2.4, 3.2, mat(textures.metal, {
    color: 0x2a2e28,
    roughness: 0.7
  }));
  world.solid(trash, 8, 0, HOF_POINTS.trash, 4.2, 2.4, 3.2, 'hof');

  HOF_POINTS.covers.forEach(([x, z]) => addCover(world, x, z, 1.6, 1.1, 1.4, 'hof'));

  buildParking(world);
  buildStairwell(world);
  buildApartment4B(world);

  HOF_POINTS.npcs.forEach((npc) => world.spawns.npc.push(npc));
  world.spawns.vehicle.push({ ...PARKED_SEDAN });

  const helicopter = boxMesh(1.6, 0.4, 4.2, mat(textures.metal, {
    color: 0x222222,
    emissive: 0x333344,
    emissiveIntensity: 0.4
  }));
  helicopter.position.set(80, 42, -40);
  helicopter.name = 'heli';
  world.group.add(helicopter);
  world.game.heli = helicopter;

  const spotlight = new THREE.SpotLight(0xffffee, 2.2, 80, 0.18, 0.6);
  spotlight.position.set(80, 40, -40);
  spotlight.target.position.set(70, 0, -40);
  world.group.add(spotlight);
  world.group.add(spotlight.target);
  world.game.heliSpot = spotlight;

  world.interact({
    id: 'crate-loot',
    label: '[F] Loot crate',
    position: new THREE.Vector3(8, 1, -40),
    kind: 'loot'
  });
}

function boatMesh(textures) {
  const group = new THREE.Group();

  const hull = boxMesh(3.2, 0.7, 7.4, mat(textures.metal, {
    color: 0x1a242c,
    metalness: 0.5
  }));
  hull.position.y = 0.2;
  group.add(hull);

  const cabin = boxMesh(2.0, 1.1, 2.2, mat(textures.metal, {
    color: 0x243038,
    metalness: 0.4
  }));
  cabin.position.set(0, 1.1, -1.2);
  group.add(cabin);

  return group;
}
