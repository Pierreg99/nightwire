"""
NIGHTWIRE asset pipeline: security drone -> GLB (Blender 4.5, headless).

  blender -b --python drone.py -- <out.glb>

Hard-surface quadcopter modelled from scratch for NIGHTWIRE (own work, CC0 like the rest of the
pipeline output): bevelled shell with panel seams, carbon arms, motor bells, two-blade props as
separate nodes rotor_0..3 (spun in game), camera gimbal with glass lens, LED strips and a
searchlight anchor node "spot". Materials are named so the game can swap in PBR textures.
"""
import bpy, bmesh, sys, math
from mathutils import Vector

OUT = sys.argv[sys.argv.index("--") + 1:][0]
for o in list(bpy.data.objects):
    bpy.data.objects.remove(o)

def material(name, color, metal=0.0, rough=0.5, emit=None):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*color, 1)
    b.inputs["Metallic"].default_value = metal
    b.inputs["Roughness"].default_value = rough
    if emit:
        b.inputs["Emission Color"].default_value = (*emit, 1)
        b.inputs["Emission Strength"].default_value = 4.0
    return m

M = {
    "shell": material("drone_shell", (0.06, 0.065, 0.07), 0.6, 0.35),
    "carbon": material("drone_carbon", (0.02, 0.02, 0.022), 0.2, 0.45),
    "motor": material("drone_motor", (0.25, 0.26, 0.28), 1.0, 0.25),
    "rotor": material("drone_rotor", (0.015, 0.015, 0.017), 0.0, 0.4),
    "led": material("drone_led", (0.2, 0.9, 1.0), 0.0, 0.3, emit=(0.24, 0.88, 1.0)),
    "warn": material("drone_warn", (1.0, 0.18, 0.3), 0.0, 0.3, emit=(1.0, 0.18, 0.4)),
    "lens": material("drone_lens", (0.01, 0.012, 0.015), 0.0, 0.05),
}

def finish(obj, mat, bevel=0.0, segs=2, subd=0, smooth=True):
    obj.data.materials.append(mat)
    bpy.context.view_layer.objects.active = obj
    if bevel:
        m = obj.modifiers.new("bevel", "BEVEL"); m.width = bevel; m.segments = segs; m.limit_method = "ANGLE"
    if subd:
        m = obj.modifiers.new("subd", "SUBSURF"); m.levels = subd; m.render_levels = subd
    for m in list(obj.modifiers):
        bpy.ops.object.modifier_apply(modifier=m.name)
    if smooth:
        bpy.ops.object.shade_auto_smooth(angle=math.radians(35))
    return obj

def box(name, size, loc, mat, bevel=0.01):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    o = bpy.context.active_object; o.name = name; o.scale = size
    bpy.ops.object.transform_apply(scale=True)
    return finish(o, mat, bevel, 3)

def cyl(name, r, depth, loc, mat, rot=(0, 0, 0), verts=32, bevel=0.004):
    bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=depth, location=loc, rotation=rot, vertices=verts)
    o = bpy.context.active_object; o.name = name
    return finish(o, mat, bevel, 2)

parts = []
# shell: rounded body with a raised spine and a tapered nose
parts.append(box("body", (0.34, 0.22, 0.09), (0, 0, 0), M["shell"], 0.03))
parts.append(box("spine", (0.2, 0.1, 0.04), (0, -0.02, 0.06), M["shell"], 0.015))
parts.append(box("nose", (0.16, 0.08, 0.06), (0, 0.15, -0.005), M["shell"], 0.02))
parts.append(box("belly", (0.26, 0.16, 0.03), (0, 0, -0.058), M["carbon"], 0.01))
parts.append(box("battery", (0.12, 0.18, 0.035), (0, -0.04, 0.085), M["carbon"], 0.008))
# panel seam strips (thin dark insets read as seams in the normal-mapped shell)
for x in (-0.1, 0.1):
    parts.append(box(f"seam{x}", (0.004, 0.2, 0.004), (x, 0, 0.047), M["carbon"], 0))
# LED strips: cyan running lights, magenta rear warning
parts.append(box("led_l", (0.006, 0.12, 0.012), (0.172, 0.02, 0.0), M["led"], 0))
parts.append(box("led_r", (0.006, 0.12, 0.012), (-0.172, 0.02, 0.0), M["led"], 0))
parts.append(box("led_tail", (0.12, 0.006, 0.012), (0, -0.112, 0.01), M["warn"], 0))

