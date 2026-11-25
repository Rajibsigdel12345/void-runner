# ---------------------------------------------------------------- v8 ENGINE tables
# (y, r) ring lofts per stack. Central cx=0 cz=0.18 (20 sides); inboard +/-0.85
# cz=0.10 (16 sides); outboard +/-1.60 cz=0.075 (14 sides).
ENR8C = [(0.76, 0.20), (0.82, 0.235), (0.88, 0.265), (0.95, 0.285),
         (1.03, 0.290), (1.11, 0.280), (1.18, 0.260), (1.26, 0.245)]
ENR8I = [(0.80, 0.145), (0.87, 0.170), (0.95, 0.185), (1.04, 0.190),
         (1.13, 0.178), (1.21, 0.160)]
ENR8O = [(0.82, 0.115), (0.89, 0.138), (0.97, 0.150), (1.06, 0.152),
         (1.14, 0.140), (1.20, 0.125)]
ENR_SIDES = {"C": 20, "I": 16, "O": 14}

# ---------------------------------------------------------------- v8 FIN tables
# closed (y,z) profiles; prism_x extrudes along +x (sgn mirrors to -x).
FIN8D = [(0.30, 0.62), (0.60, 0.88), (0.88, 1.12), (1.12, 1.26),
         (1.30, 1.30), (1.30, 0.75), (0.90, 0.66), (0.50, 0.60)]
RUDDER8 = [(0.72, 0.42), (1.30, 0.78), (1.30, 1.02), (0.72, 0.98)]
ELEV8 = [(0.55, -0.08), (0.80, -0.24), (1.02, -0.33), (1.24, -0.36),
         (1.28, -0.36), (1.28, -0.10), (0.95, -0.05), (0.70, -0.05)]

# belly gondola 8-pt cross-section (x, z), lofted along y -0.55..0.50
GOND8 = [(0.155, -0.12), (0.155, -0.30), (0.110, -0.378), (0.045, -0.382),
         (-0.045, -0.382), (-0.110, -0.378), (-0.155, -0.30), (-0.155, -0.12)]
GOND_STOPS = [(0.0, 0.45), (0.2, 0.85), (0.4, 1.0), (0.6, 1.0), (0.8, 0.85), (1.0, 0.45)]

