import bpy, bmesh, mathutils
bpy.ops.wm.read_factory_settings(use_empty=True)
for glb in (r"E:/Game/.evidence/I592/flyer_v2.glb", r"E:/Game/.evidence/I592/stinger_v2.glb"):
    for o in list(bpy.data.objects):
        if o.type == "MESH": bpy.data.objects.remove(o, do_unlink=True)
    bpy.ops.import_scene.gltf(filepath=glb)
    objs = [o for o in bpy.context.selected_objects if o.type == "MESH"]
    print("PROBE %s" % glb.split("/")[-1], flush=True)
    for o in objs:
        bm = bmesh.new(); bm.from_mesh(o.data)
        bm.verts.ensure_lookup_table()
        seen = set(); islands = []
        for v in bm.verts:
            if v.index in seen: continue
            stack = [v]; comp = set()
            while stack:
                u = stack.pop()
                if u.index in comp: continue
                comp.add(u.index)
                for e in u.link_edges:
                    w = e.other_vert(u)
                    if w.index not in comp: stack.append(w)
            seen |= comp
            islands.append(comp)
        print("  %s verts=%d tris=%d islands=%d" % (o.name, len(bm.verts), len(bm.faces), len(islands)), flush=True)
        for i, comp in enumerate(sorted(islands, key=len, reverse=True)):
            vs = [bm.verts[j] for j in comp]
            mn = mathutils.Vector((1e9,)*3); mx = mathutils.Vector((-1e9,)*3)
            for v in vs:
                for ax in range(3):
                    mn[ax] = min(mn[ax], v.co[ax]); mx[ax] = max(mx[ax], v.co[ax])
            tris = sum(max(0, len(f.verts)-2) for f in bm.faces if all(v.index in comp for v in f.verts))
            print("    island%d verts=%d tris=%d bbox_min=%s bbox_max=%s" % (i, len(comp), tris, tuple(round(x,3) for x in mn), tuple(round(x,3) for x in mx)), flush=True)
        bm.free()
print("ALL_DONE", flush=True)