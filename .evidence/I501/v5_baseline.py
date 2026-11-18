import bpy, bmesh, math, os
from mathutils import Vector, Matrix

ASSETS = "E:/Game/.evidence/I501/v5base/"
L = Vector((-0.45, -0.55, 0.70)).normalized()   # build-space bake light (glTF (-0.45,0.70,0.55))
K_HULL, K_WING = 0.60, 0.80
SEED = 42117
SCALE_XYZ = (1.600, 1.405, 1.260)

# ---- tunables (v3b: same density recipe, topology-safe order) ----
# v3b fixes vs v3 (QA I440 pass-1):
#  (1) BEVEL moved BEFORE subdiv/displace (v3 beveled the BUMPY surface: clamped
#      bevel slivers -> 90/77/70 non-manifold edges + 237 sliver faces dropped by
#      the exporter). Bevel now sees clean hard-surface edges (box/greeble 90 deg).
#  (2) DISPLACE skips greeble verts (crisp structure, bumpy skin only) - removes
#      the greeble z-band risk (v3 catwalk -0.274 pre-displace sat 1 mm under band).
#  (3) INSET moved to the COARSE (subdiv-1) faces with a 2.5*thickness edge guard
#      (v3 inset subdiv-2 quads 0.0275 wide with thickness 0.020 -> clamped slivers).
#  (4) Fin antenna replaced by a crossbar that embeds both fin roots (v3 island
#      floated 0.116 from the fin roots - QA "floating/detached part").
#  (5) Winglet tip plates removed (v3: 2 enclosed islands inside the winglets).
#  (6) Dorsal spine sunk (z 0.235->0.215) - v3 bottom face was tangential to the
#      hull top (2 z-fight tri pairs).
#  (7) Canopy antenna lowered 5 mm off the tangent dome point.
#  (8) dissolve_degenerate + tiny-face cleanup before triangulate; per-node band
#      asserts in main().
HULL_AMP, HULL_RIB, HULL_FREQ = 0.009, 0.003, 3.2     # max |d| = 0.012
WING_AMP, WING_RIB, WING_FREQ = 0.006, 0.002, 3.5     # max 0.008
ENG_AMP,  ENG_FREQ               = 0.006, 3.0         # cowl seams
HULL_MID_Y = (-0.60, 0.45)       # mid-band density band (v3c: p3 measured 3,200 -> hull lands ~3,770 incl. greebles/insets, band 3,200-4,400 sweet 3,800)
WING_MID_X = 0.95                # 2nd subdiv pass |x| bound (wings)
ENG_MID_Y  = (0.50, 0.62)        # 2nd subdiv pass band (engine)
HULL_INSET_N, WING_INSET_N, FIN_INSET_N, ENG_INSET_N = 12, 5, 4, 4
SIDES = 10                        # hull / cockpit decagon
SIDES_N = 12                      # engine / nozzle

def clamp(v, lo, hi):
    return lo if v < lo else (hi if v > hi else v)

def purge():
    for ob in list(bpy.data.objects):
        bpy.data.objects.remove(ob, do_unlink=True)
    for coll in (bpy.data.meshes, bpy.data.materials):
        for b in list(coll):
            if b.users == 0:
                coll.remove(b)

def vnoise(x, y, z, seed=SEED):
    def h(i, j, k):
        s = math.sin(i * 127.1 + j * 311.7 + k * 74.7 + seed * 0.017) * 43758.5453
        return s - math.floor(s)
    xi, yi, zi = int(math.floor(x)), int(math.floor(y)), int(math.floor(z))
    xf, yf, zf = x - xi, y - yi, z - zi
    def sm(t): return t * t * (3 - 2 * t)
    c = {}
    for di in (0, 1):
        for dj in (0, 1):
            for dk in (0, 1):
                c[di, dj, dk] = h(xi + di, yi + dj, zi + dk)
    u, w, t = sm(xf), sm(yf), sm(zf)
    n00 = c[0,0,0]*(1-u) + c[1,0,0]*u
    n10 = c[0,1,0]*(1-u) + c[1,1,0]*u
    n01 = c[0,0,1]*(1-u) + c[1,0,1]*u
    n11 = c[0,1,1]*(1-u) + c[1,1,1]*u
    n0 = n00*(1-w) + n10*w
    n1 = n01*(1-w) + n11*w
    return n0*(1-t) + n1*t

