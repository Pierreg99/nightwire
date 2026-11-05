import * as THREE from 'three';

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
    this.muzzleLight.visible = false;
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
  }

  muzzle() {
    this.muzzleT = 0.045;
    this.muzzleLight.visible = true;
    this.muzzleLight.intensity = 3.6;
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
      this.muzzleLight.visible = false;
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
