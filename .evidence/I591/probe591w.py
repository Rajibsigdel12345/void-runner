import bpy, math
bpy.ops.wm.read_factory_settings(use_empty=True)
for o in list(bpy.data.objects): bpy.data.objects.remove(o, do_unlink=True)
bpy.ops.import_scene.gltf(filepath=r"E:/Game/.evidence/I591/warden_v2.glb")
for o in bpy.data.objects:
    if o.type == "MESH":
        xs = [ (o.matrix_world @ v.co) for v in o.data.vertices ]
        mn = [min(c[i] for c in xs) for i in range(3)]
        mx = [max(c[i] for c in xs) for i in range(3)]
        ext = [mx[i]-mn[i] for i in range(3)]
        print("NODE", o.name, "verts", len(xs), "ext", [round(v,4) for v in ext], "scale", [round(s,4) for s in o.scale])
        # top-down projected area: union-ish estimate via 2D bbox + per-face projected area sum
        import bmesh
        tot = 0.0
        for p in o.data.polygons:
            vs = [ (o.matrix_world @ o.data.vertices[i].co) for i in p.vertices ]
            a = 0.0
            for i in range(len(vs)):
                j = (i+1) % len(vs)
                a += vs[i].x * vs[j].y - vs[j].x * vs[i].y
            tot += abs(a) / 2.0
        print("  top-projected face-area sum (with overlap):", round(tot,4))
print("PROBE_DONE")
