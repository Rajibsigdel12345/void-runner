import bpy, math, mathutils
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.render.engine = "BLENDER_EEVEE"
sc.render.resolution_x = 960
sc.render.resolution_y = 540
sc.view_settings.view_transform = "Standard"
w = bpy.data.worlds.new("World"); sc.world = w; w.use_nodes = True
w.node_tree.nodes["Background"].inputs[0].default_value = (0.012, 0.014, 0.02, 1.0)
def sun(name, energy, rot):
    d = bpy.data.lights.new(name, "SUN"); d.energy = energy
    o = bpy.data.objects.new(name, d); o.rotation_euler = rot
    sc.collection.objects.link(o)
sun("key", 3.2, (math.radians(55), 0, math.radians(125)))
sun("fill", 1.1, (math.radians(110), 0, math.radians(-60)))
sun("rim", 2.0, (math.radians(-35), math.radians(20), math.radians(20)))
cd = bpy.data.cameras.new("cam"); cd.lens = 50
cam = bpy.data.objects.new("cam", cd); sc.collection.objects.link(cam); sc.camera = cam
def look_at(cam, loc, target=(0,0,0)):
    cam.location = loc
    d = mathutils.Vector(target) - mathutils.Vector(loc)
    cam.rotation_euler = d.to_track_quat('-Z','Y').to_euler()
def clear_meshes():
    for o in list(bpy.data.objects):
        if o.type == "MESH": bpy.data.objects.remove(o, do_unlink=True)
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
ASSETS = r"E:/Game/assets/"
# tag, file, body hex (CONFIG)
SHIPS = [
 ("phantom",  "enemy_phantom.glb",  (0x40/255, 0xc0/255, 0x55/255, 1.0)),
 ("hauler",   "enemy_hauler.glb",   (0x97/255, 0x5a/255, 0x2d/255, 1.0)),
 ("bulwark",  "enemy_bulwark.glb",  (0xaa/255, 0x3c/255, 0x96/255, 1.0)),
 ("hunter",   "enemy_hunter.glb",   (0x9c/255, 0x5a/255, 0x46/255, 1.0)),
 ("gunship",  "enemy_gunship.glb",  (0x33/255, 0x45/255, 0x50/255, 1.0)),
 ("sentry",   "enemy_sentry.glb",   (0x8a/255, 0x8f/255, 0x7a/255, 1.0)),
 ("wasp",     "enemy_wasp.glb",     (0xb9/255, 0xc3/255, 0x4d/255, 1.0)),
 ("stinger",  "stinger.glb",        (0x54/255, 0x68/255, 0x8a/255, 1.0)),
 ("drone",    "drone.glb",          (0x6f/255, 0x87/255, 0x96/255, 1.0)),
 ("flyer",    "flyer.glb",          (0x7d/255, 0x68/255, 0x78/255, 1.0)),
]
clay = bpy.data.materials.new("clay"); clay.use_nodes = True
bb = clay.node_tree.nodes["Principled BSDF"]
bb.inputs["Base Color"].default_value = (0.72, 0.72, 0.72, 1.0); bb.inputs["Roughness"].default_value = 0.55
sil = bpy.data.materials.new("sil"); sil.use_nodes = True
bb = sil.node_tree.nodes["Principled BSDF"]
bb.inputs["Base Color"].default_value = (0.0, 0.0, 0.0, 1.0); bb.inputs["Roughness"].default_value = 1.0
def tint_mat(hexc, tag):
    m = bpy.data.materials.new("tint_" + tag); m.use_nodes = True
    nt = m.node_tree
    bsdf = nt.nodes["Principled BSDF"]; bsdf.inputs["Roughness"].default_value = 0.5
    vc = nt.nodes.new("ShaderNodeVertexColor"); vc.layer_name = "Color"
    mix = nt.nodes.new("ShaderNodeMixRGB"); mix.blend_type = "MULTIPLY"
    mix.inputs["Color2"].default_value = hexc
    nt.links.new(vc.outputs["Color"], mix.inputs["Color1"])
    nt.links.new(mix.outputs["Color"], bsdf.inputs["Base Color"])
    return m
EV = r"E:/Game/.evidence/I532/"
rows = []
for tag, fname, hexc in SHIPS:
    objs = import_glb(ASSETS + fname)
    c, r = bbox_sphere(objs)
    tris = sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in objs)
    rows.append((tag, len(objs), tris, round(r,4)))
    print("AUDIT", tag, "meshes=%d tris=%d radius=%.4f" % (len(objs), tris, r), flush=True)
    views = {
        "f34":   ((c.x + 1.9*r, c.y - 2.1*r, c.z + 0.9*r), (c.x,c.y,c.z)),
        "front": ((c.x + 3.0*r, c.y - 0.1*r, c.z + 0.15*r), (c.x,c.y,c.z)),
        "back":  ((c.x - 3.0*r, c.y + 0.1*r, c.z + 0.15*r), (c.x,c.y,c.z)),
        "side":  ((c.x - 0.1*r, c.y - 3.0*r, c.z + 0.15*r), (c.x,c.y,c.z)),
    }
    for o in objs: o.data.materials.clear(); o.data.materials.append(clay)
    for name,(loc,tgt) in views.items():
        look_at(cam, loc, tgt); sc.render.filepath = EV + "a532_%s_%s_clay.png" % (tag, name)
        bpy.ops.render.render(write_still=True)
    if tag in ("phantom","hauler","bulwark"):
        for o in objs: o.data.materials.clear(); o.data.materials.append(tint_mat(hexc, tag))
        for name,(loc,tgt) in views.items():
            look_at(cam, loc, tgt); sc.render.filepath = EV + "a532_%s_%s_tint.png" % (tag, name)
            bpy.ops.render.render(write_still=True)
    w.node_tree.nodes["Background"].inputs[0].default_value = (1.0, 1.0, 1.0, 1.0)
    for o in objs: o.data.materials.clear(); o.data.materials.append(sil)
    sc.render.resolution_x = 96; sc.render.resolution_y = 96
    for name in ("front","back"):
        look_at(cam, views[name][0], views[name][1]); sc.render.filepath = EV + "a532_%s_%s_sil96.png" % (tag, name)
        bpy.ops.render.render(write_still=True)
    sc.render.resolution_x = 960; sc.render.resolution_y = 540
    w.node_tree.nodes["Background"].inputs[0].default_value = (0.012, 0.014, 0.02, 1.0)
    print("DONE", tag, flush=True)
for t,m,tr,rd in rows: print("ROW %s %d %d %s" % (t,m,tr,rd), flush=True)
print("ALL_DONE", flush=True)