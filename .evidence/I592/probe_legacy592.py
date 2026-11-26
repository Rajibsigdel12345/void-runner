import bpy, os
for glb in ("stinger", "flyer"):
    for ob in list(bpy.data.objects):
        bpy.data.objects.remove(ob, do_unlink=True)
    for m in list(bpy.data.meshes):
        if m.users == 0:
            bpy.data.meshes.remove(m)
    path = "E:/Game/assets/%s.glb" % glb
    bpy.ops.import_scene.gltf(filepath=path)
    print("=== %s.glb ===" % glb)
    bx = []
    for ob in bpy.data.objects:
        if ob.type != "MESH":
            continue
        tris = sum(max(len(p.vertices) - 2, 0) for p in ob.data.polygons)
        mn = [1e9, 1e9, 1e9]; mx = [-1e9, -1e9, -1e9]
        for v in ob.data.vertices:
            for i in range(3):
                mn[i] = min(mn[i], v.co[i]); mx[i] = max(mx[i], v.co[i])
        print("NODE", repr(ob.name), "tris", tris,
              "Bbox(x,y,z)=(%.4f,%.4f,%.4f)-(%.4f,%.4f,%.4f)" % (mn[0], mn[1], mn[2], mx[0], mx[1], mx[2]),
              "GAME(x,y,z)=(%.4f,%.4f,%.4f)-(%.4f,%.4f,%.4f)" % (mn[0], mn[2], -mx[1], mx[0], mx[2], -mn[1]),
              "COLOR_0", bool(ob.data.color_attributes),
              "mats", [m.name for m in ob.data.materials])
        bx.append((mn, mx))
    gx0 = min(mn[0] for mn, mx in bx); gx1 = max(mx[0] for mn, mx in bx)
    gy0 = min(mn[2] for mn, mx in bx); gy1 = max(mx[2] for mn, mx in bx)
    gz0 = -max(mx[1] for mn, mx in bx); gz1 = -min(mn[1] for mn, mx in bx)
    print("GAME_EXT x", round(gx1-gx0, 4), "y", round(gy1-gy0, 4), "z", round(gz1-gz0, 4))
    print("BYTES", os.path.getsize(path))
print("PROBE_DONE")