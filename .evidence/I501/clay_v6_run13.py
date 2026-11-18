import bpy, math
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

bpy.ops.import_scene.gltf(filepath=r"E:/Game/.evidence/I501/ship_v6.glb")
ship = [o for o in bpy.context.selected_objects if o.type == "MESH"]
mc = bpy.data.materials.new("clay")
mc.use_nodes = True
b = mc.node_tree.nodes["Principled BSDF"]
b.inputs["Base Color"].default_value = (0.72, 0.72, 0.72, 1.0)
b.inputs["Roughness"].default_value = 0.55

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
    import mathutils
    cam.location = loc
    d = mathutils.Vector(target) - mathutils.Vector(loc)
    cam.rotation_euler = d.to_track_quat('-Z','Y').to_euler()

VIEWS = {
 "v1_front34":  (( 4.6, -3.6, 1.9), (0,0,0)),
 "v2_side":     (( 0.0, -6.2, 0.4), (0,0,0)),
 "v3_rear34":   ((-4.2,  4.4, 1.7), (0,0,0)),
 "v4_top":      (( 0.4,  0.0, 6.0), (0,0,0)),
 "v5_belly":    (( 0.0,  0.0,-5.4), (0,0,0)),
 "v6_port_detail": ((2.6, -2.6, 0.9), (0.6,-0.2,0.35)),
}
# pass 1: clay
for o in ship:
    o.data.materials.clear(); o.data.materials.append(mc)
for name,(loc,tgt) in VIEWS.items():
    look_at(cam, loc, tgt)
    sc.render.filepath = r"E:/Game/.evidence/I501/" + name + "_clay.png"
    bpy.ops.render.render(write_still=True)
    print("RENDER", name)
# pass 2: tint (keep imported materials + COLOR_0)
for o in ship:
    o.select_set(False)
bpy.ops.import_scene.gltf(filepath=r"E:/Game/.evidence/I501/ship_v6.glb")
ship2 = [o for o in bpy.context.selected_objects if o.type == "MESH"]
for o in ship:
    if o.name.startswith("GLTF_Material") or o.name.startswith("VR_Ship"):
        pass
# remove the first-imported set to avoid doubles: delete ship2? no - keep ship2 (has mats), delete ship
for o in ship:
    bpy.data.objects.remove(o, do_unlink=True)
for name in ("v1_front34","v3_rear34"):
    loc,tgt = VIEWS[name]
    look_at(cam, loc, tgt)
    sc.render.filepath = r"E:/Game/.evidence/I501/" + name + "_tint.png"
    bpy.ops.render.render(write_still=True)
    print("RENDER_TINT", name)
print("CLAY_V6_DONE")