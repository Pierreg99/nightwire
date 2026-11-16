/**
 * NIGHTWIRE — procedural human (.mjs)
 * One Skeleton (19 bones) shared by a few SkinnedMeshes (skin / top / pants / shoes / extra),
 * built from sculpted primitives: a displaced head sphere with eye sockets, brow, nose, cheekbones,
 * lips, jaw and chin; ears; neck; lathe torso with chest and shoulders; tapered limbs with joint
 * blending (two-bone weights at every joint); hands with four two-segment fingers and a thumb;
 * shoes. Eyes (iris texture, clearcoat) and blinking lids ride on the head bone.
 * Skin: MeshPhysicalMaterial with sheen (soft, slightly red rim = subsurface look) + pore normals;
 * clothes: fabric normal map with weave and folds. MOBILE uses lighter meshes and Standard materials.
 */

import * as THREE from 'three';
import { fabricNormal, skinNormal, irisTexture, faceTexture } from './humanTextures.mjs';

const V = (x, y, z) => new THREE.Vector3(x, y, z);

// Rest-pose joint positions (metres, character faces +Z, left side is +X).
export const JOINTS = {
  hips: V(0, 0.95, 0), spine: V(0, 1.08, 0), chest: V(0, 1.27, 0), neck: V(0, 1.47, -0.005), head: V(0, 1.57, 0),
  clavL: V(0.03, 1.43, 0), armL: V(0.185, 1.415, -0.01), elbowL: V(0.215, 1.135, -0.03), wristL: V(0.235, 0.875, 0),
  thighL: V(0.093, 0.915, 0), kneeL: V(0.1, 0.5, 0.012), ankleL: V(0.105, 0.085, -0.02),
};
const mirror = (v) => V(-v.x, v.y, v.z);
['clav', 'arm', 'elbow', 'wrist', 'thigh', 'knee', 'ankle'].forEach((k) => { JOINTS[`${k}R`] = mirror(JOINTS[`${k}L`]); });

const BONES = [
  ['hips', null, 'hips'], ['spine', 'hips', 'spine'], ['chest', 'spine', 'chest'], ['neck', 'chest', 'neck'], ['head', 'neck', 'head'],
  ['clavL', 'chest', 'clavL'], ['upperArmL', 'clavL', 'armL'], ['foreArmL', 'upperArmL', 'elbowL'], ['handL', 'foreArmL', 'wristL'],
  ['clavR', 'chest', 'clavR'], ['upperArmR', 'clavR', 'armR'], ['foreArmR', 'upperArmR', 'elbowR'], ['handR', 'foreArmR', 'wristR'],
  ['thighL', 'hips', 'thighL'], ['shinL', 'thighL', 'kneeL'], ['footL', 'shinL', 'ankleL'],
  ['thighR', 'hips', 'thighR'], ['shinR', 'thighR', 'kneeR'], ['footR', 'shinR', 'ankleR'],
];
export const BONE_INDEX = Object.fromEntries(BONES.map(([n], i) => [n, i]));

const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

/* ---------- geometry accumulation ---------- */

class Accum {
  constructor() { this.pos = []; this.nrm = []; this.uv = []; this.si = []; this.sw = []; this.idx = []; }
  add(geo, weight) {
    const g = geo.index ? geo : geo;
    const p = g.attributes.position; const n = g.attributes.normal; const u = g.attributes.uv;
    const base = this.pos.length / 3;
    const v = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i);
      this.pos.push(v.x, v.y, v.z);
      this.nrm.push(n.getX(i), n.getY(i), n.getZ(i));
      this.uv.push(u ? u.getX(i) : 0, u ? u.getY(i) : 0);
      const w = weight(v);
      this.si.push(w[0], w[2] ?? 0, 0, 0);
      this.sw.push(w[1], w[3] ?? 0, 0, 0);
    }
    if (g.index) for (let i = 0; i < g.index.count; i++) this.idx.push(base + g.index.getX(i));
    else for (let i = 0; i < p.count; i++) this.idx.push(base + i);
    geo.dispose();
  }
  build() {
    if (!this.pos.length) return null;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nrm, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2));
    g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(this.si, 4));
    g.setAttribute('skinWeight', new THREE.Float32BufferAttribute(this.sw, 4));
    g.setIndex(this.idx);
    g.computeBoundingSphere();
    return g;
  }
}