def displace(bm, amp, rib, freq, seed, skip=None):
    for v in bm.verts:
        if skip and v in skip:
            continue
        if v.normal.length < 0.5:
            continue
        d = amp * (vnoise(v.co.x * freq, v.co.y * freq, v.co.z * freq, seed) - 0.5) * 2.0
        if rib:
            d += rib * math.sin(v.co.y * 26.0 + 0.7)
        v.co = v.co + v.normal * d

def decagon_pts(w, zc, h, sides=SIDES):
    return [(w * math.cos(2.0 * math.pi * i / sides), zc + h * math.sin(2.0 * math.pi * i / sides)) for i in range(sides)]

def ring(bm, y, w, zc, h, sides=SIDES):
    return [bm.verts.new((x, y, z)) for (x, z) in decagon_pts(w, zc, h, sides)]

def ring_c(bm, cx, y, zc, r, sides=SIDES_N):
    return [bm.verts.new((cx + r * math.cos(2.0 * math.pi * i / sides), y, zc + r * math.sin(2.0 * math.pi * i / sides))) for i in range(sides)]

def newmesh(name):
    me = bpy.data.meshes.new(name)
    ob = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(ob)
    return ob

def tris_of(ob):
    return sum(len(p.vertices) - 2 for p in ob.data.polygons)

def _boxfaces(vs):
    for f in ((0,2,6,4),(1,5,7,3),(0,4,5,1),(2,3,7,6),(0,1,3,2),(4,5,7,6)):
        yield tuple(vs[f[i]] for i in range(4))

def box(bm, cx, cy, cz, hx, hy, hz):
    v = []
    for dx in (-hx, hx):
        for dy in (-hy, hy):
            for dz in (-hz, hz):
                v.append(bm.verts.new((cx + dx, cy + dy, cz + dz)))
    for f in _boxfaces(v):
        bm.faces.new(f)

def rot_box(bm, center, half, pivot, axis, ang):
    m = Matrix.Rotation(ang, 3, Vector(axis).normalized())
    pv = Vector(pivot)
    vs = []
    for dx in (-half[0], half[0]):
        for dy in (-half[1], half[1]):
            for dz in (-half[2], half[2]):
                co = m @ (Vector((center[0]+dx, center[1]+dy, center[2]+dz)) - pv) + pv
                vs.append(bm.verts.new(co))
    for f in _boxfaces(v if False else vs):
        bm.faces.new(f)

def slab_x(bm, yz, x0, x1):
    top = [bm.verts.new((x1, y, z)) for (y, z) in yz]
    bot = [bm.verts.new((x0, y, z)) for (y, z) in yz]
    n = len(yz)
    bm.faces.new(top); bm.faces.new(list(reversed(bot)))
    for i in range(n):
        a, b = i, (i + 1) % n
        bm.faces.new((top[a], top[b], bot[b], bot[a]))

def prism_x(bm, sgn, prof, x0, x1):
    top = [bm.verts.new((sgn * x1, y, z)) for (y, z) in prof]
    bot = [bm.verts.new((sgn * x0, y, z)) for (y, z) in prof]
    n = len(prof)
    bm.faces.new(top); bm.faces.new(list(reversed(bot)))
    for i in range(n):
        a, b = i, (i + 1) % n
        bm.faces.new((top[a], top[b], bot[b], bot[a]))

def wing_loft(bm, sgn, prof, stations):
    rings = []
    for (x, yz, zy, sy, sz) in stations:
        rings.append([bm.verts.new((sgn * x, py * sy + yz, pz * sz + zy)) for (py, pz) in prof])
    n = len(prof)
    for rii in range(len(rings) - 1):
        a, b = rings[rii], rings[rii + 1]
        for i in range(n):
            j = (i + 1) % n
            bm.faces.new((a[i], a[j], b[j], b[i]))
    bm.faces.new(list(reversed(rings[0])))
    bm.faces.new(rings[-1])

def cable(bm, p0, p1, r, sides=4):
    p0, p1 = Vector(p0), Vector(p1)
    d = (p1 - p0)
    zax = d.normalized()
    ref = Vector((0, 0, 1)) if abs(zax.z) < 0.9 else Vector((0, 1, 0))
    xax = zax.cross(ref).normalized()
    yax = zax.cross(xax)
    ra = [bm.verts.new(p0 + xax * (r * math.cos(2*math.pi*i/sides)) + yax * (r * math.sin(2*math.pi*i/sides))) for i in range(sides)]
    rb = [bm.verts.new(p1 + xax * (r * math.cos(2*math.pi*i/sides)) + yax * (r * math.sin(2*math.pi*i/sides))) for i in range(sides)]
    for i in range(sides):
        j = (i + 1) % sides
        bm.faces.new((ra[i], ra[j], rb[j], rb[i]))
    bm.faces.new(ra)
    bm.faces.new(list(reversed(rb)))

