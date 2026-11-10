/**
 * NIGHTWIRE — photographic map layer (.mjs)
 * Upgrades the authored city (layout.mjs / assets/maps/city.json stay untouched) with CC0 Poly Haven
 * assets once they have loaded (see docs/ASSET-LICENSES.md):
 *  - PBR photo textures (colour + normal + roughness) on asphalt, pavement, concrete, metal, rust,
 *    containers, brick and slab facades, with UVs rescaled to real-world metres per mesh;
 *  - the "Neuer Zollhof" night HDRI (Düsseldorf harbour) as image-based lighting;
 *  - scanned street furniture and modular pieces placed per zone (lamps, hydrants, bins, barriers,
 *    utility boxes, AC units, fire escapes, pipes, ducts, shutters, crates, barrels, generator, ...),
 *    solid ones with collision boxes. Density follows profile.props.
 * Everything is additive: if a file fails, the procedural look underneath stays.
 */

import * as THREE from 'three';
import { SLABS, WAREHOUSE } from './layout.mjs';

const PH_MODEL = (id) => `/assets/thirdparty/polyhaven/models/${id}.glb`;

// procedural texture key -> [Poly Haven set, tile size in metres, ground]
const SURFACES = {
  asphalt: ['asphalt_02', 4.0, true],
  concrete: ['concrete_floor_worn_001', 3.0, false],
  metal: ['corrugated_iron_02', 2.2, false],
  rust: ['rusty_metal_sheet', 2.0, false],
  tealMetal: ['metal_plate', 1.6, false],
  container: ['container_side', 2.6, false],
  brick: ['brick_wall_10', 2.4, false],
  platten: ['concrete_tile_facade', 3.2, false],
};

/** Rescale a mesh's UVs to world metres / tile (BoxGeometry per face, PlaneGeometry in-plane). */
function worldUv(mesh, tile) {
  let g = mesh.geometry;
  if (!g?.attributes?.uv) return false;
  const p = g.parameters || {};
  const s = mesh.scale;
  const key = `${tile}|${s.x.toFixed(3)}|${s.y.toFixed(3)}|${s.z.toFixed(3)}`;
  if (g.userData.nwWorldUv === key) return true;
  if (g.userData.nwWorldUv) { g = g.clone(); mesh.geometry = g; }
  const uv = g.attributes.uv;
  if (g.type === 'BoxGeometry') {
    const w = p.width * s.x; const h = p.height * s.y; const d = p.depth * s.z;
    const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
    const done = new Uint8Array(uv.count);
    for (const grp of g.groups) {
      const [du, dv] = dims[grp.materialIndex] || [w, h];
      for (let i = grp.start; i < grp.start + grp.count; i++) {
        const vi = g.index ? g.index.getX(i) : i;
        if (done[vi]) continue;
        done[vi] = 1;
        uv.setXY(vi, uv.getX(vi) * du / tile, uv.getY(vi) * dv / tile);
      }
    }
  } else if (g.type === 'PlaneGeometry') {
    const w = p.width * s.x; const h = p.height * s.y;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w / tile, uv.getY(i) * h / tile);
  } else {
    return false;
  }
  uv.needsUpdate = true;
  g.userData.nwWorldUv = key;
  return true;
}

