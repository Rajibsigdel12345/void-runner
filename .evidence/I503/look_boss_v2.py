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
def look_at(cam, loc, target):
    cam.location = loc
    d = mathutils.Vector(target) - mathutils.Vector(loc)
    cam.rotation_euler = d.to_track_quat("-Z","Y").to_euler()
def clear_meshes():
    for o in list(bpy.data.objects):
        if o.type == "MESH":
            bpy.data.objects.remove(o, do_unlink=True)
    for m in list(bpy.data.materials):
        if m.users == 0: bpy.data.materials.remove(m)
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
            p = o.matrix_world @ mathutils.Vector(c)
            mn = mathutils.Vector((min(mn.x,p.x),min(mn.y,p.y),min(mn.z,p.z)))
            mx = mathutils.Vector((max(mx.x,p.x),max(mx.y,p.y),max(mx.z,p.z)))
    c = (mn+mx)/2; r = (mx-mn).length/2
    return c, r
BASE = r"E:/Game/.evidence/I503/"
PATH = r"E:/Game/.evidence/I503/boss_v2.glb"
objs = import_glb(PATH)
c, r = bbox_sphere(objs)
print("LOOK boss_v2 meshes=%d center=%s radius=%.4f" % (len(objs), [round(v,4) for v in c], r))
views = {
    "f34":  (( c.x + 2.76*r, c.y - 3.05*r, c.z + 1.31*r), (c.x,c.y,c.z)),
    "side": (( c.x - 0.1*r, c.y - 4.4*r, c.z + 0.22*r), (c.x,c.y,c.z)),
    "r34":  (( c.x - 2.76*r, c.y + 3.05*r, c.z + 1.31*r), (c.x,c.y,c.z)),
    "top":  (( c.x + 0.2*r, c.y - 0.2*r, c.z + 3.0*r), (c.x,c.y,c.z)),
}
clay = bpy.data.materials.new("clay")
clay.use_nodes = True
bb = clay.node_tree.nodes["Principled BSDF"]
bb.inputs["Base Color"].default_value = (0.72, 0.72, 0.72, 1.0)
bb.inputs["Roughness"].default_value = 0.55
for o in objs:
    o.data.materials.clear(); o.data.materials.append(clay)
for name,(loc,tgt) in views.items():
    look_at(cam, loc, tgt)
    sc.render.filepath = BASE + "look_boss_v2_%s_clay.png" % name
    bpy.ops.render.render(write_still=True)
    print("RENDER ", name, "clay")
objs = import_glb(PATH)
for name,(loc,tgt) in views.items():
    look_at(cam, loc, tgt)
    sc.render.filepath = BASE + "look_boss_v2_%s_tint.png" % name
    bpy.ops.render.render(write_still=True)
    print("RENDER ", name, "tint")
print("ALL_DONE")