def _chk(bm):
    bnd = sum(1 for e in bm.edges if len(e.link_faces) == 1)
    nm = sum(1 for e in bm.edges if len(e.link_faces) > 2)
    deg = sum(1 for f in bm.faces if f.calc_area() < 1e-8)
    zed = sum(1 for e in bm.edges if e.calc_length() < 1e-6)
    return nm, deg, zed, bnd

def bevel_ob(ob, offset=0.007, ang=40.0):
    bm = bmesh.new(); bm.from_mesh(ob.data)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    bm.normal_update()
    ang_r = math.radians(ang)
    minside = offset * 2.2
    es = []
    for e in bm.edges:
        lf = e.link_faces
        if len(lf) == 2:
            n1 = lf[0].normal; n2 = lf[1].normal
            if n1.length > 0.5 and n2.length > 0.5 and n1.angle(n2) > ang_r:
                ok = e.calc_length() >= offset * 3.0
                if ok:
                    for f in lf:
                        for ee in f.edges:
                            if ee.calc_length() < minside:
                                ok = False; break
                        if not ok:
                            break
                if ok:
                    es.append(e)
    bmesh.ops.bevel(bm, geom=es, offset=offset, offset_type="OFFSET", segments=1, profile=0.7,
                    affect="EDGES", clamp_overlap=True)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    nm, deg, zed, bnd = _chk(bm)
    print("BEVEL", ob.name, "sel", len(es), "bnd", bnd, "nm", nm, "degen", deg, "zeroe", zed)
    assert nm == 0, "bevel produced non-manifold edges"
    bm.to_mesh(ob.data); bm.free(); ob.data.update()

def inset_guarded(bm, sel, thickness, depth, cap):
    # v3b guard: a face may be inset only if its shortest edge >= 2.5*thickness,
    # otherwise the even-offset border clamps to slivers (the v3 fin/hull tiny faces).
    keep = [f for f in sel if all(e.calc_length() >= thickness * 2.5 for e in f.edges)]
    keep.sort(key=lambda f: -f.calc_area())
    n = min(cap, len(keep))
    if n:
        bmesh.ops.inset_individual(bm, faces=keep[:n], thickness=thickness, depth=depth, use_even_offset=True)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    nm, deg, zed, bnd = _chk(bm)
    print("INSET", n, "candidates", len(keep), "nm", nm, "degen", deg)
    return n

def cleanup(ob):
    bm = bmesh.new(); bm.from_mesh(ob.data)
    bmesh.ops.dissolve_degenerate(bm, dist=1e-6, edges=bm.edges[:])
    tiny = [f for f in bm.faces if f.calc_area() < 1e-8]
    if tiny:
        bmesh.ops.delete(bm, geom=tiny, context='FACES')
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    nm, deg, zed, bnd = _chk(bm)
    print("CLEANUP", ob.name, "nm", nm, "degen", deg, "zeroe", zed, "bnd", bnd)
    bm.to_mesh(ob.data); bm.free(); ob.data.update()

GREBBLES = {}
def g(part, n):
    GREBBLES[part] = GREBBLES.get(part, 0) + n

# ---------------------------------------------------------------- HULL
RINGS = [
    (-0.80, 0.055, 0.005, 0.055), (-0.75, 0.095, 0.005, 0.095),
    (-0.68, 0.155, 0.005, 0.140), (-0.58, 0.225, 0.000, 0.180),
    (-0.47, 0.290, -0.005, 0.218), (-0.36, 0.332, -0.010, 0.236),
    (-0.24, 0.355, -0.015, 0.240), (-0.11, 0.352, -0.020, 0.238),
    (0.02, 0.335, -0.022, 0.232), (0.14, 0.305, -0.026, 0.220),
    (0.26, 0.262, -0.028, 0.205), (0.38, 0.215, -0.030, 0.185),
    (0.48, 0.168, -0.028, 0.152), (0.57, 0.128, -0.025, 0.112),
    (0.65, 0.088, -0.020, 0.078),
]