async function upgradeSurfaces(game, lib, profile) {
  const tex = game.textures;
  const byTex = new Map();
  for (const key of Object.keys(SURFACES)) if (tex[key]) byTex.set(tex[key], key);
  const meshes = [];
  game.scene.traverse((o) => {
    if (!o.isMesh || Array.isArray(o.material) || !o.material?.map) return;
    const key = byTex.get(o.material.map);
    if (key) meshes.push([o, key]);
  });
  const lite = profile.id === 'mobile';
  const sets = {};
  await Promise.all(Object.entries(SURFACES).map(async ([key, [id, , ground]]) => {
    const res = ground && (profile.pbr === '2k') ? '2k' : '1k';
    // AO is baked into the procedural lighting already; MOBILE walls get the photo albedo only
    sets[key] = await lib.pbr(id, res, lite && !ground ? ['diff'] : ['diff', 'nor_gl', 'rough']);
  }));
  // Hof courtyard: pavement instead of road asphalt
  const pave = await lib.pbr('concrete_pavement', profile.pbr === '2k' ? '2k' : '1k', ['diff', 'nor_gl', 'rough']);
  let n = 0;
  const seen = new Set();
  for (const [mesh, key] of meshes) {
    let set = sets[key];
    let tile = SURFACES[key][1];
    const hof = mesh.position.z > 96 && key === 'asphalt' && mesh.geometry.type === 'PlaneGeometry';
    if (hof && pave) { set = pave; tile = 3.0; }
    if (!set) continue;
    if (!worldUv(mesh, tile)) continue;
    const m = mesh.material;
    if (seen.has(m) && m.userData.nwSet !== set) {
      mesh.material = m.clone();
    }
    const mm = mesh.material;
    seen.add(mm);
    mm.userData.nwSet = set;
    mm.map = set.map;
    if (!lite || SURFACES[key][2]) {
      if (set.normalMap) { mm.normalMap = set.normalMap; mm.normalScale = new THREE.Vector2(1, 1); }
      if (set.roughnessMap && !mm.isMeshPhysicalMaterial) mm.roughnessMap = set.roughnessMap;
    }
    if (mm.isMeshPhysicalMaterial && mm.roughnessMap && mm.roughnessMap !== set.roughnessMap && mesh.geometry.type === 'PlaneGeometry') {
      // procedural wet-roughness breakup was tiled over the 0..1 UVs; keep its world scale
      const f = (mesh.geometry.parameters.width * mesh.scale.x) / tile;
      const r = mm.roughnessMap.clone();
      r.repeat.set(mm.roughnessMap.repeat.x / f, mm.roughnessMap.repeat.y / f);
      r.needsUpdate = true;
      mm.roughnessMap = r;
    }
    if (mm.isMeshPhysicalMaterial && set.normalMap) {
      // wet lanes keep their animated roughness; the photo normal adds the aggregate under the water film
      mm.normalScale = new THREE.Vector2(0.55, 0.55);
    }
    if (key === 'asphalt' && !mm.isMeshPhysicalMaterial) mm.color.set(0x8a8e94);
    mm.needsUpdate = true;
    n++;
  }
  return n;
}

/* ---------- props ---------- */

