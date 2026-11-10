/**
 * NIGHTWIRE — security drones (.mjs)
 * Patrol quadcopters over the three zones (public/assets/models/drone.glb, built by
 * tools/asset-pipeline/drone.py). Lissajous patrol loops at roof height, heading follows the
 * velocity, the airframe pitches / banks into the motion, props spin, LEDs blink, and on ULTRA /
 * HIGH each drone carries a shadowless searchlight with a soft rain-lit cone sweeping the street.
 * Count: profile.drones (ULTRA 3, HIGH 2, MEDIUM 2, MOBILE 1). Presentation only, no collision.
 */

import * as THREE from 'three';

const ROUTES = [
  { cx: 2, cz: 40, rx: 16, rz: 34, alt: 11, w: 0.11, zone: 'strip' },
  { cx: 0, cz: -52, rx: 30, rz: 22, alt: 13, w: 0.08, zone: 'docks' },
  { cx: 0, cz: 150, rx: 22, rz: 26, alt: 12, w: 0.09, zone: 'hof' },
];

export class Drones {
  constructor(game) {
    this.game = game;
    this.list = [];
    this.t = 0;
    // Searchlights exist from the first frame (intensity 0) so the asynchronous drone load later
    // does not change the light count and recompile every material mid-game.
    const p = game.qualityProfile;
    this.spotPool = [];
    if ((p.shadow ?? 0) >= 2048 && !game.settings.reducedFx) {
      for (let i = 0; i < Math.min(ROUTES.length, p.drones ?? 1); i++) {
        const l = new THREE.SpotLight(0xd8ecff, 0, 34, 0.32, 0.65, 1.4);
        l.castShadow = false;
        l.position.set(0, -500, 0);
        game.scene.add(l, l.target);
        this.spotPool.push(l);
      }
    }
  }

  /** @param gltf drone GLB (or null), @param profile quality profile */
  build(gltf, profile, lib) {
    if (!gltf) return 0;
    const count = Math.min(ROUTES.length, profile.drones ?? 1);
    const spots = this.spotPool.length > 0;
    const env = this.game.hdriEnv || null;
    gltf.scene.traverse((o) => {
      if (!o.isMesh) return;
      const m = o.material;
      if (/shell|motor/.test(m.name)) { m.envMap = env; m.envMapIntensity = 1.2; m.metalness = Math.max(m.metalness, 0.6); }
      if (/rotor/.test(m.name)) { m.transparent = true; m.opacity = 0.85; }
    });
    for (let i = 0; i < count; i++) {
      const r = ROUTES[i];
      const root = gltf.scene.clone();
      root.scale.setScalar(1.6);
      root.traverse((o) => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = false; } });
      const rotors = [0, 1, 2, 3].map((k) => root.getObjectByName(`rotor_${k}`)).filter(Boolean);
      const leds = [];
      root.traverse((o) => { if (o.isMesh && /led|warn/.test(o.material.name)) leds.push(o); });
      let light = null; let cone = null;
      const anchor = root.getObjectByName('spot') || root;
      if (spots && this.spotPool[i]) {
        light = this.spotPool[i];
        light.intensity = 60;
        light.position.set(0, 0, 0);
        anchor.add(light);
        light.target.position.set(0, -10, 3);
        anchor.add(light.target);
      }
      // soft beam: open cone, additive, fades along its length (cheap on every preset)
      const geo = new THREE.ConeGeometry(2.6, 11, 24, 1, true);
      geo.translate(0, -5.5, 0);
      cone = new THREE.Mesh(geo, new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
        uniforms: { uCol: { value: new THREE.Color(0x9ec8ff) }, uK: { value: spots ? 0.07 : 0.045 } },
        vertexShader: `varying float vY; varying vec3 vN; varying vec3 vV;
          void main(){ vY = position.y; vec4 mv = modelViewMatrix * vec4(position, 1.0);
            vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
        // soft edges: brightest where the eye looks through the most volume (facing the axis)
        fragmentShader: `uniform vec3 uCol; uniform float uK; varying float vY; varying vec3 vN; varying vec3 vV;
          void main(){ float edge = pow(abs(dot(normalize(vN), normalize(vV))), 2.0);
            float a = smoothstep(-11.0, 0.0, vY) * edge * uK; gl_FragColor = vec4(uCol * a, a); }`,
      }));
      cone.rotation.x = -0.27;
      cone.scale.setScalar(1 / 1.6);
      anchor.add(cone);
      const phase = i * 2.1;
      this.game.world.add(root, r.zone);
      this.list.push({ root, rotors, leds, light, cone, r, phase, prev: new THREE.Vector3(), yaw: 0 });
    }
    void lib;
    return this.list.length;
  }

  update(dt) {
    if (!this.list.length) return;
    this.t += dt;
    const t = this.t;
    for (const d of this.list) {
      const { r } = d;
      const a = t * r.w + d.phase;
      const x = r.cx + Math.sin(a) * r.rx;
      const z = r.cz + Math.sin(a * 2 + 0.6) * r.rz * 0.5;
      const y = r.alt + Math.sin(t * 0.7 + d.phase) * 0.5;
      const p = d.root.position;
      d.prev.copy(p);
      p.set(x, y, z);
      const vx = (p.x - d.prev.x) / Math.max(dt, 1e-4);
      const vz = (p.z - d.prev.z) / Math.max(dt, 1e-4);
      const sp = Math.hypot(vx, vz);
      if (sp > 0.05) {
        const want = Math.atan2(vx, vz);
        let dy = want - d.yaw;
        dy = Math.atan2(Math.sin(dy), Math.cos(dy));
        d.yaw += dy * (1 - Math.exp(-2.5 * dt));
      }
      d.root.rotation.set(Math.min(0.28, sp * 0.06), d.yaw, Math.sin(t * 1.3 + d.phase) * 0.04, 'YXZ');
      for (const [k, rot] of d.rotors.entries()) rot.rotation.y += dt * (k % 2 ? -62 : 62);
      const blink = Math.sin(t * 6 + d.phase) > 0.6;
      for (const l of d.leds) l.visible = /warn/.test(l.material.name) ? blink : true;
      if (d.cone) d.cone.rotation.z = Math.sin(t * 0.5 + d.phase) * 0.25;
    }
  }
}