def build_hull():
    ob = newmesh("VR_Ship_Hull"); bm = bmesh.new()
    apex = bm.verts.new((0.0, -0.85, 0.005))
    rv = [ring(bm, y, w, zc, h) for (y, w, zc, h) in RINGS]
    for i in range(SIDES):
        bm.faces.new((apex, rv[0][i], rv[0][(i + 1) % SIDES]))
    for rii in range(len(rv) - 1):
        a, b = rv[rii], rv[rii + 1]
        for i in range(SIDES):
            j = (i + 1) % SIDES
            bm.faces.new((a[i], a[j], b[j], b[i]))
    rc = bm.verts.new((0.0, 0.68, -0.020))
    rt = rv[-1]
    for i in range(SIDES):
        bm.faces.new((rt[i], rt[(i + 1) % SIDES], rc))
    base = set(bm.verts)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    bm.normal_update()
    # greebles (function-first, real-airship vocabulary)
    box(bm, 0.0, -0.885, 0.005, 0.020, 0.045, 0.020)          # nose sensor
    box(bm, 0.0, 0.05, 0.215, 0.045, 0.300, 0.014)            # dorsal spine (v3b: sunk 20 mm, no tangential coplanar bottom)
    box(bm, 0.0, -0.15, -0.233, 0.100, 0.160, 0.018)          # belly step F
    box(bm, 0.0, 0.05, -0.240, 0.120, 0.140, 0.020)           # belly step M
    box(bm, 0.0, 0.24, -0.233, 0.100, 0.110, 0.018)           # belly step A
    box(bm, 0.318, 0.02, 0.005, 0.014, 0.060, 0.045)          # vent R
    box(bm, -0.318, 0.02, 0.005, 0.014, 0.060, 0.045)         # vent L
    box(bm, 0.0, 0.46, 0.190, 0.009, 0.009, 0.090)            # antenna mast
    box(bm, 0.0, 0.46, 0.105, 0.020, 0.020, 0.012)            # mast base
    rot_box(bm, (0.045, 0.45, 0.175), (0.007, 0.007, 0.085), (0.0, 0.45, 0.10), (1,0,0), -0.30)  # strut R
    rot_box(bm, (-0.045, 0.45, 0.175), (0.007, 0.007, 0.085), (0.0, 0.45, 0.10), (1,0,0), 0.30)   # strut L
    box(bm, 0.0, 0.05, -0.266, 0.055, 0.160, 0.008)           # belly catwalk plank
    box(bm, 0.070, -0.05, -0.247, 0.006, 0.020, 0.026)        # catwalk strut F
    box(bm, 0.070, 0.15, -0.247, 0.006, 0.020, 0.026)         # catwalk strut A
    box(bm, 0.045, -0.09, -0.250, 0.004, 0.006, 0.014)        # rail post F
    box(bm, 0.045, 0.19, -0.250, 0.004, 0.006, 0.014)         # rail post A
    cable(bm, (0.0, 0.46, 0.115), (0.20, 0.40, 0.02), 0.005)  # stay cable R
    cable(bm, (0.0, 0.46, 0.115), (-0.20, 0.40, 0.02), 0.005) # stay cable L
    box(bm, 0.0, -0.42, 0.200, 0.050, 0.050, 0.010)            # filler plate
    g("Hull", 20)
    bm.normal_update()
    bevel_ob(ob_from_bm(bm, ob), 0.007, 40.0)
    bm = bmesh.new(); bm.from_mesh(ob.data)
    bmesh.ops.subdivide_edges(bm, edges=bm.edges[:], cuts=1, smooth=0)
    # bold non-boolean panels on the COARSE side faces (v3b: before subdiv-2)
    sel = [f for f in bm.faces
           if abs(f.normal.x) > 0.55 and -0.52 < f.calc_center_median().y < 0.42
           and f.calc_area() > 0.0012]
    inset_guarded(bm, sel, 0.020, -0.012, HULL_INSET_N)
    mid = set(e for f in bm.faces if HULL_MID_Y[0] < f.calc_center_median().y < HULL_MID_Y[1] for e in f.edges)
    bmesh.ops.subdivide_edges(bm, edges=list(mid), cuts=1, smooth=0)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    bm.normal_update()
    mid2_y0, mid2_y1 = HULL_MID_Y[0], (HULL_MID_Y[0] + HULL_MID_Y[1]) / 2.0
    mid2 = set(e for f in bm.faces if mid2_y0 < f.calc_center_median().y < mid2_y1 for e in f.edges)  # v5f: forward half of mid-band only
    bmesh.ops.subdivide_edges(bm, edges=list(mid2), cuts=1, smooth=0)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    bm.normal_update()
    displace(bm, HULL_AMP, HULL_RIB, HULL_FREQ, SEED, skip=greeble_verts(bm, base))
    bm.to_mesh(ob.data); bm.free(); ob.data.update()
    return ob