// [model, node (null = whole model), x, y, z, yaw, scale, zone, solid]
function placements(dens) {
  const P = [];
  const add = (id, node, x, y, z, yaw = 0, s = 1, zone, solid = false) => P.push({ id, node, x, y, z, yaw, s, zone, solid });
  const strip = SLABS.strip; const hof = SLABS.hof;
  const half = Math.PI / 2;
  // STRIP: furniture along both sidewalks (facades at x = ±18)
  [0, 24, 48, 72].forEach((z, i) => {
    const side = i % 2 ? 1 : -1;
    add('street_lamp_01', null, side * 13.6, 0, z + 6, side > 0 ? -half : half, 1, 'strip', true);
  });
  [[14, -1], [58, 1], [86, -1]].forEach(([z, sd]) => add('fire_hydrant', 'fire_hydrant_aged', sd * 14.8, 0, z, sd > 0 ? half : -half, 1, 'strip', true));
  [[27, -1], [66, 1], [44, 1]].forEach(([z, sd]) => add('metal_trash_can', 'metal_trash_can_rust', sd * 16.6, 0, z, sd > 0 ? -half : half, 0.9, 'strip', true));
  [[36, -1], [37.2, -1], [80, 1], [79, 1], [12, 1]].forEach(([z, sd], i) => add('trashbag', null, sd * (17.1 - (i % 2) * 0.5), 0, z, i * 1.3, 0.9 + (i % 3) * 0.08, 'strip'));
  [[10, -1, 'utility_box_01'], [46, 1, 'utility_box_02'], [61, -1, 'power_box_01']].forEach(([z, sd, id]) => add(id, null, sd * 17.75, 0, z, sd > 0 ? -half : half, 1, 'strip', true));
  add('korean_public_payphone_01', null, 17.7, 1.0, 34, -half, 1, 'strip');
  add('modular_street_seating', null, -14.9, 0, 41, half, 1, 'strip', true);
  add('WetFloorSign_01', null, -16.4, 0, 8.6, 0.4, 1, 'strip');
  add('concrete_road_barrier', null, -3.2, 0, -10, 0.1, 1, 'strip', true);
  add('concrete_road_barrier_02', null, 2.4, 0, -11, -0.15, 1, 'strip', true);
  add('concrete_road_barrier', null, 9, 0, 92, 0.05, 1, 'strip', true);
  // facade kit: fire escapes, AC units, shutters, cameras (street faces of the inner rows)
  [[30, -1], [74, 1]].forEach(([z, sd]) => add('modular_fire_escape', null, sd * 17.3, 0, z, sd > 0 ? -half : half, 1, 'strip'));
  [[8, -1, 4.6], [52, -1, 7.8], [19, 1, 5.2], [63, 1, 9.4], [41, 1, 6.4], [85, -1, 5.0]].forEach(([z, sd, y]) => add('exterior_aircon_unit', 'exterior_aircon_unit_rusted', sd * 17.82, y, z, sd > 0 ? -half : half, 0.62, 'strip'));
  [[13.3, -1], [57.3, 1], [79.3, -1]].forEach(([z, sd]) => add('rollershutter_door', 'rollershutter_door_graffiti', sd * 17.98, 0, z, sd > 0 ? -half : half, 0.82, 'strip'));
  [[2.5, -1], [50, 1]].forEach(([z, sd]) => add('security_camera_01', null, sd * 17.8, 3.6, z, sd > 0 ? -half - 0.6 : half + 0.6, 1, 'strip'));
  [[22, -1], [68, 1]].forEach(([z, sd]) => add('modular_industrial_pipes_01', null, sd * 17.85, 0.4, z, sd > 0 ? -half : half, 1.2, 'strip'));

  // DOCKS: yard clutter around the warehouse, containers and the quay
  const W = WAREHOUSE;
  add('portable_generator', null, W.x + 16, 0, W.z + 3.5, 0.6, 1, 'docks', true);
  add('hand_truck', null, W.x + 15.4, 0, W.z - 3.4, -0.4, 1, 'docks');
  add('propane_tank', null, W.x + 16.6, 0, W.z + 5, 0, 1, 'docks', true);
  add('propane_tank', null, W.x + 17.1, 0, W.z + 5.4, 0.7, 1, 'docks', true);
  add('security_light', null, W.x + 14.35, 5.6, W.z - 3, half, 1.4, 'docks');
  add('security_light', null, W.x - 3, 5.6, W.z - 11.35, Math.PI, 1.4, 'docks');
  add('industrial_wall_lamp', null, W.x + 14.3, 3.2, W.z + 3, half, 1.3, 'docks');
  add('modular_industrial_pipes_01', null, W.x + 14.3, 0.3, W.z + 8, half, 1.4, 'docks');
  add('modular_airduct_rectangular_01', 'modular_airduct_rectangular_01_single_01', W.x + 4, 8.7, W.z, 0, 1.3, 'docks');
  add('modular_airduct_rectangular_01', 'modular_airduct_rectangular_01_double_01', W.x - 6, 8.7, W.z + 4, half, 1.3, 'docks');
  [[-50, -78], [-47, -79], [-3, -80], [34, -79], [37, -78.4]].forEach(([x, z], i) => add(i % 2 ? 'barrel_03' : 'Barrel_01', null, x, 0, z, i, 1, 'docks', true));
  [[-41, -80], [-1, -81.5], [44, -80], [12, -48]].forEach(([x, z], i) => add('wooden_military_crate', null, x, 0, z, i * 0.8, 1, 'docks', true));
  [[-39.8, -80.4], [0.2, -82]].forEach(([x, z]) => add('wooden_military_crate', null, x, 0.46, z, 0.2, 1, 'docks'));
  [[14, -46], [15, -47.2], [-19, -38], [26, -60]].forEach(([x, z], i) => add(i % 2 ? 'plastic_crate_01' : 'wooden_crate_01', null, x, 0, z, i * 0.6, 1.2, 'docks', true));
  [[13, -44.6], [-18, -39.2], [27, -61.2]].forEach(([x, z], i) => add('cardboard_box_01', null, x, 0, z, i, 1.3, 'docks'));
  [[18, -36], [18.5, -36.4], [-24, -44]].forEach(([x, z], i) => add('old_tyre', null, x, 0.08 + i * 0.16, z, i * 0.9, 1, 'docks'));
  add('covered_car', null, 24, 0, -40, 0.35, 1, 'docks', true);
  add('metal_jerrycan', null, 17.2, 0, -37.5, 0.4, 1, 'docks');
  [-30, -10, 10, 30].forEach((x, i) => add(i % 2 ? 'concrete_road_barrier_02' : 'concrete_road_barrier', null, x, 0, -110.6, 0, 1, 'docks', true));
  [[-6, -30], [16, -56]].forEach(([x, z]) => add('water_manhole_cover', null, x, 0.005, z, 0, 1, 'docks'));
  add('street_lamp_01', null, 4, 0, -36, 0, 1, 'docks', true);
  add('street_lamp_01', null, -14, 0, -76, Math.PI, 1, 'docks', true);

  // HOF: courtyard furniture
  const hz = hof.z;
  [[-14, hz - 28], [8, hz - 6], [-10, hz + 18], [12, hz + 30]].forEach(([x, z], i) => add('street_lamp_02', null, x, 0, z, i * 1.1, 1.6, 'hof', true));
  [[4, hz - 22], [-12, hz + 4]].forEach(([x, z], i) => add('metal_trash_can', 'metal_trash_can', x, 0, z, i, 0.9, 'hof', true));
  [[4.6, hz - 21], [5.1, hz - 22.8], [-12.6, hz + 5.2]].forEach(([x, z], i) => add('trashbag', null, x, 0, z, i * 2, 1, 'hof'));
  [[-4, hz - 12], [10, hz + 12]].forEach(([x, z]) => add('water_manhole_cover', null, x, 0.005, z, 0, 1, 'hof'));
  add('modular_street_seating', null, 0, 0, hz + 8, 0, 1, 'hof', true);
  add('utility_box_01', null, -19, 0, hz - 34, half, 1, 'hof', true);
  add('old_tyre', null, 20, 0.08, hz - 30, 0, 1, 'hof');
  add('covered_car', null, 22, 0, hz - 22, -0.2, 1, 'hof', true);
  add('WetFloorSign_01', null, -8.5, 0, hz - 40, 0.8, 1, 'hof');
  void strip;
  // density: keep every prop on ULTRA/HIGH, thin the small clutter on MEDIUM / MOBILE
  return P.filter((p, i) => p.solid || dens >= 1 || ((i * 37) % 100) / 100 < dens);
}

