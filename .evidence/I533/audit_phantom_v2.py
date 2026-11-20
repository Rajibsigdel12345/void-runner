import bpy, math, mathutils
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.render.engine = "BLENDER_EEVEE"
sc.render.resolution_x = 960; sc.render.resolution_y = 540
sc.view_settings.view_transform = "Standard"
w = bpy.data.worlds.new("World"); sc.world = w; w.use_nodes = True
w.node_tree.nodes["Background"].inputs[0].default_value = (0.012, 0.014, 0.02, 1.0)
def sun(name, energy, rot):
    d = bpy.data.lights.new(name, "SUN"); d.energy = energy
    o = bpy.data.objects.new(name, d); o.rotation_euler = rot; sc.collection.objects.link(o)
sun("key", 3.2, (math.radians(55), 0, math.radians(125)))
sun("fill", 1.1, (math.radians(110), 0, math.radians(-60)))
sun("rim", 2.0, (math.radians(-35), math.radians(20), math.radians(20)))
cd = bpy.data.cameras.new("cam"); cd.lens = 50
cam = bpy.data.objects.new("cam", cd); sc.collection.objects.link(cam); sc.camera = cam
def look_at(cam, loc, target=(0,0,0)):
    cam.location = loc; d = mathutils.Vector(target) - mathutils.Vector(loc); cam.rotation_euler = d.to_track_quat('-Z','Y').to_euler()
def import_glb(path):
    for o in list(bpy.data.objects):
        if o.type == "MESH": bpy.data.objects.remove(o, do_unlink=True)
    bpy.ops.import_scene.gltf(filepath=path)
    return [o for o in bpy.context.selected_objects if o.type == "MESH"]
def bbox_sphere(objs):
    mn = mathutils.Vector((1e9,1e9,1e9)); mx = mathutils.Vector((-1e9,-1e9,-1e9))
    for o in objs:
        for c in o.bound_box:
            wv = o.matrix_world @ mathutils.Vector(c)
            mn = mathutils.Vector((min(mn.x,wv.x),min(mn.y,wv.y),min(mn.z,wv.z)))
            mx = mathutils.Vector((max(mx.x,wv.x),max(mx.y,wv.y),max(mx.z,wv.z)))
    c = (mn+mx)/2; r = (mx-mn).length/2; return c, r
objs = import_glb(r"E:/Game/.evidence/I533/phantom_v2.glb")
c, r = bbox_sphere(objs)
tris = sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in objs)
print("AUDIT phantom_v2 meshes=%d tris=%d radius=%.4f" % (len(objs), tris, r), flush=True)
views = {
 "f34":   ((c.x + 1.9*r, c.y - 2.1*r, c.z + 0.9*r), (c.x,c.y,c.z)),
 "front": ((c.x + 3.0*r, c.y - 0.1*r, c.z + 0.15*r), (c.x,c.y,c.z)),
 "back":  ((c.x - 3.0*r, c.y + 0.1*r, c.z + 0.15*r), (c.x,c.y,c.z)),
 "side":  ((c.x - 0.1*r, c.y - 3.0*r, c.z + 0.15*r), (c.x,c.y,c.z)),
}
clay = bpy.data.materials.new("clay"); clay.use_nodes = True
bb = clay.node_tree.nodes["Principled BSDF"]; bb.inputs["Base Color"].default_value = (0.72,0.72,0.72,1.0); bb.inputs["Roughness"].default_value = 0.55
hexc = (0x40/255, 0xc0/255, 0x55/255, 1.0)
tm = bpy.data.materials.new("tint"); tm.use_nodes = True; nt = tm.node_tree; bsdf = nt.nodes["Principled BSDF"]; bsdf.inputs["Roughness"].default_value = 0.5
vc = nt.nodes.new("ShaderNodeVertexColor"); vc.layer_name = "Color"; mix = nt.nodes.new("ShaderNodeMixRGB"); mix.blend_type = "MULTIPLY"; mix.inputs["Color2"].default_value = hexc
nt.links.new(vc.outputs["Color"], mix.inputs["Color1"]); nt.links.new(mix.outputs["Color"], bsdf.inputs["Base Color"])
sil = bpy.data.materials.new("sil"); sil.use_nodes = True
bb = sil.node_tree.nodes["Principled BSDF"]; bb.inputs["Base Color"].default_value = (0.0,0.0,0.0,1.0); bb.inputs["Roughness"].default_value = 1.0
EV = r"E:/Game/.evidence/I533/"
for o in objs: o.data.materials.clear(); o.data.materials.append(clay)
for name,(loc,tgt) in views.items():
    look_at(cam, loc, tgt); sc.render.filepath = EV + "v2_phantom_%s_clay.png" % name; bpy.ops.render.render(write_still=True)
for o in objs: o.data.materials.clear(); o.data.materials.append(tm)
for name,(loc,tgt) in views.items():
    look_at(cam, loc, tgt); sc.render.filepath = EV + "v2_phantom_%s_tint.png" % name; bpy.ops.render.render(write_still=True)
w.node_tree.nodes["Background"].inputs[0].default_value = (1.0, 1.0, 1.0, 1.0)
for o in objs: o.data.materials.clear(); o.data.materials.append(sil)
sc.render.resolution_x = 96; sc.render.resolution_y = 96
for name in ("front","back"):
    look_at(cam, views[name][0], views[name][1]); sc.render.filepath = EV + "v2_phantom_%s_sil96.png" % name; bpy.ops.render.render(write_still=True)
print("ALL_DONE", flush=True)