const rigid = (b) => () => [BONE_INDEX[b], 1];
/** Blend from parent to child bone across a joint (two-bone weights). */
function joint(child, parent, J, dir, bl = 0.045) {
  const ci = BONE_INDEX[child]; const pi = BONE_INDEX[parent];
  const d = dir.clone().normalize();
  const tmp = new THREE.Vector3();
  return (v) => {
    const t = tmp.copy(v).sub(J).dot(d);
    const w = smooth(-bl, bl, t);
    return [ci, w, pi, 1 - w];
  };
}
function torsoWeight(v) {
  const y = v.y;
  if (y < 1.0) return [BONE_INDEX.hips, 1];
  if (y < 1.12) { const w = smooth(1.0, 1.12, y); return [BONE_INDEX.spine, w, BONE_INDEX.hips, 1 - w]; }
  if (y < 1.3) { const w = smooth(1.16, 1.3, y); return [BONE_INDEX.chest, w, BONE_INDEX.spine, 1 - w]; }
  const side = Math.abs(v.x);
  if (side > 0.13 && y > 1.33) {
    const w = smooth(0.13, 0.2, side) * 0.6;
    return [BONE_INDEX[v.x > 0 ? 'clavL' : 'clavR'], w, BONE_INDEX.chest, 1 - w];
  }
  return [BONE_INDEX.chest, 1];
}

/** Tapered tube from A to B (A = proximal). sx/sz squash the cross-section. */
function limb(A, B, rA, rB, radial, segs, sx = 1, sz = 1) {
  const len = A.distanceTo(B);
  const g = new THREE.CylinderGeometry(rA, rB, len, radial, segs, true);
  g.scale(sx, 1, sz);
  const q = new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), A.clone().sub(B).normalize());
  g.applyQuaternion(q);
  const m = A.clone().add(B).multiplyScalar(0.5);
  g.translate(m.x, m.y, m.z);
  return g;
}
function ball(c, r, w, h, sx = 1, sy = 1, sz = 1) {
  const g = new THREE.SphereGeometry(r, w, h);
  g.scale(sx, sy, sz);
  g.translate(c.x, c.y, c.z);
  return g;
}

/* ---------- head sculpt ---------- */

export const HEAD = { center: V(0, 1.66, 0.012), scale: V(0.083, 0.104, 0.097) };

