/**
 * NIGHTWIRE — asset humans (.mjs)
 * Realistic characters from public/assets/thirdparty: MakeHuman/MPFB bodies (CC0 skins, eyes, brows,
 * lashes, hair cards, clothes with normal maps) and the UAL mannequin as a security android, all on
 * UE-style rigs with the same 21 retargeted Quaternius UAL clips (CC0, see docs/ASSET-LICENSES.md).
 *
 *  loadHumanTemplates(lib, names, lod)  -> Map name -> template (materials tuned once, clips split)
 *  createAssetHuman(template, opts)     -> { root, bones, sockets, meshes, mixer, asset: true }
 *  ClipAnimator                         -> same interface as HumanAnimator (speed, aim, lookTarget,
 *                                          hitReact, die, update) on AnimationMixer layers:
 *                                          locomotion (idle/walk/jog/sprint phase-synced, lower+upper),
 *                                          aim upper-body layer, one-shot hit reactions, death clip
 *                                          rotated so the body falls along the shot, head look-at.
 *  bakeHandGeometry(template, side)     -> static hand + sleeve geometry in the FPArms hand frame.
 *
 * Skin: MeshPhysicalMaterial with a wrap-lighting diffuse term (red light bleeds further into the
 * terminator: a cheap subsurface-scattering approximation), sheen rim, pore normals. LOD templates
 * (MEDIUM / MOBILE) use decimated meshes, 1K textures and MeshStandardMaterial.
 */

import * as THREE from 'three';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import { skinNormal } from './humanTextures.mjs';
import { ASSET_ROOT } from '../assets/AssetLibrary.mjs';

export const HUMAN_SETS = {
  civil: ['civil_m_jacket', 'civil_f_elegant', 'civil_m_tee', 'civil_f_sport'],
  crew: ['crew_worker'],
  security: ['security_suit', 'android'],
  street: ['street_plaid', 'civil_m_jacket'],
};
export const ALL_HUMANS = [...new Set(Object.values(HUMAN_SETS).flat()), 'player'];

export function humanUrl(name, lod) {
  if (name === 'android') return `${ASSET_ROOT}quaternius/android.glb`;
  return `${ASSET_ROOT}makehuman/${name}${lod ? '_lod' : ''}.glb`;
}

const UPPER = /^(spine_0[123]|neck_01|head|Head|clavicle_|upperarm_|lowerarm_|hand_|thumb_|index_|middle_|ring_|pinky_)/;
const boneOfTrack = (t) => t.name.split('.')[0];

function splitClip(clip, upper) {
  const c = clip.clone();
  c.name = `${clip.name}_${upper ? 'up' : 'low'}`;
  c.tracks = c.tracks.filter((t) => UPPER.test(boneOfTrack(t)) === upper);
  return c;
}

/* ---------- materials ---------- */

const SKIN_WRAP = THREE.ShaderChunk.lights_physical_pars_fragment.replace(
  'reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );',
  `float nwNL = dot( geometryNormal, directLight.direction );
	vec3 nwWrap = vec3( saturate( ( nwNL + 0.45 ) / 1.45 ), saturate( ( nwNL + 0.24 ) / 1.24 ), saturate( ( nwNL + 0.18 ) / 1.18 ) );
	reflectedLight.directDiffuse += nwWrap * directLight.color * BRDF_Lambert( material.diffuseColor );`,
);

function skinMat(src, cheap, env) {
  if (cheap) {
    return new THREE.MeshStandardMaterial({ map: src.map, roughness: 0.55, metalness: 0, envMap: env || null, envMapIntensity: 0.6 });
  }
  const pores = skinNormal().clone();
  pores.wrapS = pores.wrapT = THREE.RepeatWrapping;
  pores.repeat.set(14, 14);
  const m = new THREE.MeshPhysicalMaterial({
    map: src.map, roughness: 0.5, metalness: 0,
    normalMap: pores, normalScale: new THREE.Vector2(0.12, 0.12),
    sheen: 0.42, sheenRoughness: 0.5, sheenColor: new THREE.Color(0.75, 0.3, 0.24),
    clearcoat: 0.08, clearcoatRoughness: 0.45, specularIntensity: 0.55,
    envMap: env || null, envMapIntensity: 0.55,
  });
  if (SKIN_WRAP !== THREE.ShaderChunk.lights_physical_pars_fragment) {
    m.onBeforeCompile = (shader) => {
      shader.fragmentShader = shader.fragmentShader.replace('#include <lights_physical_pars_fragment>', SKIN_WRAP);
    };
    m.customProgramCacheKey = () => 'nw-skin-wrap';
  }
  return m;
}

