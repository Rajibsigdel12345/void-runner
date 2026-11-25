# ---------------------------------------------------------------- v8 NOZZLE
# exhaust lip steps + inner cones + aft keel + 32 lip bolts. Central mouth
# reaches build y 1.30 (length pin + mouth gate); sponson mouths 1.22 / 1.20.
def build_nozzle8():
    ob = newmesh("VR_Ship_Nozzle"); bm = bmesh.new()
    cr = [0.245, 0.225, 0.205, 0.195, 0.185]
    for i in range(V8_NOZ_STEPS_C):
        y0 = 1.22 + 0.02 * i
        _annular_y(bm, 0.0, 0.18, y0, y0 + 0.02, cr[i + 1], cr[i], V8_NOZ_SIDES_C)
    sr = [0.160, 0.148, 0.136, 0.125, 0.113]
    for sgn in (1, -1):
        for i in range(V8_NOZ_STEPS_S):
            y0 = 1.19 + 0.015 * i
            _annular_y(bm, sgn * 0.85, 0.10, y0, y0 + 0.015, sr[i + 1], sr[i], 12)
    orr = [0.125, 0.113, 0.104, 0.095, 0.088]
    for sgn in (1, -1):
        for i in range(V8_NOZ_STEPS_S):
            y0 = 1.17 + 0.015 * i
            _annular_y(bm, sgn * 1.60, 0.075, y0, y0 + 0.015, orr[i + 1], orr[i], 12)
    _cone_y(bm, 0.0, 1.30, 0.18, 0.185, 1.26, 16)
    for sgn in (1, -1):
        _cone_y(bm, sgn * 0.85, 1.22, 0.10, 0.125, 1.19, 12)
        _cone_y(bm, sgn * 1.60, 1.20, 0.075, 0.095, 1.17, 12)
    box(bm, 0.0, 1.22, 0.060, 0.018, 0.025, 0.050)   # aft keel (centerline)
    cable(bm, (0.0, 1.20, 0.05), (0.85, 1.18, 0.10), 0.005)
    cable(bm, (-0.85, 1.18, 0.10), (0.0, 1.20, 0.05), 0.005)
    # lip bolts: 16 central + 4+4 inboard + 4+4 outboard (sponson rings +0.4 rad)
    for i in range(8):
        th = 2.0 * math.pi * i / 8.0
        bx = 0.245 * math.cos(th); bz = 0.18 + 0.245 * math.sin(th)
        _hex_x(bm, bx, bx + 0.02, 1.23, bz, 0.012)
    for sgn in (1, -1):
        for i in range(4):
            th = 2.0 * math.pi * i / 4.0 + 0.4
            bx = sgn * 0.85 + 0.150 * math.cos(th); bz = 0.10 + 0.150 * math.sin(th)
            _hex_x(bm, bx, bx + 0.02, 1.198, bz, 0.011)
        for i in range(4):
            th = 2.0 * math.pi * i / 4.0 + 0.4
            bx = sgn * 1.60 + 0.110 * math.cos(th); bz = 0.075 + 0.110 * math.sin(th)
            _hex_x(bm, bx, bx + 0.02, 1.178, bz, 0.011)
    g("Nozzle", 8 + 8 + 8 + 3 + 2)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    bm.normal_update()
    print("NOZ8 pre-bevel1 tris", sum(len(f.verts) - 2 for f in bm.faces))
    bevel_ob(ob_from_bm(bm, ob), 0.004, V8_NOZ_BEVEL)
    print("NOZ8 post-bevel1 tris", sum(len(f.verts) - 2 for f in bm.faces))
    bm = bmesh.new(); bm.from_mesh(ob.data)
    bm.to_mesh(ob.data); bm.free(); ob.data.update()
    bevel_ob(ob, 0.004, 45.0)
    print("NOZ8 final tris", tris_of(ob))
    return ob