function sculptHead(seg, face = {}, shell = 0) {
  const g = new THREE.SphereGeometry(1, seg, Math.round(seg * 0.75));
  const p = g.attributes.position;
  const nose = face.nose ?? 1; const jaw = face.jaw ?? 1; const cheek = face.cheek ?? 1;
  const gauss = (dx, dy, s) => Math.exp(-(dx * dx + dy * dy) / s);
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i); let y = p.getY(i); let z = p.getZ(i);
    const front = smooth(0.15, 0.75, z);
    let r = 1;
    if (z < 0.1) r += 0.07 * smooth(0.1, -0.8, z) * smooth(-0.3, 0.5, y); // occiput
    r -= 0.1 * (gauss(x - 0.37, y - 0.1, 0.02) + gauss(x + 0.37, y - 0.1, 0.02)) * front; // eye sockets
    r += 0.045 * gauss(x * 0.55, y - 0.3, 0.006) * front; // brow ridge
    const ridge = Math.exp(-(x * x) / 0.009) * smooth(0.2, -0.02, y) * smooth(-0.32, -0.1, y);
    r += 0.16 * nose * ridge * front; // nose bridge + dorsum
    r += 0.07 * nose * gauss(x, y + 0.2, 0.01) * front; // tip
    r += 0.04 * (gauss(x - 0.12, y + 0.26, 0.005) + gauss(x + 0.12, y + 0.26, 0.005)) * front; // alae
    r += 0.05 * cheek * (gauss(x - 0.55, y + 0.05, 0.03) + gauss(x + 0.55, y + 0.05, 0.03)) * front; // cheekbones
    r += 0.05 * gauss(x * 0.7, y + 0.43, 0.005) * front; // upper lip
    r -= 0.035 * gauss(x * 0.6, y + 0.49, 0.0012) * front; // mouth line
    r += 0.045 * gauss(x * 0.75, y + 0.55, 0.004) * front; // lower lip
    r -= 0.02 * gauss(x * 0.5, y + 0.66, 0.003) * front; // mentolabial fold
    r += 0.06 * jaw * gauss(x * 0.4, y + 0.8, 0.014) * front; // chin
    x *= r; y *= r; z *= r;
    // jaw taper + temples
    const lower = smooth(-0.1, -0.9, y);
    x *= 1 - 0.08 * lower * (2 - jaw) + 0.06 * Math.exp(-((y + 0.45) ** 2) / 0.03) * jaw; // taper + jaw angle
    z += 0.04 * lower * front;
    y *= 1 - 0.1 * lower; // shorter lower face
    if (z > 0.5) z = 0.5 + (z - 0.5) * 0.9; // flatter face plane
    x *= 1 - 0.05 * smooth(0.25, 0.6, y);
    y *= 1 + 0.04 * smooth(0.5, 1.0, y);
    p.setXYZ(i, x, y, z);
  }
  if (shell > 0) {
    // hair: the same skull pushed out a few mm, only the triangles above the hairline / at the back
    const keep = [];
    const idx = g.index.array;
    const pos = g.attributes.position;
    for (let i = 0; i < idx.length; i += 3) {
      let ok = true;
      for (let k = 0; k < 3; k++) {
        const j = idx[i + k];
        const y = pos.getY(j); const z = pos.getZ(j); const x = pos.getX(j);
        const hairline = z > 0.2 ? 0.4 + 0.12 * Math.abs(x) : z > -0.3 ? 0.05 : -0.42;
        if (y < hairline || (Math.abs(x) > 0.82 && y < 0.25 && z > -0.4)) ok = false;
      }
      if (ok) keep.push(idx[i], idx[i + 1], idx[i + 2]);
    }
    g.setIndex(keep);
    for (let i = 0; i < pos.count; i++) pos.setXYZ(i, pos.getX(i) * (1 + shell), pos.getY(i) * (1 + shell * 1.3), pos.getZ(i) * (1 + shell));
  }
  g.computeVertexNormals();
  g.scale(HEAD.scale.x, HEAD.scale.y, HEAD.scale.z);
  g.translate(HEAD.center.x, HEAD.center.y, HEAD.center.z);
  return g;
}

/* ---------- hands ---------- */

/**
 * Hand hanging along -Y from the wrist at the origin, palm facing -X (left hand; mirrored for right).
 * curl 0 = relaxed, 1 = fist / grip. Returns geometries in hand-bone space.
 */
