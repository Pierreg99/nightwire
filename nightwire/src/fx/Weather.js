import * as THREE from 'three';

// Rain is drawn as short streaks (line segments) instead of dots: two vertices per drop,
// tail offset by fall speed and wind, additive so neon and sodium light pick it up.
const WIND = 0.26;

function seedRain(n, streak) {
  const pos = new Float32Array(n * 6);
  for (let i = 0; i < n; i++) {
    const x = Math.random() * 24 - 12;
    const y = Math.random() * 16;
    const z = Math.random() * 18 - 4;
    pos.set([x, y, z, x - WIND * streak, y + streak, z - WIND * 0.6 * streak], i * 6);
  }
  return pos;
}

export class Weather {
  constructor(game) {
    this.game = game;
    const n = game.qualityProfile?.rain || (game.settings.reducedFx ? 280 : 900);
    this.n = n;
    this.streak = game.qualityProfile?.rainStreak ?? 0.32;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(seedRain(n, this.streak), 3));
    this.pts = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({
      color: 0x9fb8cc, transparent: true, opacity: 0.32,
      depthWrite: false, blending: THREE.AdditiveBlending, fog: true,
    }));
    this.pts.frustumCulled = false;
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
    const streak = this.game.qualityProfile?.rainStreak ?? this.streak;
    if (rain !== this.n || streak !== this.streak) {
      this.n = rain;
      this.streak = streak;
      this.geo.setAttribute('position', new THREE.BufferAttribute(seedRain(rain, streak), 3));
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
    const L = this.streak;
    for (let i = 0; i < this.n; i++) {
      const k = i * 6;
      const fall = dt * (9 + (i % 5));
      const drift = dt * 2.4;
      a[k + 1] -= fall; a[k + 4] -= fall;
      a[k + 2] += drift; a[k + 5] += drift;
      if (a[k + 1] < -2) {
        const x = Math.random() * 24 - 12;
        const z = Math.random() * 18 - 8;
        a[k] = x; a[k + 1] = 14; a[k + 2] = z;
        a[k + 3] = x - WIND * L; a[k + 4] = 14 + L; a[k + 5] = z - WIND * 0.6 * L;
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
