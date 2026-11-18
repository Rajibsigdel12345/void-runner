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
    for o in list(bpy.data.objects):
        if o.type == "MESH":
            bpy.data.objects.remove(o, do_unlink=True)
    for me in list(bpy.data.meshes):
        if me.users == 0: bpy.data.meshes.remove(me)
def import_glb(path):
    clear_meshes()
    bpy.ops.import_scene.gltf(filepath=path)
    return [o for o in bpy.context.selected_objects if o.type == "MESH"]
def bbox_sphere(objs):
    mn = mathutils.Vector((1e9,1e9,1e9)); mx = mathutils.Vector((-1e9,-1e9,-1e9))
    for o in objs:
        for c in o.bound_box:
            wv = o.matrix_world @ mathutils.Vector(c)
            mn = mathutils.Vector((min(mn.x,wv.x),min(mn.y,wv.y),min(mn.z,wv.z)))
            mx = mathutils.Vector((max(mx.x,wv.x),max(mx.y,wv.y),max(mx.z,wv.z)))
    c = (mn+mx)/2; r = (mx-mn).length/2
    return c, r
BASE = r"E:/Game/.evidence/I509/"
ASSETS = [
    ("hunter",  BASE + "hunter.glb"),
    ("gunship", BASE + "gunship.glb"),
    ("sentry",  BASE + "sentry.glb"),
    ("wasp",    BASE + "wasp.glb"),
]
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
    print("AUDIT", tag, "meshes=%d tris=%d radius=%.4f" % (len(objs), tris, r), flush=True)
    views = {
        "f34":   ((c.x + 1.9*r, c.y - 2.1*r, c.z + 0.9*r), (c.x,c.y,c.z)),
        "front": ((c.x + 3.0*r, c.y - 0.1*r, c.z + 0.15*r), (c.x,c.y,c.z)),
        "back":  ((c.x - 3.0*r, c.y + 0.1*r, c.z + 0.15*r), (c.x,c.y,c.z)),
        "side":  ((c.x - 0.1*r, c.y - 3.0*r, c.z + 0.15*r), (c.x,c.y,c.z)),
        "top":   ((c.x + 0.2*r, c.y - 0.2*r, c.z + 3.0*r), (c.x,c.y,c.z)),
    }
    for o in objs:
        o.data.materials.clear(); o.data.materials.append(clay)
    for name,(loc,tgt) in views.items():
        look_at(cam, loc, tgt)
        sc.render.filepath = BASE + "aud_%s_%s_clay.png" % (tag, name)
        bpy.ops.render.render(write_still=True)
    objs = import_glb(path)
    for name,(loc,tgt) in views.items():
        look_at(cam, loc, tgt)
        sc.render.filepath = BASE + "aud_%s_%s_tint.png" % (tag, name)
        bpy.ops.render.render(write_still=True)
    objs = import_glb(path)
    w.node_tree.nodes["Background"].inputs[0].default_value = (1.0, 1.0, 1.0, 1.0)
    for o in objs:
        o.data.materials.clear(); o.data.materials.append(sil)
    sc.render.resolution_x = 96; sc.render.resolution_y = 96
    for name in ("front", "back"):
        look_at(cam, views[name][0], views[name][1])
        sc.render.filepath = BASE + "aud_%s_%s_sil96.png" % (tag, name)
        bpy.ops.render.render(write_still=True)
    sc.render.resolution_x = 960; sc.render.resolution_y = 540
    w.node_tree.nodes["Background"].inputs[0].default_value = (0.012, 0.014, 0.02, 1.0)
    print("DONE", tag, flush=True)
print("ALL_DONE", flush=True)