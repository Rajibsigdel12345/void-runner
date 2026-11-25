def _enr_at(table, y):
    if y <= table[0][0]:
        return table[0][1]
    if y >= table[-1][0]:
        return table[-1][1]
    for i in range(len(table) - 1):
        if table[i][0] <= y <= table[i + 1][0]:
            t = (y - table[i][0]) / (table[i + 1][0] - table[i][0])
            return table[i][1] + (table[i + 1][1] - table[i][1]) * t
    return table[-1][1]

# ---------------------------------------------------------------- v8 WINGS
# slim sponson airfoil loft (12-pt, 9 stations) + tip finlet + 5 rib bands + stay.
def build_wings8():
    ob = newmesh("VR_Ship_Wings"); bm = bmesh.new()
    for sgn in (1, -1):
        wing_loft(bm, sgn, AIR8, STATIONS8)
        prism_x(bm, sgn, WINGLET8, 1.955, 2.005)
        for (x, hx, hy, hz) in ((0.62, 0.028, 0.055, 0.011), (0.95, 0.024, 0.047, 0.010),
                                (1.28, 0.022, 0.042, 0.009), (1.60, 0.018, 0.035, 0.008),
                                (1.85, 0.016, 0.030, 0.007)):
            box(bm, sgn * x, 0.0, 0.045, hx, hy, hz)
        cable(bm, (sgn * 1.50, -0.06, 0.02), (sgn * 0.40, 0.16, 0.55), 0.005)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    bm.normal_update()
    g("Wings", 5 * 2 + 2)
    print("WING8 pre-bevel1 tris", sum(len(f.verts) - 2 for f in bm.faces))
    bevel_ob(ob_from_bm(bm, ob), 0.006, 45.0)
    bm = bmesh.new(); bm.from_mesh(ob.data)
    print("WING8 post-bevel1 tris", sum(len(f.verts) - 2 for f in bm.faces))
    if V8_WING_SUBALL:
        bmesh.ops.subdivide_edges(bm, edges=bm.edges[:], cuts=1, smooth=0)
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:]); bm.normal_update()
        print("WING8 post-suball tris", sum(len(f.verts) - 2 for f in bm.faces))
    if V8_WING_SUBDIVA:
        sel = set(e for f in bm.faces if 0.60 < abs(f.calc_center_median().x) < 1.60 for e in f.edges)
        bmesh.ops.subdivide_edges(bm, edges=list(sel), cuts=1, smooth=0)
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:]); bm.normal_update()
        print("WING8 post-subA tris", sum(len(f.verts) - 2 for f in bm.faces))
    if V8_WING_SUBDIVB:
        sel = set(e for f in bm.faces if 0.95 < abs(f.calc_center_median().x) < 1.35 for e in f.edges)
        bmesh.ops.subdivide_edges(bm, edges=list(sel), cuts=1, smooth=0)
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:]); bm.normal_update()
        print("WING8 post-subB tris", sum(len(f.verts) - 2 for f in bm.faces))
    if V8_WING_SUBDIVC:
        sel = set(e for f in bm.faces if 1.20 < abs(f.calc_center_median().x) < 1.50 for e in f.edges)
        bmesh.ops.subdivide_edges(bm, edges=list(sel), cuts=1, smooth=0)
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:]); bm.normal_update()
        print("WING8 post-subC tris", sum(len(f.verts) - 2 for f in bm.faces))
    for sgn in (1, -1):
        sel = [f for f in bm.faces
               if abs(f.normal.z) > 0.85 and 0.30 < sgn * f.calc_center_median().x < 1.90
               and f.calc_area() > 0.002]
        inset_guarded(bm, sel, 0.014, -0.007, 8)
    if V8_WING_SUB2B:
        cands = [f for f in bm.faces if 0.75 < abs(f.calc_center_median().x) < 1.45]
        cands.sort(key=lambda f: abs(abs(f.calc_center_median().x) - 1.10))
        sel = set(e for f in cands[:V8_WING_SUB2B_N] for e in f.edges)
        bmesh.ops.subdivide_edges(bm, edges=list(sel), cuts=1, smooth=0)
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:]); bm.normal_update()
        print("WING8 post-sub2B tris", sum(len(f.verts) - 2 for f in bm.faces), "sel", min(V8_WING_SUB2B_N, len(cands)))
    print("WING8 post-inset tris", sum(len(f.verts) - 2 for f in bm.faces))
    displace(bm, 0.006, 0.002, 3.5, SEED + 1)
    bm.to_mesh(ob.data); bm.free(); ob.data.update()
    bevel_ob(ob, 0.005, 45.0)
    print("WING8 final tris", tris_of(ob))
    return ob