motors = []
for i, (sx, sy) in enumerate([(1, 1), (-1, 1), (-1, -1), (1, -1)]):
    a = Vector((sx * 0.3, sy * 0.24, 0.02))
    mid = a * 0.5
    ang = math.atan2(a.y, a.x)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.016, depth=a.length, location=mid, rotation=(0, math.pi / 2, ang), vertices=16)
    arm = bpy.context.active_object; arm.name = f"arm_{i}"
    finish(arm, M["carbon"], 0.003)
    parts.append(arm)
    parts.append(cyl(f"motor_{i}", 0.034, 0.045, (a.x, a.y, a.z + 0.01), M["motor"]))
    parts.append(cyl(f"cap_{i}", 0.02, 0.012, (a.x, a.y, a.z + 0.04), M["shell"]))
    parts.append(cyl(f"guard_{i}", 0.155, 0.012, (a.x, a.y, a.z + 0.03), M["carbon"], verts=48, bevel=0.002))
    motors.append(Vector((a.x, a.y, a.z + 0.05)))

# hollow the prop guards (ring): boolean with a slightly smaller cylinder
for i, g in enumerate([p for p in parts if p.name.startswith("guard_")]):
    bpy.ops.mesh.primitive_cylinder_add(radius=0.145, depth=0.05, location=g.location if g.location.length else motors[i] - Vector((0, 0, 0.02)), vertices=48)
    cutter = bpy.context.active_object
    cutter.location = (motors[i].x, motors[i].y, motors[i].z - 0.02)
    mod = g.modifiers.new("hole", "BOOLEAN"); mod.object = cutter; mod.operation = "DIFFERENCE"
    bpy.context.view_layer.objects.active = g
    bpy.ops.object.modifier_apply(modifier="hole")
    bpy.data.objects.remove(cutter)

# gimbal + camera
gimbal_parts = []
gimbal_parts.append(cyl("gimbal_yoke", 0.03, 0.05, (0, 0.12, -0.085), M["motor"]))
bpy.ops.mesh.primitive_uv_sphere_add(radius=0.045, location=(0, 0.12, -0.12), segments=32, ring_count=16)
ball = bpy.context.active_object; ball.name = "gimbal_ball"; finish(ball, M["shell"])
gimbal_parts.append(ball)
gimbal_parts.append(cyl("lens", 0.022, 0.02, (0, 0.163, -0.12), M["lens"], rot=(math.pi / 2, 0, 0)))
gimbal_parts.append(cyl("lens_ring", 0.027, 0.012, (0, 0.157, -0.12), M["motor"], rot=(math.pi / 2, 0, 0)))

# join static parts
bpy.ops.object.select_all(action="DESELECT")
for p in parts:
    p.select_set(True)
bpy.context.view_layer.objects.active = parts[0]
bpy.ops.object.join()
hull = bpy.context.active_object; hull.name = "drone_hull"
bpy.ops.object.select_all(action="DESELECT")
for p in gimbal_parts:
    p.select_set(True)
bpy.context.view_layer.objects.active = gimbal_parts[1]
bpy.ops.object.join()
gimbal = bpy.context.active_object; gimbal.name = "gimbal"
bpy.ops.object.origin_set(type="ORIGIN_CURSOR")

root = bpy.data.objects.new("drone", None)
bpy.context.scene.collection.objects.link(root)
hull.parent = root
gimbal.parent = root
# props: two twisted blades per motor, pivot at the motor axis
for i, m in enumerate(motors):
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, 0))
    blade = bpy.context.active_object
    blade.scale = (0.27, 0.026, 0.004)
    bpy.ops.object.transform_apply(scale=True)
    tw = blade.modifiers.new("twist", "SIMPLE_DEFORM"); tw.deform_method = "TWIST"; tw.angle = math.radians(28); tw.deform_axis = "X"
    finish(blade, M["rotor"], 0.002)
    blade.name = f"rotor_{i}"
    blade.location = m
    blade.rotation_euler.z = i * 0.7
    blade.parent = root
spot = bpy.data.objects.new("spot", None)
spot.location = (0, 0.17, -0.12)
spot.parent = root
bpy.context.scene.collection.objects.link(spot)

bpy.ops.object.select_all(action="SELECT")
bpy.ops.export_scene.gltf(filepath=OUT, export_format="GLB", use_selection=True, export_yup=True,
                          export_materials="EXPORT", export_apply=True)
print("EXPORTED", OUT)
