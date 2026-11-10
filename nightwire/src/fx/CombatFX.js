import * as THREE from 'three';

const MUZZLE = {
  pistol: { light: 2.8, flash: 0.15 },
  smg: { light: 3.0, flash: 0.15 },
  rifle: { light: 3.8, flash: 0.19 },
  dmr: { light: 4.2, flash: 0.2 },
  shotgun: { light: 5.6, flash: 0.26 },
};
const POOL = 96;

/**
 * Pooled impact particles: one Points draw for sparks (additive), one for flesh mist / grit.
 * Count per hit comes from profile.impactParticles (ULTRA 28 … MOBILE 6).
 */
class ParticlePool {
  constructor(scene, color, additive, size) {
    this.pos = new Float32Array(POOL * 3);
    this.vel = new Float32Array(POOL * 3);
    this.life = new Float32Array(POOL);
    this.max = new Float32Array(POOL);
    this.col = new Float32Array(POOL * 3);
    this.base = new THREE.Color(color);
    this.cursor = 0;
    this.alive = 0;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('color', new THREE.BufferAttribute(this.col, 3).setUsage(THREE.DynamicDrawUsage));
    this.points = new THREE.Points(geo, new THREE.PointsMaterial({
      size, vertexColors: true, transparent: true, depthWrite: false,
      blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
      opacity: additive ? 1 : 0.85, sizeAttenuation: true, fog: true,
    }));
    this.points.frustumCulled = false;
    this.points.visible = false;
    for (let i = 0; i < POOL; i++) this.pos[i * 3 + 1] = -999;
    scene.add(this.points);
  }

  emit(point, normal, n, speed, life, spread) {
    for (let k = 0; k < n; k++) {
      const i = this.cursor;
      this.cursor = (this.cursor + 1) % POOL;
      const r = (Math.random() - 0.5) * spread;
      const vx = normal.x + (Math.random() - 0.5) * spread;
      const vy = normal.y + Math.random() * 0.8 + r * 0.2;
      const vz = normal.z + (Math.random() - 0.5) * spread;
      const s = speed * (0.4 + Math.random() * 0.8);
      this.pos.set([point.x + normal.x * 0.03, point.y + normal.y * 0.03, point.z + normal.z * 0.03], i * 3);
      this.vel.set([vx * s, vy * s, vz * s], i * 3);
      this.max[i] = this.life[i] = life * (0.5 + Math.random() * 0.7);
    }
    this.alive = POOL;
    this.points.visible = true;
  }

  update(dt, gravity) {
    if (!this.points.visible) return;
    let any = false;
    for (let i = 0; i < POOL; i++) {
      if (this.life[i] <= 0) continue;
      this.life[i] -= dt;
      const j = i * 3;
      if (this.life[i] <= 0) {
        this.pos[j + 1] = -999;
        this.col[j] = this.col[j + 1] = this.col[j + 2] = 0;
        continue;
      }
      any = true;
      this.vel[j + 1] -= gravity * dt;
      this.vel[j] *= 0.985; this.vel[j + 2] *= 0.985;
      this.pos[j] += this.vel[j] * dt;
      this.pos[j + 1] += this.vel[j + 1] * dt;
      this.pos[j + 2] += this.vel[j + 2] * dt;
      const f = this.life[i] / this.max[i];
      this.col[j] = this.base.r * f; this.col[j + 1] = this.base.g * f * f; this.col[j + 2] = this.base.b * f * f;
    }
    this.points.geometry.attributes.position.needsUpdate = true;
    this.points.geometry.attributes.color.needsUpdate = true;
    if (!any) this.points.visible = false;
  }
}