function pickNode(scene, node) {
  if (!node) return scene;
  const n = scene.getObjectByName(node);
  if (!n) return scene;
  const g = new THREE.Group();
  const c = n.clone();
  c.position.set(0, 0, 0);
  c.quaternion.identity();
  g.add(c);
  return g;
}

async function placeProps(game, lib, profile) {
  const world = game.world;
  const list = placements(profile.props ?? 1);
  const ids = [...new Set(list.map((p) => p.id))];
  const models = new Map();
  await Promise.all(ids.map(async (id) => models.set(id, await lib.gltf(PH_MODEL(id)))));
  const shadows = (profile.shadow ?? 0) >= 1024;
  const box = new THREE.Box3();
  const proto = new Map();
  let n = 0;
  for (const p of list) {
    const gltf = models.get(p.id);
    if (!gltf) continue;
    const key = `${p.id}|${p.node}`;
    if (!proto.has(key)) {
      // normalise once: pivot at the bottom centre, wear the right orientation
      const src = pickNode(gltf.scene, p.node);
      const holder = new THREE.Group();
      holder.add(src);
      holder.updateMatrixWorld(true);
      box.setFromObject(src);
      const c = box.getCenter(new THREE.Vector3());
      src.position.x -= c.x; src.position.z -= c.z; src.position.y -= box.min.y;
      holder.traverse((o) => {
        if (!o.isMesh) return;
        o.castShadow = shadows;
        o.receiveShadow = true;
        if (o.material) o.material.envMapIntensity = 0.75;
      });
      proto.set(key, { holder, size: box.getSize(new THREE.Vector3()) });
    }
    const { holder, size } = proto.get(key);
    const obj = holder.clone();
    obj.position.set(p.x, p.y, p.z);
    obj.rotation.y = p.yaw;
    obj.scale.setScalar(p.s);
    obj.name = `prop-${p.id}`;
    world.add(obj, p.zone);
    if (p.solid && p.y < 0.2) {
      const c = Math.abs(Math.cos(p.yaw)); const s = Math.abs(Math.sin(p.yaw));
      const w = (size.x * c + size.z * s) * p.s; const d = (size.x * s + size.z * c) * p.s;
      world.collision.addBox(p.x, 0, p.z, Math.max(0.2, w * 0.9), size.y * p.s, Math.max(0.2, d * 0.9), 'solid');
    }
    n++;
  }
  return n;
}

/* ---------- HDRI ---------- */

async function applyHdri(game, lib, profile) {
  const env = await lib.hdri('neuer_zollhof', profile.hdri === '2k' ? '2k' : '1k');
  if (!env) return null;
  game.hdriEnv = env;
  // static environment (MEDIUM / MOBILE, and until the live probe has its first cube on ULTRA / HIGH)
  if (game.envProbe) game.envProbe.staticEnv = env;
  // The live probe (ULTRA / HIGH) already captures the lit street; there the HDRI only fills its sky.
  // Without it the photographed Zollhof lights are much brighter than this rainy district, so the
  // static IBL is dimmed or wet asphalt turns into a mirror (measured on the MOBILE smoke frame).
  if (!game.envProbe?.active) {
    game.scene.environment = env;
    game.scene.environmentIntensity = 0.32;
  }
  return env;
}

/**
 * @returns {Promise<{surfaces:number, props:number, hdri:boolean}>}
 */
export async function upgradeMap(game, lib, profile) {
  const [hdri, surfaces, props] = await Promise.all([
    applyHdri(game, lib, profile),
    upgradeSurfaces(game, lib, profile),
    placeProps(game, lib, profile),
  ]);
  return { surfaces, props, hdri: !!hdri };
}
