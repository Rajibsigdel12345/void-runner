import bpy, bmesh

DIR = "E:/Game/.evidence/I592/"
TARGETS = [
    ("stinger_v2.glb", "VR_Stinger_Body", "STINGER_BODY"),
    ("stinger_v2.glb", "VR_Stinger_Core", "STINGER_CORE"),
    ("flyer_v2.glb", "VR_Flyer_Body", "FLYER_BODY"),
]

def segdist(p, a, b):
    ab = b - a
    l2 = ab.length_squared
    t = 0.0 if l2 < 1e-12 else max(0.0, min(1.0, (p - a).dot(ab) / l2))
    return (p - (a + ab * t)).length

def probe(glb, node, tag):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=DIR + glb)
    objs = [o for o in bpy.context.selected_objects if o.type == "MESH"]
    hits = [o for o in objs if o.name == node]
    if len(hits) != 1:
        print(tag + " IMPORT_FAIL nodes=%r" % [o.name for o in objs], flush=True)
        return
    body = hits[0]
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
    if not host:
        print(tag + " HOST_FAIL islands=%d" % len(islands), flush=True)
        return
    host_set = set()
    for c in host: host_set |= c
    host_vs = [bm.verts[i].co.copy() for i in host_set]
    host_es = []
    bm.edges.ensure_lookup_table()
    for e in bm.edges:
        a, b = e.verts
        if a.index in host_set and b.index in host_set:
            host_es.append((a.co.copy(), b.co.copy()))
    print(tag + " host islands=%d (tris %s) of %d islands" % (len(host), [tri_count(c) for c in host], len(islands)), flush=True)
    floats = 0
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
            floats += 1
            print("  %s FLOAT island%d verts=%d tris=%d dist=%.4f" % (tag, idx, len(comp), tri_count(comp), best), flush=True)
    print(tag + "_FLOAT_COUNT", floats, "of", len(islands) - len(host), flush=True)
    bm.free()

for glb, node, tag in TARGETS:
    probe(glb, node, tag)
print("ALL_DONE", flush=True)