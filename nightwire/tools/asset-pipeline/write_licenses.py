#!/usr/bin/env python3
"""Writes docs/ASSET-LICENSES.md from the shipped third-party asset folders and manifests.
Usage: python3 tools/asset-pipeline/write_licenses.py   (run from nightwire/)"""
import json, os, hashlib, datetime

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
TP = os.path.join(ROOT, 'public', 'assets', 'thirdparty')
FETCHED = '2026-11-10'

def size(p):
    return os.path.getsize(p)

def mb(n):
    return f'{n / 1048576:.2f} MB'

def files(d):
    out = []
    for base, _, fs in os.walk(d):
        for f in sorted(fs):
            out.append(os.path.join(base, f))
    return sorted(out)

L = []
w = L.append
w('# Third-party assets and licenses')
w('')
w('All assets below are shipped under `public/assets/thirdparty/<source>/` and were downloaded on')
w(f'{FETCHED} from public pages without any login, API key or scraping behind authentication.')
w('Only CC0 (public domain dedication) material is used, so redistribution in this repository and in')
w('all builds (web, Electron, Android) is allowed. Attribution is not legally required for CC0; it is given')
w('anyway. No Mixamo or other non-redistributable files are included. Regenerate this file with')
w('`python3 tools/asset-pipeline/write_licenses.py`.')
w('')
total = sum(size(f) for f in files(TP))
w(f'Total size of `public/assets/thirdparty/`: **{mb(total)}** (largest single file: '
  f'{mb(max(size(f) for f in files(TP)))}; no Git LFS needed).')
w('')

# MakeHuman
mh = os.path.join(TP, 'makehuman')
w('## MakeHuman (humans: NPCs, player, first-person hands)')
w('')
w('| Field | Value |')
w('|---|---|')
w('| Source | MakeHuman system assets, CC0 pack: https://files.makehumancommunity.org/asset_packs/makehuman_system_assets/makehuman_system_assets_cc0.zip |')
w('| Tool | MPFB 2.0.18 Blender extension (https://extensions.blender.org/add-ons/mpfb/), used only offline to build the meshes; MPFB code (GPL) is **not** shipped |')
w('| Authors | MakeHuman team (Data Collection AB, Joel Palmius, Jonas Hauquier and contributors) |')
w('| License | CC0 1.0 (https://creativecommons.org/publicdomain/zero/1.0/) for the system assets and the base mesh / targets as released by the MakeHuman project |')
w(f'| Downloaded | {FETCHED} |')
w('| Changes | combined into 8 characters (`tools/asset-pipeline/humans.json`), game-engine rig, retargeted Quaternius clips baked in, meshopt + WebP (2048 px), decimated LOD set (1024 px) |')
w('')
w('| File | Size |')
w('|---|---|')
for f in files(mh):
    w(f'| `{os.path.relpath(f, ROOT)}` | {mb(size(f))} |')
w('')

# Quaternius
q = os.path.join(TP, 'quaternius')
w('## Quaternius Universal Animation Library 1 + 2 (animations, android mannequin)')
w('')
w('| Field | Value |')
w('|---|---|')
w('| Source | https://quaternius.itch.io/universal-animation-library and https://quaternius.itch.io/universal-animation-library-2 (free "Standard" downloads) |')
w('| Author | Quaternius (https://quaternius.com) |')
w('| License | CC0 1.0 (License.txt in both packs: "CC0 1.0 Universal Public Domain Dedication") |')
w(f'| Downloaded | {FETCHED} |')
w('| Use | 21 clips retargeted onto every MakeHuman character (baked into their GLBs); the mannequin itself ships as the security android `quaternius/android.glb` |')
w('')
for f in files(q):
    w(f'- `{os.path.relpath(f, ROOT)}` ({mb(size(f))})')
w('')

# Poly Haven
ph = os.path.join(TP, 'polyhaven')
man = json.load(open(os.path.join(ph, 'manifest.json')))
w('## Poly Haven (HDRI, PBR photo textures, street props)')
w('')
w('All Poly Haven assets are CC0 1.0 (https://polyhaven.com/license). Metadata from the public API')
w('`https://api.polyhaven.com/info/<id>`. Textures converted to WebP (2K / 1K), models simplified and')
w('meshopt-compressed with gltf-transform.')
w('')
w('| Asset | Type | Author(s) | License | Source | Published | Shipped files |')
w('|---|---|---|---|---|---|---|')
for a in man['assets']:
    fs = ', '.join(f'`{x}`' for x in a.get('files', []))
    w(f"| {a['name']} (`{a['id']}`) | {a['kind']} | {', '.join(a['authors'])} | {a['license']} | {a['url']} | {a.get('published','')} | {fs} |")
w('')
w(f"Fetched: {man.get('fetched', FETCHED)}. Folder size: {mb(sum(size(f) for f in files(ph)))}.")
w('')

# own work
w('## Own work (not third-party)')
w('')
w('- `public/assets/models/drone.glb`: security quadcopter modelled procedurally in Blender by')
w('  `tools/asset-pipeline/drone.py` for this project; same license as the game.')
w('- Retargeting, character assembly and compression scripts in `tools/asset-pipeline/`.')
w('')
w('## Not used / excluded')
w('')
w('- Mixamo (Adobe licence forbids redistribution of the raw files), Sketchfab "free" downloads behind')
w('  login, any asset with NC/ND or unclear terms.')
w('')
os.makedirs(os.path.join(ROOT, 'docs'), exist_ok=True)
open(os.path.join(ROOT, 'docs', 'ASSET-LICENSES.md'), 'w').write('\n'.join(L))
print('wrote docs/ASSET-LICENSES.md', len(man['assets']), 'poly haven entries', mb(total))
