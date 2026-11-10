"""
NIGHTWIRE asset pipeline: security android -> GLB (Blender 4.5, headless).

  blender -b --python ual_android.py -- <humans.json> <out.glb>   (NW_UAL_DIR = UAL download dir)

Takes the CC0 Quaternius UAL mannequin (smooth hard-surface body on the UE-style rig), keeps its
two material slots (M_Main shell / M_Joints) for the game's PBR robot materials, adds the same
retargeted clip set as the humans (identical clip names, so one animator drives both) and exports
a skinned GLB.
"""
import bpy, sys, os, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from retarget import retarget_clips

argv = sys.argv[sys.argv.index("--") + 1:]
spec = json.load(open(argv[0]))
OUT = argv[1]
UAL = {k: os.path.join(os.environ.get("NW_UAL_DIR", "."), v) for k, v in spec["ual"].items()}

for o in list(bpy.data.objects):
    bpy.data.objects.remove(o)
for a in list(bpy.data.actions):
    bpy.data.actions.remove(a)
bpy.ops.import_scene.gltf(filepath=UAL["ual1"])
for o in list(bpy.data.objects):
    if o.type not in ("ARMATURE", "MESH") or o.name.startswith("Icosphere"):
        bpy.data.objects.remove(o)
for a in list(bpy.data.actions):
    bpy.data.actions.remove(a)
arm = [o for o in bpy.data.objects if o.type == "ARMATURE"][0]
arm.name = "android"
body = [o for o in bpy.data.objects if o.type == "MESH"][0]
body.name = "android_body"
if arm.animation_data:
    arm.animation_data.action = None

retarget_clips(arm, spec["clips"], UAL)

bpy.ops.object.select_all(action="DESELECT")
for o in bpy.data.objects:
    o.select_set(True)
bpy.ops.export_scene.gltf(
    filepath=OUT, export_format="GLB", use_selection=True,
    export_skins=True, export_animations=True, export_animation_mode="ACTIONS",
    export_force_sampling=True, export_optimize_animation_size=True, export_anim_slide_to_zero=True,
    export_reset_pose_bones=True, export_morph=False, export_yup=True, export_materials="EXPORT",
)
print("EXPORTED", OUT)
