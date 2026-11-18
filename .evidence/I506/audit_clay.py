import bpy, math, mathutils
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.render.engine = "BLENDER_EEVEE"
sc.render.resolution_x = 960
sc.render.resolution_y = 540
sc.render.film_transparent = False
sc.view_settings.view_transform = "Standard"
w = bpy.data.worlds.new("World")
sc.world = w
w.use_nodes = True
w.node_tree.nodes["Background"].inputs[0].default_value = (0.012, 0.014, 0.02, 1.0)

def sun(name, energy, rot):
    d = bpy.data.lights.new(name, "SUN"); d.energy = energy
    o = bpy.data.objects.new(name, d); o.rotation_euler = rot
    sc.collection.objects.link(o)
sun("key", 3.2, (math.radians(55), 0, math.radians(125)))
sun("fill", 1.1, (math.radians(110), 0, math.radians(-60)))
sun("rim", 2.0, (math.radians(-35), math.radians(20), math.radians(20)))
cd = bpy.data.cameras.new("cam"); cd.lens = 50
cam = bpy.data.objects.new("cam", cd)
sc.collection.objects.link(cam); sc.camera = cam

def look_at(cam, loc, target=(0,0,0)):
    cam.location = loc
    d = mathutils.Vector(target) - mathutils.Vector(loc)
    cam.rotation_euler = d.to_track_quat('-Z','Y').to_euler()

def clear_meshes():
    # Remove meshes + orphan mesh data only. Materials are DELIBERATELY kept alive
    # across imports (v1 crash: deleting 0-user materials freed the clay/sil
    # pointers between assets -> "StructRNA of type Material has been removed").
    # One-shot headless run, so the small material leak is harmless.
    for o in list(bpy.data.objects):
        if o.type == "MESH":
            bpy.data.objects.remove(o, do_unlink=True)
    for me in list(bpy.data.meshes):
        if me.users == 0: bpy.data.meshes.remove(me)

def import_glb(path):
    clear_meshes()
    bpy.ops.import_scene.gltf(filepath=path)
    objs = [o for o in bpy.context.selected_objects if o.type == "MESH"]
    return objs

def bbox_sphere(objs):
    mn = mathutils.Vector((1e9,1e9,1e9)); mx = mathutils.Vector((-1e9,-1e9,-1e9))
    for o in objs:
        for c in o.bound_box:
            wv = o.matrix_world @ mathutils.Vector(c)
            mn = mathutils.Vector((min(mn.x,wv.x),min(mn.y,wv.y),min(mn.z,wv.z)))
            mx = mathutils.Vector((max(mx.x,wv.x),max(mx.y,wv.y),max(mx.z,wv.z)))
    c = (mn+mx)/2; r = (mx-mn).length/2
    return c, r

BASE = r"E:/Game/.evidence/I506/"
ASSETS = [
    ("hunter",  r"E:/Game/assets/enemy_hunter.glb"),
    ("gunship", r"E:/Game/assets/enemy_gunship.glb"),
    ("sentry",  r"E:/Game/assets/enemy_sentry.glb"),
    ("wasp",    r"E:/Game/assets/enemy_wasp.glb"),
    ("warden",  r"E:/Game/assets/warden.glb"),
    ("stinger", r"E:/Game/assets/stinger.glb"),
    ("drone",   r"E:/Game/assets/drone.glb"),
    ("flyer",   r"E:/Game/assets/flyer.glb"),
    ("boss",    r"E:/Game/assets/boss.glb"),
]

# Create clay + sil ONCE, before the loop, so they outlive every import_glb call.
clay = bpy.data.materials.new("clay"); clay.use_nodes = True
bb = clay.node_tree.nodes["Principled BSDF"]
bb.inputs["Base Color"].default_value = (0.72, 0.72, 0.72, 1.0)
bb.inputs["Roughness"].default_value = 0.55
sil = bpy.data.materials.new("sil"); sil.use_nodes = True
bb = sil.node_tree.nodes["Principled BSDF"]
bb.inputs["Base Color"].default_value = (0.0, 0.0, 0.0, 1.0)
bb.inputs["Roughness"].default_value = 1.0

for tag, path in ASSETS:
    objs = import_glb(path)
    c, r = bbox_sphere(objs)
    tris = sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in objs)
    print("AUDIT", tag, "meshes=%d tris=%d center=%s radius=%.4f" % (len(objs), tris, [round(v,4) for v in c], r), flush=True)
    for o in objs:
        print("  NODE", o.name, "tris=", sum(len(p.vertices)-2 for p in o.data.polygons), flush=True)
    views = {
        "f34":  (( c.x + 1.9*r, c.y - 2.1*r, c.z + 0.9*r), (c.x,c.y,c.z)),
        "side": (( c.x - 0.1*r, c.y - 3.0*r, c.z + 0.15*r), (c.x,c.y,c.z)),
        "top":  (( c.x + 0.2*r, c.y - 0.2*r, c.z + 3.0*r), (c.x,c.y,c.z)),
    }
    # pass 1: clay
    for o in objs:
        o.data.materials.clear(); o.data.materials.append(clay)
    for name,(loc,tgt) in views.items():
        look_at(cam, loc, tgt)
        sc.render.filepath = BASE + "aud_%s_%s_clay.png" % (tag, name)
        bpy.ops.render.render(write_still=True)
    # pass 2: tint (original materials)
    objs = import_glb(path)
    for name,(loc,tgt) in views.items():
        look_at(cam, loc, tgt)
        sc.render.filepath = BASE + "aud_%s_%s_tint.png" % (tag, name)
        bpy.ops.render.render(write_still=True)
    # pass 3: silhouette (flat black on white, f34 only)
    objs = import_glb(path)
    w.node_tree.nodes["Background"].inputs[0].default_value = (1.0, 1.0, 1.0, 1.0)
    for o in objs:
        o.data.materials.clear(); o.data.materials.append(sil)
    look_at(cam, views["f34"][0], views["f34"][1])
    sc.render.filepath = BASE + "aud_%s_f34_sil.png" % tag
    bpy.ops.render.render(write_still=True)
    w.node_tree.nodes["Background"].inputs[0].default_value = (0.012, 0.014, 0.02, 1.0)
    print("DONE", tag, flush=True)
print("ALL_DONE", flush=True)