def ob_from_bm(bm, ob):
    bm.to_mesh(ob.data); bm.normal_update()
    return ob

def greeble_verts(bm, base):
    # greeble = every vertex not in the base loft set (bevel/inset verts ARE skin: displaced)
    return set(bm.verts) - base

# ---------------------------------------------------------------- WINGS
AIR = [(0.62, 0.000), (0.44, 0.040), (0.20, 0.060), (-0.04, 0.066), (-0.26, 0.048),
       (-0.44, 0.018), (-0.52, -0.018), (-0.50, -0.050), (-0.40, -0.080),
       (-0.22, -0.098), (0.02, -0.102), (0.24, -0.080), (0.44, -0.044), (0.56, -0.012)]
STATIONS = [(0.16, 0.050, 0.000, 1.00, 1.00),
            (0.45, 0.080, 0.000, 0.94, 0.96),
            (0.75, 0.110, 0.005, 0.82, 0.86),
            (1.00, 0.130, 0.015, 0.66, 0.72),
            (1.16, 0.150, 0.025, 0.48, 0.54),
            (1.25, 0.160, 0.030, 0.34, 0.40)]
WINGLET = [(0.16, 0.02), (0.30, 0.02), (0.27, 0.21), (0.17, 0.19)]
STRAKE = [(-0.46, 0.010), (-0.06, 0.010), (-0.12, 0.085), (-0.52, 0.055)]

def build_wings():
    ob = newmesh("VR_Ship_Wings"); bm = bmesh.new()
    for sgn in (1, -1):
        wing_loft(bm, sgn, AIR, STATIONS)
        prism_x(bm, sgn, WINGLET, 1.195, 1.245)
        slab_x(bm, STRAKE, 0.20 * sgn, 0.58 * sgn)
    base = set(bm.verts)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    bm.normal_update()
    for sgn in (1, -1):
        cable(bm, (sgn * 0.95, 0.10, 0.045), (sgn * 0.25, -0.05, 0.20), 0.005)  # stay cable
        box(bm, sgn * 0.62, 0.10, 0.048, 0.012, 0.030, 0.010)               # wing rib
        # v3b: winglet tip plate REMOVED (was an enclosed island inside the winglet)
        g("Wings", 2)
    bm.normal_update()
    bevel_ob(ob_from_bm(bm, ob), 0.007, 40.0)
    bm = bmesh.new(); bm.from_mesh(ob.data)
    bmesh.ops.subdivide_edges(bm, edges=bm.edges[:], cuts=1, smooth=0)
    for sgn in (1, -1):
        sel = [f for f in bm.faces
               if abs(f.normal.z) > 0.85 and 0.30 < sgn * f.calc_center_median().x < 1.10
               and f.calc_area() > 0.0025]
        inset_guarded(bm, sel, 0.018, -0.009, WING_INSET_N)
    mid = set(e for f in bm.faces
              if False  # v5 wings mid-band subdiv off (density rebalance)
              for e in f.edges)
    bmesh.ops.subdivide_edges(bm, edges=list(mid), cuts=1, smooth=0)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    bm.normal_update()
    displace(bm, WING_AMP, WING_RIB, WING_FREQ, SEED + 1, skip=greeble_verts(bm, base))
    bm.to_mesh(ob.data); bm.free(); ob.data.update()
    return ob

