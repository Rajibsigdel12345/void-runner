import bpy, bmesh
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=r"E:/Game/.evidence/I592/stinger_v2.glb")
objs = [o for o in bpy.context.selected_objects if o.type == "MESH"]
for body in [o for o in objs if o.name == "VR_Stinger_Body"]:
    bm = bmesh.new(); bm.from_mesh(body.data)
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
        seen |= comp; islands.append(comp)
    islands.sort(key=len, reverse=True)
    def tri_count(comp):
        return sum(max(0, len(f.verts) - 2) for f in bm.faces if all(v.index in comp for v in f.verts))
    host = [c for c in islands if tri_count(c) >= 55]
    host_set = set()
    for c in host: host_set |= c
    host_vs = [bm.verts[i].co.copy() for i in host_set]
    host_es = []
    for e in bm.edges:
        a, b = e.verts
        if a.index in host_set and b.index in host_set:
            host_es.append((a.co.copy(), b.co.copy()))
    def segdist(p, a, b):
        ab = b - a; t = (p - a).dot(ab) / ab.length_squared
        t = max(0.0, min(1.0, t))
        return (p - (a + ab * t)).length
    print("STINGER host islands=%d (tris %s)" % (len(host), [tri_count(c) for c in host]), flush=True)
    floats = []
    for idx, comp in enumerate(islands):
        if comp in host: continue
        best = 1e9
        for i in comp:
            p = bm.verts[i].co
            for a in host_vs:
                d = (p - a).length
                if d < best: best = d
            for (a, b) in host_es:
                d = segdist(p, a, b)
                if d < best: best = d
        if best > 0.012:
            tris = tri_count(comp)
            floats.append((idx, len(comp), tris, best))
            print("  STINGER FLOAT island%d verts=%d tris=%d dist=%.4f" % (idx, len(comp), tris, best), flush=True)
    print("STINGER_FLOAT_COUNT", len(floats), "of", len(islands) - len(host), flush=True)
print("ALL_DONE", flush=True)