function tuneMaterials(scene, name, cheap, env, robot) {
  const out = { skin: null, cloth: [], hair: [], eyes: null, robot: [] };
  const done = new Map();
  scene.traverse((o) => {
    if (!o.isMesh) return;
    const src = o.material;
    if (done.has(src)) { o.material = done.get(src); return; }
    const n = (o.name + ' ' + (src.name || '')).toLowerCase();
    let m;
    if (robot) {
      const joint = /joint/.test(n);
      m = new THREE.MeshPhysicalMaterial({
        color: joint ? 0x101214 : 0x2c323a, metalness: joint ? 0.35 : 0.82, roughness: joint ? 0.55 : 0.32,
        clearcoat: joint ? 0 : 0.6, clearcoatRoughness: 0.18, envMap: env || null, envMapIntensity: 1.1,
      });
      m.userData.robotPart = joint ? 'joint' : 'shell';
      out.robot.push(m);
    } else if (/(^| )base|skin/.test(n) && !/teeth/.test(n)) {
      m = skinMat(src, cheap, env);
      out.skin = m;
    } else if (/high-poly|eye(?!brow|lash)/.test(n)) {
      m = new THREE.MeshPhysicalMaterial({
        map: src.map, roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.02, alphaTest: 0.35,
        envMap: env || null, envMapIntensity: 0.9,
      });
      out.eyes = m;
    } else if (/eyebrow|eyelash|short|long|bob|ponytail|afro|braid|hair/.test(n)) {
      const Mat = cheap ? THREE.MeshStandardMaterial : THREE.MeshPhysicalMaterial;
      m = new Mat({
        map: src.map, normalMap: src.normalMap || null, alphaTest: /eyelash/.test(n) ? 0.25 : 0.42,
        side: THREE.DoubleSide, roughness: 0.62, metalness: 0, envMap: env || null, envMapIntensity: 0.22,
        // a faint warm sheen for strand highlights; stronger values grey out dark hair at night
        ...(cheap ? {} : { sheen: 0.25, sheenRoughness: 0.4, sheenColor: new THREE.Color(0.2, 0.16, 0.12) }),
      });
      out.hair.push(m);
    } else if (/teeth/.test(n)) {
      m = new THREE.MeshStandardMaterial({ map: src.map, roughness: 0.35, color: 0xd8d0c4 });
    } else {
      const Mat = cheap ? THREE.MeshStandardMaterial : THREE.MeshPhysicalMaterial;
      m = new Mat({
        map: src.map, normalMap: src.normalMap || null, normalScale: new THREE.Vector2(1, 1),
        roughness: 0.82, metalness: 0.02, envMap: env || null, envMapIntensity: 0.3,
        ...(cheap ? {} : { sheen: 0.35, sheenRoughness: 0.75, sheenColor: new THREE.Color(0.22, 0.24, 0.27) }),
      });
      out.cloth.push(m);
    }
    m.name = src.name;
    done.set(src, m);
    src.dispose();
    o.material = m;
  });
  return out;
}

/* ---------- templates ---------- */

function measure(scene) {
  scene.updateMatrixWorld(true);
  const bone = (n) => scene.getObjectByName(n);
  const wp = (n) => bone(n)?.getWorldPosition(new THREE.Vector3());
  let eyes = null;
  scene.traverse((o) => {
    if (!eyes && o.isMesh && /high-poly/.test(o.name)) {
      // meshopt quantises skinned positions (the dequantisation lives in the inverse bind matrices),
      // so the bounds must come from the skinned vertices, not from the raw attribute
      let box;
      if (o.isSkinnedMesh) { o.skeleton.update(); o.computeBoundingBox(); box = o.boundingBox; } else { o.geometry.computeBoundingBox(); box = o.geometry.boundingBox; }
      eyes = box.getCenter(new THREE.Vector3()).applyMatrix4(o.matrixWorld);
    }
  });
  const head = wp('head') || wp('Head');
  if (!eyes && head) eyes = head.clone().add(new THREE.Vector3(0, 0.07, 0.08));
  return { eyes, head };
}

