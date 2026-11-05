import * as THREE from 'three';

export class Weather {
  constructor(game) {
    this.game = game;
    const n = game.qualityProfile?.rain || (game.settings.reducedFx ? 280 : 900);
    this.n = n;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = Math.random() * 24 - 12;
      pos[i * 3 + 1] = Math.random() * 16;
      pos[i * 3 + 2] = Math.random() * 18 - 4;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.pts = new THREE.Points(geo, new THREE.PointsMaterial({
      color: 0xa8c0d0, size: 0.045, transparent: true, opacity: 0.5,
      depthWrite: false, sizeAttenuation: true,
    }));
    game.camera.add(this.pts);
    this.geo = geo;

    const sn = game.qualityProfile?.steam || (game.settings.reducedFx ? 40 : 120);
    this.sn = sn;
    const sp = new Float32Array(sn * 3);
    for (let i = 0; i < sn; i++) {
      sp[i * 3] = (Math.random() - 0.5) * 4;
      sp[i * 3 + 1] = Math.random() * 2.4;
      sp[i * 3 + 2] = (Math.random() - 0.5) * 4;
    }
    this.steamGeo = new THREE.BufferGeometry();
    this.steamGeo.setAttribute('position', new THREE.BufferAttribute(sp, 3));
    this.steam = new THREE.Points(this.steamGeo, new THREE.PointsMaterial({
      color: 0xb8c4d0, size: 0.22, transparent: true, opacity: 0.18, depthWrite: false,
    }));
    this.steam.position.set(2, 0.4, -48);
    game.scene.add(this.steam);
    this.steam2 = this.steam.clone();
    this.steam2.position.set(-8, 0.2, -104);
    game.scene.add(this.steam2);
  }

  setDensity(rain, steam) {
    if (rain !== this.n) {
      this.n = rain;
      const pos = new Float32Array(rain * 3);
      for (let i = 0; i < rain; i++) {
        pos[i * 3] = Math.random() * 24 - 12;
        pos[i * 3 + 1] = Math.random() * 16;
        pos[i * 3 + 2] = Math.random() * 18 - 4;
      }
      this.geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    }
    if (steam !== this.sn) {
      this.sn = steam;
      const sp = new Float32Array(steam * 3);
      for (let i = 0; i < steam; i++) {
        sp[i * 3] = (Math.random() - 0.5) * 4;
        sp[i * 3 + 1] = Math.random() * 2.4;
        sp[i * 3 + 2] = (Math.random() - 0.5) * 4;
      }
      this.steamGeo.setAttribute('position', new THREE.BufferAttribute(sp, 3));
    }
  }

  update(dt) {
    if (this.game.settings.reducedFx) {
      this.pts.visible = false;
      this.steam.visible = this.steam2.visible = false;
      return;
    }
    this.pts.visible = true;
    this.steam.visible = this.steam2.visible = true;
    const a = this.geo.attributes.position.array;
    for (let i = 0; i < this.n; i++) {
      a[i * 3 + 1] -= dt * (9 + (i % 5));
      a[i * 3 + 2] += dt * 2.4;
      if (a[i * 3 + 1] < -2) {
        a[i * 3] = Math.random() * 24 - 12;
        a[i * 3 + 1] = 14;
        a[i * 3 + 2] = Math.random() * 18 - 8;
      }
    }
    this.geo.attributes.position.needsUpdate = true;

    const s = this.steamGeo.attributes.position.array;
    for (let i = 0; i < this.sn; i++) {
      s[i * 3 + 1] += dt * (0.35 + (i % 3) * 0.12);
      s[i * 3] += Math.sin(this.game.time.elapsed + i) * dt * 0.15;
      if (s[i * 3 + 1] > 3.2) {
        s[i * 3] = (Math.random() - 0.5) * 4;
        s[i * 3 + 1] = 0;
        s[i * 3 + 2] = (Math.random() - 0.5) * 4;
      }
    }
    this.steamGeo.attributes.position.needsUpdate = true;
  }
}