# ---------------------------------------------------------------- COCKPIT
def build_cockpit():
    ob = newmesh("VR_Ship_Cockpit"); bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=3, radius=1.0)
    for v in bm.verts:
        v.co = Vector((v.co.x * 0.16, v.co.y * 0.24 + (-0.32), v.co.z * 0.15 + 0.195))
    top = set(e for f in bm.faces if f.calc_center_median().z > 0.24 for e in f.edges)
    bmesh.ops.subdivide_edges(bm, edges=list(top), cuts=1, smooth=0)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    angs = [2.0 * math.pi * i / SIDES for i in range(SIDES)]
    r1 = [bm.verts.new((0.165 * math.cos(a), -0.32 + 0.245 * math.sin(a), 0.200)) for a in angs]
    r2 = [bm.verts.new((0.150 * math.cos(a), -0.32 + 0.225 * math.sin(a), 0.235)) for a in angs]
    for i in range(SIDES):
        bm.faces.new((r1[i], r1[(i + 1) % SIDES], r2[(i + 1) % SIDES], r2[i]))
    bm.faces.new(r1)
    bm.faces.new(list(reversed(r2)))
    box(bm, 0.0, -0.50, 0.319, 0.012, 0.055, 0.012)
    box(bm, 0.0, -0.32, 0.345, 0.012, 0.055, 0.012)
    box(bm, 0.0, -0.14, 0.319, 0.012, 0.055, 0.012)
    box(bm,  0.065, -0.44, 0.325, 0.060, 0.012, 0.012)
    box(bm, -0.065, -0.44, 0.325, 0.060, 0.012, 0.012)
    box(bm,  0.060, -0.20, 0.325, 0.055, 0.012, 0.012)
    box(bm, -0.060, -0.20, 0.325, 0.055, 0.012, 0.012)
    box(bm, 0.0, -0.12, 0.276, 0.075, 0.012, 0.012)
    box(bm, 0.0, -0.56, 0.240, 0.014, 0.010, 0.014)   # canopy sensor
    box(bm, 0.0, -0.30, 0.365, 0.003, 0.003, 0.025)   # canopy antenna (v3b: 5 mm lower, no tangent dome point)
    g("Cockpit", 10)
    bm.to_mesh(ob.data); bm.free(); ob.data.update()
    return ob

# ---------------------------------------------------------------- FIN (TWIN)
FIN13 = [(0.28, 0.02), (0.35, 0.02), (0.42, 0.02), (0.49, 0.02), (0.56, 0.02),
         (0.55, 0.14), (0.54, 0.29), (0.54, 0.44),
         (0.48, 0.44), (0.42, 0.44),
         (0.39, 0.36), (0.36, 0.28), (0.34, 0.24)]
FINLET = [(0.20, 0.04), (0.32, 0.04), (0.30, 0.16), (0.22, 0.14)]

def build_fin():
    ob = newmesh("VR_Ship_Fin"); bm = bmesh.new()
    for sgn in (1, -1):
        prism_x(bm, sgn, FIN13, 0.120, 0.175)
    base = set(bm.verts)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    bm.normal_update()
    for sgn in (1, -1):
        prism_x(bm, sgn, FINLET, 0.118, 0.152)
        box(bm, sgn * 0.155, 0.42, 0.045, 0.075, 0.055, 0.012)   # fin top plate
        box(bm, sgn * 0.145, 0.30, 0.100, 0.010, 0.050, 0.020)  # leading strake plate
        box(bm, sgn * 0.150, 0.44, 0.300, 0.020, 0.020, 0.008)  # fin filler
        g("Fin", 3)
    box(bm, 0.0, 0.50, 0.33, 0.13, 0.006, 0.006)                 # tail crossbar between fin roots (v3b: replaces the floating antenna island; embeds both roots 10 mm)
    g("Fin", 1)
    bm.normal_update()
    bevel_ob(ob_from_bm(bm, ob), 0.007, 40.0)
    bm = bmesh.new(); bm.from_mesh(ob.data)
    bmesh.ops.subdivide_edges(bm, edges=bm.edges[:], cuts=1, smooth=0)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    sel = [f for f in bm.faces if abs(f.normal.x) > 0.85 and f.calc_area() > 0.0010]
    inset_guarded(bm, sel, 0.012, -0.007, FIN_INSET_N)
    bm.to_mesh(ob.data); bm.free(); ob.data.update()
    return ob

# ---------------------------------------------------------------- ENGINE (TWIN nacelles)
ENR8 = [(0.375, 0.135), (0.40, 0.140), (0.44, 0.150), (0.50, 0.158),
        (0.56, 0.158), (0.62, 0.150), (0.68, 0.138), (0.74, 0.124), (0.78, 0.112)]