/** Root-local fall direction of the death clip (where the head ends up), for shot-aligned falls. */
function deathDirection(scene, clip) {
  if (!clip) return new THREE.Vector2(0, -1);
  const clone = SkeletonUtils.clone(scene);
  const mixer = new THREE.AnimationMixer(clone);
  const a = mixer.clipAction(clip);
  a.play();
  mixer.setTime(clip.duration * 0.999);
  clone.updateMatrixWorld(true);
  const h = (clone.getObjectByName('head') || clone.getObjectByName('Head')).getWorldPosition(new THREE.Vector3());
  mixer.stopAllAction();
  const v = new THREE.Vector2(h.x, h.z);
  return v.lengthSq() > 1e-4 ? v.normalize() : new THREE.Vector2(0, -1);
}

export async function loadHumanTemplates(lib, names, { lod = false, env = null } = {}) {
  const map = new Map();
  await Promise.all(names.map(async (name) => {
    const robot = name === 'android';
    const gltf = await lib.gltf(humanUrl(name, lod && !robot));
    if (!gltf) return;
    const scene = gltf.scene;
    const cheap = lod;
    const mats = tuneMaterials(scene, name, cheap, env, robot);
    // Culling bounds from the skinned rest pose (raw positions are meshopt-quantised), padded for
    // animation (lying down, arms out); stored as plain numbers so clones inherit them via userData.
    scene.updateMatrixWorld(true);
    scene.traverse((m) => {
      if (!m.isSkinnedMesh) return;
      m.skeleton.update();
      m.computeBoundingSphere();
      const b = m.boundingSphere;
      m.userData.nwSphere = [b.center.x, b.center.y, b.center.z, b.radius + 0.9];
    });
    if (robot) {
      const metal = await lib.pbr('metal_plate', lod ? '1k' : '2k', ['nor_gl', 'rough']);
      if (metal) {
        for (const m of mats.robot) {
          if (m.userData.robotPart !== 'shell') continue;
          m.normalMap = metal.normalMap?.clone() || null;
          m.roughnessMap = metal.roughnessMap?.clone() || null;
          for (const t of [m.normalMap, m.roughnessMap]) if (t) { t.repeat.set(3, 3); t.needsUpdate = true; }
          m.normalScale = new THREE.Vector2(0.35, 0.35);
          m.needsUpdate = true;
        }
      }
    }
    const clips = Object.fromEntries(gltf.animations.map((c) => [c.name, c]));
    const split = {};
    for (const k of ['idle', 'idle_talk', 'idle_phone', 'idle_fold', 'walk', 'jog', 'sprint', 'pistol_idle']) {
      if (clips[k]) split[k] = { up: splitClip(clips[k], true), low: splitClip(clips[k], false) };
    }
    const upperOnly = {};
    for (const k of ['aim', 'aim_up', 'aim_down', 'shoot', 'reload']) if (clips[k]) upperOnly[k] = splitClip(clips[k], true);
    map.set(name, {
      name, robot, lod, scene, clips, split, upperOnly, mats, measure: measure(scene),
      fall: deathDirection(scene, clips.death),
    });
  }));
  return map;
}

/* ---------- instances ---------- */

function frameFromHand(scene, side) {
  const s = side === 'r' ? '_r' : '_l';
  const g = (n) => scene.getObjectByName(n).getWorldPosition(new THREE.Vector3());
  const wrist = g(`hand${s}`);
  const finger = g(`middle_01${s}`).sub(wrist).normalize();
  const thumb = g(`thumb_01${s}`).sub(wrist);
  thumb.addScaledVector(finger, -thumb.dot(finger)).normalize();
  const y = finger.clone().negate();
  const z = thumb;
  const x = new THREE.Vector3().crossVectors(y, z);
  const q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z));
  return { wrist, q, finger, thumb };
}

