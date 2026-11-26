# ---------------------------------------------------------------- I592 v2b rework: embed_pass
def _islands(bm):
    bm.verts.ensure_lookup_table()
    seen = set(); out = []
    for v in bm.verts:
        if v.index in seen:
            continue
        stack = [v]; comp = set()
        while stack:
            u = stack.pop()
            if u.index in comp:
                continue
            comp.add(u.index)
            for e in u.link_edges:
                w = e.other_vert(u)
                if w.index not in comp:
                    stack.append(w)
        seen |= comp; out.append(comp)
    return out

def _tri_count(bm, comp):
    return sum(max(0, len(f.verts) - 2) for f in bm.faces
               if all(v.index in comp for v in f.verts))

def _raycount(hostob, origin, d, maxhits=5):
    o = origin + d * 1e-6
    n = 0
    for _ in range(maxhits):
        hit, loc, nrm, idx = hostob.ray_cast(o, d)
        if not hit:
            return n
        n += 1
        o = loc + d * 1e-4
    return n

def _inside(hostob, p):
    return (_raycount(hostob, p, Vector((0, 0, 1))) % 2 == 1
            and _raycount(hostob, p, Vector((1, 0, 0))) % 2 == 1)

def embed_pass(ob):
    # I592 P-gate rework (frozen design): rigidly settle floating greeble
    # islands into the host hull. Host = islands with >= 55 tris. An island
    # moves only if NO vertex is inside the host solid (ray parity, marching
    # ray_cast) - straddling greebles (partly buried) stay put. Pure
    # translation -> vertex/face/tri counts unchanged. Called after bevel,
    # before bake (bake is position-based).
    bm = bmesh.new(); bm.from_mesh(ob.data)
    islands = _islands(bm)
    host = [c for c in islands if _tri_count(bm, c) >= 55]
    assert host, "EMBED_FAIL %s: no host island (>=55 tris)" % ob.name
    print("EMBED %s islands=%d host=%d host_tris=%s" % (
        ob.name, len(islands), len(host),
        sorted((_tri_count(bm, c) for c in host), reverse=True)), flush=True)
    host_set = set()
    for c in host:
        host_set |= c
    hverts = [bv for bv in bm.verts if bv.index in host_set]
    hv_co = [bv.co[:] for bv in hverts]
    vmap = {bv.index: i for i, bv in enumerate(hverts)}
    hf = [tuple(vmap[v.index] for v in f.verts) for f in bm.faces
          if all(v.index in host_set for v in f.verts)]
    tmp_me = bpy.data.meshes.new(ob.name + "_hosttmp")
    tmp_me.from_pydata(hv_co, [], hf)
    tmp_me.update()
    hostob = bpy.data.objects.new(ob.name + "_hosttmp", tmp_me)
    if ob.users_collection:
        next(iter(ob.users_collection)).objects.link(hostob)
    else:
        bpy.context.scene.collection.objects.link(hostob)
    bpy.context.view_layer.update()
    xs = [c[0] for c in hv_co]; ys = [c[1] for c in hv_co]; zs = [c[2] for c in hv_co]
    center = Vector(((min(xs) + max(xs)) / 2.0, (min(ys) + max(ys)) / 2.0,
                     (min(zs) + max(zs)) / 2.0))
    ext_pt = center + Vector((5.0, 5.0, 5.0))
    c_in = _inside(hostob, center)
    e_out = not _inside(hostob, ext_pt)
    ray_ok = c_in and e_out
    print("EMBED %s ray_cast validation %s (center inside=%s ext outside=%s)" % (
        ob.name, "PASS" if ray_ok else "FAIL -> wireframe fallback", c_in, e_out), flush=True)
    host_vs = [bv.co.copy() for bv in hverts]
    host_es = []
    bm.edges.ensure_lookup_table()
    for e in bm.edges:
        a, b = e.verts
        if a.index in host_set and b.index in host_set:
            host_es.append((a.co.copy(), b.co.copy()))
    n_v0 = len(bm.verts); n_f0 = len(bm.faces)
    moved = 0
    for comp in islands:
        if any(comp == c for c in host):
            continue
        if ray_ok and any(_inside(hostob, bv.co) for bv in bm.verts if bv.index in comp):
            print("EMBED %s island%3d verts=%d tris=%d BURIED - no move" % (
                ob.name, min(comp), len(comp), _tri_count(bm, comp)), flush=True)
            continue
        best = 1e9; bp = None; bq = None
        for bv in bm.verts:
            if bv.index not in comp:
                continue
            p = bv.co
            for a in host_vs:
                d = (p - a).length
                if d < best:
                    best = d; bp = p.copy(); bq = a
            for (a, b) in host_es:
                ab = b - a; l2 = ab.length_squared
                t = 0.0 if l2 < 1e-12 else max(0.0, min(1.0, (p - a).dot(ab) / l2))
                q = a + ab * t
                d = (p - q).length
                if d < best:
                    best = d; bp = p.copy(); bq = q
        if best <= 0.004:
            print("EMBED %s island%3d verts=%d tris=%d TOUCH d=%.4f - no move" % (
                ob.name, min(comp), len(comp), _tri_count(bm, comp), best), flush=True)
            continue
        shift = (best + 0.004) * ((bq - bp) / best)
        for bv in bm.verts:
            if bv.index in comp:
                bv.co = bv.co + shift
        moved += 1
        print("EMBED %s island%3d verts=%d tris=%d FLOAT d=%.4f shift=(%.4f, %.4f, %.4f)" % (
            ob.name, min(comp), len(comp), _tri_count(bm, comp), best,
            shift.x, shift.y, shift.z), flush=True)
    bm.normal_update()
    nm, deg, bnd = _chk(bm)
    assert nm == 0, "EMBED_FAIL %s: non-manifold after embed" % ob.name
    assert bnd == 0, "EMBED_FAIL %s: boundary after embed" % ob.name
    assert len(bm.verts) == n_v0 and len(bm.faces) == n_f0, "EMBED_FAIL %s: topology changed" % ob.name
    bm.to_mesh(ob.data); bm.free(); ob.data.update()
    bpy.data.objects.remove(hostob, do_unlink=True)
    bpy.data.meshes.remove(tmp_me)
    print("EMBED %s moved=%d of %d greeble islands" % (
        ob.name, moved, len(islands) - len(host)), flush=True)