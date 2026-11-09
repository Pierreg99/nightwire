/**
 * Machala Render Foundation v1 — layered post-processing.
 * Intentionally conservative: cinematic response without mobile frame-budget blowout.
 */

import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';

const NightGradeShader = {
  uniforms: {
    tDiffuse: { value: null },
    vignette: { value: 0.35 },
    grain: { value: 0.035 },
    time: { value: 0 }
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float vignette;
    uniform float grain;
    uniform float time;
    varying vec2 vUv;

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }

    void main() {
      vec4 color = texture2D(tDiffuse, vUv);

      vec2 centered = vUv - 0.5;
      float vignetteMask = smoothstep(0.85, 0.25, length(centered));
      color.rgb *= mix(1.0, vignetteMask, vignette);

      float noise = hash(vUv * 1000.0 + time) - 0.5;
      color.rgb += noise * grain;

      gl_FragColor = color;
    }
  `
};

export function createPostFX({ renderer, scene, camera, quality }) {
  const composer = new EffectComposer(renderer.webglRenderer);
  composer.addPass(new RenderPass(scene, camera));

  const bloom = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.45,
    0.75,
    0.82
  );
  composer.addPass(bloom);

  const grade = new ShaderPass(NightGradeShader);
  composer.addPass(grade);

  const fxaa = new ShaderPass(FXAAShader);
  composer.addPass(fxaa);

  let time = 0;
  let disposed = false;

  function resize() {
    const size = new THREE.Vector2();
    renderer.webglRenderer.getSize(size);
    composer.setSize(size.x, size.y);

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    fxaa.material.uniforms.resolution.value.set(
      1 / (size.x * dpr),
      1 / (size.y * dpr)
    );
  }

  function applyQuality(settings) {
    bloom.enabled = settings.bloom;
    bloom.strength = settings.bloomStrength;
    grade.uniforms.vignette.value = settings.id === 'low' ? 0.22 : 0.35;
    grade.uniforms.grain.value = settings.id === 'low' ? 0 : 0.035;
    resize();
  }

  function update(deltaTime) {
    if (disposed) return;
    time += deltaTime;
    grade.uniforms.time.value = time;
    composer.render(deltaTime);
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    composer.dispose();
  }

  const unsubscribe = quality.onChange(applyQuality);
  window.addEventListener('resize', resize);

  return {
    composer,
    update,
    applyQuality,
    dispose: () => {
      unsubscribe();
      window.removeEventListener('resize', resize);
      dispose();
    }
  };
}