function socket(bone, worldPos, worldQuat) {
  const s = new THREE.Object3D();
  s.name = `socket-${bone.name}`;
  bone.updateMatrixWorld(true);
  const bq = bone.getWorldQuaternion(new THREE.Quaternion());
  s.quaternion.copy(bq).invert().multiply(worldQuat);
  s.position.copy(bone.worldToLocal(worldPos.clone()));
  bone.add(s);
  return s;
}

/**
 * @param template from loadHumanTemplates
 * @param o { tint: { top, pants } (hex, multiplies the cloth textures), seed }
 */
export function createAssetHuman(template, o = {}) {
  const inner = SkeletonUtils.clone(template.scene);
  const root = new THREE.Group();
  root.name = 'human';
  root.add(inner);
  root.userData.asset = template.name;
  const meshes = {};
  inner.traverse((m) => {
    if (!m.isMesh) return;
    m.castShadow = true;
    m.receiveShadow = !template.lod;
    meshes[m.name] = m;
    if (o.tint && template.mats.cloth.includes(m.material)) {
      m.material = m.material.clone();
      m.material.color.set(o.tint);
    }
    if (m.isSkinnedMesh) {
      // bind-pose bounds + headroom for animation (lying down, arms out): no popping at the frustum edge
      // padded rest-pose sphere from the template (the geometry is shared and quantised)
      const b = m.userData.nwSphere;
      if (b) m.boundingSphere = new THREE.Sphere(new THREE.Vector3(b[0], b[1], b[2]), b[3]);
    }
  });
  const find = (...names) => names.map((n) => inner.getObjectByName(n)).find(Boolean);
  const bones = {
    root: find('Root', 'root'), hips: find('pelvis'), spine: find('spine_01'), chest: find('spine_03'),
    neck: find('neck_01'), head: find('head', 'Head'), handR: find('hand_r'), handL: find('hand_l'),
  };
  inner.updateMatrixWorld(true);
  // Sockets in the procedural rig's frames so NPC attachments (helmet, gun) keep their offsets.
  const eye = template.measure.eyes;
  const sockets = {};
  if (bones.head && eye) sockets.head = socket(bones.head, eye.clone().add(new THREE.Vector3(0, -0.101, -0.08)), new THREE.Quaternion());
  if (bones.handR) {
    const f = frameFromHand(inner, 'r');
    sockets.handR = socket(bones.handR, f.wrist, f.q);
  }
  const mixer = new THREE.AnimationMixer(inner);
  return { root, inner, bones, sockets, meshes, mixer, template, asset: true, robot: template.robot };
}

/* ---------- animator ---------- */

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const _v = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _q2 = new THREE.Quaternion();
const _m = new THREE.Matrix4();
const AX_Y = new THREE.Vector3(0, 1, 0);
const AX_X = new THREE.Vector3(1, 0, 0);
// locomotion anchors: [speed m/s at which the clip plays at 1x, clip]
const GAITS = [['walk', 1.35], ['jog', 3.2], ['sprint', 5.4]];

export class ClipAnimator {
  /**
   * @param human from createAssetHuman
   * @param seed  phase / idle variety
   * @param idle  'idle' | 'idle_talk' | 'idle_phone' | 'idle_fold'
   */
  constructor(human, seed = Math.random() * 100, idle = 'idle') {
    this.h = human;
    this.t = human.template;
    this.mixer = human.mixer;
    this.speed = 0;
    this.aim = 0;
    this.lookTarget = null;
    this.look = { yaw: 0, pitch: 0 };
    this.dead = false;
    this.phase = (seed * 0.137) % 1;
    this.seed = seed;
    const sp = this.t.split;
    const idleKey = sp[idle] ? idle : 'idle';
    this.loco = [];
    const add = (key, speed) => {
      if (!sp[key]) return;
      const up = this.mixer.clipAction(sp[key].up);
      const low = this.mixer.clipAction(sp[key].low);
      for (const a of [up, low]) { a.play(); a.setEffectiveWeight(0); a.timeScale = 0; }
      this.loco.push({ key, speed, up, low, dur: sp[key].low.duration || sp[key].up.duration || 1 });
    };
    add(idleKey, 0);
    for (const [k, s] of GAITS) add(k, s);
    this.aimAct = null;
    const aimClip = this.t.upperOnly.aim;
    if (aimClip) {
      this.aimAct = this.mixer.clipAction(aimClip);
      this.aimAct.play();
      this.aimAct.setEffectiveWeight(0);
    }
    this.idleT = seed * 3.1;
    this.hitAct = null;
    this.hitW = 0;
  }

