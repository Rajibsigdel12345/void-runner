# ---------------------------------------------------------------- bake + materials
def triangulate_recalc(ob):
    bm = bmesh.new(); bm.from_mesh(ob.data)
    bmesh.ops.triangulate(bm, faces=bm.faces[:], quad_method='BEAUTY', ngon_method='EAR_CLIP')
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    bm.to_mesh(ob.data); bm.free(); ob.data.update()

def bake(ob, k, layer="Color"):
    me = ob.data
    attr = me.color_attributes.new(name=layer, type='FLOAT_COLOR', domain='POINT')
    vals = []
    for i, v in enumerate(me.vertices):
        vn = v.normal
        val = clamp(1.0 + k * vn.dot(L), 0.30, 1.55)
        vals.append(val)
        attr.data[i].color = (val, val, val, 1.0)
    fl = []
    for p in me.polygons:
        if len(p.vertices) == 3:
            fl.append(sum(vals[i] for i in p.vertices) / 3.0)
    fl.sort()
    q = lambda f: fl[min(len(fl) - 1, int(math.floor(f * len(fl))))]
    return dict(p10=q(0.1), p50=q(0.5), p90=q(0.9), spread=q(0.9) - q(0.1))

def finish(ob):
    for _uv in list(ob.data.uv_layers):
        ob.data.uv_layers.remove(_uv)
    for p in ob.data.polygons:
        p.use_smooth = True

def newmat(name, use_vc, base):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    bsdf = nt.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (base[0], base[1], base[2], 1.0)
    if use_vc:
        vc = nt.nodes.new("ShaderNodeVertexColor")
        vc.layer_name = "Color"
        nt.links.new(vc.outputs["Color"], bsdf.inputs["Base Color"])
    return mat

def _angdist(a, b):
    d = (a - b) % (2.0 * math.pi)
    if d > math.pi:
        d = 2.0 * math.pi - d
    return d

def bake_hull_v8(ob, k):
    # v8 base formula + shadow regions (a-f), each re-clamped [0.30,1.55];
    # multi-region verts accumulate (deterministic order).
    me = ob.data
    attr = me.color_attributes.new(name="Color", type='FLOAT_COLOR', domain='POINT')
    n = len(me.vertices)
    verts = me.vertices
    vals = [clamp(1.0 + k * verts[i].normal.dot(L), 0.30, 1.55) for i in range(n)]
    for yf in FORMER_Y8:  # (a) former rib shadow bands
        for i in range(n):
            if abs(verts[i].co.y - yf) < 0.026:
                vals[i] = clamp(vals[i] * 0.84, 0.30, 1.55)
    for i in range(n):  # (b) dark lower trench
        co = verts[i].co
        if co.z < -0.14 and abs(co.x) < 0.6 and -0.9 < co.y < 0.5:
            vals[i] = clamp(vals[i] * 0.78, 0.30, 1.55)
    for yr in CELL_RING_Y8:  # (c) cell-ring shadow bands
        for i in range(n):
            if abs(verts[i].co.y - yr) < 0.022:
                vals[i] = clamp(vals[i] * 0.85, 0.30, 1.55)
    for i in range(n):  # (d) belly shadow
        if verts[i].co.z < -0.20:
            vals[i] = clamp(vals[i] * 0.85, 0.30, 1.55)
    for i in range(n):  # (e) nose-rib band
        if abs(verts[i].co.y + 1.10) < 0.03:
            vals[i] = clamp(vals[i] * 0.85, 0.30, 1.55)
    gthr = [math.radians(t) for t in GOTH_TH8]  # (f) gothic-rib shadow arcs
    for i in range(n):
        co = verts[i].co
        r = math.hypot(co.x, co.z - 0.30)
        if 0.15 <= r <= 0.75:
            thv = math.atan2(co.z - 0.30, co.x)
            for tg in gthr:
                if _angdist(thv, tg) < 0.12:
                    vals[i] = clamp(vals[i] * 0.88, 0.30, 1.55)
                    break
    for i in range(n):
        attr.data[i].color = (vals[i], vals[i], vals[i], 1.0)
    fl = []
    for p in me.polygons:
        if len(p.vertices) == 3:
            fl.append(sum(vals[i] for i in p.vertices) / 3.0)
    fl.sort()
    q = lambda f: fl[min(len(fl) - 1, int(math.floor(f * len(fl))))]
    return dict(p10=q(0.1), p50=q(0.5), p90=q(0.9), spread=q(0.9) - q(0.1))

