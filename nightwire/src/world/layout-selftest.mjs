import assert from 'node:assert/strict';
import {
  ANCHORS, BLOCK_HALL, BLOCK_SLAB, BOLLARD_Z, CONTAINER_ISLANDS, CUT_DOCKS, CUT_STRIP,
  DOORS, DUMMY_POS, HOF_POINTS, HOF_SHIFT, PARKED_SEDAN, SLABS, STRIP_BUILDINGS,
  STRIP_COVER, WAREHOUSE, zoneOf,
} from './layout.mjs';

function aabb(b) {
  return {
    minX: b.x - b.w / 2,
    maxX: b.x + b.w / 2,
    minZ: b.z - b.d / 2,
    maxZ: b.z + b.d / 2,
  };
}

function overlaps(a, b) {
  return a.minX < b.maxX - 0.05 && a.maxX > b.minX + 0.05
    && a.minZ < b.maxZ - 0.05 && a.maxZ > b.minZ + 0.05;
}

function inside(slab, x, z) {
  return Math.abs(x - slab.x) <= slab.w / 2 + 0.01 && Math.abs(z - slab.z) <= slab.d / 2 + 0.01;
}

assert.equal(zoneOf(-50), 'docks');
assert.equal(zoneOf(CUT_DOCKS - 0.01), 'docks');
assert.equal(zoneOf(CUT_DOCKS), 'strip');
assert.equal(zoneOf(46), 'strip');
assert.equal(zoneOf(CUT_STRIP - 0.01), 'strip');
assert.equal(zoneOf(CUT_STRIP), 'hof');
assert.equal(zoneOf(ANCHORS.apartment.z), 'hof');
assert.equal(zoneOf(ANCHORS.warehouse.z), 'docks');

assert.ok(ANCHORS.boat.z < -50, 'boat stays south of the beat-0 line');
assert.equal(zoneOf(ANCHORS.boat.z), 'docks');
assert.equal(ANCHORS.player.z, -26.5);
assert.ok(inside(SLABS.docks, ANCHORS.player.x, ANCHORS.player.z));
assert.ok(inside(SLABS.docks, ANCHORS.warehouse.x, ANCHORS.warehouse.z));
assert.ok(inside(SLABS.docks, ANCHORS.boat.x, ANCHORS.boat.z));
assert.ok(inside(SLABS.hof, ANCHORS.apartment.x, ANCHORS.apartment.z));
assert.ok(inside(SLABS.hof, ANCHORS.block17.x, ANCHORS.block17.z));
assert.equal(ANCHORS.apartment.z, 96.4 + HOF_SHIFT);
assert.equal(DOORS.enter.to.z, ANCHORS.apartment.z);
assert.ok(inside(SLABS.strip, ANCHORS.rheinlicht.x, ANCHORS.rheinlicht.z));

const inner = STRIP_BUILDINGS.filter((b) => b.row === 'inner');
const lane = Math.min(...inner.map((b) => Math.abs(b.x) - b.w / 2)) * 2;
assert.ok(lane >= 18, `strip lane ${lane} m is under 18`);

for (const side of [-1, 1]) {
  const inn = STRIP_BUILDINGS.filter((b) => b.row === 'inner' && Math.sign(b.x) === side);
  const out = STRIP_BUILDINGS.filter((b) => b.row === 'outer' && Math.sign(b.x) === side);
  const innerOuterFace = Math.max(...inn.map((b) => Math.abs(b.x) + b.w / 2));
  const outerInnerFace = Math.min(...out.map((b) => Math.abs(b.x) - b.w / 2));
  const alley = outerInnerFace - innerOuterFace;
  assert.ok(alley >= 10, `alley on side ${side} is ${alley} m`);
}

const boxes = STRIP_BUILDINGS.map(aabb);
for (let i = 0; i < boxes.length; i++) {
  for (let j = i + 1; j < boxes.length; j++) {
    assert.equal(overlaps(boxes[i], boxes[j]), false, `buildings ${i} and ${j} overlap`);
  }
}

const player = { x: ANCHORS.player.x, z: ANCHORS.player.z, w: 0.6, d: 0.6 };
const warehouse = aabb(WAREHOUSE);
assert.equal(overlaps(aabb(player), warehouse), false, 'spawn sits inside warehouse');
for (const b of STRIP_BUILDINGS) {
  assert.equal(overlaps(aabb(player), aabb(b)), false, 'spawn sits inside a strip building');
  assert.ok(inside(SLABS.strip, b.x, b.z), 'strip building leaves the slab');
}

for (const island of CONTAINER_ISLANDS) {
  assert.ok(island.z < ANCHORS.player.z - 20, 'container island is not south of the harbor street');
  assert.equal(zoneOf(island.z), 'docks');
}
const xs = CONTAINER_ISLANDS.map((i) => i.x).sort((a, b) => a - b);
for (let i = 1; i < xs.length; i++) assert.ok(xs[i] - xs[i - 1] >= 8, 'container islands are closer than 8 m');

for (const c of STRIP_COVER) {
  for (const b of STRIP_BUILDINGS) {
    assert.equal(overlaps(aabb({ ...c, h: 1 }), aabb(b)), false, 'cover sits inside a building');
  }
}

assert.ok(BOLLARD_Z.every((z) => zoneOf(z) === 'strip'));
assert.equal(zoneOf(HOF_POINTS.keyLight), 'hof');
assert.equal(zoneOf(PARKED_SEDAN.z), 'hof');
assert.ok(inside(SLABS.hof, BLOCK_SLAB.x, BLOCK_SLAB.z));
assert.ok(inside(SLABS.hof, BLOCK_HALL.x, BLOCK_HALL.z));
assert.ok(DUMMY_POS.filter(([, z]) => z > CUT_STRIP).length >= 4);
assert.ok(SLABS.docks.w >= 200 && SLABS.strip.w >= 156 && SLABS.hof.w >= 168);

console.log('layout self-test ok');