  _weights(s) {
    // piecewise-linear blend across idle(0) / walk / jog / sprint anchor speeds
    const anchors = this.loco.map((l) => l.speed);
    const w = anchors.map(() => 0);
    if (s <= anchors[0]) w[0] = 1;
    else if (s >= anchors[anchors.length - 1]) w[w.length - 1] = 1;
    else {
      for (let i = 0; i < anchors.length - 1; i++) {
        if (s >= anchors[i] && s <= anchors[i + 1]) {
          const k = (s - anchors[i]) / (anchors[i + 1] - anchors[i]);
          w[i] = 1 - k; w[i + 1] = k;
        }
      }
    }
    return w;
  }

  hitReact(dir, strength = 1, head = false) {
    if (this.dead) return;
    const clips = this.t.clips;
    const clip = head ? clips.hit_head : strength > 1.2 && clips.hit_knock ? clips.hit_knock : clips.hit_chest;
    if (!clip) return;
    if (this.hitAct) this.hitAct.stop();
    this.hitAct = this.mixer.clipAction(clip);
    this.hitAct.reset();
    this.hitAct.setLoop(THREE.LoopOnce, 1);
    this.hitAct.clampWhenFinished = false;
    this.hitAct.timeScale = 1.25;
    this.hitAct.play();
    this.hitW = Math.min(0.95, 0.55 + strength * 0.3);
  }

  shoot() {
    const c = this.t.upperOnly.shoot;
    if (!c || this.dead) return;
    const a = this.mixer.clipAction(c);
    a.reset(); a.setLoop(THREE.LoopOnce, 1); a.timeScale = 1.6; a.setEffectiveWeight(this.aim * 0.6); a.play();
  }

  die(dir) {
    if (this.dead) return;
    this.dead = true;
    const death = this.t.clips.death;
    this.mixer.stopAllAction();
    if (death) {
      const a = this.mixer.clipAction(death);
      a.reset(); a.setLoop(THREE.LoopOnce, 1); a.clampWhenFinished = true; a.timeScale = 1.15; a.play();
    }
    // turn the body so the clip's fall direction lines up with the shot
    const root = this.h.root;
    const d = _v.copy(dir || new THREE.Vector3(0, 0, 1)).setY(0);
    if (d.lengthSq() < 1e-6) d.set(0, 0, 1);
    d.normalize();
    const want = Math.atan2(d.x, d.z) - Math.atan2(this.t.fall.x, this.t.fall.y);
    this.fallYaw = { from: root.rotation.y, to: root.rotation.y + Math.atan2(Math.sin(want - root.rotation.y), Math.cos(want - root.rotation.y)), k: 0 };
  }

