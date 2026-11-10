/**
 * NIGHTWIRE — Neon response (.mjs)
 * Gives every neon sign, lamp head and zone light a life: a mains hum on all of them, and a few
 * "faulty" tubes that stutter on their own and when a gun goes off nearby. Landmark lights
 * (userData.keep) only hum, they never drop out. Amplitude scales with profile.neonFlicker.
 */

import * as THREE from 'three';

const FAULTY_SHARE = 0.22;
const REACT_RADIUS = 24;

function saturated(c) {
  const max = Math.max(c.r, c.g, c.b);
  const min = Math.min(c.r, c.g, c.b);
  return max > 0.2 && (max - min) / max > 0.35;
}

/** Deterministic per-item random so the same sign is faulty on every boot. */
function seeded(i) {
  const x = Math.sin(i * 91.7 + 13.3) * 43758.5453;
  return x - Math.floor(x);
}

export class NeonFX {
  constructor(game) {
    this.game = game;
    this.items = [];
    this.t = 0;
    this._v = new THREE.Vector3();
  }

  collect() {
    const g = this.game;
    this.items = [];
    let i = 0;
    for (const l of g.lights.points) {
      if (l.userData.baseIntensity == null) l.userData.baseIntensity = l.intensity > 0 ? l.intensity : 1;
      const keep = !!l.userData.keep;
      this.items.push(this._item({ light: l, keep, faulty: !keep && seeded(i) < FAULTY_SHARE, phase: seeded(i + 50) * 6.28 }));
      i++;
    }
    g.scene.traverse((o) => {
      if (!o.isMesh || !o.material) return;
      // multi-material meshes (e.g. the two-faced vertical street signs) register each emissive slot
      for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
        if (!m.emissive || (m.emissiveIntensity ?? 0) < 1.5 || !saturated(m.emissive)) continue;
        if (m.userData.neonBase != null) continue; // shared material, already registered
        m.userData.neonBase = m.emissiveIntensity;
        this.items.push(this._item({ material: m, mesh: o, faulty: seeded(i) < FAULTY_SHARE * 1.4, phase: seeded(i + 50) * 6.28 }));
        i++;
      }
    });
    return this.items.length;
  }

  _item(o) {
    return { ...o, burst: 0, burstRate: 18 + seeded(this.items.length + 7) * 22, next: 2 + seeded(this.items.length + 3) * 9 };
  }

  /** Gunfire nearby rattles the faulty tubes. */
  react(pos, strength = 1) {
    for (const it of this.items) {
      if (!it.faulty) continue;
      const p = it.light ? it.light.position : it.mesh?.getWorldPosition(this._v);
      if (!p) continue;
      const d = Math.hypot(p.x - pos.x, p.z - pos.z);
      if (d < REACT_RADIUS) it.burst = Math.max(it.burst, (0.18 + Math.random() * 0.25) * strength * (1 - d / REACT_RADIUS));
    }
  }

  update(dt, profile, reducedFx) {
    const amp = reducedFx ? 0.25 : (profile?.neonFlicker ?? 1);
    this.t += dt;
    const t = this.t;
    for (const it of this.items) {
      let f = 1 + Math.sin(t * 7.3 + it.phase) * 0.018 * amp + Math.sin(t * 31.0 + it.phase * 3.0) * 0.012 * amp;
      if (it.faulty && amp > 0) {
        it.next -= dt;
        if (it.next <= 0) {
          it.burst = 0.25 + Math.random() * 0.7;
          it.next = 3 + Math.random() * 12;
        }
        if (it.burst > 0) {
          it.burst -= dt;
          const on = Math.sin(t * it.burstRate + it.phase) > -0.15 + Math.random() * 0.4;
          f *= on ? 1 : 1 - 0.85 * amp;
        }
      }
      if (it.light) {
        const l = it.light;
        if (l.visible && !l.userData.off) l.intensity = l.userData.baseIntensity * f;
      } else if (it.material) {
        it.material.emissiveIntensity = it.material.userData.neonBase * f;
      }
    }
  }
}
