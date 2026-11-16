import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { GTAOPass } from 'three/examples/jsm/postprocessing/GTAOPass.js';
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass.js';
import { LOOK } from './look.mjs';

// Linear grade. OutputPass is the only tone-map. Do not encode sRGB here.
const GRADE = LOOK.grade.map((n) => n.toFixed(4)).join(', ');
const GradeShader = {
  uniforms: {
    tDiffuse: { value: null },
    time: { value: 0 },
    vignette: { value: 0.34 },
    grain: { value: 0.018 },
    resolution: { value: new THREE.Vector2(1280, 720) },
    useFxaa: { value: 0 },
    chroma: { value: 0 },
    lensRain: { value: 0 },
    splitTone: { value: 0 },
    hurt: { value: 0 },
    cvd: { value: 0 },
    blurVel: { value: new THREE.Vector2() },
  },
  vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float time;
    uniform float vignette;
    uniform float grain;
    uniform vec2 resolution;
    uniform float useFxaa;
    uniform float chroma;
    uniform float lensRain;
    uniform float splitTone;
    uniform float hurt;
    uniform float cvd;
    uniform vec2 blurVel;
    varying vec2 vUv;
    // Daltonize (colour-vision setting): simulate the deficiency in LMS, push the lost contrast
    // into channels the viewer still separates. 1 deuteranopia, 2 protanopia, 3 tritanopia.
    vec3 daltonize(vec3 c, float mode){
      mat3 toLms = mat3(17.8824, 3.45565, 0.0299566, 43.5161, 27.1554, 0.184309, 4.11935, 3.86714, 1.46709);
      mat3 toRgb = mat3(0.0809444479, -0.0102485335, -0.000365296938, -0.130504409, 0.0540193266, -0.00412161469, 0.116721066, -0.113614708, 0.693511405);
      vec3 lms = toLms * c;
      vec3 s = lms;
      if (mode < 1.5) s = vec3(lms.x, 0.494207 * lms.x + 1.24827 * lms.z, lms.z);
      else if (mode < 2.5) s = vec3(2.02344 * lms.y - 2.52581 * lms.z, lms.y, lms.z);
      else s = vec3(lms.x, lms.y, -0.395913 * lms.x + 0.801109 * lms.y);
      vec3 err = c - toRgb * s;
      vec3 shift = vec3(0.0, err.r * 0.7 + err.g, err.r * 0.7 + err.b);
      return c + shift;
    }
    float rand(vec2 co){ return fract(sin(dot(co.xy, vec2(12.9898,78.233))) * 43758.5453); }
    float luma(vec3 c){ return dot(c, vec3(0.2126, 0.7152, 0.0722)); }
    // Rain on the lens: sparse drops in a sliding grid refract the frame a little. One cell lookup, no textures.
    vec2 lensDrops(vec2 uv, float t){
      vec2 aspect = vec2(resolution.x / max(resolution.y, 1.0), 1.0);
      vec2 st = uv * aspect * vec2(7.0, 3.5);
      st.y += t * 0.05;
      vec2 id = floor(st);
      vec2 f = fract(st) - 0.5;
      float n = rand(id);
      float life = fract(t * (0.08 + n * 0.1) + n * 7.0);
      vec2 p = vec2((n - 0.5) * 0.6, 0.4 - life * 0.8);
      vec2 d = (f - p) * vec2(1.0, 1.45);
      float drop = smoothstep(0.11, 0.0, length(d)) * step(0.62, n) * smoothstep(1.0, 0.75, life);
      float trail = smoothstep(0.035, 0.0, abs(f.x - p.x)) * smoothstep(p.y, p.y + 0.35, f.y) * step(0.62, n) * 0.25;
      return d * drop * 0.55 + vec2(0.0, trail * 0.02);
    }
    void main(){
      vec2 texel = 1.0 / max(resolution, vec2(1.0));
      vec2 uv = vUv;
      if (lensRain > 0.0) uv += lensDrops(vUv, time) * lensRain * 0.06;
      vec3 c = texture2D(tDiffuse, uv).rgb;
      if (dot(blurVel, blurVel) > 1e-7) {
        // Camera motion blur: 6 taps along the rotation velocity, centre-weighted, edges stronger.
        vec2 v = blurVel * (0.6 + distance(vUv, vec2(0.5)));
        vec3 acc = c; float wsum = 1.0;
        for (int i = 1; i <= 3; i++) {
          float t = float(i) / 3.0; float w = 1.0 - t * 0.6;
          acc += texture2D(tDiffuse, uv + v * t * 0.5).rgb * w;
          acc += texture2D(tDiffuse, uv - v * t * 0.5).rgb * w;
          wsum += 2.0 * w;
        }
        c = acc / wsum;
      }
      if (chroma > 0.0) {
        vec2 dir = (uv - 0.5) * chroma * (0.4 + distance(uv, vec2(0.5)) * 2.0);
        c.r = texture2D(tDiffuse, uv + dir).r;
        c.b = texture2D(tDiffuse, uv - dir).b;
      }
      if (useFxaa > 0.5) {
        vec3 n = texture2D(tDiffuse, uv + vec2(0.0, texel.y)).rgb;
        vec3 s = texture2D(tDiffuse, uv - vec2(0.0, texel.y)).rgb;
        vec3 e = texture2D(tDiffuse, uv + vec2(texel.x, 0.0)).rgb;
        vec3 w = texture2D(tDiffuse, uv - vec2(texel.x, 0.0)).rgb;
        float edge = smoothstep(0.03, 0.16, max(abs(luma(e) - luma(w)), abs(luma(n) - luma(s))));
        c = mix(c, (n + s + e + w + c) * 0.2, edge * 0.55);
      }
      c *= vec3(${GRADE});
      if (splitTone > 0.0) {
        // Cold teal shadows, warm sodium/magenta highlights: the night palette in one multiply.
        vec3 tint = mix(vec3(0.9, 1.0, 1.12), vec3(1.1, 0.98, 0.92), smoothstep(0.04, 0.5, luma(c)));
        c *= mix(vec3(1.0), tint, clamp(splitTone * 5.0, 0.0, 1.0));
      }
      float d = distance(vUv, vec2(0.5));
      if (hurt > 0.001) {
        // Damage: colour drains toward the centre, a red pulse closes in from the edges.
        float l = luma(c);
        c = mix(c, vec3(l * 1.08, l * 0.86, l * 0.86), hurt * 0.45);
        c += vec3(0.16, 0.0, 0.015) * smoothstep(0.25, 0.85, d) * hurt;
        c *= 1.0 - smoothstep(0.3, 1.0, d) * hurt * 0.35;
      }
      c *= 1.0 - smoothstep(0.45, 1.15, d) * vignette;
      if (cvd > 0.5) c = max(daltonize(c, cvd), 0.0);
      c += (rand(vUv * resolution + time) - 0.5) * grain;
      gl_FragColor = vec4(max(c, 0.0), 1.0);
    }
  `,
};

export class PostFX {
  constructor(game) {
    this.game = game;
    this.profile = game.qualityProfile;
    const renderer = game.renderer;
    this.composer = new EffectComposer(renderer);
    this.composer.addPass(new RenderPass(game.scene, game.camera));
    // Contact shadows / ambient occlusion (ULTRA, HIGH). GTAO renders its own depth+normal pass.
    try {
      this.gtao = new GTAOPass(game.scene, game.camera, innerWidth, innerHeight);
      this.gtao.updateGtaoMaterial({ radius: 0.6, distanceExponent: 1.2, thickness: 1.2, scale: 1.1, samples: 12 });
      this.gtao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 12 });
      this.gtao.blendIntensity = 0.85;
      this.gtao.enabled = false;
      this.composer.addPass(this.gtao);
    } catch (err) {
      console.warn('GTAO unavailable', err);
      this.gtao = null;
    }
    this.bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.16, 0.35, 0.9);
    this.composer.addPass(this.bloom);
    // Subtle depth of field: only while aiming down sights or during the jack-in card.
    this.bokeh = new BokehPass(game.scene, game.camera, { focus: 12, aperture: 0.00035, maxblur: 0.0045 });
    this.bokeh.enabled = false;
    this.composer.addPass(this.bokeh);
    this._lastYaw = null;
    this.film = new ShaderPass(GradeShader);
    this.composer.addPass(this.film);
    this.composer.addPass(new OutputPass());
    this._applyUniforms();
  }

  _applyUniforms() {
    const p = this.profile;
    if (!p) return;
    this.bloom.strength = p.bloom;
    this.bloom.radius = p.bloomRadius;
    this.bloom.threshold = p.bloomThreshold;
    this.film.uniforms.vignette.value = p.vignette;
    this.film.uniforms.useFxaa.value = p.fxaa ? 1 : 0;
    this.film.uniforms.chroma.value = p.chroma || 0;
    this.film.uniforms.splitTone.value = p.splitTone || 0;
    this.bloom.enabled = p.bloom > 0;
    if (this.gtao) this.gtao.enabled = (p.ao ?? 0) > 0;
    if (this._size) this.resize(this._size.w, this._size.h);
  }

  setProfile(profile) {
    this.profile = profile;
    this.setPixelRatio(this.game.renderer.getPixelRatio());
    this._applyUniforms();
  }

  setPixelRatio(dpr) {
    this.composer.setPixelRatio(dpr);
  }

  resize(w, h) {
    this._size = { w, h };
    this.composer.setSize(w, h);
    // Bloom is the most expensive pass. MEDIUM renders it at 3/4, MOBILE / APK at 1/2 of CSS size.
    const bs = this.profile?.bloomScale ?? 1;
    this.bloom.setSize(Math.max(1, Math.round(w * bs)), Math.max(1, Math.round(h * bs)));
    const pr = this.game.renderer.getPixelRatio();
    this.film.uniforms.resolution.value.set(Math.max(1, w * pr), Math.max(1, h * pr));
  }

  render() {
    if (this._dead) {
      this.game.renderer.render(this.game.scene, this.game.camera);
      return;
    }
    const reduced = this.game.settings.reducedFx;
    const motion = this.game.settings.motion;
    const p = this.profile;
    this.bloom.strength = reduced ? 0.05 : p.bloom;
    this.bloom.threshold = reduced ? 0.96 : p.bloomThreshold;
    this.film.uniforms.grain.value = reduced || !motion ? 0 : p.grain;
    this.film.uniforms.lensRain.value = reduced || !motion || this.game.mode === 'skim' ? 0 : (p.lensRain || 0);
    this.film.uniforms.chroma.value = reduced ? 0 : (p.chroma || 0);
    this.film.uniforms.time.value = this.game.time.elapsed;
    const g = this.game;
    if (this.gtao) this.gtao.enabled = !reduced && (p.ao ?? 0) > 0 && g.mode !== 'title';
    // DOF: ADS focuses on what the crosshair sits on; the jack-in card softens the background.
    const wantDof = !reduced && p.dof && motion && g.settings.dof !== false
      && (g.photoMode ? !g.photoMode.view : ((g.mode === 'play' && g.weapons?.ads) || g.presenter?.barsT > 0));
    this.bokeh.enabled = wantDof;
    if (wantDof) {
      const u = this.bokeh.uniforms;
      let focus = 14;
      if (g.photoMode) focus = 0.75;
      else if (g.weapons?.ads) {
        const o = g.camera.getWorldPosition(this._o || (this._o = new THREE.Vector3()));
        const d = g.camera.getWorldDirection(this._d || (this._d = new THREE.Vector3()));
        const hit = g.world.collision.raycast(o, d, 80);
        focus = hit ? hit.t : 60;
      }
      this._focus = this._focus == null ? focus : this._focus + (focus - this._focus) * 0.15;
      u.focus.value = this._focus;
      u.aperture.value = g.photoMode ? 0.004 : g.weapons?.ads ? 0.00028 : 0.0005;
      u.maxblur.value = g.photoMode ? 0.006 : 0.004;
    }
    // camera motion blur from yaw / pitch velocity
    const mb = !reduced && motion && g.settings.motionBlur !== false ? (p.motionBlur || 0) : 0;
    const bv = this.film.uniforms.blurVel.value;
    if (mb > 0 && g.mode === 'play' && !g.player.inVehicle) {
      const yaw = g.player.yaw; const pitch = g.player.pitch;
      if (this._lastYaw != null) {
        const fovY = THREE.MathUtils.degToRad(g.camera.fov);
        const vx = -(yaw - this._lastYaw) / (fovY * g.camera.aspect);
        const vy = (pitch - this._lastPitch) / fovY;
        bv.set(THREE.MathUtils.clamp(vx * mb, -0.025, 0.025), THREE.MathUtils.clamp(vy * mb, -0.025, 0.025));
        if (bv.lengthSq() < 4e-6) bv.set(0, 0);
      }
      this._lastYaw = yaw; this._lastPitch = pitch;
    } else bv.set(0, 0);
    const h = this.game.health;
    let hurt = 0;
    if (h && this.game.mode !== 'title') {
      const low = h.hp < 35 ? (1 - h.hp / 35) * (0.45 + 0.25 * Math.sin(this.game.time.elapsed * 5.2)) : 0;
      hurt = Math.min(1, Math.max(h.hurt * 0.85, low));
      if (reduced) hurt *= 0.5;
    }
    this.film.uniforms.hurt.value = hurt;
    this.film.uniforms.cvd.value = { deuteranopia: 1, protanopia: 2, tritanopia: 3 }[this.game.settings.colorMode] || 0;
    try {
      this.composer.render();
    } catch (err) {
      this._dead = true;
      console.warn('PostFX failed, drawing the scene directly', err);
      this.game.renderer.render(this.game.scene, this.game.camera);
    }
  }
}