HULLC = (0.6706, 0.5765, 0.4549)
WINGC = (0.3294, 0.2510, 0.1804)
COKC  = (0.0431, 0.0941, 0.1882)
# ---------------------------------------------------------------- main
def main():
    purge()
    hull    = build_hull8()
    wings   = build_wings8()
    cockpit = build_cockpit8()
    fin     = build_fin8()
    engine  = build_engine8()
    nozzle  = build_nozzle8()
    parts = (hull, wings, cockpit, fin, engine, nozzle)
    for ob in parts:
        cleanup(ob)
        triangulate_recalc(ob)
    for ob in parts:
        t = tris_of(ob)
        print("PART", ob.name, "tris", t, "verts", len(ob.data.vertices))
        if t > CAPS[ob.name]:
            raise SystemExit("CAP_FAIL " + ob.name + " " + str(t) + " > " + str(CAPS[ob.name]))
    fh = bake_hull_v8(hull, K_HULL)
    fw = bake(wings, K_WING)
    print("FACET hull   p10", round(fh['p10'],4), "p50", round(fh['p50'],4), "p90", round(fh['p90'],4), "spread", round(fh['spread'],4))
    print("FACET wings  p10", round(fw['p10'],4), "p50", round(fw['p50'],4), "p90", round(fw['p90'],4), "spread", round(fw['spread'],4))
    assert fh['spread'] >= 0.35, "hull spread < 0.35"
    assert fw['spread'] >= 0.35, "wings spread < 0.35"
    for ob in parts:
        t = tris_of(ob)
        if t < AIMS[ob.name]:
            raise SystemExit("AIM_FAIL " + ob.name + " " + str(t) + " < " + str(AIMS[ob.name]))
    mh = newmat("VR_Ship_Hull", True, HULLC)
    mw = newmat("VR_Ship_Wing", True, WINGC)
    mc = newmat("VR_Ship_Cockpit", False, COKC)
    for ob, mat in ((hull, mh), (nozzle, mh), (engine, mh), (wings, mw), (fin, mw), (cockpit, mc)):
        ob.data.materials.clear()
        ob.data.materials.append(mat)
        finish(ob)
    # ---- BUILD-SPACE asserts (SCALE 1.0; no scale pass) ----
    allv = [v.co for ob in parts for v in ob.data.vertices]
    xs = [c.x for c in allv]; ys = [c.y for c in allv]; zs = [c.z for c in allv]
    zmin = min(zs)
    for _ob in parts:
        _zz = [v.co.z for v in _ob.data.vertices]
        print("ZMIN", _ob.name, round(min(_zz), 4))
    span_x = max(xs) - min(xs)
    length = max(ys) - min(ys)
    print("BUILD extent x", round(min(xs),4), round(max(xs),4), "span", round(span_x,4))
    print("BUILD extent y", round(min(ys),4), round(max(ys),4), "len", round(length,4))
    print("BUILD extent z", round(zmin,4), round(max(zs),4))
    assert zmin >= -0.399, "belly below -0.399 (%.4f)" % zmin
    assert 3.60 <= span_x <= 4.40, "span band broken (%.4f)" % span_x
    assert 2.34 <= length <= 2.86, "length band broken (%.4f)" % length
    assert max(ys) <= 1.3005, "max y above 1.3005 (%.4f)" % max(ys)
    noz_ys = [v.co.y for v in nozzle.data.vertices]
    assert max(noz_ys) >= 1.299, "central mouth does not reach y 1.299 (%.4f)" % max(noz_ys)
    eng_ys = [v.co.y for v in engine.data.vertices]
    assert min(eng_ys) <= 0.80, "engine min y above 0.80 (%.4f)" % min(eng_ys)
    cok_ys = [v.co.y for v in cockpit.data.vertices]
    cok_cy = (min(cok_ys) + max(cok_ys)) / 2.0
    cok_zmin = min(v.co.z for v in cockpit.data.vertices)
    print("COCKPIT y-center", round(cok_cy, 4), "zmin", round(cok_zmin, 4))
    assert -0.85 <= cok_cy <= -0.55, "cockpit y-center off-band (%.4f)" % cok_cy
    assert cok_zmin >= 0.65, "cockpit zmin below 0.65 (%.4f)" % cok_zmin
    total = sum(tris_of(ob) for ob in parts)
    print("TOTAL_TRIS", total)
    assert total <= TOTAL_HARD, "total tris over hard cap " + str(TOTAL_HARD)
    if total > TOTAL_AIM:
        print("TOTAL_WARN", total, ">", TOTAL_AIM)
    print("GREEBLES", GREBBLES, "total", sum(GREBBLES.values()))
    out = EVID + "ship_v8.glb"
    for ob in parts:
        ob.select_set(True)
    bpy.context.view_layer.objects.active = hull
    bpy.ops.export_scene.gltf(
        filepath=out, export_format='GLB', use_selection=True,
        export_yup=True, export_apply=True, export_materials='EXPORT',
        export_vertex_color='MATERIAL', export_image_format='AUTO',
        export_skins=False, export_animations=False,
        export_normals=True, export_texcoords=False, export_tangents=False)
    gb = os.path.getsize(out)
    print("GLB_BYTES", gb)
    assert gb <= 1500000, "GLB hard %d > 1500000" % gb
    if gb > 1400000:
        print("GLB_WARN", gb, "> 1400000")
    bpy.ops.wm.save_as_mainfile(filepath=EVID + "ship_v8.blend")
    print("ALL_DONE")

main()
