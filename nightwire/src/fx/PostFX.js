import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { LOOK } from './look.js';

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
  },
  vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float time;
    uniform float vignette;
    uniform float grain;
    uniform vec2 resolution;
    uniform float useFxaa;
    varying vec2 vUv;
    float rand(vec2 co){ return fract(sin(dot(co.xy, vec2(12.9898,78.233))) * 43758.5453); }
    float luma(vec3 c){ return dot(c, vec3(0.2126, 0.7152, 0.0722)); }
    void main(){
      vec2 texel = 1.0 / max(resolution, vec2(1.0));
      vec3 c = texture2D(tDiffuse, vUv).rgb;
      if (useFxaa > 0.5) {
        vec3 n = texture2D(tDiffuse, vUv + vec2(0.0, texel.y)).rgb;
        vec3 s = texture2D(tDiffuse, vUv - vec2(0.0, texel.y)).rgb;
        vec3 e = texture2D(tDiffuse, vUv + vec2(texel.x, 0.0)).rgb;
        vec3 w = texture2D(tDiffuse, vUv - vec2(texel.x, 0.0)).rgb;
        float edge = smoothstep(0.03, 0.16, max(abs(luma(e) - luma(w)), abs(luma(n) - luma(s))));
        c = mix(c, (n + s + e + w + c) * 0.2, edge * 0.55);
      }
      c *= vec3(${GRADE});
      float d = distance(vUv, vec2(0.5));
      c *= 1.0 - smoothstep(0.45, 1.15, d) * vignette;
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
    this.bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.16, 0.35, 0.9);
    this.composer.addPass(this.bloom);
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
    this.composer.setSize(w, h);
    this.bloom.setSize(w, h);
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
    this.film.uniforms.time.value = this.game.time.elapsed;
    try {
      this.composer.render();
    } catch (err) {
      this._dead = true;
      console.warn('PostFX failed, drawing the scene directly', err);
      this.game.renderer.render(this.game.scene, this.game.camera);
    }
  }
}
