import bpy, os, json, math, mathutils

OUT = r"E:/Game/.evidence/I590"
ASSETS = r"E:/Game/assets"
os.makedirs(OUT, exist_ok=True)

SHIPS = [
    "drone", "stinger", "warden", "flyer",
    "enemy_hunter", "enemy_gunship", "enemy_sentry", "enemy_wasp",
    "enemy_phantom", "enemy_hauler", "enemy_bulwark",
    "enemy_sweeper", "enemy_beacon",
]

sc = bpy.context.scene
try:
    sc.render.engine = "BLENDER_EEVEE"
except Exception as e:
    print("EEVEE_FAIL", e, flush=True)
    sc.render.engine = "BLENDER_EEVEE_NEXT"
sc.render.resolution_x = 96
sc.render.resolution_y = 96
sc.render.film_transparent = True
sc.view_settings.view_transform = "Standard"

silmat = bpy.data.materials.new("sil96mat")
silmat.use_nodes = True
nt = silmat.node_tree
for n in list(nt.nodes):
    nt.nodes.remove(n)
em = nt.nodes.new("ShaderNodeEmission")
em.inputs["Color"].default_value = (1.0, 1.0, 1.0, 1.0)
em.inputs["Strength"].default_value = 1.0
out = nt.nodes.new("ShaderNodeOutputMaterial")
nt.links.new(em.outputs["Emission"], out.inputs["Surface"])

camdata = bpy.data.cameras.new("cam96")
camdata.type = "ORTHO"
cam = bpy.data.objects.new("cam96", camdata)
sc.collection.objects.link(cam)
sc.camera = cam

def clear_meshes():
    for o in list(bpy.data.objects):
        if o.type == "MESH":
            bpy.data.objects.remove(o, do_unlink=True)
    for me in list(bpy.data.meshes):
        if me.users == 0:
            bpy.data.meshes.remove(me)

def import_glb(path):
    clear_meshes()
    bpy.ops.import_scene.gltf(filepath=path)
    return [o for o in bpy.context.selected_objects if o.type == "MESH"]

def look_at(loc, target=(0, 0, 0)):
    cam.location = loc
    d = mathutils.Vector(target) - mathutils.Vector(loc)
    cam.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()

def count_tris(o):
    return sum(len(p.vertices) - 2 for p in o.data.polygons)

results = []
for name in SHIPS:
    path = os.path.join(ASSETS, name + ".glb")
    objs = import_glb(path)
    if not objs:
        print("AUDIT_FAIL", name, "no mesh", flush=True)
        results.append({"name": name, "error": "no mesh"})
        continue
    tris = sum(count_tris(o) for o in objs)
    mn = mathutils.Vector((1e9, 1e9, 1e9))
    mx = mathutils.Vector((-1e9, -1e9, -1e9))
    for o in objs:
        for cc in o.bound_box:
            wv = o.matrix_world @ mathutils.Vector(cc)
            mn = mathutils.Vector((min(mn.x, wv.x), min(mn.y, wv.y), min(mn.z, wv.z)))
            mx = mathutils.Vector((max(mx.x, wv.x), max(mx.y, wv.y), max(mx.z, wv.z)))
    ext = mx - mn
    r = ext.length / 2.0
    T = mathutils.Matrix.Translation(-((mn + mx) / 2.0))
    S = mathutils.Matrix.Scale(1.0 / max(ext.x, ext.y, ext.z), 4)
    for o in objs:
        o.matrix_world = S @ T @ o.matrix_world
    for o in objs:
        o.data.materials.clear()
        o.data.materials.append(silmat)
    fills = {}
    for tag, loc, inplane in [
        ("A", (0, 5, 0), (ext.x, ext.z)),
        ("B", (5, 0, 0), (ext.y, ext.z)),
        ("C", (0, 0, 5), (ext.x, ext.y)),
    ]:
        camdata.ortho_scale = max(inplane) * 1.04
        look_at(loc)
        sc.render.filepath = os.path.join(OUT, "sil96_%s_%s.png" % (name, tag))
        bpy.ops.render.render(write_still=True)
        img = bpy.data.images.load(sc.render.filepath)
        px = list(img.pixels)
        n_op = 0
        for i in range(3, len(px), 4):
            if px[i] > 0.1:
                n_op += 1
        fills[tag] = round(n_op / (96 * 96), 4)
        bpy.data.images.remove(img)
    sil96 = round(sum(fills.values()) / 3.0, 4)
    size_b = os.path.getsize(path)
    per_node = {}
    for o in objs:
        per_node[o.name] = count_tris(o)
    results.append({
        "name": name, "tris": tris, "bytes": size_b,
        "b_per_tri": round(size_b / tris, 2), "r": round(r, 4),
        "ext": [round(v, 4) for v in ext], "fills": fills, "sil96": sil96,
        "nodes": per_node,
    })
    print("AUDIT %s tris=%d bytes=%d b/t=%.2f r=%.4f sil96=%.4f fills=%s" % (
        name, tris, size_b, size_b / tris, r, sil96, fills), flush=True)

with open(os.path.join(OUT, "audit_i590.json"), "w") as f:
    json.dump(results, f, indent=1)
print("AUDIT_DONE %d ships" % len(results), flush=True)