# ---------------------------------------------------------------- v8 HULL
# long rigid-airship envelope (16-gon loft, 14 rings) + belly gondola + 2 turret
# humps + pre-bevel boxes; SUBALL + banded subdivs tuned against the v7 measured
# band-multiplier (v7 run14: 7-band stack M ~ 3.47).
def build_hull8():
    ob = newmesh("VR_Ship_Hull"); bm = bmesh.new()
    apex = bm.verts.new(APEX8)
    rv = [ring(bm, y, w, zc, h) for (y, w, zc, h) in RINGS8]
    for i in range(SIDES):
        bm.faces.new((apex, rv[0][i], rv[0][(i + 1) % SIDES]))
    for rii in range(len(rv) - 1):
        a, b = rv[rii], rv[rii + 1]
        for i in range(SIDES):
            j = (i + 1) % SIDES
            bm.faces.new((a[i], a[j], b[j], b[i]))
    rc = bm.verts.new(TAILCAP8)
    rt = rv[-1]
    for i in range(SIDES):
        bm.faces.new((rt[i], rt[(i + 1) % SIDES], rc))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    bm.normal_update()
    # ---- PRE-bevel greebles ----
    box(bm, 0.0, -1.38, 0.265, 0.022, 0.035, 0.050)   # nose sensor snout
    box(bm, 0.0, -0.10, 0.865, 0.050, 0.520, 0.045)  # dorsal spine
    box(bm, 0.0, -0.95, 0.530, 0.030, 0.050, 0.030)  # forward light
    box(bm, 0.0, -0.98, 0.500, 0.085, 0.070, 0.028)  # roof hatch
    box(bm, 0.30, 0.55, 0.740, 0.020, 0.020, 0.085)  # antenna mast (R flank)
    box(bm, 0.30, 0.55, 0.705, 0.035, 0.045, 0.020)  # mast base
    # belly gondola (lofted 8-pt section, scaled per station)
    nst = V8_GOND_ST
    grow = []
    for k in range(nst):
        t = k / float(nst - 1)
        y = -0.55 + 1.05 * t
        s = 0.45
        for (tt, ss) in GOND_STOPS:
            if t <= tt:
                s = ss; break
        grow.append([bm.verts.new((x * s, y, -0.30 + (z + 0.30) * s)) for (x, z) in GOND8])
    ng = len(GOND8)
    for rii in range(nst - 1):
        a, b = grow[rii], grow[rii + 1]
        for i in range(ng):
            j = (i + 1) % ng
            bm.faces.new((a[i], a[j], b[j], b[i]))
    bm.faces.new(list(reversed(grow[0])))
    bm.faces.new(grow[-1])
    for sx in (1, -1):           # 4 fairing struts gondola -> belly
        for sy in (1, -1):
            box(bm, sx * 0.10, sy * 0.30, -0.16, 0.012, 0.05, 0.06)
    for sy in (1, -1):           # 2 gondola deck plates
        box(bm, 0.0, sy * 0.15, -0.118, 0.10, 0.06, 0.008)
    for sx in (1, -1):           # 4 gondola side vents
        for sy in (1, -1):
            box(bm, sx * 0.150, sy * 0.20, -0.25, 0.008, 0.030, 0.022)
    # 2 turret humps (centerline ellipsoids) + 4 barrels
    for (ty, tz, rx, rz, by0, by1, bz) in ((-0.85, 0.66, 0.09, 0.06, -1.00, -0.84, 0.68),
                                          (0.30, 0.80, 0.085, 0.06, 0.30, 0.46, 0.82)):
        n0 = len(bm.verts)
        bmesh.ops.create_icosphere(bm, subdivisions=V8_TURRET_SUB, radius=1.0)
        for v in bm.verts[n0:]:
            v.co = (rx * v.co.x, ty + 0.11 * v.co.y, tz + rz * v.co.z)
        for bx in (1, -1):
            _cyl_y(bm, bx * 0.045, by0, by1, bz, 0.016, 6)
    cable(bm, (0.30, 0.55, 0.820), (0.16, 0.42, 0.70), 0.004)
    cable(bm, (-0.16, 0.42, 0.70), (0.30, 0.55, 0.820), 0.004)
    g("Hull", 16 + 2 + nst - 1 + 4 + 2 + 4 + 2)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    bm.normal_update()
    print("HULL8 base+pre tris", sum(len(f.verts) - 2 for f in bm.faces))
    bevel_ob(ob_from_bm(bm, ob), 0.006, 45.0)
    bm = bmesh.new(); bm.from_mesh(ob.data)
    print("HULL8 post-bevel1 tris", sum(len(f.verts) - 2 for f in bm.faces))
    if V8_HULL_SUBALL:
        bmesh.ops.subdivide_edges(bm, edges=bm.edges[:], cuts=1, smooth=0)
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:]); bm.normal_update()
        print("HULL8 post-suball tris", sum(len(f.verts) - 2 for f in bm.faces))
    BANDS = []
    if V8_HULL_BANDA:
        BANDS.append((-0.50, 0.30))
    if V8_HULL_BANDB:
        BANDS.append((-0.15, 0.15))
    if V8_HULL_BANDC:
        BANDS.append((-1.24, -0.55))
    if V8_HULL_BANDD:
        BANDS.append((0.30, 0.86))
    for bi, (y0, y1) in enumerate(BANDS):
        sel = set(e for f in bm.faces if y0 < f.calc_center_median().y < y1 for e in f.edges)
        bmesh.ops.subdivide_edges(bm, edges=list(sel), cuts=1, smooth=0)
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:]); bm.normal_update()
        print("HULL8 post-band%d tris" % bi, sum(len(f.verts) - 2 for f in bm.faces))
    if V8_HULL_SUB2A:
        sel = set(e for f in bm.faces if -0.50 < f.calc_center_median().y < 0.30 for e in f.edges)
        bmesh.ops.subdivide_edges(bm, edges=list(sel), cuts=1, smooth=0)
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:]); bm.normal_update()
        print("HULL8 post-sub2A tris", sum(len(f.verts) - 2 for f in bm.faces))
    if V8_HULL_SUB2B:
        cands = [f for f in bm.faces if -0.50 < f.calc_center_median().y < 0.30]
        cands.sort(key=lambda f: abs(f.calc_center_median().y + 0.10))
        _hist = {}
        for f in cands:
            _hist[len(f.verts)] = _hist.get(len(f.verts), 0) + 1
        print("HULL8 sub2B cands", len(cands), dict(sorted(_hist.items())), "faces", len(bm.faces))
        sel = set(e for f in cands[:V8_HULL_SUB2B_N] for e in f.edges)
        bmesh.ops.subdivide_edges(bm, edges=list(sel), cuts=1, smooth=0)
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:]); bm.normal_update()
        print("HULL8 post-sub2B tris", sum(len(f.verts) - 2 for f in bm.faces), "sel", min(V8_HULL_SUB2B_N, len(cands)))
    displace(bm, 0.008, 0.002, 3.0, SEED)
    bm.to_mesh(ob.data); bm.free(); ob.data.update()
    bevel_ob(ob, 0.005, 45.0)
    bm = bmesh.new(); bm.from_mesh(ob.data)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:]); bm.normal_update()
    # ---- POST-bevel crisp greebles ----
    # 19 transverse former rows, 16 cells each (R8.6: 18-20 transverse ribs)
    for yf in FORMER_Y8[:V8_FORMERS]:
        for ci in range(SIDES):
            th = 2.0 * math.pi * ci / SIDES
            px, pz, nx, nz = facet_at(yf, th)
            if nz < -0.8:
                off, hh = 0.006, 0.008   # belly cell: stay above -0.399 gate
            else:
                off, hh = 0.012, 0.014
            cx = px + nx * off
            cz = pz + nz * off
            rot_box(bm, (cx, yf, cz), (0.028, 0.010, hh),
                    (cx, yf, cz), (0, 1, 0), th + math.pi / 2.0)
    g("Hull", V8_FORMERS * SIDES)
    # 6 longitudinal gothic ribs (R8.6), y -1.22..0.86
    for thd in GOTH_TH8:
        gothic_rib(bm, thd, -1.22, 0.86, V8_GOTH_ST)
    g("Hull", 6)
    # portholes: 2 rows x 8 x both flanks = 16/side (R8.5)
    for (thdeg, ymid, yspan) in ((-25.0, -0.95, 0.65), (-55.0, -0.80, 0.55)):
        for i in range(V8_PORTH):
            y = ymid - yspan / 2.0 + i * (yspan / (V8_PORTH - 1))
            for th in (math.radians(thdeg), math.radians(180.0 - thdeg)):
                px, pz, nx, nz = facet_at(y, th)
                box(bm, px + nx * 0.010, y, pz + nz * 0.010, 0.016, 0.022, 0.016)
    g("Hull", 2 * V8_PORTH * 2)
    # dark-trench inset panels (th -60 / 240)
    for y in (-0.45, 0.25):
        for th in (math.radians(-60), math.radians(240)):
            px, pz, nx, nz = facet_at(y, th)
            box(bm, px + nx * 0.008, y, pz + nz * 0.008, 0.050, 0.100, 0.020)
    g("Hull", 4)
    # trench pipe runs: 2/side, 2 segments each (R8.4)
    for (ya, yb) in ((-0.80, -0.30), (-0.05, 0.50)):
        ym = (ya + yb) / 2.0
        for th in (math.radians(-50), math.radians(230)):
            px, pz, nx, nz = facet_at(ym, th)
            cx = px + nx * 0.008
            cz = pz + nz * 0.008
            _cyl_y(bm, cx, ya, yb, cz, 0.018, 6)
            box(bm, cx, ym, cz, 0.026, 0.008, 0.026)  # joint flange
    g("Hull", 8)
    # subtle cell rings (protruding elliptical bands)
    for y in CELL_RING_Y8[:V8_CELL_RINGS]:
        w, zc, h = _ring_at(y)
        cell_ring(bm, y, w, zc, h, 0.012)
    g("Hull", V8_CELL_RINGS)
    bm.to_mesh(ob.data); bm.free(); ob.data.update()
    return ob
