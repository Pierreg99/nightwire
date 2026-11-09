import * as THREE from 'three';
import { PostFX } from './PostFX.js';
import { createAdaptiveScale } from '../core/Quality.js';

export function frameSize() {
  const vv = globalThis.visualViewport;
  const w = vv?.width || globalThis.innerWidth || 1280;
  const h = vv?.height || globalThis.innerHeight || 720;
  return { w: Math.max(1, Math.round(w)), h: Math.max(1, Math.round(h)) };
}

export function requestStage() {
  const el = document.documentElement;
  if (document.fullscreenElement || document.webkitFullscreenElement) return;
  const req = el.requestFullscreen || el.webkitRequestFullscreen;
  if (!req) return;
  try {
    const pending = req.call(el);
    pending?.catch?.(() => {});
  } catch { /* no gesture or unsupported */ }
}

export class RenderPipeline {
  constructor(canvas, profile) {
    this.canvas = canvas;
    this.profile = profile;
    try {
      this.renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        powerPreference: 'high-performance',
        alpha: false,
        stencil: false,
        failIfMajorPerformanceCaveat: false,
      });
    } catch (err) {
      throw new Error('WebGL2 renderer failed. Use Chrome/Edge with hardware acceleration.');
    }
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.setClearColor(0x07080c, 1);
    const { w, h } = frameSize();
    this.renderer.setPixelRatio(this._dpr(profile));
    this.renderer.setSize(w, h, false);
    this.post = null;
    this.adaptive = createAdaptiveScale(profile, 30);
  }

  _dpr(profile) {
    const base = Math.min(globalThis.devicePixelRatio || 1, profile.dpr);
    return Math.max(0.5, base * (this.adaptive?.scale ?? 1));
  }

  /** Per-frame hook. On adaptive presets it lowers / restores the render scale; returns true on change. */
  adapt(dt, camera) {
    if (!this.profile?.adaptive) return false;
    const before = this.adaptive.scale;
    if (this.adaptive.update(dt) === before) return false;
    this.renderer.setPixelRatio(this._dpr(this.profile));
    this.resize(camera);
    return true;
  }

  attachPost(game) {
    try {
      this.post = new PostFX(game);
    } catch (err) {
      console.warn('PostFX disabled', err);
      const renderer = this.renderer;
      this.post = {
        resize() {},
        setProfile() {},
        setPixelRatio() {},
        render: () => renderer.render(game.scene, game.camera),
      };
    }
    return this.post;
  }

  apply(profile, { moon, scene, hemi, camera }) {
    this.profile = profile;
    this.adaptive = createAdaptiveScale(profile, 30);
    const dpr = this._dpr(profile);
    this.renderer.setPixelRatio(dpr);
    this.renderer.shadowMap.enabled = profile.shadow > 0;
    this.renderer.toneMappingExposure = profile.exposure;
    if (moon) this._shadow(moon, profile);
    if (scene?.fog) scene.fog.density = profile.fog;
    if (scene) scene.backgroundIntensity = profile.bg;
    if (hemi) hemi.intensity = profile.hemi;
    this.tuneMaterials(scene, profile);
    this.post?.setProfile?.(profile);
    this.resize(camera);
    return dpr;
  }

  _shadow(moon, profile) {
    moon.castShadow = profile.shadow > 0;
    moon.shadow.mapSize.set(profile.shadow, profile.shadow);
    moon.shadow.bias = -0.00012;
    moon.shadow.normalBias = profile.shadow >= 2048 ? 0.03 : 0.05;
    moon.shadow.radius = profile.shadow >= 2048 ? 1.2 : 2.2;
    if (moon.shadow.map) {
      moon.shadow.map.dispose();
      moon.shadow.map = null;
    }
    const cam = moon.shadow.camera;
    const r = profile.shadowRadius;
    cam.near = 1;
    cam.far = Math.max(24, r * 3.4);
    cam.left = cam.bottom = -r;
    cam.right = cam.top = r;
    cam.updateProjectionMatrix();
    this.renderer.shadowMap.needsUpdate = true;
  }

  resize(camera) {
    const { w, h } = frameSize();
    if (camera) {
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    this.renderer.setSize(w, h, false);
    this.post?.setPixelRatio?.(this.renderer.getPixelRatio());
    this.post?.resize?.(w, h);
  }

  tuneMaterials(root, profile) {
    if (!root) return;
    const maxA = this.renderer.capabilities.getMaxAnisotropy?.() || profile.aniso;
    const aniso = Math.min(maxA, profile.aniso);
    root.traverse((o) => {
      if (!o.isMesh || !o.material) return;
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      for (const m of mats) {
        if (!m) continue;
        if (m.map && m.map.anisotropy !== aniso) {
          m.map.anisotropy = aniso;
          m.map.needsUpdate = true;
        }
        if (m.envMapIntensity != null) {
          if (m.userData.baseEnv == null) m.userData.baseEnv = m.envMapIntensity;
          m.envMapIntensity = m.userData.baseEnv * profile.envScale;
        }
        if (m.clearcoat != null) {
          if (m.userData.baseCoat == null) m.userData.baseCoat = m.clearcoat;
          m.clearcoat = Math.min(1, m.userData.baseCoat * profile.clearcoatScale);
        }
      }
    });
  }
}
