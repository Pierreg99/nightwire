/**
 * NIGHTWIRE v2.0.1 — Asset Binding (.mjs)
 * Connects procedural assets to UI and the world renderer.
 */

import * as THREE from 'three';

export function bindAssetsToUIAndWorld({ phone, scene, assets }) {
  if (!assets) {
    return {
      phoneAsset: null,
      worldPreview: null,
      dispose() {}
    };
  }

  const phoneAsset = assets['phone-ui']?.() || null;

  if (phoneAsset && phone?.root) {
    phone.root.style.backgroundImage = `url(${phoneAsset})`;
    phone.root.style.backgroundSize = 'cover';
    phone.root.style.backgroundPosition = 'center';
    phone.root.style.backgroundRepeat = 'no-repeat';
  }

  const dockStreetAsset = assets['dock-street']?.() || null;
  let worldPreview = null;

  if (dockStreetAsset && scene) {
    const texture = new THREE.TextureLoader().load(dockStreetAsset);
    texture.colorSpace = THREE.SRGBColorSpace;

    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0.85
    });

    const geometry = new THREE.PlaneGeometry(24, 13.5);
    worldPreview = new THREE.Mesh(geometry, material);
    worldPreview.name = 'nightwire-zone-preview';
    worldPreview.position.set(0, 8, -48);
    scene.add(worldPreview);
  }

  function dispose() {
    if (worldPreview) {
      scene.remove(worldPreview);
      worldPreview.geometry.dispose();
      worldPreview.material.map?.dispose();
      worldPreview.material.dispose();
      worldPreview = null;
    }
  }

  return {
    phoneAsset,
    worldPreview,
    dispose
  };
}
