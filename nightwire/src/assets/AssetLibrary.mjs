/**
 * NIGHTWIRE — asset library (.mjs)
 * Loads the shipped third-party assets (public/assets/thirdparty, see docs/ASSET-LICENSES.md):
 * meshopt-compressed GLBs with WebP textures (GLTFLoader + MeshoptDecoder from three/examples),
 * Poly Haven PBR texture sets and the HDRI. Every request is cached and never rejects the game:
 * a failed load resolves to null and the caller keeps its procedural fallback.
 * `?assets=0` in the URL disables all of it (fallback test / very weak devices).
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';

export const ASSET_ROOT = '/assets/thirdparty/';

export function assetsDisabled(root = globalThis) {
  try {
    return new URLSearchParams(root.location?.search || '').get('assets') === '0';
  } catch {
    return false;
  }
}

/** Transient failures (aborted request while the main thread compiled shaders, flaky mobile data): retry. */
async function retry(make, tries = 3) {
  let last;
  for (let i = 0; i < tries; i++) {
    try {
      return await make();
    } catch (err) {
      last = err;
      if (/missing|404/.test(String(err?.message || err))) break;
      await new Promise((r) => setTimeout(r, 400 * (i + 1)));
    }
  }
  throw last;
}

export class AssetLibrary {
  constructor(renderer) {
    this.renderer = renderer;
    this.manager = new THREE.LoadingManager();
    this.gltfLoader = new GLTFLoader(this.manager);
    this.gltfLoader.setMeshoptDecoder(MeshoptDecoder);
    this.texLoader = new THREE.TextureLoader(this.manager);
    this.hdrLoader = new RGBELoader(this.manager);
    this.cache = new Map();
    this.failed = [];
    this.loaded = 0;
    this.maxAniso = renderer?.capabilities?.getMaxAnisotropy?.() || 4;
  }

  _once(key, make) {
    if (!this.cache.has(key)) {
      const p = retry(make).then((v) => { this.loaded++; return v; }).catch((err) => {
        this.failed.push(`${key}: ${err?.message || err}`);
        console.warn(`[assets] ${key} failed, procedural fallback stays`, err?.message || err);
        return null;
      });
      this.cache.set(key, p);
    }
    return this.cache.get(key);
  }

  gltf(url) {
    return this._once(url, () => this.gltfLoader.loadAsync(url));
  }

  /** PBR set from Poly Haven: { map, normalMap, roughnessMap, aoMap }; `maps` limits what is loaded (GPU memory). */
  pbr(id, res = '2k', maps = ['diff', 'nor_gl', 'rough', 'ao']) {
    return this._once(`pbr:${id}:${res}:${maps.join(',')}`, async () => {
      const base = `${ASSET_ROOT}polyhaven/textures/${id}/`;
      const load = async (name, srgb) => {
        if (!maps.includes(name)) return undefined;
        try {
          const t = await retry(() => this.texLoader.loadAsync(`${base}${name}_${res}.webp`), 3);
          t.wrapS = t.wrapT = THREE.RepeatWrapping;
          t.anisotropy = Math.min(8, this.maxAniso);
          if (srgb) t.colorSpace = THREE.SRGBColorSpace;
          return t;
        } catch {
          return undefined;
        }
      };
      const [map, normalMap, roughnessMap, aoMap] = await Promise.all([
        load('diff', true), load('nor_gl', false), load('rough', false), load('ao', false),
      ]);
      if (!map && !normalMap && !roughnessMap && !aoMap) throw new Error(`texture set ${id} missing`);
      return { map, normalMap, roughnessMap, aoMap };
    });
  }

  /** Equirect HDR -> PMREM cube texture (for scene.environment / per-material envMap). */
  hdri(id, res = '2k') {
    return this._once(`hdri:${id}:${res}`, async () => {
      const tex = await this.hdrLoader.loadAsync(`${ASSET_ROOT}polyhaven/hdri/${id}_${res}.hdr`);
      tex.mapping = THREE.EquirectangularReflectionMapping;
      const pmrem = new THREE.PMREMGenerator(this.renderer);
      const env = pmrem.fromEquirectangular(tex).texture;
      pmrem.dispose();
      tex.dispose();
      return env;
    });
  }

  stats() {
    return { loaded: this.loaded, failed: this.failed.length, errors: this.failed.slice(0, 5) };
  }
}