def build_engine():
    ob = newmesh("VR_Ship_Engine"); bm = bmesh.new()
    for sgn in (1, -1):
        cx = sgn * 0.30
        rv = [ring_c(bm, cx, y, 0.0, r, SIDES_N) for (y, r) in ENR8]
        ir = ring_c(bm, cx, 0.375, 0.0, 0.085, SIDES_N)
        for i in range(SIDES_N):
            j = (i + 1) % SIDES_N
            bm.faces.new((rv[0][i], rv[0][j], ir[j], ir[i]))
        ir2 = ring_c(bm, cx, 0.42, 0.0, 0.085, SIDES_N)
        for i in range(SIDES_N):
            j = (i + 1) % SIDES_N
            bm.faces.new((ir[i], ir[j], ir2[j], ir2[i]))
        bm.faces.new(list(reversed(ir2)))
        for rii in range(len(rv) - 1):
            a, b = rv[rii], rv[rii + 1]
            for i in range(SIDES_N):
                j = (i + 1) % SIDES_N
                bm.faces.new((a[i], a[j], b[j], b[i]))
        cb = bm.verts.new((cx, 0.78, 0.0))
        rl = rv[-1]
        for i in range(SIDES_N):
            bm.faces.new((rl[i], rl[(i + 1) % SIDES_N], cb))
    base = set(bm.verts)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    bm.normal_update()
    for sgn in (1, -1):
        cx = sgn * 0.30
        box(bm, cx + sgn * 0.10, 0.58, 0.100, 0.014, 0.060, 0.028)  # top exhaust greeble
        box(bm, cx, 0.62, -0.130, 0.050, 0.050, 0.016)              # belly greeble
        box(bm, sgn * 0.155, 0.52, 0.0, 0.085, 0.055, 0.030)        # cowl strut to hull
        box(bm, cx + sgn * 0.160, 0.50, 0.0, 0.008, 0.050, 0.022)   # cooling fin fwd
        box(bm, cx + sgn * 0.160, 0.66, 0.0, 0.008, 0.040, 0.020)   # cooling fin aft
        g("Engine", 5)
    bm.normal_update()
    bevel_ob(ob_from_bm(bm, ob), 0.007, 60.0)
    bm = bmesh.new(); bm.from_mesh(ob.data)
    bmesh.ops.subdivide_edges(bm, edges=bm.edges[:], cuts=1, smooth=0)
    sel = [f for f in bm.faces
           if f.calc_area() > 0.004 and 0.40 < f.calc_center_median().y < 0.72
           and abs(f.calc_center_median().x) > 0.34]
    inset_guarded(bm, sel, 0.014, -0.008, ENG_INSET_N)
    mid = set()  # v5 engine mid-band subdiv off (density rebalance)
    bmesh.ops.subdivide_edges(bm, edges=list(mid), cuts=1, smooth=0)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    bm.normal_update()
    displace(bm, ENG_AMP, 0.0, ENG_FREQ, SEED + 2, skip=greeble_verts(bm, base))
    bm.to_mesh(ob.data); bm.free(); ob.data.update()
    return ob

# ---------------------------------------------------------------- NOZZLE
def build_nozzle():
    ob = newmesh("VR_Ship_Nozzle"); bm = bmesh.new()
    R = [(0.62, 0.075), (0.70, 0.102), (0.78, 0.130), (0.84, 0.155), (0.88, 0.172), (0.89, 0.176), (0.90, 0.180)]
    rv = [ring_c(bm, 0.0, y, -0.02, r, SIDES_N) for (y, r) in R]
    for rii in range(len(rv) - 1):
        a, b = rv[rii], rv[rii + 1]
        for i in range(SIDES_N):
            j = (i + 1) % SIDES_N
            bm.faces.new((a[i], a[j], b[j], b[i]))
    r5 = ring_c(bm, 0.0, 0.92, -0.02, 0.190, SIDES_N)
    for i in range(SIDES_N):
        j = (i + 1) % SIDES_N
        bm.faces.new((rv[-1][i], rv[-1][j], r5[j], r5[i]))
    bmesh.ops.subdivide_edges(bm, edges=bm.edges[:], cuts=1, smooth=0)
    for sgn in (1, -1):
        cx = sgn * 0.30
        a = ring_c(bm, cx, 0.78, 0.0, 0.105, SIDES_N)
        b = ring_c(bm, cx, 0.83, 0.0, 0.115, SIDES_N)
        for i in range(SIDES_N):
            j = (i + 1) % SIDES_N
            bm.faces.new((a[i], a[j], b[j], b[i]))
        ca = bm.verts.new((cx, 0.78, 0.0))
        for i in range(SIDES_N):
            bm.faces.new((a[i], a[(i + 1) % SIDES_N], ca))
        cb = bm.verts.new((cx, 0.83, 0.0))
        for i in range(SIDES_N):
            bm.faces.new((b[i], b[(i + 1) % SIDES_N], cb))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    bm.to_mesh(ob.data); bm.free(); ob.data.update()
    return ob

# ---------------------------------------------------------------- pipeline
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

def newmat(name, use_vc):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    bsdf = nt.nodes.get("Principled BSDF")
    if use_vc:
        vc = nt.nodes.new("ShaderNodeVertexColor")
        vc.layer_name = "Color"
        nt.links.new(vc.outputs["Color"], bsdf.inputs["Base Color"])
    return mat

