/**
 * NIGHTWIRE — Live reflection probe (.mjs)
 * ULTRA / HIGH only: a low-resolution CubeCamera follows the player at knee height and re-renders
 * the district every profile.envProbe seconds. The result becomes scene.environment, so puddles,
 * wet asphalt, car paint and glass reflect the neon around the player instead of a static sky.
 * MEDIUM / MOBILE keep the static PMREM environment (no extra render passes).
 */

import * as THREE from 'three';

export class EnvProbe {
  constructor(game) {
    this.game = game;
    this.staticEnv = game.scene.environment;
    this.rt = null;
    this.cam = null;
    this.size = 0;
    this.timer = 0;
    this.active = false;
  }

  apply(profile, reducedFx) {
    const want = !reducedFx && (profile?.envProbe ?? 0) > 0;
    if (!want) {
      this.active = false;
      this.face = null;
      this.game.scene.environment = this.staticEnv;
      return;
    }
    const size = profile.probeSize || 96;
    if (!this.rt || this.size !== size) {
      this.rt?.dispose();
      this.rt = new THREE.WebGLCubeRenderTarget(size, { type: THREE.HalfFloatType, generateMipmaps: false });
      this.cam = new THREE.CubeCamera(0.3, 90, this.rt);
      this.size = size;
    }
    this.interval = profile.envProbe;
    this.active = true;
    this.face = null;
    this.timer = 0; // refresh on the next frame
  }

  /**
   * Staggered: one cube face per frame (1/6 of a 96–128 px scene render), the finished cube is
   * handed to PMREM after face 6. No frame ever pays for the full probe.
   */
  update(dt) {
    if (!this.active) return false;
    const g = this.game;
    const r = g.renderer;
    if (this.face == null) {
      this.timer -= dt;
      if (this.timer > 0) return false;
      const p = g.player.pos;
      this.cam.position.set(p.x, p.y + 0.6, p.z);
      this.cam.updateMatrixWorld();
      if (this.cam.coordinateSystem !== r.coordinateSystem) {
        this.cam.coordinateSystem = r.coordinateSystem;
        this.cam.updateCoordinateSystem();
      }
      this.face = 0;
    }
    const scene = g.scene;
    // No feedback loop, no viewmodel / rain in the probe, no shadow re-render.
    const prevEnv = scene.environment;
    const camVis = g.camera.visible;
    const rain = g.weather?.pts;
    const rainVis = rain?.visible;
    const autoShadow = r.shadowMap.autoUpdate;
    const prevTarget = r.getRenderTarget();
    scene.environment = this.staticEnv;
    g.camera.visible = false;
    if (rain) rain.visible = false;
    r.shadowMap.autoUpdate = false;
    try {
      r.setRenderTarget(this.rt, this.face);
      r.render(scene, this.cam.children[this.face]);
    } finally {
      r.setRenderTarget(prevTarget);
      r.shadowMap.autoUpdate = autoShadow;
      if (rain) rain.visible = rainVis;
      g.camera.visible = camVis;
      scene.environment = prevEnv;
    }
    this.face += 1;
    if (this.face >= 6) {
      this.face = null;
      this.timer = this.interval;
      this.rt.texture.needsPMREMUpdate = true;
      scene.environment = this.rt.texture;
      return true;
    }
    return false;
  }
}
