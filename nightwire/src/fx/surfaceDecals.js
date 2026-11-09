/**
 * Machala Texture & Surface Detail Pass v1
 * Canvas-generated decal atlas for surface storytelling.
 */

import * as THREE from 'three';

function createDecalAtlas() {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');

  context.fillStyle = '#000000';
  context.fillRect(0, 0, size, size);

  context.globalAlpha = 0.9;

  context.fillStyle = '#101216';
  context.beginPath();
  context.arc(96, 96, 62, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = '#3d0a0d';
  context.beginPath();
  context.arc(288, 96, 48, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = '#04060a';
  context.beginPath();
  context.ellipse(96, 320, 78, 48, 0.3, 0, Math.PI * 2);
  context.fill();

  context.strokeStyle = '#0d1014';
  context.lineWidth = 7;
  context.beginPath();
  context.moveTo(250, 250);
  context.lineTo(330, 330);
  context.lineTo(300, 390);
  context.stroke();

  context.fillStyle = '#07080a';
  context.fillRect(390, 280, 90, 34);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createSurfaceDecalSystem({ scene, maxDecals = 220 }) {
  const atlas = createDecalAtlas();
  const geometry = new THREE.PlaneGeometry(1, 1);
  const decals = [];
  let disposed = false;

  function addDecal({ position, normal = new THREE.Vector3(0, 1, 0), size = 1, opacity = 0.75, rotation = 0 }) {
    if (disposed) return null;

    const material = new THREE.MeshBasicMaterial({
      map: atlas,
      transparent: true,
      opacity,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -4,
      polygonOffsetUnits: -4
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(position);
    mesh.scale.setScalar(size);
    mesh.rotation.z = rotation;

    const target = position.clone().add(normal);
    mesh.lookAt(target);

    scene.add(mesh);
    decals.push(mesh);

    if (decals.length > maxDecals) {
      const oldest = decals.shift();
      scene.remove(oldest);
      oldest.material.dispose();
    }

    return mesh;
  }

  function addOilSlick(position, scale = 1) {
    return addDecal({ position, size: 1.8 * scale, opacity: 0.68, rotation: Math.random() * Math.PI });
  }

  function addCrack(position, scale = 1) {
    return addDecal({ position, size: 2.2 * scale, opacity: 0.55, rotation: Math.random() * Math.PI });
  }

  function addTireMark(position, scale = 1) {
    return addDecal({ position, size: 1.4 * scale, opacity: 0.42, rotation: Math.random() * Math.PI });
  }

  function clear() {
    decals.forEach((decal) => {
      scene.remove(decal);
      decal.material.dispose();
    });
    decals.length = 0;
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    clear();
    geometry.dispose();
    atlas.dispose();
  }

  return {
    addDecal,
    addOilSlick,
    addCrack,
    addTireMark,
    clear,
    dispose,
    count: () => decals.length
  };
}