export function handGeometries(curl = 0.25, detail = 8, side = 1) {
  const out = [];
  const palm = new THREE.SphereGeometry(1, detail + 2, detail);
  palm.scale(0.017, 0.048, 0.041);
  palm.translate(0, -0.05, 0.004);
  out.push(palm);
  const fingers = [[0.026, 0.047, 0.0085], [0.009, 0.052, 0.0088], [-0.009, 0.049, 0.0084], [-0.025, 0.04, 0.0075]];
  fingers.forEach(([z, len, r], i) => {
    let base = V(-0.002, -0.094, z);
    let dir = V(0, -1, 0);
    const bend = (0.35 + curl * 0.95) * (1 + i * 0.06);
    const parts = [len * 0.55, len * 0.45];
    parts.forEach((l, k) => {
      dir.applyAxisAngle(V(0, 0, 1), -bend * (k === 0 ? 0.6 : 1)); // curls toward the palm (-X)
      const tip = base.clone().addScaledVector(dir, l);
      out.push(limb(base, tip, r * (k ? 0.92 : 1), r * (k ? 0.8 : 0.95), detail, 1));
      out.push(ball(tip, r * (k ? 0.8 : 0.92), detail, Math.max(4, detail - 2)));
      base = tip;
    });
    out.push(ball(V(-0.002, -0.094, z), r * 1.05, detail, Math.max(4, detail - 2))); // knuckle
  });
  // thumb: from the heel of the palm, forward (+Z) and toward the palm
  const t0 = V(-0.008, -0.03, 0.03);
  const t1 = t0.clone().add(V(-0.012 - curl * 0.012, -0.026, 0.02));
  const t2 = t1.clone().add(V(-0.012 - curl * 0.016, -0.022, 0.008 - curl * 0.012));
  out.push(limb(t0, t1, 0.011, 0.0098, detail, 1), ball(t1, 0.0098, detail, 6), limb(t1, t2, 0.0095, 0.0082, detail, 1), ball(t2, 0.0082, detail, 6));
  if (side < 0) out.forEach((g) => { g.scale(-1, 1, 1); flipWinding(g); });
  return out;
}
/** Lathe profiles are listed bottom→top for correct winding, which leaves LatheGeometry's analytic normals pointing inward. */
function outwardLathe(points, segs) {
  const g = new THREE.LatheGeometry(points, segs);
  const n = g.attributes.normal.array;
  for (let i = 0; i < n.length; i++) n[i] = -n[i];
  return g;
}
function flipWinding(g) {
  if (!g.index) return;
  const a = g.index.array;
  for (let i = 0; i < a.length; i += 3) { const t = a[i + 1]; a[i + 1] = a[i + 2]; a[i + 2] = t; }
  g.index.needsUpdate = true;
  const n = g.attributes.normal;
  for (let i = 0; i < n.count; i++) n.setX(i, -n.getX(i));
}

/* ---------- materials ---------- */

const matCache = new Map();
export function skinMaterial(color, cheap) {
  const key = `skin${color}${cheap ? 1 : 0}`;
  if (matCache.has(key)) return matCache.get(key);
  const c = new THREE.Color(color);
  const m = cheap
    ? new THREE.MeshStandardMaterial({ color: c, roughness: 0.55, metalness: 0 })
    : new THREE.MeshPhysicalMaterial({
      color: c, roughness: 0.5, metalness: 0,
      normalMap: skinNormal(), normalScale: new THREE.Vector2(0.35, 0.35),
      sheen: 0.55, sheenRoughness: 0.55, sheenColor: new THREE.Color(0.85, 0.32, 0.26),
      clearcoat: 0.06, clearcoatRoughness: 0.5,
    });
  matCache.set(key, m);
  return m;
}
export function faceMaterial(o, cheap) {
  const hairHex = `#${new THREE.Color(o.hairColor ?? 0x15110e).getHexString()}`;
  const map = faceTexture({ brow: hairHex, hair: hairHex, buzz: o.hair === 'buzz', stubble: o.stubble ?? 0, seed: o.seed ?? 1 });
  const key = `face${o.skin}${map.uuid}${cheap ? 1 : 0}`;
  if (matCache.has(key)) return matCache.get(key);
  const base = skinMaterial(o.skin ?? 0x8a6450, cheap);
  const m = base.clone();
  m.map = map;
  matCache.set(key, m);
  return m;
}

export function clothMaterial(color, cheap, opts = {}) {
  const key = `cloth${color}${cheap ? 1 : 0}${JSON.stringify(opts)}`;
  if (matCache.has(key)) return matCache.get(key);
  const base = {
    color: new THREE.Color(color), roughness: opts.roughness ?? 0.82, metalness: opts.metalness ?? 0.02,
    normalMap: fabricNormal(), normalScale: new THREE.Vector2(opts.fold ?? 0.6, opts.fold ?? 0.6),
  };
  if (opts.emissive != null) { base.emissive = new THREE.Color(opts.emissive); base.emissiveIntensity = opts.emissiveIntensity ?? 0.2; }
  const m = cheap ? new THREE.MeshStandardMaterial(base)
    : new THREE.MeshPhysicalMaterial({ ...base, sheen: opts.leather ? 0 : 0.4, sheenRoughness: 0.8, sheenColor: new THREE.Color(color).multiplyScalar(1.6), clearcoat: opts.leather ? 0.35 : 0, clearcoatRoughness: 0.45 });
  matCache.set(key, m);
  return m;
}

