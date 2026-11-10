# Asset pipeline (hyperreal pass)

Offline tools that produced everything under `public/assets/thirdparty/` and `public/assets/models/`.
Nothing here runs in the game. Licenses and sources: `docs/ASSET-LICENSES.md`.

| Step | Command (from `nightwire/`) | Output |
|---|---|---|
| Poly Haven download (public API, CC0) | `node tools/asset-pipeline/fetch-polyhaven.mjs <cache-dir>` | raw HDRI / textures / models + `manifest.json` |
| Human build (Blender 4.5 + MPFB 2.0.18 + MakeHuman CC0 system assets) | `blender -b --python tools/asset-pipeline/mpfb_human.py -- tools/asset-pipeline/humans.json <name> <out.glb> [--lod]` (`NW_UAL_DIR` = folder with the Quaternius UAL packs) | one GLB per character with 21 retargeted clips |
| Android mannequin | `blender -b --python tools/asset-pipeline/ual_android.py -- tools/asset-pipeline/humans.json <out.glb>` | `android.glb` |
| Drone (own model) | `blender -b --python tools/asset-pipeline/drone.py -- <out.glb>` | `drone.glb` |
| Compress + install | `python3 tools/asset-pipeline/build_assets.py --cache <ph-cache> --blender-out <dir> --gltf-transform <bin>` | meshopt GLBs, WebP textures, HDRIs, manifest |
| License doc | `python3 tools/asset-pipeline/write_licenses.py` | `docs/ASSET-LICENSES.md` |

`retarget.py` holds the shared world-space retargeting (UAL rig → MakeHuman game-engine rig): per-bone
rest alignment, hip translation scaled by the hip-height ratio, one baked action per clip.
Compression: gltf-transform 4.5 (`meshopt`, WebP textures, 2048 px full / 1024 px LOD). No Git LFS:
the largest file is 5.6 MB.
