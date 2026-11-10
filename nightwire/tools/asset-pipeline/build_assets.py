#!/usr/bin/env python3
"""
NIGHTWIRE asset pipeline: raw downloads / Blender exports -> shipped, compressed game assets.

  python3 tools/asset-pipeline/build_assets.py --cache <dir> --blender-out <dir> [--gltf-transform <bin>]

  humans   <blender-out>/<name>.glb, <name>_lod.glb -> public/assets/thirdparty/makehuman/  (meshopt, WebP 2048 / 1024)
  android  <blender-out>/android.glb                 -> public/assets/thirdparty/quaternius/
  drone    <blender-out>/drone.glb                   -> public/assets/models/drone.glb
  models   <cache>/<id>/<id>_1k.gltf                 -> public/assets/thirdparty/polyhaven/models/<id>.glb (simplified)
  textures <cache>/<id>/*.jpg                        -> public/assets/thirdparty/polyhaven/textures/<id>/<map>_{2k,1k}.webp
  hdri     <cache>/<id>/<id>_{1k,2k}.hdr             -> public/assets/thirdparty/polyhaven/hdri/
Also writes public/assets/thirdparty/polyhaven/manifest.json (license metadata for docs/ASSET-LICENSES.md).
"""
import argparse, json, os, shutil, subprocess, sys
from PIL import Image, ImageOps

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
PUB = os.path.join(ROOT, "public", "assets")
ap = argparse.ArgumentParser()
ap.add_argument("--cache", required=True)
ap.add_argument("--blender-out", required=True)
ap.add_argument("--gltf-transform", default="gltf-transform")
ap.add_argument("--only", default="")
a = ap.parse_args()
ONLY = set(filter(None, a.only.split(",")))

def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        sys.stderr.write(r.stdout + r.stderr)
        raise SystemExit(f"failed: {' '.join(cmd)}")

def optimize(src, dst, size, simplify=0.0, error=0.0001, keep_nodes=True):
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    cmd = [a.gltf_transform, "optimize", src, dst, "--compress", "meshopt", "--texture-compress", "webp",
           "--texture-size", str(size), "--instance", "false", "--palette", "false"]
    if keep_nodes:
        cmd += ["--flatten", "false", "--join", "false"]
    if simplify:
        cmd += ["--simplify", "true", "--simplify-ratio", str(simplify), "--simplify-error", str(error)]
    else:
        cmd += ["--simplify", "false"]
    run(cmd)
    print(f"{os.path.relpath(dst, ROOT)}  {os.path.getsize(dst) / 1e6:.2f} MB")

def want(k):
    return not ONLY or k in ONLY

# humans + android + drone (Blender exports)
if want("humans"):
    for f in sorted(os.listdir(a.blender_out)):
        if not f.endswith(".glb") or f.startswith(("android", "drone")):
            continue
        lod = f.endswith("_lod.glb")
        optimize(os.path.join(a.blender_out, f), os.path.join(PUB, "thirdparty", "makehuman", f), 1024 if lod else 2048)
if want("android"):
    optimize(os.path.join(a.blender_out, "android.glb"), os.path.join(PUB, "thirdparty", "quaternius", "android.glb"), 1024)
if want("drone"):
    optimize(os.path.join(a.blender_out, "drone.glb"), os.path.join(PUB, "models", "drone.glb"), 1024)

manifest = json.load(open(os.path.join(a.cache, "manifest.json")))
for asset in manifest["assets"]:
    src = os.path.join(a.cache, asset["id"])
    if asset["kind"] == "models" and want("models"):
        gltf = [x for x in asset["files"] if x.endswith(".gltf")][0]
        doc = json.load(open(os.path.join(src, gltf)))
        tris = 0
        for m in doc["meshes"]:
            for p in m["primitives"]:
                acc = doc["accessors"][p["indices"]] if "indices" in p else doc["accessors"][p["attributes"]["POSITION"]]
                tris += acc["count"] // 3
        ratio = min(1.0, 7000 / max(1, tris))
        optimize(os.path.join(src, gltf), os.path.join(PUB, "thirdparty", "polyhaven", "models", asset["id"] + ".glb"), 1024,
                 simplify=ratio if ratio < 0.95 else 0.0, error=0.004)
    elif asset["kind"] == "textures" and want("textures"):
        out = os.path.join(PUB, "thirdparty", "polyhaven", "textures", asset["id"])
        os.makedirs(out, exist_ok=True)
        for f in asset["files"]:
            name = f.split("_2k")[0][len(asset["id"]) + 1:]  # diff | nor_gl | rough | ao
            img = Image.open(os.path.join(src, f))
            if name == "diff" and asset["id"] == "container_side":
                img = ImageOps.grayscale(img).convert("RGB")  # tinted per container in game
            img = img.convert("RGB")
            for res, px in (("2k", 2048), ("1k", 1024)):
                im = img if img.size[0] == px else img.resize((px, px), Image.LANCZOS)
                im.save(os.path.join(out, f"{name}_{res}.webp"), "WEBP", quality=84 if name == "diff" else 90, method=6)
        print(f"textures/{asset['id']}  {sum(os.path.getsize(os.path.join(out, x)) for x in os.listdir(out)) / 1e6:.2f} MB")
    elif asset["kind"] == "hdris" and want("hdri"):
        out = os.path.join(PUB, "thirdparty", "polyhaven", "hdri")
        os.makedirs(out, exist_ok=True)
        for f in asset["files"]:
            shutil.copyfile(os.path.join(src, f), os.path.join(out, f))
        print(f"hdri/{asset['id']}")
os.makedirs(os.path.join(PUB, "thirdparty", "polyhaven"), exist_ok=True)
json.dump(manifest, open(os.path.join(PUB, "thirdparty", "polyhaven", "manifest.json"), "w"), indent=2)