BANDS = {"VR_Ship_Hull": (3200, 4400), "VR_Ship_Wings": (2000, 2800),
         "VR_Ship_Cockpit": (600, 900), "VR_Ship_Fin": (900, 1500),
         "VR_Ship_Engine": (2300, 3300), "VR_Ship_Nozzle": (650, 1100)}

def main():
    purge()
    hull   = build_hull()
    wings  = build_wings()
    cockpit= build_cockpit()
    fin    = build_fin()
    engine = build_engine()
    nozzle = build_nozzle()
    parts = (hull, wings, cockpit, fin, engine, nozzle)
    for ob in parts:
        cleanup(ob)
        triangulate_recalc(ob)
    for ob in parts:
        t = tris_of(ob)
        lo, hi = BANDS[ob.name]
        print("PART", ob.name, "tris", t, "verts", len(ob.data.vertices))
        if not (lo <= t <= hi): print('PART_WARN', ob.name, t, 'outside', lo, hi)
    fh = bake(hull, K_HULL)
    fw = bake(wings, K_WING)
    print("FACET hull   p10", round(fh['p10'],4), "p50", round(fh['p50'],4), "p90", round(fh['p90'],4), "spread", round(fh['spread'],4))
    print("FACET wings  p10", round(fw['p10'],4), "p50", round(fw['p50'],4), "p90", round(fw['p90'],4), "spread", round(fw['spread'],4))
    assert fh['spread'] >= 0.35, "hull spread < 0.35"
    assert fw['spread'] >= 0.35, "wings spread < 0.35"
    mh = newmat("VR_Ship_Hull", True)
    mw = newmat("VR_Ship_Wing", True)
    mc = newmat("VR_Ship_Cockpit", False)
    for ob, mat in ((hull, mh), (nozzle, mh), (wings, mw), (fin, mw), (cockpit, mc), (engine, mc)):
        ob.data.materials.clear()
        ob.data.materials.append(mat)
        finish(ob)
    for ob in parts:
        bpy.ops.object.select_all(action='DESELECT')
        ob.select_set(True); bpy.context.view_layer.objects.active = ob
        ob.scale = SCALE_XYZ
        bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    allv = [v.co for ob in parts for v in ob.data.vertices]
    xs = [c.x for c in allv]; ys = [c.y for c in allv]; zs = [c.z for c in allv]
    print("LOCAL extent x", round(min(xs),4), round(max(xs),4), "span", round(max(xs)-min(xs),4))
    print("LOCAL extent y", round(min(ys),4), round(max(ys),4), "span", round(max(ys)-min(ys),4))
    print("LOCAL extent z", round(min(zs),4), round(max(zs),4), "span", round(max(zs)-min(zs),4))
    span_x = max(xs) - min(xs); span_y = max(ys) - min(ys)
    assert 3.60 <= span_x <= 4.40, "v5 span band broken"
    assert 2.34 <= span_y <= 2.86, "v5 length band broken"
    hz = max(zs) - min(zs)
    assert 0.82 <= hz <= 0.98, "v5 height band broken (span %.4f)" % hz
    rim_r = max(math.hypot(v.co.x, v.co.z + 0.02) for v in nozzle.data.vertices if v.co.y >= 0.915)
    print("NOZZLE rim r", round(rim_r, 4))
    assert rim_r >= 0.19, "central bell rim < 0.19"
    total = sum(tris_of(ob) for ob in parts)
    print("TOTAL_TRIS", total)
    assert 15000 <= total <= 18900, "total tris outside v5 band 15000-18900"
    print("GREEBLES", GREBBLES, "total", sum(GREBBLES.values()))
    os.makedirs(ASSETS, exist_ok=True)
    for ob in parts:
        ob.select_set(True)
    bpy.context.view_layer.objects.active = hull
    bpy.ops.wm.save_as_mainfile(filepath=ASSETS + 'v5_baseline.blend')
    bpy.ops.export_scene.gltf(
        filepath=ASSETS + "ship.glb", export_format='GLB', use_selection=True,
        export_yup=True, export_apply=True, export_materials='EXPORT',
        export_vertex_color='MATERIAL', export_image_format='AUTO',
        export_skins=False, export_animations=False,
        export_normals=True, export_texcoords=False, export_tangents=False)
    print("GLB_BYTES", os.path.getsize(ASSETS + "ship.glb"))
    print("ALL_DONE")

main()