# ---------------------------------------------------------------- v8 COCKPIT
# command bridge at the hull top: icosphere sub4 core + collar + bridge wing
# + canopy band + radar dish + masts / periscopes / vents / panels.
def build_cockpit8():
    ob = newmesh("VR_Ship_Cockpit"); bm = bmesh.new()
    n0 = len(bm.verts)
    bmesh.ops.create_icosphere(bm, subdivisions=V8_COK_SUB, radius=1.0)
    for v in bm.verts[n0:]:
        v.co = (0.24 * v.co.x, -0.70 + 0.28 * v.co.y, 0.98 + 0.26 * v.co.z)
    _cyl_y(bm, 0.0, -0.82, -0.58, 0.90, 0.22, 16)     # bridge deck collar
    box(bm, 0.0, -0.55, 1.10, 0.280, 0.150, 0.032)   # bridge wing
    box(bm, 0.0, -0.90, 1.02, 0.120, 0.020, 0.090)   # forward canopy band
    n1 = len(bm.verts)                                # radar dish
    bmesh.ops.create_icosphere(bm, subdivisions=2, radius=1.0)
    for v in bm.verts[n1:]:
        v.co = (0.10 + 0.09 * v.co.x, -0.60 + 0.09 * v.co.y, 1.28 + 0.035 * v.co.z)
    box(bm, 0.10, -0.60, 1.22, 0.012, 0.020, 0.055)  # dish strut
    for sgn in (1, -1):
        box(bm, sgn * 0.10, -0.62, 1.22, 0.008, 0.015, 0.060)   # mast
        _hex_x(bm, sgn * 0.05, sgn * 0.07, -0.96, 1.075, 0.014) # periscope
        box(bm, sgn * 0.16, -0.90, 1.02, 0.012, 0.045, 0.028)   # vent F
        box(bm, sgn * 0.16, -0.58, 1.14, 0.012, 0.045, 0.028)   # vent A
        box(bm, sgn * 0.20, -0.78, 1.10, 0.008, 0.035, 0.030)   # panel F
        box(bm, sgn * 0.20, -0.62, 1.10, 0.008, 0.035, 0.030)   # panel A
    box(bm, 0.0, -0.70, 1.245, 0.055, 0.040, 0.010)   # roof plate
    box(bm, 0.08, -0.62, 0.76, 0.015, 0.060, 0.020)   # base vent
    g("Cockpit", 16)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    bm.normal_update()
    print("COK8 pre-bevel1 tris", sum(len(f.verts) - 2 for f in bm.faces))
    bevel_ob(ob_from_bm(bm, ob), 0.004, 45.0)
    print("COK8 post-bevel1 tris", sum(len(f.verts) - 2 for f in bm.faces))
    bm = bmesh.new(); bm.from_mesh(ob.data)
    if V8_COK_TOPSUB:
        sel = set(e for f in bm.faces
                  if f.calc_center_median().z > 1.15 and abs(f.calc_center_median().x) < 0.25
                  for e in f.edges)
        bmesh.ops.subdivide_edges(bm, edges=list(sel), cuts=1, smooth=0)
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:]); bm.normal_update()
        print("COK8 post-topsub tris", sum(len(f.verts) - 2 for f in bm.faces))
    if V8_COK_TOPSUB2:
        sel = set(e for f in bm.faces
                  if f.calc_center_median().z > 1.05 and abs(f.calc_center_median().x) < 0.30
                  for e in f.edges)
        bmesh.ops.subdivide_edges(bm, edges=list(sel), cuts=1, smooth=0)
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:]); bm.normal_update()
        print("COK8 post-topsub2 tris", sum(len(f.verts) - 2 for f in bm.faces))
    if V8_COK_SUBALLZ:
        sel = set(e for f in bm.faces if f.calc_center_median().z < V8_COK_SUBALLZ_Z for e in f.edges)
        bmesh.ops.subdivide_edges(bm, edges=list(sel), cuts=1, smooth=0)
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:]); bm.normal_update()
        print("COK8 post-suballz tris", sum(len(f.verts) - 2 for f in bm.faces))
    sel = [f for f in bm.faces
           if abs(f.calc_center_median().x) < 0.28 and 0.80 < f.calc_center_median().z < 1.23
           and f.calc_area() > 0.0015]
    inset_guarded(bm, sel, 0.008, -0.004, 10)
    bm.to_mesh(ob.data); bm.free(); ob.data.update()
    bevel_ob(ob, 0.003, 45.0)
    print("COK8 final tris", tris_of(ob))
    return ob

