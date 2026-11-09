/**
 * NIGHTWIRE v2.0.1 — Layout (.mjs)
 * Zone cuts, slabs, story anchors and city layout data.
 */

export const HOF_SHIFT = 40;
export const CUT_DOCKS = -16;
export const CUT_STRIP = 96;

export const SLABS = {
  docks: { x: 0, z: -64, w: 200, d: 96 },
  strip: { x: 0, z: 40, w: 156, d: 112 },
  hof: { x: 0, z: 151, w: 168, d: 110 }
};

export function zoneOf(z) {
  if (z < CUT_DOCKS) return 'docks';
  if (z < CUT_STRIP) return 'strip';
  return 'hof';
}

export const WAREHOUSE = { x: -30, z: -58, w: 28, d: 22 };

export const ANCHORS = {
  player: { x: 6.2, y: 0, z: -26.5, yaw: -0.33 },
  warehouse: { x: WAREHOUSE.x, z: WAREHOUSE.z },
  boat: { x: -10, z: -104 },
  crane: { x: 22, z: -72 },
  rheinlicht: { x: -17.7, y: 5.6, z: 8 },
  apartment: { x: -18.5, y: 3.15, z: 96.4 + HOF_SHIFT },
  stairwell: { x: -12.2, z: 87.2 + HOF_SHIFT },
  block17: { x: -22, z: 102 + HOF_SHIFT, w: 22, d: 28, h: 26.8 },
  parking: { x: 16, z: 78 + HOF_SHIFT }
};

export const BLOCK_SLAB = {
  x: -16.4,
  y: 3.05,
  z: 94.2 + HOF_SHIFT,
  w: 12,
  h: 0.22,
  d: 8
};

export const BLOCK_HALL = {
  x: -14.2,
  y: 3.05,
  z: 89.6 + HOF_SHIFT,
  w: 6.4,
  h: 0.22,
  d: 3.2
};

export const DOORS = {
  landing: {
    x: -12.4,
    y: 3.3,
    z: 89.2 + HOF_SHIFT,
    to: { x: -16.6, y: 3.2, z: 96.4 + HOF_SHIFT }
  },
  enter: {
    x: -16.2,
    y: 3.3,
    z: 93.2 + HOF_SHIFT,
    to: { x: -16.6, y: 3.2, z: 96.4 + HOF_SHIFT }
  },
  out: {
    x: -15.2,
    y: 3.3,
    z: 93.4 + HOF_SHIFT,
    to: { x: -12.2, y: 3.2, z: 87.4 + HOF_SHIFT }
  }
};

export const PARKED_SEDAN = {
  type: 'sedan',
  x: 14,
  z: 80 + HOF_SHIFT,
  yaw: 0.2,
  zone: 'hof'
};

export const CONTAINER_ISLANDS = [
  { x: -46, z: -86, cols: [0x8a3a22, 0x1e4a48, 0x2a4060] },
  { x: -6, z: -90, cols: [0x8a3a22, 0x3a3a3a, 0x1e4a48] },
  { x: 40, z: -86, cols: [0x2a4060, 0x5a3224, 0x8a3a22] }
];

const innerZ = [8, 30, 52, 74];
const outerZ = [19, 41, 63, 85];
const walls = ['#1a1520', '#12161c', '#18140e', '#141018', '#101418', '#16120c', '#1a1820', '#12141a'];
const lits = ['#ff6aa0', '#3ee0ff', '#ffb35a', '#ff2d6a', '#88ccff', '#ffaa66', '#88ccff', '#3ee0ff'];

function row(side, zs, x, w, floors) {
  return zs.map((z, index) => ({
    x: side * x,
    z,
    w,
    d: 12,
    floors: floors[index],
    zone: 'strip',
    wall: walls[(index + (side < 0 ? 0 : 4)) % walls.length],
    lit: lits[(index + (side < 0 ? 0 : 3)) % lits.length],
    seed: 11 + index * 17 + (side < 0 ? 0 : 100),
    row: Math.abs(x) < 40 ? 'inner' : 'outer'
  }));
}

export const STRIP_BUILDINGS = [
  ...row(-1, innerZ, 25, 14, [5, 4, 6, 4]),
  ...row(1, innerZ, 25, 14, [6, 5, 3, 5]),
  ...row(-1, outerZ, 50, 12, [4, 5, 3, 4]),
  ...row(1, outerZ, 50, 12, [5, 4, 4, 3])
];

export const STRIP_COVER = [
  { x: -6, z: 18, w: 1.6, h: 1.15, d: 1.2 },
  { x: 6, z: 20, w: 1.4, h: 1.1, d: 1.6 },
  { x: -5, z: 42, w: 1.8, h: 1.15, d: 1.1 },
  { x: 7, z: 44, w: 1.4, h: 1.1, d: 1.4 },
  { x: -6, z: 64, w: 1.6, h: 1.15, d: 1.2 },
  { x: 5, z: 66, w: 1.5, h: 1.1, d: 1.5 }
];

export const BOLLARD_Z = [10, 28, 46, 64, 82];

export const HOF_POINTS = {
  neon: 90 + HOF_SHIFT,
  keyLight: 92 + HOF_SHIFT,
  tubeA: 88 + HOF_SHIFT,
  tubeB: 104 + HOF_SHIFT,
  fill: 88 + HOF_SHIFT,
  puddle: 90 + HOF_SHIFT,
  trash: 108 + HOF_SHIFT,
  covers: [
    [-4, 84], [2, 100], [-18, 86], [18, 86], [-18, 104], [18, 104], [0, 120]
  ].map(([x, z]) => [x, z + HOF_SHIFT]),
  npcs: [
    { type: 'civil', x: 2, z: 86 + HOF_SHIFT, yaw: 0, wander: true },
    { type: 'street', x: -6, z: 92 + HOF_SHIFT, yaw: 1.2, wander: true },
    { type: 'security', x: 10, z: 76 + HOF_SHIFT, yaw: 3, hostile: false, guard: true }
  ]
};

export const DUMMY_POS = [
  [9, -32], [11, -34], [4, -38], [8, -48], [14, -42], [-2, -36], [6, -55], [12, -28],
  [4, 18], [-3, 30], [3.5, 44], [-2, 50],
  [3, 86 + HOF_SHIFT], [-5, 94 + HOF_SHIFT], [8, 100 + HOF_SHIFT], [0, 110 + HOF_SHIFT]
];