  update(dt, motionOk = true) {
    const root = this.h.root;
    if (this.dead) {
      if (this.fallYaw && this.fallYaw.k < 1) {
        this.fallYaw.k = Math.min(1, this.fallYaw.k + dt * 4);
        const e = 1 - (1 - this.fallYaw.k) ** 3;
        root.rotation.y = this.fallYaw.from + (this.fallYaw.to - this.fallYaw.from) * e;
      }
      this.mixer.update(dt);
      return;
    }
    const s = Math.max(0, this.speed);
    const w = this._weights(s);
    // one shared normalised phase: gait clips stay foot-synced while blending
    let rate = 0;
    this.loco.forEach((l, i) => {
      const ts = l.speed > 0 ? clamp(s / l.speed, 0.55, 1.6) : 1;
      rate += w[i] * ts / l.dur;
    });
    this.idleT += dt;
    this.phase = (this.phase + dt * (s > 0.05 ? rate : 1 / this.loco[0].dur)) % 1;
    const aim = clamp(this.aim, 0, 1);
    let hit = 0;
    if (this.hitAct) {
      const a = this.hitAct;
      const p = a.time / (a.getClip().duration || 1);
      hit = this.hitW * (1 - smooth(0.45, 1, p));
      if (!a.isRunning()) { a.stop(); this.hitAct = null; hit = 0; }
      else a.setEffectiveWeight(hit);
    }
    this.loco.forEach((l, i) => {
      const t = (i === 0 ? (this.idleT / l.dur) % 1 : this.phase) * l.dur;
      l.low.time = t; l.up.time = t;
      l.low.setEffectiveWeight(w[i] * (1 - hit));
      l.up.setEffectiveWeight(w[i] * (1 - aim) * (1 - hit));
    });
    if (this.aimAct) this.aimAct.setEffectiveWeight(aim * (1 - hit));
    this.mixer.update(motionOk ? dt : dt * 0.5);
    this._post(dt);
  }

  /** Head look-at + a slight chin-up (UAL idles look a touch down) on top of the clips. */
  _post(dt) {
    const b = this.h.bones;
    if (!b.head || !b.neck) return;
    const root = this.h.root;
    let yaw = 0; let pitch = 0;
    if (this.lookTarget) {
      root.updateMatrixWorld(true);
      b.head.getWorldPosition(_v);
      _m.copy(root.matrixWorld).invert();
      const local = _v.copy(this.lookTarget).sub(b.head.getWorldPosition(new THREE.Vector3())).transformDirection(_m);
      yaw = clamp(Math.atan2(local.x, local.z), -1.1, 1.1);
      pitch = clamp(Math.atan2(local.y, Math.hypot(local.x, local.z)), -0.5, 0.45);
      if (Math.abs(Math.atan2(local.x, local.z)) > 1.9) { yaw = 0; pitch = 0; }
    }
    const k = 1 - Math.exp(-6 * dt);
    this.look.yaw += (yaw * (1 - this.aim * 0.8) - this.look.yaw) * k;
    this.look.pitch += (pitch * (1 - this.aim * 0.8) - this.look.pitch) * k;
    root.updateMatrixWorld(true);
    const rootQ = root.getWorldQuaternion(_q2);
    const up = _v.copy(AX_Y).applyQuaternion(rootQ);
    const right = new THREE.Vector3().copy(AX_X).applyQuaternion(rootQ);
    const apply = (bone, yawA, pitchA) => {
      const parentQ = bone.parent.getWorldQuaternion(new THREE.Quaternion());
      const qw = new THREE.Quaternion().setFromAxisAngle(up, yawA).multiply(_q.setFromAxisAngle(right, -pitchA));
      const ql = parentQ.clone().invert().multiply(qw).multiply(parentQ);
      bone.quaternion.premultiply(ql);
      bone.updateMatrixWorld(true);
    };
    const chinUp = this.t.robot ? 0 : 0.12 * (1 - this.aim);
    apply(b.neck, this.look.yaw * 0.4, this.look.pitch * 0.35);
    apply(b.head, this.look.yaw * 0.6, this.look.pitch * 0.65 + chinUp);
  }
}

/* ---------- first-person hands ---------- */

/**
 * Static hand (+ wrist) geometry posed from a clip frame, in the FPArms hand frame
 * (origin at the wrist, fingers -Y, thumb +Z), plus the forearm sleeve of the outermost cloth
 * (origin at the wrist, +Y toward the elbow; userData.restLen = wrist→elbow distance).
 */