# ---------------------------------------------------------------- v8 FIN
# twin dorsal fins + twin elevators + centerline rudder + tail keel + greebles.
def build_fin8():
    ob = newmesh("VR_Ship_Fin"); bm = bmesh.new()
    for sgn in (1, -1):
        prism_x(bm, sgn, FIN8D, 0.030, 0.080)
        prism_x(bm, sgn, ELEV8, 0.155, 0.205)
    prism_x(bm, 1, RUDDER8, 0.0, 0.028)
    for sgn in (1, -1):
        box(bm, sgn * 0.055, 0.70, 0.95, 0.045, 0.040, 0.010)   # spar rib F
        box(bm, sgn * 0.055, 0.95, 1.12, 0.045, 0.040, 0.010)   # spar rib A
        box(bm, sgn * 0.055, 1.275, 1.295, 0.020, 0.025, 0.010) # dorsal tip plate
        box(bm, sgn * 0.18, 1.26, -0.355, 0.020, 0.025, 0.010)  # elevator tip plate
        box(bm, sgn * 0.18, 0.95, -0.22, 0.018, 0.040, 0.010)   # elevator rib
    box(bm, 0.0, 1.00, 0.55, 0.018, 0.28, 0.22)      # tail keel
    box(bm, 0.0, 1.28, 1.015, 0.014, 0.020, 0.008)   # rudder tip plate
    g("Fin", 13)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    bm.normal_update()
    print("FIN8 pre-bevel1 tris", sum(len(f.verts) - 2 for f in bm.faces))
    bevel_ob(ob_from_bm(bm, ob), 0.005, 45.0)
    print("FIN8 post-bevel1 tris", sum(len(f.verts) - 2 for f in bm.faces))
    bm = bmesh.new(); bm.from_mesh(ob.data)
    if V8_FIN_SUBALL:
        bmesh.ops.subdivide_edges(bm, edges=bm.edges[:], cuts=1, smooth=0)
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:]); bm.normal_update()
        print("FIN8 post-suball tris", sum(len(f.verts) - 2 for f in bm.faces))
    if V8_FIN_DORSAL:
        sel = set(e for f in bm.faces if f.calc_center_median().z > 0.92 for e in f.edges)
        bmesh.ops.subdivide_edges(bm, edges=list(sel), cuts=1, smooth=0)
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:]); bm.normal_update()
        print("FIN8 post-dorsal tris", sum(len(f.verts) - 2 for f in bm.faces))
    if V8_FIN_DORSAL2:
        sel = set(e for f in bm.faces if f.calc_center_median().z > 0.75 for e in f.edges)
        bmesh.ops.subdivide_edges(bm, edges=list(sel), cuts=1, smooth=0)
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:]); bm.normal_update()
        print("FIN8 post-dorsal2 tris", sum(len(f.verts) - 2 for f in bm.faces))
    for sgn in (1, -1):
        sel = [f for f in bm.faces
               if abs(f.normal.x) > 0.85 and sgn * f.calc_center_median().x > 0.05
               and f.calc_center_median().z > 0.70 and f.calc_area() > 0.002]
        inset_guarded(bm, sel, 0.008, -0.004, 4)
    skip = set(v for v in bm.verts if v.co.y > 1.29)   # protect the y <= 1.3005 gate
    displace(bm, 0.004, 0.0, 3.0, SEED + 3, skip=skip)
    bm.to_mesh(ob.data); bm.free(); ob.data.update()
    bevel_ob(ob, 0.004, 45.0)
    print("FIN8 final tris", tris_of(ob))
    return ob
