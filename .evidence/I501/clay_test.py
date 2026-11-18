import bpy, math

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.render.engine = "BLENDER_EEVEE"
sc.render.resolution_x = 1280
sc.render.resolution_y = 720
sc.render.film_transparent = False
sc.view_settings.view_transform = "Standard"
w = bpy.data.worlds.new("World")
sc.world = w
w.use_nodes = True
w.node_tree.nodes["Background"].inputs[0].default_value = (0.012, 0.014, 0.02, 1.0)

bpy.ops.import_scene.gltf(filepath=r"E:/Game/.evidence/I501/ship_v6.glb")
ship = bpy.context.selected_objects
# single clay material on everything
m = bpy.data.materials.new("clay")
m.use_nodes = True
b = m.node_tree.nodes["Principled BSDF"]
b.inputs["Base Color"].default_value = (0.72, 0.72, 0.72, 1.0)
b.inputs["Roughness"].default_value = 0.55
for ob in ship:
    if ob.type == "MESH":
        ob.data.materials.clear()
        ob.data.materials.append(m)

# lights
def sun(name, energy, rot):
    d = bpy.data.lights.new(name, "SUN")
    d.energy = energy
    o = bpy.data.objects.new(name, d)
    o.rotation_euler = rot
    sc.collection.objects.link(o)
    return o
sun("key", 3.2, (math.radians(55), 0, math.radians(125)))
sun("fill", 1.1, (math.radians(110), 0, math.radians(-60)))
sun("rim", 2.0, (math.radians(-35), math.radians(20), math.radians(20)))

# camera: 3/4 front (bow is blender -y)
cd_ = bpy.data.cameras.new("cam")
cd_.lens = 50
cam = bpy.data.objects.new("cam", cd_)
sc.collection.objects.link(cam)
sc.camera = cam
cam.location = (6.5, -7.5, 2.6)
cam.rotation_euler = (math.radians(80), 0, math.radians(40))

sc.render.filepath = r"E:/Game/.evidence/I501/test_a.png"
bpy.ops.render.render(write_still=True)
print("RENDER1_DONE")

# rear 3/4 (stern + engines)
cam.location = (-6.0, 8.0, 2.2)
cam.rotation_euler = (math.radians(80), 0, math.radians(-145))
sc.render.filepath = r"E:/Game/.evidence/I501/test_b.png"
bpy.ops.render.render(write_still=True)
print("RENDER2_DONE")