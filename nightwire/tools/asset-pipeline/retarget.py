"""
NIGHTWIRE asset pipeline: retarget Quaternius Universal Animation Library clips (CC0) onto any
armature with UE-style bone names (MPFB game_engine rig, UAL mannequin).

World-space rotation transfer with per-bone rest alignment: for every mapped bone the source's
world rotation delta from its rest is applied to the target rest rotated into the source rest
direction, so a T-pose source drives an A-pose target without bent limbs. The pelvis translation
is scaled by the hip-height ratio. One baked action per clip (30 fps), named after clip["name"].
"""
import bpy, math
from mathutils import Matrix


def _import_ual(path):
    before = set(bpy.data.objects)
    acts_before = set(bpy.data.actions)
    bpy.ops.import_scene.gltf(filepath=path)
    new = [o for o in bpy.data.objects if o not in before]
    arm = [o for o in new if o.type == "ARMATURE"][0]
    for o in new:
        if o is not arm:
            bpy.data.objects.remove(o)
    acts = {a.name: a for a in bpy.data.actions if a not in acts_before}
    return arm, acts


def _facing(arm):
    b = arm.data.bones
    return math.copysign(1, (arm.matrix_world @ b["ball_l"].head_local).y - (arm.matrix_world @ b["foot_l"].head_local).y)


def _src_name(S, n):
    for cand in (n, n.capitalize(), n.lower(), {"Root": "root", "head": "Head"}.get(n, n)):
        if cand in S.data.bones:
            return cand
    return None


def retarget_clips(T, clips, ual_paths):
    srcs = {}
    for key, path in ual_paths.items():
        if not any(c["pack"] == key for c in clips):
            continue
        a, acts = _import_ual(path)
        if _facing(a) != _facing(T):
            a.rotation_euler.z += math.pi
            bpy.context.view_layer.update()
        srcs[key] = (a, acts)

    for pb in T.pose.bones:
        pb.rotation_mode = "QUATERNION"
    Tw = T.matrix_world.copy()
    Tw_rot_inv = Tw.to_quaternion().inverted()
    order = []

    def walk(b):
        order.append(b.name)
        for c in b.children:
            walk(c)
    for b in T.data.bones:
        if b.parent is None:
            walk(b)
    root_name = order[0]

    def prepare(S):
        Sw = S.matrix_world
        K = {}
        for n in order:
            s = _src_name(S, n)
            if not s or n == root_name:
                continue
            sb = S.data.bones[s]; tb = T.data.bones[n]
            s_rot = (Sw @ sb.matrix_local).to_quaternion()
            t_rot = (Tw @ tb.matrix_local).to_quaternion()
            ds = ((Sw @ sb.tail_local) - (Sw @ sb.head_local)).normalized()
            dt = ((Tw @ tb.tail_local) - (Tw @ tb.head_local)).normalized()
            fix = ds.rotation_difference(dt)
            K[n] = (s, fix.inverted() @ t_rot, s_rot.inverted())
        pel_s = S.data.bones[_src_name(S, "pelvis")]
        ratio = (Tw @ T.data.bones["pelvis"].head_local).z / (Sw @ pel_s.head_local).z
        return K, (Sw @ pel_s.head_local).copy(), ratio

    bpy.context.scene.render.fps = 30
    names = set()
    for clip in clips:
        S, acts = srcs[clip["pack"]]
        sa = acts.get(clip["src"])
        if sa is None:
            raise SystemExit(f"clip {clip['src']} missing in {clip['pack']}")
        S.animation_data_create()
        S.animation_data.action = sa
        if hasattr(S.animation_data, "action_slot") and sa.slots:
            S.animation_data.action_slot = sa.slots[0]
        K, pel_rest, ratio = prepare(S)
        f0, f1 = int(sa.frame_range[0]), int(sa.frame_range[1])
        act = bpy.data.actions.new(clip["name"])
        act.use_fake_user = True
        names.add(clip["name"])
        T.animation_data_create()
        T.animation_data.action = act
        prevq = {}
        t_rest_pel = T.data.bones["pelvis"].head_local.copy()
        for f in range(f0, f1 + 1):
            bpy.context.scene.frame_set(f)
            Sw = S.matrix_world
            pose = {}
            for n in order:
                tb = T.data.bones[n]
                if tb.parent:
                    M_off = pose[tb.parent.name] @ tb.parent.matrix_local.inverted() @ tb.matrix_local
                else:
                    M_off = tb.matrix_local.copy()
                if n in K:
                    s, k, s_rest_inv = K[n]
                    q_s = (Sw @ S.pose.bones[s].matrix).to_quaternion()
                    d_rot = Tw_rot_inv @ ((q_s @ s_rest_inv) @ k)
                    loc = M_off.to_translation()
                    if n == "pelvis":
                        sp = Sw @ S.pose.bones[s].head
                        loc = t_rest_pel + Tw_rot_inv @ ((sp - pel_rest) * ratio)
                    D = Matrix.LocRotScale(loc, d_rot, None)
                else:
                    D = M_off
                pose[n] = D
                basis = M_off.inverted() @ D
                pb = T.pose.bones[n]
                q = basis.to_quaternion().normalized()
                if n in prevq and prevq[n].dot(q) < 0:
                    q.negate()
                prevq[n] = q
                pb.rotation_quaternion = q
                pb.keyframe_insert("rotation_quaternion", frame=f - f0, group=n)
                if n == "pelvis":
                    pb.location = basis.to_translation()
                    pb.keyframe_insert("location", frame=f - f0, group=n)
        T.animation_data.action = None
        for pb in T.pose.bones:
            pb.rotation_quaternion = (1, 0, 0, 0)
            pb.location = (0, 0, 0)

    for S, acts in srcs.values():
        bpy.data.objects.remove(S)
        for a in acts.values():
            if a.name not in names:
                bpy.data.actions.remove(a)
    bpy.context.scene.frame_set(0)