# ---------------------------------------------------------------- v8 ENGINE
# 3 stacked lofts (central + 2 sponsons) + lips + cooling-fin rings + struts
# + pods + cowl ribs; banded subdiv tuned against the v7 measured multiplier.
def build_engine8():
    ob = newmesh("VR_Ship_Engine"); bm = bmesh.new()
    for (tab, cx, cz, ns) in ((ENR8C, 0.0, 0.18, ENR_SIDES["C"]),
                              (ENR8I, 0.85, 0.10, ENR_SIDES["I"]),
                              (ENR8O, 1.60, 0.075, ENR_SIDES["O"])):
        cxs = (cx,) if cx == 0.0 else (cx, -cx)
        for ccx in cxs:
            rv = [ring_c(bm, ccx, y, cz, r, ns) for (y, r) in tab]
            for rii in range(len(rv) - 1):
                a, b = rv[rii], rv[rii + 1]
                for i in range(ns):
                    j = (i + 1) % ns
                    bm.faces.new((a[i], a[j], b[j], b[i]))
            bm.faces.new(list(reversed(rv[0]))); bm.faces.new(rv[-1])
    # cowl struts: central stack -> inboard / inboard -> outboard
    box(bm, 0.425, 1.02, 0.290, 0.350, 0.028, 0.022)
    box(bm, -0.425, 1.02, 0.290, 0.350, 0.028, 0.022)
    box(bm, 1.225, 0.98, 0.160, 0.325, 0.024, 0.020)
    box(bm, -1.225, 0.98, 0.160, 0.325, 0.024, 0.020)
    # intake lips (forward annulus) - central lip min y 0.745 (<= 0.80 gate)
    _annular_y(bm, 0.0, 0.18, 0.745, 0.775, 0.185, 0.225, 24)
    for sgn in (1, -1):
        _annular_y(bm, sgn * 0.85, 0.10, 0.785, 0.815, 0.135, 0.175, 16)
        _annular_y(bm, sgn * 1.60, 0.075, 0.805, 0.835, 0.105, 0.145, 12)
    # cooling-fin rings
    for k in range(V8_ENG_FINR_C):
        y = 0.86 + 0.107 * k
        r = _enr_at(ENR8C, y)
        _annular_y(bm, 0.0, 0.18, y - 0.012, y + 0.012, r + 0.015, r + 0.035, 16)
    for sgn in (1, -1):
        for k in range(V8_ENG_FINR_I):
            y = 0.90 + 0.10 * k
            r = _enr_at(ENR8I, y)
            _annular_y(bm, sgn * 0.85, 0.10, y - 0.010, y + 0.010, r + 0.015, r + 0.030, 12)
        for k in range(V8_ENG_FINR_O):
            y = 0.94 + 0.12 * k
            r = _enr_at(ENR8O, y)
            _annular_y(bm, sgn * 1.60, 0.075, y - 0.009, y + 0.009, r + 0.013, r + 0.028, 10)
    # intake rim struts (12, around the central forward cap lip)
    for i in range(V8_ENG_STRUTS):
        th = 2.0 * math.pi * i / V8_ENG_STRUTS
        box(bm, 0.225 * math.cos(th), 0.760, 0.18 + 0.225 * math.sin(th),
            0.014, 0.015, 0.012)
    # side pods (inboard 3/side, outboard 2/side)
    for sgn in (1, -1):
        for (py, pz) in ((0.92, 0.330), (0.98, -0.125), (1.05, 0.300)):
            box(bm, sgn * 0.85, py, pz, 0.048, 0.085, 0.020)
        for (py, pz) in ((0.95, 0.260), (1.02, -0.100)):
            box(bm, sgn * 1.60, py, pz, 0.042, 0.075, 0.018)
    # cowl ribs on the central stack (8)
    for i in range(V8_ENG_RIBS):
        th = 2.0 * math.pi * i / V8_ENG_RIBS + 0.4
        box(bm, 0.300 * math.cos(th), 1.06, 0.18 + 0.300 * math.sin(th),
            0.015, 0.045, 0.015)
    g("Engine", 4 + 3 + V8_ENG_FINR_C + 2 * V8_ENG_FINR_I + 2 * V8_ENG_FINR_O
      + 4 + 2 * (V8_ENG_PODS + 2) + V8_ENG_RIBS)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    bm.normal_update()
    print("ENG8 pre-bevel1 tris", sum(len(f.verts) - 2 for f in bm.faces))
    bevel_ob(ob_from_bm(bm, ob), 0.005, V8_ENG_BEVEL)
    print("ENG8 post-bevel1 tris", sum(len(f.verts) - 2 for f in bm.faces))
    bm = bmesh.new(); bm.from_mesh(ob.data)
    BANDS = []
    if V8_ENG_SUBDIV:
        BANDS.append(("subdiv", V8_ENG_SUBDIV_Y))
    if V8_ENG_SUBDIV2:
        BANDS.append(("subdiv2", V8_ENG_SUBDIV2_Y))
    if V8_ENG_SUBDIV3:
        BANDS.append(("subdiv3", V8_ENG_SUBDIV3_Y))
    for (nm, thr) in BANDS:
        sel = set(e for f in bm.faces if f.calc_center_median().y > thr for e in f.edges)
        bmesh.ops.subdivide_edges(bm, edges=list(sel), cuts=1, smooth=0)
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:]); bm.normal_update()
        print("ENG8 post-" + nm + " tris", sum(len(f.verts) - 2 for f in bm.faces))
    if V8_ENG_SUB2B:
        cands = [f for f in bm.faces if f.calc_center_median().y > 0.95]
        cands.sort(key=lambda f: -f.calc_center_median().y)
        sel = set(e for f in cands[:V8_ENG_SUB2B_N] for e in f.edges)
        bmesh.ops.subdivide_edges(bm, edges=list(sel), cuts=1, smooth=0)
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:]); bm.normal_update()
        print("ENG8 post-sub2B tris", sum(len(f.verts) - 2 for f in bm.faces), "sel", min(V8_ENG_SUB2B_N, len(cands)))
    displace(bm, 0.005, 0.0, 3.0, SEED + 2)
    bm.to_mesh(ob.data); bm.free(); ob.data.update()
    bevel_ob(ob, 0.004, 60.0)
    print("ENG8 final tris", tris_of(ob))
    return ob