/* ---------- body ---------- */

/**
 * @param {object} o  { skin, top, pants, shoes, accent, hair, eyes, build, height, hood, vest, cheap, face }
 * @returns {{ root, bones, skeleton, head, meshes, mats, lidL, lidR, eyeL, eyeR, handR }}
 */
export function makeHuman(o = {}) {
  const cheap = !!o.cheap;
  const radial = cheap ? 8 : 14;
  const segs = cheap ? 2 : 4;
  const build = o.build ?? 1;
  const root = new THREE.Group();
  root.name = 'human';

  // bones
  const bones = []; const byName = {};
  for (const [name, parent, j] of BONES) {
    const b = new THREE.Bone();
    b.name = name;
    const pos = JOINTS[j];
    if (parent) { b.position.copy(pos).sub(JOINTS[BONES.find((x) => x[0] === parent)[2]]); byName[parent].add(b); } else { b.position.copy(pos); root.add(b); }
    byName[name] = b; bones.push(b);
  }
  root.updateMatrixWorld(true);
  const skeleton = new THREE.Skeleton(bones);

  const acc = { skin: new Accum(), top: new Accum(), pants: new Accum(), shoes: new Accum(), extra: new Accum(), hair: new Accum(), face: new Accum() };
  const J = JOINTS;

  // head + neck + ears
  acc.face.add(sculptHead(cheap ? 22 : 40, o.face), rigid('head'));
  acc.skin.add(limb(V(0, 1.6, -0.012), V(0, 1.45, -0.012), 0.054, 0.062 * build, radial, segs), joint('head', 'neck', J.head, V(0, 1, 0), 0.03));
  for (const s of [1, -1]) {
    const ear = new THREE.SphereGeometry(1, cheap ? 6 : 10, cheap ? 5 : 8);
    ear.scale(0.011, 0.029, 0.02);
    ear.rotateY(s * 0.35);
    ear.translate(s * 0.083, 1.655, -0.004);
    acc.skin.add(ear, rigid('head'));
  }

  // torso (lathe), squashed front-to-back, broad at the shoulders
  const prof = [[0.05, 1.5], [0.12, 1.465], [0.168, 1.42], [0.172, 1.36], [0.165, 1.27], [0.15, 1.17], [0.137, 1.07], [0.145, 0.99], [0.158, 0.93]]
    .map(([r, y]) => new THREE.Vector2(r * build, y)).reverse();
  const torso = outwardLathe(prof, radial + 4);
  const tp = torso.attributes.position;
  for (let i = 0; i < tp.count; i++) {
    const y = tp.getY(i); const z = tp.getZ(i); const x = tp.getX(i);
    const chestFwd = z > 0 ? 1 + 0.12 * smooth(1.15, 1.32, y) * smooth(1.44, 1.32, y) : 1;
    tp.setXYZ(i, x * 1.1, y, z * 0.66 * chestFwd - 0.005);
  }
  torso.computeVertexNormals();
  acc.top.add(torso, torsoWeight);

  // pelvis / pants top
  const pelvisProf = [[0.159, 0.96], [0.162, 0.9], [0.15, 0.84], [0.11, 0.8]].map(([r, y]) => new THREE.Vector2(r * build, y)).reverse();
  const pelvis = outwardLathe(pelvisProf, radial + 4);
  pelvis.scale(1.08, 1, 0.72);
  acc.pants.add(pelvis, rigid('hips'));

  for (const s of ['L', 'R']) {
    const sg = s === 'L' ? 1 : -1;
    // shoulder cap + sleeves
    acc.top.add(ball(J[`arm${s}`].clone().add(V(-sg * 0.008, -0.01, 0)), 0.058 * build, radial, Math.max(6, radial - 4), 1, 0.95, 0.9), joint(`upperArm${s}`, `clav${s}`, J[`arm${s}`], V(sg, -0.4, 0), 0.04));
    acc.top.add(limb(J[`arm${s}`], J[`elbow${s}`], 0.052 * build, 0.043, radial, segs, 1, 0.95), joint(`upperArm${s}`, `clav${s}`, J[`arm${s}`], V(0, -1, 0), 0.05));
    acc.top.add(ball(J[`elbow${s}`], 0.043, radial, Math.max(6, radial - 4)), joint(`foreArm${s}`, `upperArm${s}`, J[`elbow${s}`], V(0, -1, 0), 0.03));
    acc.top.add(limb(J[`elbow${s}`], J[`wrist${s}`].clone().add(V(0, 0.035, 0)), 0.042, 0.034, radial, segs, 1, 0.9), joint(`foreArm${s}`, `upperArm${s}`, J[`elbow${s}`], V(0, -1, 0), 0.03));
    // cuff + wrist skin
    acc.skin.add(limb(J[`wrist${s}`].clone().add(V(0, 0.04, 0)), J[`wrist${s}`].clone().add(V(0, -0.01, 0)), 0.027, 0.025, radial, 1, 1, 0.75), joint(`hand${s}`, `foreArm${s}`, J[`wrist${s}`], V(0, -1, 0), 0.015));
    // hand
    handGeometries(0.3, cheap ? 5 : 8, sg).forEach((g) => {
      g.translate(J[`wrist${s}`].x, J[`wrist${s}`].y, J[`wrist${s}`].z);
      acc.skin.add(g, rigid(`hand${s}`));
    });
    // legs
    acc.pants.add(limb(J[`thigh${s}`].clone().add(V(0, 0.03, 0)), J[`knee${s}`], 0.083 * build, 0.056, radial, segs, 1, 0.95), joint(`thigh${s}`, 'hips', J[`thigh${s}`], V(0, -1, 0), 0.06));
    acc.pants.add(ball(J[`knee${s}`], 0.056, radial, Math.max(6, radial - 4), 1, 1, 0.95), joint(`shin${s}`, `thigh${s}`, J[`knee${s}`], V(0, -1, 0), 0.03));
    acc.pants.add(limb(J[`knee${s}`], J[`ankle${s}`].clone().add(V(0, 0.04, 0)), 0.054, 0.04, radial, segs, 1, 1.05), joint(`shin${s}`, `thigh${s}`, J[`knee${s}`], V(0, -1, 0), 0.03));
    // shoe: rounded upper + sole
    const a = J[`ankle${s}`];
    acc.shoes.add(ball(a.clone().add(V(0, -0.02, 0.055)), 1, radial, Math.max(6, radial - 4), 0.048, 0.045, 0.125), joint(`foot${s}`, `shin${s}`, a, V(0, -1, 0), 0.02));
    const sole = new THREE.BoxGeometry(0.092, 0.025, 0.27, 1, 1, 2);
    sole.translate(a.x, 0.012, a.z + 0.06);
    acc.shoes.add(sole, rigid(`foot${s}`));
  }

  // trapezius slope: shoulders rise into the neck (without it the neck reads like a pole)
  acc.top.add(limb(V(0, 1.415, -0.018), V(0, 1.5, -0.022), 0.15 * build, 0.066, radial, 2, 1, 0.62), joint('neck', 'chest', J.neck, V(0, 1, 0), 0.04));
  // clothing extras
  if (o.hood) {
    const hood = new THREE.TorusGeometry(0.1, 0.035, radial > 8 ? 8 : 5, radial + 4, Math.PI * 1.25);
    hood.rotateX(Math.PI / 2 - 0.15);
    hood.rotateZ(-Math.PI * 0.125 - Math.PI / 2);
    hood.translate(0, 1.47, -0.035);
    acc.top.add(hood, rigid('chest'));
  } else {
    // stand-up jacket collar around the lower neck
    acc.top.add(limb(V(0, 1.45, -0.012), V(0, 1.53, -0.016), 0.082, 0.068, radial, 2, 1, 0.92), joint('neck', 'chest', J.neck, V(0, 1, 0), 0.03));
  }
  if (o.vest) {
    const vp = [[0.15, 1.43], [0.178, 1.36], [0.172, 1.25], [0.158, 1.12], [0.148, 1.04]].map(([r, y]) => new THREE.Vector2(r * build + 0.012, y)).reverse();
    const vest = outwardLathe(vp, radial + 4);
    vest.scale(1.1, 1, 0.72);
    acc.extra.add(vest, torsoWeight);
  }
  // hair: a shell of the sculpted skull (short); buzz cuts are painted into the face map instead
  if (o.hair === 'short' || o.hair === 'long') {
    acc.hair.add(sculptHead(cheap ? 18 : 32, o.face, o.hair === 'long' ? 0.075 : 0.05), rigid('head'));
  }

  const mats = {
    skin: skinMaterial(o.skin ?? 0x8a6450, cheap),
    top: clothMaterial(o.top ?? 0x2a2e34, cheap, { leather: o.leather, fold: 0.7 }),
    pants: clothMaterial(o.pants ?? 0x1e2024, cheap, { fold: 0.5 }),
    shoes: clothMaterial(o.shoes ?? 0x0c0d0f, cheap, { roughness: 0.45, leather: true, fold: 0.2 }),
    extra: clothMaterial(new THREE.Color(o.accent ?? 0x3ee0ff).lerp(new THREE.Color(0x14171b), 0.96).getHex(), cheap, { roughness: 0.6, emissive: o.accent ?? 0x3ee0ff, emissiveIntensity: 0.035, fold: 0.4 }),
    hair: clothMaterial(o.hairColor ?? 0x15110e, cheap, { roughness: 0.72, fold: 1.4 }),
    face: faceMaterial(o, cheap),
  };
  const meshes = {};
  for (const k of Object.keys(acc)) {
    const geo = acc[k].build();
    if (!geo) continue;
    const m = new THREE.SkinnedMesh(geo, mats[k]);
    m.name = `body-${k}`;
    m.castShadow = true;
    m.receiveShadow = !cheap;
    m.bind(skeleton);
    root.add(m);
    meshes[k] = m;
  }

  // eyes + lids on the head bone
  const head = byName.head;
  const eyeMat = new THREE.MeshPhysicalMaterial({ map: irisTexture(o.eyes ?? '#4a3420'), color: 0xc4b8ac, roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.03 });
  const lidMat = mats.skin;
  const eyeGeo = new THREE.SphereGeometry(0.0122, cheap ? 10 : 18, cheap ? 8 : 14);
  const lidGeo = new THREE.SphereGeometry(0.0131, cheap ? 10 : 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.5);
  const res = { root, bones: byName, skeleton, head, meshes, mats };
  for (const s of [1, -1]) {
    const c = V(s * 0.0292, HEAD.center.y + 0.0108, HEAD.center.z + 0.068).sub(J.head);
    const eye = new THREE.Mesh(eyeGeo, eyeMat);
    eye.position.copy(c);
    const lid = new THREE.Mesh(lidGeo, lidMat);
    lid.position.copy(c);
    lid.rotation.x = -0.95; // open: the cap sits back over the top of the eyeball
    const lower = new THREE.Mesh(lidGeo, lidMat);
    lower.position.copy(c);
    lower.rotation.x = Math.PI + 0.75;
    head.add(eye, lid, lower);
    eye.castShadow = false;
    if (s > 0) { res.eyeL = eye; res.lidL = lid; } else { res.eyeR = eye; res.lidR = lid; }
  }
  res.handR = byName.handR;
  res.handL = byName.handL;
  root.userData.human = res;
  return res;
}
