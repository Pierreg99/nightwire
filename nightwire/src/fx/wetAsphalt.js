import * as THREE from 'three';

/**
 * Wet lane on top of MeshPhysicalMaterial so shadows, fog, and the env map stay.
 * Chunk names are Three r170 ShaderLib includes, replaced once in onBeforeCompile.
 */
export function wetAsphaltMaterial(map) {
  const material = new THREE.MeshPhysicalMaterial({
    map: map || null,
    color: 0x9aa8b4,
    roughness: 0.22,
    metalness: 0.42,
    envMapIntensity: 1.35,
    clearcoat: 0.62,
    clearcoatRoughness: 0.22,
  });
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uWetTime = { value: 0 };
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWetWorld;')
      .replace(
        '#include <project_vertex>',
        '#include <project_vertex>\nvWetWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;',
      );
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uWetTime;\nvarying vec3 vWetWorld;')
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        float wetLane = 1.0 - smoothstep(5.0, 14.0, abs(vWetWorld.x));
        diffuseColor.rgb *= mix(1.0, 0.68, wetLane);`,
      )
      .replace(
        '#include <roughnessmap_fragment>',
        `#include <roughnessmap_fragment>
        float wetLaneR = 1.0 - smoothstep(6.0, 14.0, abs(vWetWorld.x));
        roughnessFactor = mix(roughnessFactor, 0.07, wetLaneR * 0.75);
        float rip = sin(vWetWorld.x * 2.7 + uWetTime * 0.55) * sin(vWetWorld.z * 1.9 - uWetTime * 0.4);
        roughnessFactor = clamp(roughnessFactor + rip * 0.035, 0.045, 1.0);`,
      );
    material.userData.wetShader = shader;
  };
  material.onBeforeRender = () => {
    const shader = material.userData.wetShader;
    if (shader) shader.uniforms.uWetTime.value = performance.now() * 0.001;
  };
  return material;
}
