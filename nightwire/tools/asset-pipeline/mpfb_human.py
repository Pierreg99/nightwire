"""
NIGHTWIRE asset pipeline: realistic human -> GLB (Blender 4.5 + MPFB 2.0.18, headless).

  blender -b --python mpfb_human.py -- <spec.json> <name> <out.glb> [--lod]

Builds a MakeHuman/MPFB human (CC0 base mesh, skins, eyes, brows, lashes, hair, clothes from the
"makehuman_system_assets" CC0 pack) on the MPFB "game_engine" rig (UE-style bone names), retargets
the CC0 Quaternius Universal Animation Library clips onto it (world-space rotation transfer with
per-bone rest alignment, so the T-pose source drives the A-pose target correctly), bakes one action
per clip and exports a skinned, animated GLB. --lod decimates the meshes and halves the textures
for the MEDIUM / MOBILE presets.
"""
import bpy, sys, os, json, math
from mathutils import Matrix, Quaternion, Vector

argv = sys.argv[sys.argv.index("--") + 1:]
SPEC, NAME, OUT = argv[0], argv[1], argv[2]
LOD = "--lod" in argv
spec_all = json.load(open(SPEC))
spec = spec_all["characters"][NAME]
UAL = {k: os.path.join(os.environ.get("NW_UAL_DIR", "."), v) for k, v in spec_all["ual"].items()}
CLIPS = spec_all["clips"]

from bl_ext.user_default.mpfb.services.humanservice import HumanService
from bl_ext.user_default.mpfb.services.targetservice import TargetService
from bl_ext.user_default.mpfb.services.locationservice import LocationService

DATA = LocationService.get_user_data()
for o in list(bpy.data.objects):
    bpy.data.objects.remove(o)

info = HumanService._create_default_human_info_dict()
info["phenotype"].update(spec["phenotype"])
info["rig"] = "game_engine"
info["eyes"] = "high-poly/high-poly.mhclo"
info["eyebrows"] = spec["eyebrows"]
info["eyelashes"] = spec.get("eyelashes", "eyelashes02/eyelashes02.mhclo")
info["teeth"] = "teeth_base/teeth_base.mhclo"
info["hair"] = spec.get("hair", "")
info["clothes"] = spec["clothes"]
info["skin_mhmat"] = spec["skin"]
info["skin_material_type"] = "MAKESKIN"
settings = HumanService.get_default_deserialization_settings()
settings["subdiv_levels"] = 0
basemesh = HumanService.deserialize_from_dict(info, settings)
rig = basemesh.parent
rig.name = "rig"
rig.data.name = "rig"

# ---------- bake shape keys + helper / delete masks into plain skinned meshes ----------
bpy.context.view_layer.objects.active = basemesh
TargetService.bake_targets(basemesh)
for m in list(basemesh.modifiers):
    if m.type != "ARMATURE":
        bpy.context.view_layer.objects.active = basemesh
        bpy.ops.object.modifier_apply(modifier=m.name)

# ---------- materials: plain Principled BSDF from the MakeHuman .mhmat files ----------
def parse_mhmat(path):
    d = {}
    for line in open(path, encoding="utf-8", errors="ignore"):
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        k, _, v = line.partition(" ")
        d[k] = v.strip()
    return d

def mhmat_for(obj):
    suffix = obj.name.split(".", 1)[1] if "." in obj.name else ""
    if obj is basemesh:
        return os.path.join(DATA, "skins", spec["skin"])
    if suffix == "high-poly":
        return os.path.join(DATA, "eyes", "materials", spec.get("eye_color", "brown") + ".mhmat")
    for sub in ("clothes", "hair", "eyebrows", "eyelashes", "teeth"):
        p = os.path.join(DATA, sub, suffix, suffix + ".mhmat")
        if os.path.exists(p):
            return p
    return None

def load_img(path, max_size):
    img = bpy.data.images.load(path, check_existing=True)
    if max_size and max(img.size) > max_size:
        img.scale(max_size, max_size)
    return img

def build_material(obj):
    path = mhmat_for(obj)
    mat = bpy.data.materials.new(obj.name.split(".")[-1] if obj is not basemesh else "skin")
    mat.use_nodes = True
    nt = mat.node_tree
    bsdf = nt.nodes["Principled BSDF"]
    bsdf.inputs["Roughness"].default_value = 0.55
    if not path or not os.path.exists(path):
        return mat
    d = parse_mhmat(path)
    base = os.path.dirname(path)
    tex_max = 1024 if LOD else 2048
    alpha = d.get("transparent", "False") == "True" and obj is not basemesh
    if "diffuseTexture" in d:
        img = load_img(os.path.join(base, os.path.basename(d["diffuseTexture"])), tex_max)
        tn = nt.nodes.new("ShaderNodeTexImage"); tn.image = img
        nt.links.new(tn.outputs["Color"], bsdf.inputs["Base Color"])
        if alpha:
            nt.links.new(tn.outputs["Alpha"], bsdf.inputs["Alpha"])
            mat.surface_render_method = "DITHERED"
    nkey = d.get("normalmapTexture")
    if nkey:
        img = load_img(os.path.join(base, os.path.basename(nkey)), tex_max)
        img.colorspace_settings.name = "Non-Color"
        tn = nt.nodes.new("ShaderNodeTexImage"); tn.image = img
        nm = nt.nodes.new("ShaderNodeNormalMap")
        nt.links.new(tn.outputs["Color"], nm.inputs["Color"])
        nt.links.new(nm.outputs["Normal"], bsdf.inputs["Normal"])
    if obj is basemesh:
        bsdf.inputs["Roughness"].default_value = 0.5
    return mat

for obj in [o for o in bpy.data.objects if o.type == "MESH"]:
    if obj.name.endswith("tongue01"):
        bpy.data.objects.remove(obj)
        continue
    mat = build_material(obj)
    obj.data.materials.clear()
    obj.data.materials.append(mat)
    obj.name = obj.name.replace("Human.", "").replace("Human", "body")
    if LOD:
        dec = obj.modifiers.new("lod", "DECIMATE")
        dec.ratio = 0.35 if obj is basemesh or len(obj.data.vertices) > 1500 else 0.6
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.modifier_apply(modifier="lod")

# ---------- retarget the Universal Animation Library onto the game_engine rig ----------
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from retarget import retarget_clips
retarget_clips(rig, CLIPS, UAL)

bpy.ops.object.select_all(action="DESELECT")
for o in bpy.data.objects:
    o.select_set(True)
bpy.ops.export_scene.gltf(
    filepath=OUT, export_format="GLB", use_selection=True,
    export_skins=True, export_animations=True, export_animation_mode="ACTIONS",
    export_force_sampling=True, export_optimize_animation_size=True, export_anim_slide_to_zero=True,
    export_reset_pose_bones=True, export_morph=False, export_apply=False,
    export_image_format="AUTO", export_yup=True, export_texcoords=True, export_normals=True,
    export_tangents=False, export_materials="EXPORT",
)
if "--blend" in argv:
    bpy.ops.wm.save_as_mainfile(filepath=OUT.replace(".glb", ".blend"))
print("EXPORTED", OUT)