export function bakeHandGeometry(template, side, clipName = 'aim', at = 0.35) {
  const s = side === 'r' ? '_r' : '_l';
  const inner = SkeletonUtils.clone(template.scene);
  const mixer = new THREE.AnimationMixer(inner);
  const clip = template.clips[clipName];
  if (clip) { const a = mixer.clipAction(clip); a.play(); mixer.setTime(clip.duration * at); }
  inner.updateMatrixWorld(true);
  const f = frameFromHand(inner, side);
  const elbow = inner.getObjectByName(`lowerarm${s}`).getWorldPosition(new THREE.Vector3());
  const toHand = new THREE.Matrix4().compose(f.wrist, f.q, new THREE.Vector3(1, 1, 1)).invert();
  const armDir = elbow.clone().sub(f.wrist).normalize();
  const sleeveQ = new THREE.Quaternion().setFromUnitVectors(AX_Y, armDir);
  const toSleeve = new THREE.Matrix4().compose(f.wrist, sleeveQ, new THREE.Vector3(1, 1, 1)).invert();

  const handBones = new Set(); const foreBones = new Set();
  inner.traverse((o) => {
    if (!o.isBone) return;
    if (o.name === `hand${s}` || new RegExp(`^(thumb|index|middle|ring|pinky)_0\\d${s}$`).test(o.name)) handBones.add(o);
    if (o.name === `lowerarm${s}`) foreBones.add(o);
  });

  const bake = (mesh, pick, toLocal) => {
    const g = mesh.geometry;
    const sk = mesh.skeleton;
    const idx = g.attributes.skinIndex; const wt = g.attributes.skinWeight;
    const keep = new Int32Array(g.attributes.position.count).fill(-1);
    const pos = []; const uv = [];
    const p = new THREE.Vector3();
    mesh.updateMatrixWorld(true);
    for (let i = 0; i < keep.length; i++) {
      let wh = 0; let wf = 0;
      for (let k = 0; k < 4; k++) {
        const bone = sk.bones[idx.getComponent(i, k)];
        const ww = wt.getComponent(i, k);
        if (handBones.has(bone)) wh += ww;
        if (foreBones.has(bone)) wf += ww;
      }
      mesh.getVertexPosition(i, p);
      p.applyMatrix4(mesh.matrixWorld);
      if (!pick(wh, wf, p)) continue;
      keep[i] = pos.length / 3;
      p.applyMatrix4(toLocal);
      pos.push(p.x, p.y, p.z);
      if (g.attributes.uv) uv.push(g.attributes.uv.getX(i), g.attributes.uv.getY(i));
    }
    const index = [];
    const src = g.index;
    for (let i = 0; i < src.count; i += 3) {
      const a = keep[src.getX(i)]; const b = keep[src.getX(i + 1)]; const c = keep[src.getX(i + 2)];
      if (a >= 0 && b >= 0 && c >= 0) index.push(a, b, c);
    }
    const out = new THREE.BufferGeometry();
    out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    if (uv.length) out.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    out.setIndex(index);
    out.computeVertexNormals();
    out.computeBoundingSphere();
    return out;
  };

  let skin = null; let sleeveMesh = null; let sleeveCount = 0;
  inner.traverse((m) => {
    if (!m.isSkinnedMesh) return;
    if (m.material === template.mats.skin) skin = m;
    else if (template.mats.cloth.includes(m.material)) {
      // the cloth with the most forearm-weighted vertices is the jacket / shirt sleeve
      const g = m.geometry; let n = 0;
      for (let i = 0; i < g.attributes.position.count; i += 7) {
        for (let k = 0; k < 4; k++) if (foreBones.has(m.skeleton.bones[g.attributes.skinIndex.getComponent(i, k)]) && g.attributes.skinWeight.getComponent(i, k) > 0.5) n++;
      }
      if (n > sleeveCount) { sleeveCount = n; sleeveMesh = m; }
    }
  });
  if (!skin) return null;
  const hand = bake(skin, (wh, wf, p) => wh > 0.3 || (wf > 0.3 && p.distanceTo(f.wrist) < 0.06), toHand);
  const restLen = elbow.distanceTo(f.wrist);
  const sleeve = sleeveMesh ? bake(sleeveMesh, (wh, wf, p) => wf > 0.4 && p.distanceTo(f.wrist) > 0.015, toSleeve) : null;
  if (sleeve) sleeve.userData.restLen = restLen;
  mixer.stopAllAction();
  return {
    hand, sleeve, restLen,
    skinMat: template.mats.skin,
    sleeveMat: sleeveMesh?.material || null,
  };
}