export class CombatFX {
  constructor(game) {
    this.game = game;
    this.tracers = [];
    this.decals = [];
    this.casings = [];
    this.decalGeo = new THREE.CircleGeometry(0.09, 8);
    this.decalMatFlesh = new THREE.MeshBasicMaterial({
      color: 0x6a1020, transparent: true, opacity: 0.85, depthWrite: false,
      polygonOffset: true, polygonOffsetFactor: -2,
    });
    this.decalMatWorld = new THREE.MeshBasicMaterial({
      color: 0x1a1a1a, transparent: true, opacity: 0.8, depthWrite: false,
      polygonOffset: true, polygonOffsetFactor: -2,
    });
    this.muzzleLight = new THREE.PointLight(0xffcc88, 0, 5, 2);
    // Stays visible: toggling .visible on a light changes the light count and recompiles every
    // lit shader on the next frame (a visible hitch on the first shot). Intensity 0 is free.
    this.muzzleLight.visible = true;
    game.camera.add(this.muzzleLight);
    this.muzzleLight.position.set(0.15, -0.1, -0.6);
    this.muzzleT = 0;
    this.tracerMat = new THREE.LineBasicMaterial({ color: 0xffd0a0, transparent: true, opacity: 0.85 });

    const flash = document.createElement('canvas');
    flash.width = flash.height = 64;
    const g = flash.getContext('2d');
    const grd = g.createRadialGradient(32, 32, 2, 32, 32, 32);
    grd.addColorStop(0, '#fff6d8');
    grd.addColorStop(0.25, '#ffaa55');
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grd;
    g.fillRect(0, 0, 64, 64);
    this.flashSpr = new THREE.Sprite(new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(flash),
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    }));
    this.flashSpr.scale.set(0.18, 0.18, 1);
    this.flashSpr.visible = false;
    game.camera.add(this.flashSpr);
    this.flashSpr.position.set(0.12, -0.16, -0.72);

    this.casingGeo = new THREE.CylinderGeometry(0.006, 0.006, 0.028, 5);
    this.casingMat = new THREE.MeshStandardMaterial({ color: 0xc9a227, metalness: 0.8, roughness: 0.35 });

    this.sparks = new ParticlePool(game.scene, 0xffb060, true, 0.05);
    this.blood = new ParticlePool(game.scene, 0x8a1426, false, 0.045);
    this.grit = new ParticlePool(game.scene, 0x6c6a66, false, 0.035);
    this.flashBase = 0.14;
  }

  muzzle(cam, type = 'rifle') {
    const m = MUZZLE[type] || MUZZLE.rifle;
    this.muzzleT = type === 'shotgun' ? 0.06 : 0.045;
    this.muzzleLight.intensity = m.light;
    this.flashBase = m.flash;
    this.flashSpr.visible = true;
    this.flashSpr.material.rotation = Math.random() * Math.PI;
    this._eject();
  }

  _eject() {
    if (this.game.settings.reducedFx) return;
    const m = new THREE.Mesh(this.casingGeo, this.casingMat);
    this.game.camera.getWorldPosition(m.position);
    const right = new THREE.Vector3(1, 0.4, 0.2).applyQuaternion(this.game.camera.quaternion);
    m.position.addScaledVector(right, 0.18);
    const vel = right.multiplyScalar(2.4 + Math.random());
    vel.y += 1.6;
    this.game.scene.add(m);
    this.casings.push({ mesh: m, vel, t: 0.7 });
    if (this.casings.length > 18) {
      const old = this.casings.shift();
      this.game.scene.remove(old.mesh);
    }
  }

  tracer(a, b, color = 0xffd0a0) {
    const geo = new THREE.BufferGeometry().setFromPoints([a, b]);
    const mat = this.tracerMat.clone();
    mat.color.setHex(color);
    const line = new THREE.Line(geo, mat);
    this.game.scene.add(line);
    this.tracers.push({ line, t: 0.08 });
  }

  /** Hit feedback in the world: sparks + grit on walls, a dark mist on bodies. */
  impact(point, normal, flesh) {
    const g = this.game;
    let n = g.qualityProfile?.impactParticles ?? 12;
    if (g.settings.reducedFx) n = Math.ceil(n / 3);
    if (flesh) this.blood.emit(point, normal, Math.ceil(n * 0.6), 1.6, 0.45, 1.4);
    else {
      this.sparks.emit(point, normal, n, 4.2, 0.32, 1.2);
      this.grit.emit(point, normal, Math.ceil(n * 0.3), 1.2, 0.5, 0.9);
    }
  }

  decal(point, normal, flesh) {
    const m = new THREE.Mesh(this.decalGeo, flesh ? this.decalMatFlesh : this.decalMatWorld);
    m.position.copy(point).addScaledVector(normal, 0.02);
    m.lookAt(point.clone().add(normal));
    this.game.scene.add(m);
    this.decals.push(m);
    if (this.decals.length > 64) {
      const old = this.decals.shift();
      this.game.scene.remove(old);
    }
  }

  update(dt) {
    this.muzzleT -= dt;
    if (this.muzzleT <= 0) {
      this.muzzleLight.intensity = 0;
      // Stays visible: toggling .visible on a light changes the light count and recompiles every
    // lit shader on the next frame (a visible hitch on the first shot). Intensity 0 is free.
    this.muzzleLight.visible = true;
      this.flashSpr.visible = false;
    } else {
      this.flashSpr.scale.setScalar(0.14 + this.muzzleT * 2.2);
    }
    for (let i = this.tracers.length - 1; i >= 0; i--) {
      this.tracers[i].t -= dt;
      this.tracers[i].line.material.opacity = Math.max(0, this.tracers[i].t * 10);
      if (this.tracers[i].t <= 0) {
        this.game.scene.remove(this.tracers[i].line);
        this.tracers[i].line.geometry.dispose();
        this.tracers.splice(i, 1);
      }
    }
    for (let i = this.casings.length - 1; i >= 0; i--) {
      const c = this.casings[i];
      c.t -= dt;
      c.vel.y -= 18 * dt;
      c.mesh.position.addScaledVector(c.vel, dt);
      c.mesh.rotation.x += dt * 12;
      if (c.t <= 0) {
        this.game.scene.remove(c.mesh);
        this.casings.splice(i, 1);
      }
    }
  }
}
