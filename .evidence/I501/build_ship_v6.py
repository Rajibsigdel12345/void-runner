import bpy, bmesh, math, os
from mathutils import Vector, Matrix

EVID = "E:/Game/.evidence/I501/"
L = Vector((-0.45, -0.55, 0.70)).normalized()   # build-space bake light (glTF (-0.45,0.70,0.55))
K_HULL, K_WING = 0.60, 0.80
SEED = 42117
SCALE_XYZ = (1.600, 1.405, 1.260)

# ---- v5 tunables (verbatim from .evidence/I470/build_ship_v5.py) ----
HULL_AMP, HULL_RIB, HULL_FREQ = 0.009, 0.003, 3.2
WING_AMP, WING_RIB, WING_FREQ = 0.006, 0.002, 3.5
ENG_AMP,  ENG_FREQ               = 0.006, 3.0
HULL_MID_Y = (-0.60, 0.45)
WING_MID_X = 0.95
ENG_MID_Y  = (0.50, 0.62)
HULL_INSET_N, WING_INSET_N, FIN_INSET_N, ENG_INSET_N = 12, 5, 4, 4
SIDES = 10
SIDES_N = 12

# ---- v6 (I501/ST-467): cut-ladder knobs + frozen v6 geometry ----
HULL_MID3_Y = (-0.12, 0.09)     # NEW v6 third subdiv band - I501 MEASURED: full (-0.30,0.25) gave 23,956 t > 21,500 CAP; ladder run midA-E pinned this band (21,252 t, +248 margin); no greeble cuts applied (H1-H4 FULL fidelity)
V6_GIRDERS = 6                   # cut ladder: 4
V6_RIBS_PER_RING = 13            # cut ladder: 10
V6_H4 = True                     # cut ladder: False (mast + rigging)
V6_H2_HATCH = True               # cut ladder: False (roof hatch + lip)
V6_H3_SPOKED = True              # cut ladder: False (pod underside ribs + hub)
V6_PROPS_PER_NACELLE = 3         # cut ladder: 2
V6_KEEL_SUBDIV = True            # cut ladder: False
# frozen lower pair {235,295} is pairwise x-asymmetric (mirror(235)=305, mirror(295)=245);
# corrected WITH derivation to {235,305} (keeps 235, replaces 295 with its mirror 305).
V6_GIRDER_TH = (25, 65, 115, 155, 235, 305)
V6_GIRDER_TH_4 = (65, 115, 235, 305)
V6_RIB_Y = (-0.64, -0.43, -0.21, 0.00, 0.21, 0.40, 0.52)
# run12: run11's 0-base-drift table put most ribs at the exact ring y; every same-ring rib
# has (0,+/-1,0) y-face normals -> 45 new coplanar rib-x-rib y island-pairs (run11 zf:
# 204 face / 45 island pairs). Restore the run10 unique-y formula (min adjacent y-gap
# 0.009 build = 0.0126 mesh, ~10x the flagged-gap ceiling 0.00131 mesh) + per-cell
# overrides for the 4 rib x skin/post y-pairs the run10 formula alone hit (run10 zf had
# 8 island pairs total = these 4 + tang 11x24 + rad 77x89 + tang 68x70 + belly 95x116):
#   (2,3)  k3  ri2: bottom -0.2165 vs post 65 gi06 bottom -0.2162 (gap 0.0003 build)
#   (2,12) k12 ri2: bottom -0.2195 vs skin -0.2200 (gap 0.0005 build)
#   (3,1)  k1  ri3: top +0.0200 vs skin +0.0200 (co-plane)
#   (6,11) k11 ri6: top +0.5300 vs post 305 gi13 top +0.5300 (co-plane)
# Each override re-verified vs skin/post planes AND same-ring neighbor y-gaps (min
# 0.003 build = 0.0042 mesh). Probe (zf_final.py) is the arbiter.
V6_RIB_YK_FIX = {(2, 3): -0.0275, (2, 12): +0.003, (3, 1): -0.006, (6, 11): +0.006}
# run12: k9 sits on decagon side 6 WITH post 235 (identical box orientation). off 0.012
# (= post off) is forbidden (re-creates the radial co-plane 77x89); 0.024 outward FAILED
# the zmin floor (zmin -0.3368 < -0.3333, run11 build fail #1); 0.006 (run11) co-planned
# the same-side k8 x k9 radial faces (island-pair k08 x k09 in run11 zf). 0.015: vs k8
# (0.006) gap 0.009 build / 0.012 mesh; vs post 235 (0.012) gap 0.003 build / 0.0041 mesh
# (4x eps). k9 zmin -0.3267 -> floor margin 0.0066.
V6_RIB_OFF = {1: 0.018, 5: 0.018, 9: 0.015, 12: 0.018}
# run11: ribs k6/k9 share their decagon side with posts 155/235 -> tangential faces near-coplanar
# (gaps 0.00131 / 0.00009 mesh). tang half 0.075->0.079 moves both tang faces +0.004..0.006 mesh.
V6_RIB_TANG = {6: 0.079, 9: 0.079}
CAPS = {"VR_Ship_Hull": 21500, "VR_Ship_Engine": 5800, "VR_Ship_Fin": 2800,
        "VR_Ship_Wings": 3000, "VR_Ship_Cockpit": 1600, "VR_Ship_Nozzle": 2400}
TOTAL_CAP, TOTAL_HARD = 37100, 38000

def girder_thetas():
    return V6_GIRDER_TH if V6_GIRDERS == 6 else V6_GIRDER_TH_4

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
    for f in _boxfaces(vs):
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
    GREBBLES[part] = GREBBLES.get(part, 0) + n# ---------------------------------------------------------------- HULL (v5 RINGS verbatim)
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

def _ring_at(y):
    R = RINGS
    if y <= R[0][0]:
        return (R[0][1], R[0][2], R[0][3])
    if y >= R[-1][0]:
        return (R[-1][1], R[-1][2], R[-1][3])
    for i in range(len(R) - 1):
        y0, w0, z0, h0 = R[i]
        y1, w1, z1, h1 = R[i + 1]
        if y0 <= y <= y1:
            t = (y - y0) / (y1 - y0)
            return (w0 + (w1 - w0) * t, z0 + (z1 - z0) * t, h0 + (h1 - h0) * t)
    w, zc, h = R[-1]
    return (w, zc, h)

# I501 MEASURED CORRECTION: the hull skin is the DECAGON (chords), not the
# ellipse through the vertices. Chords cut inside the ellipse by up to the
# sagitta (~14 mm at lower-hull edge midpoints). Girder/rib/window centers
# placed on the ellipse would FLOAT 3-9 mm off the skin. All v6 skin-seated
# greebles therefore use the true decagon chord point + chord normal.
def decagon_at(y, th):
    w, zc, h = _ring_at(y)
    step = 2.0 * math.pi / SIDES
    a0 = math.floor(th / step + 1e-9) * step
    a1 = a0 + step
    px0, pz0 = w * math.cos(a0), zc + h * math.sin(a0)
    px1, pz1 = w * math.cos(a1), zc + h * math.sin(a1)
    ddx, ddz = px1 - px0, pz1 - pz0
    den = math.cos(th) * ddz - math.sin(th) * ddx
    t = (px0 * ddz - (pz0 - zc) * ddx) / den if abs(den) > 1e-12 else w
    px, pz = t * math.cos(th), zc + t * math.sin(th)
    ln = math.hypot(ddx, ddz)
    nx, nz = ddz / ln, -ddx / ln
    mx, mz = (px0 + px1) / 2.0, (pz0 + pz1) / 2.0
    if nx * mx + nz * (mz - zc) < 0:
        nx, nz = -nx, -nz
    return (px, pz, nx, nz)

def decagon_x_side(y, zt):
    w, zc, h = _ring_at(y)
    vs = []
    for i in range(SIDES):
        a = 2.0 * math.pi * i / SIDES
        vs.append((w * math.cos(a), zc + h * math.sin(a)))
    for i in range(SIDES):
        x0, z0 = vs[i]
        x1, z1 = vs[(i + 1) % SIDES]
        if x0 > 0.0 and x1 > 0.0 and min(z0, z1) - 1e-9 <= zt <= max(z0, z1) + 1e-9:
            t = (zt - z0) / (z1 - z0) if abs(z1 - z0) > 1e-9 else 0.0
            px = x0 + (x1 - x0) * t
            dx, dz = x1 - x0, z1 - z0
            ln = math.hypot(dx, dz)
            nx, nz = dz / ln, -dx / ln
            if nx < 0:
                nx, nz = -nx, -nz
            return (px, zt, nx, nz)
    return (w, zt, 1.0, 0.0)

def belly_face(y):
    w, zc, h = _ring_at(y)
    return zc - 0.951 * h

def x_keel(y):
    w, zc, h = _ring_at(y)
    return min(0.05, 0.309 * w - 0.020)

def hull_surf_x(y, z):
    w, zc, h = _ring_at(y)
    u = (z - zc) / h
    return w * math.sqrt(max(0.0, 1.0 - u * u))

# ---------------------------------------------------------------- WINGS (v5 constants verbatim)
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

def station_at(x):
    S = STATIONS
    if x <= S[0][0]:
        return S[0][1:5]
    if x >= S[-1][0]:
        return S[-1][1:5]
    for i in range(len(S) - 1):
        x0, yz0, zy0, sy0, sz0 = S[i]
        x1, yz1, zy1, sy1, sz1 = S[i + 1]
        if x0 <= x <= x1:
            t = (x - x0) / (x1 - x0)
            return (yz0 + (yz1 - yz0) * t, zy0 + (zy1 - zy0) * t,
                    sy0 + (sy1 - sy0) * t, sz0 + (sz1 - sz0) * t)
    return S[-1][1:5]

# ---------------------------------------------------------------- FIN (v5 constants verbatim)
FIN13 = [(0.28, 0.02), (0.35, 0.02), (0.42, 0.02), (0.49, 0.02), (0.56, 0.02),
         (0.55, 0.14), (0.54, 0.29), (0.54, 0.44),
         (0.48, 0.44), (0.42, 0.44),
         (0.39, 0.36), (0.36, 0.28), (0.34, 0.24)]
FINLET = [(0.20, 0.04), (0.32, 0.04), (0.30, 0.16), (0.22, 0.14)]

# ---------------------------------------------------------------- ENGINE (v5 constants verbatim)
ENR8 = [(0.375, 0.135), (0.40, 0.140), (0.44, 0.150), (0.50, 0.158),
        (0.56, 0.158), (0.62, 0.150), (0.68, 0.138), (0.74, 0.124), (0.78, 0.112)]

def dome_z(x, y):
    u = (x / 0.16) ** 2 + ((y + 0.32) / 0.24) ** 2
    if u >= 1.0:
        return 0.195
    return 0.195 + 0.15 * math.sqrt(1.0 - u)

# ---------------------------------------------------------------- v6 greeble primitives

def disc_z(bm, cx, cy, z0, z1, r, sides):
    # horizontal (x-y) n-gon prism between z0 (bottom) and z1 (top)
    top = [bm.verts.new((cx + r * math.cos(2.0 * math.pi * i / sides),
                         cy + r * math.sin(2.0 * math.pi * i / sides), z1)) for i in range(sides)]
    bot = [bm.verts.new((cx + r * math.cos(2.0 * math.pi * i / sides),
                         cy + r * math.sin(2.0 * math.pi * i / sides), z0)) for i in range(sides)]
    bm.faces.new(list(reversed(top)))
    bm.faces.new(bot)
    for i in range(sides):
        j = (i + 1) % sides
        bm.faces.new((top[i], top[j], bot[j], bot[i]))

def _hex_x(bm, x0, x1, cy, cz, r, sides=6):
    p0 = [bm.verts.new((x0, cy + r * math.cos(2.0 * math.pi * i / sides),
                        cz + r * math.sin(2.0 * math.pi * i / sides))) for i in range(sides)]
    p1 = [bm.verts.new((x1, cy + r * math.cos(2.0 * math.pi * i / sides),
                        cz + r * math.sin(2.0 * math.pi * i / sides))) for i in range(sides)]
    bm.faces.new(list(reversed(p0)))
    bm.faces.new(p1)
    for i in range(sides):
        j = (i + 1) % sides
        bm.faces.new((p0[i], p0[j], p1[j], p1[i]))

def _cyl_y(bm, cx, y0, y1, r, sides):
    a = [bm.verts.new((cx + r * math.cos(2.0 * math.pi * i / sides), y0,
                       r * math.sin(2.0 * math.pi * i / sides))) for i in range(sides)]
    b = [bm.verts.new((cx + r * math.cos(2.0 * math.pi * i / sides), y1,
                       r * math.sin(2.0 * math.pi * i / sides))) for i in range(sides)]
    bm.faces.new(list(reversed(a)))
    bm.faces.new(b)
    for i in range(sides):
        j = (i + 1) % sides
        bm.faces.new((a[i], a[j], b[j], b[i]))

def _cone_y(bm, cx, ybase, rbase, ytip, sides):
    base = [bm.verts.new((cx + rbase * math.cos(2.0 * math.pi * i / sides), ybase,
                          rbase * math.sin(2.0 * math.pi * i / sides))) for i in range(sides)]
    tip = bm.verts.new((cx, ytip, 0.0))
    bm.faces.new(list(reversed(base)))
    for i in range(sides):
        j = (i + 1) % sides
        bm.faces.new((base[i], base[j], tip))

def _annular_y(bm, cx, y0, y1, rin, rout, sides):
    a_in = [bm.verts.new((cx + rin * math.cos(2.0 * math.pi * i / sides), y0,
                          rin * math.sin(2.0 * math.pi * i / sides))) for i in range(sides)]
    a_out = [bm.verts.new((cx + rout * math.cos(2.0 * math.pi * i / sides), y0,
                           rout * math.sin(2.0 * math.pi * i / sides))) for i in range(sides)]
    b_in = [bm.verts.new((cx + rin * math.cos(2.0 * math.pi * i / sides), y1,
                          rin * math.sin(2.0 * math.pi * i / sides))) for i in range(sides)]
    b_out = [bm.verts.new((cx + rout * math.cos(2.0 * math.pi * i / sides), y1,
                           rout * math.sin(2.0 * math.pi * i / sides))) for i in range(sides)]
    for i in range(sides):
        j = (i + 1) % sides
        bm.faces.new((a_in[i], a_in[j], b_in[j], b_in[i]))
        bm.faces.new((a_out[j], a_out[i], b_out[i], b_out[j]))
        bm.faces.new((a_in[i], a_out[i], a_out[j], a_in[j]))
        bm.faces.new((b_out[i], b_in[i], b_in[j], b_out[j]))

def keel_loft(bm, sgn, y0, y1, n):
    # hex keel section, lofted along the hull belly
    prof = [(0.0156, 0.0), (0.0078, 0.008), (-0.0078, 0.008),
            (-0.0156, 0.0), (-0.0078, -0.008), (0.0078, -0.008)]
    m = len(prof)
    before = set(bm.verts)
    rings = []
    for i in range(n):
        y = y0 + (y1 - y0) * i / (n - 1)
        cx = sgn * x_keel(y)
        cz = belly_face(y) - 0.006
        rings.append([bm.verts.new((cx + px, y, cz + pz)) for (px, pz) in prof])
    for rii in range(n - 1):
        a, b = rings[rii], rings[rii + 1]
        for i in range(m):
            j = (i + 1) % m
            bm.faces.new((a[i], a[j], b[j], b[i]))
    bm.faces.new(list(reversed(rings[0])))
    bm.faces.new(rings[-1])
    newv = set(bm.verts) - before
    if V6_KEEL_SUBDIV:
        faces = [f for f in bm.faces
                 if all(v in newv for v in f.verts)
                 and f.calc_center_median().z < -0.05]
        edges = set(e for f in faces for e in f.edges)
        if edges:
            bmesh.ops.subdivide_edges(bm, edges=list(edges), cuts=1, smooth=0)
            bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    return newv

def prop_blade(bm, cx, psi):
    ps = math.radians(psi)
    rd = Vector((math.sin(ps), 0.0, math.cos(ps)))
    tang = Vector((math.cos(ps), 0.0, -math.sin(ps)))
    yhat = Vector((0.0, 1.0, 0.0))
    y0 = 0.740
    r0, r1 = 0.034, 0.260
    n = 12
    rings = []
    for i in range(n):
        t = i / (n - 1)
        r = r0 + (r1 - r0) * t
        c = 0.032 * (1.0 - 0.35 * t)
        th = 0.008
        phi = math.radians(25.0) * t
        cd = tang * math.cos(phi) + yhat * math.sin(phi)
        ctr = Vector((cx, 0.0, 0.0)) + rd * r
        c0 = ctr - cd * (c / 2.0) - rd * (th / 2.0)
        c1 = ctr + cd * (c / 2.0) - rd * (th / 2.0)
        c2 = ctr + cd * (c / 2.0) + rd * (th / 2.0)
        c3 = ctr - cd * (c / 2.0) + rd * (th / 2.0)
        rings.append([bm.verts.new((p.x, p.y + y0, p.z)) for p in (c0, c1, c2, c3)])
    for rii in range(n - 1):
        a, b = rings[rii], rings[rii + 1]
        for i in range(4):
            j = (i + 1) % 4
            bm.faces.new((a[i], a[j], b[j], b[i]))
    bm.faces.new(list(reversed(rings[0])))
    bm.faces.new(rings[-1])

def nose_ring(bm):
    SID = 24
    stations = (-0.842, -0.826, -0.810)
    rings_in, rings_out = [], []
    for y in stations:
        r = 0.055 * (y + 0.85) / 0.05
        rin, rout = r - 0.004, r + 0.010
        ri = [bm.verts.new((rin * math.cos(2.0 * math.pi * i / SID), y,
                            0.005 + rin * math.sin(2.0 * math.pi * i / SID))) for i in range(SID)]
        ro = [bm.verts.new((rout * math.cos(2.0 * math.pi * i / SID), y,
                            0.005 + rout * math.sin(2.0 * math.pi * i / SID))) for i in range(SID)]
        rings_in.append(ri); rings_out.append(ro)
    for rii in range(len(stations) - 1):
        a_in, b_in = rings_in[rii], rings_in[rii + 1]
        a_out, b_out = rings_out[rii], rings_out[rii + 1]
        for i in range(SID):
            j = (i + 1) % SID
            bm.faces.new((a_in[i], a_in[j], b_in[j], b_in[i]))
            bm.faces.new((a_out[j], a_out[i], b_out[i], b_out[j]))
    for rii in (0, len(stations) - 1):
        ri, ro = rings_in[rii], rings_out[rii]
        for i in range(SID):
            j = (i + 1) % SID
            bm.faces.new((ri[i], ri[j], ro[j], ro[i]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
# ---------------------------------------------------------------- v6 greeble placements (I501/ST-467)
# rot_box convention (RESOLVED, spec 7.1): local Z -> radial normal,
# local X -> tangent, local Y -> vertical. rot_box(bm, center, half,
# pivot, axis, ang) with axis (0,1,0), ang=atan2(nx,nz) puts local Z on (nx,0,nz).

def v6_h1(bm):
    # H1 frame cage: longitudinal girders (14 posts each) + transverse rib rings
    for td in girder_thetas():
        th = math.radians(td)
        for gi in range(14):
            y = -0.72 + 1.2 * gi / 13.0
            px, pz, nx, nz = decagon_at(y, th)
            c = (px + nx * 0.012, y, pz + nz * 0.012)
            rot_box(bm, c, (0.020, 0.050, 0.030), c, (0, 1, 0), math.atan2(nx, nz))
    for ri, y in enumerate(V6_RIB_Y):
        m = V6_RIBS_PER_RING
        for k in range(m):
            th = 2.0 * math.pi * k / m
            yk = y + 0.0015 * (((k * 7 + 3) % m) - (m // 2)) + 0.002 * (((ri * 5 + 1) % 7) - 3) + V6_RIB_YK_FIX.get((ri, k), 0.0)  # run12: run10 unique-y + 4 per-cell skin/post fixes (V6_RIB_YK_FIX)
            px, pz, nx, nz = decagon_at(y, th)
            off = V6_RIB_OFF.get(k, 0.006)  # run11: per-rib radial offset (k9 widened vs post 235 co-side radial faces)
            c = (px + nx * off, yk, pz + nz * off)
            rot_box(bm, c, (V6_RIB_TANG.get(k, 0.075), 0.016, 0.030), c, (0, 1, 0), math.atan2(nx, nz))  # run11: k6/k9 tang widened vs post co-side tang faces
    g("Hull", V6_GIRDERS * 14 + len(V6_RIB_Y) * V6_RIBS_PER_RING)

def v6_h2(bm):
    # H2 gondola detail: portholes 4/side, vent bars +x, forward roof hatch
    for sgn in (1, -1):
        for y in (-0.30, -0.15, 0.0, 0.10):
            px, zt, nx, nz = decagon_x_side(y, 0.05)
            cx = sgn * (px + nx * 0.012)  # run13: 0.008->0.012 - outer face 0.048 was COPLANAR with
            #   rib k1 (side 0, off 0.018 + rad half 0.030 = 0.048): run12 pair 210x225 (full overlap)
            #   + rib k1 ri2 x porthole y=-0.15 sliver. 0.012: vs rib k1 0.004 build / vs k0 0.016 /
            #   vs post 25 outer 0.042 -> 0.010 / inner -0.028 stays embedded (skin min -0.012).
            cz = 0.05 + nz * 0.012
            rot_box(bm, (cx, y, cz), (0.020, 0.045, 0.040), (cx, y, cz), (0, 1, 0),
                    math.atan2(sgn * nx, nz))
    # 7.2 vent-bar zt fixed on build: safe on-skin zt per row (decagon_x_side),
    # boxes 8 mm proud of the skin, 47 mm embedded -> cannot float.
    for y, zt in ((0.30, 0.14), (0.3133, 0.11), (0.33, 0.08), (0.34, 0.05)):
        px, zt2, nx, nz = decagon_x_side(y, zt)
        cx = px + nx * 0.008
        cz = zt + nz * 0.008
        rot_box(bm, (cx, y, cz), (0.010, 0.007, 0.055), (cx, y, cz), (0, 1, 0),
                math.atan2(nx, nz))
    if V6_H2_HATCH:
        # 7.3 DECISION: frozen hatch at cy=0.02 sits INSIDE the v5 dorsal spine
        # box (y -0.25..0.35, z 0.201..0.229) -> would be an enclosed island.
        # Moved to the forward roof (y 0.365..0.475): straddles the decagon roof
        # chord (top 0.1224..0.1401 incl. +/-12 mm hull displace), spine ends at
        # y=0.35 so no overlap. Lid + lip, both intersect the skin in all cases.
        box(bm, 0.0, 0.42, 0.1352, 0.030, 0.055, 0.014)
        box(bm, 0.0, 0.42, 0.127, 0.040, 0.065, 0.008)
    g("Hull", 12 + (2 if V6_H2_HATCH else 0))

def v6_h3(bm, sgn):
    # H3 spoked skid pod + struts (pod top 52 mm under belly; struts bridge)
    disc_z(bm, sgn * 0.22, 0.11, -0.3175, -0.2858, 0.16, 16)
    if V6_H3_SPOKED:
        for k in range(4):  # 180-deg-symmetric box: k and k+4 coincide -> range(4) = same 8-spoke star, no z-fight
            rot_box(bm, (sgn * 0.22, 0.11, -0.3147), (0.090, 0.014, 0.008),
                    (sgn * 0.22, 0.11, -0.3147), (0, 0, 1), math.radians(45.0 * k))
        disc_z(bm, sgn * 0.22, 0.11, -0.3255, -0.3055, 0.045, 8)
    for y in (0.02, 0.20):
        disc_z(bm, sgn * 0.28, y, -0.29, -0.06, 0.022, 8)
    g("Hull", 1 + (5 if V6_H3_SPOKED else 0) + 2)  # 4 spokes + 1 hub

def v6_h4(bm):
    # H4 mast + rigging (all cable ends verified buried in the hull solid)
    if not V6_H4:
        return
    disc_z(bm, 0.0, -0.39, 0.1912, 0.42, 0.0156, 8)
    box(bm, 0.0, -0.39, 0.1988, 0.030, 0.030, 0.015)  # z nudge: clear mast z-fight
    cable(bm, (0.0, -0.39, 0.42), (0.0, -0.80, 0.045), 0.008)
    cable(bm, (0.0, -0.39, 0.42), (0.0, -0.15, 0.205), 0.008)
    cable(bm, (0.0, -0.39, 0.42), (0.125, 0.30, 0.10), 0.008)
    cable(bm, (0.0, -0.39, 0.42), (-0.125, 0.30, 0.10), 0.008)
    g("Hull", 6)

def v6_wings(bm):
    # panel bands straddle the nominal wing top; embedded 15 mm down vs the
    # +/-8 mm wing displace -> intersect in all noise states (placed PRE-displace,
    # so the boxes stay crisp while the bumpy skin moves around them).
    # 7.5 tip plate widened to hx 0.007 (1.240..1.254) so it still embeds in the
    # displaced wingtip/winglet faces (worst case face at x=1.242).
    for sgn in (1, -1):
        for xc in (0.35, 0.65, 0.95):
            yz, zy, sy, sz = station_at(xc)
            box(bm, sgn * xc, yz - 0.04, zy + 0.0645 * sz, 0.015, 0.025, 0.011)
        box(bm, sgn * 1.247, 0.23, 0.115, 0.007, 0.075, 0.10)
    g("Wings", 8)

def v6_cockpit(bm):
    # canopy frame cage: 5 long ribs x 3 rows + 3 cross ribs x 3 rows, all
    # straddling the exact (undisplaced) dome via dome_z; cockpit is crisp.
    for x in (-0.12, -0.06, 0.0, 0.06, 0.12):
        for y in (-0.3817, -0.32, -0.2583):
            box(bm, x, y, dome_z(x, y) + 0.003, 0.006, 0.0283, 0.006)
    for y in (-0.45, -0.32, -0.18):
        for x in (-0.06, 0.0, 0.06):
            box(bm, x, y, dome_z(x, y) + 0.003, 0.032, 0.006, 0.006)
    # windshield: 12-gon elliptical slab (rx 0.148, rz 0.108), y -0.556..-0.540,
    # side quads + TRIANGLE-FAN end caps (no n-gons).
    RX, RZ, ZC, Y0, Y1, N12 = 0.148, 0.108, 0.280, -0.556, -0.540, 12
    ra = [bm.verts.new((RX * math.cos(2.0 * math.pi * i / N12), Y0,
                        ZC + RZ * math.sin(2.0 * math.pi * i / N12))) for i in range(N12)]
    rb = [bm.verts.new((RX * math.cos(2.0 * math.pi * i / N12), Y1,
                        ZC + RZ * math.sin(2.0 * math.pi * i / N12))) for i in range(N12)]
    for i in range(N12):
        j = (i + 1) % N12
        bm.faces.new((ra[i], ra[j], rb[j], rb[i]))
    ca = bm.verts.new((0.0, Y0, ZC))
    cb = bm.verts.new((0.0, Y1, ZC))
    for i in range(N12):
        j = (i + 1) % N12
        bm.faces.new((ca, rb[i], rb[j]))
        bm.faces.new((cb, ra[j], ra[i]))
    for sgn in (1, -1):
        rot_box(bm, (sgn * 0.055, -0.542, 0.26), (0.004, 0.008, 0.050),
                (sgn * 0.055, -0.542, 0.26), (0, 1, 0), -sgn * 0.25)
    g("Cockpit", 27)

def v6_fin(bm):
    # rivet bosses straddle the crisp fin front face (x 0.119..0.129 vs face
    # 0.120, embedded 9 mm); spar ribs straddle the fin rear (x 0.164..0.192
    # vs face 0.175, embedded 11 mm).
    for sgn in (1, -1):
        for i in range(10):
            _hex_x(bm, sgn * 0.119, sgn * 0.129, 0.30 + 0.025 * i, 0.04, 0.0094)
        for y in (0.34, 0.44):
            box(bm, sgn * 0.178, y, 0.15, 0.014, 0.016, 0.16)
    g("Fin", 28)

def v6_engine(bm):
    # 7.4 DECISION: intake lip + seam bands widened to 8 mm radial half-width
    # (frozen 2 mm bands would float up to 6 mm off the skin once the engine
    # displace moves the nacelle +/-6 mm). 7.6 spinner base 0.735 -> 0.737:
    # at 0.735 its base disc is coplanar with the hub front cap (z-fight).
    for sgn in (1, -1):
        cx = sgn * 0.30
        _cyl_y(bm, cx, 0.735, 0.839, 0.0375, 12)
        _cone_y(bm, cx, 0.737, 0.030, 0.660, 12)
        psis = (90, 210, 330) if V6_PROPS_PER_NACELLE == 3 else (90, 270)
        if sgn < 0:
            # Mirror per nacelle: prop_blade rd=(sin,0,cos) is not symmetric
            # for cx=-0.30 -- psi=90 (+x) sends the left blade toward the
            # centerline, sweeping it through the exhaust plume cone. (270,150,30)
            # mirrors (90,210,330) about the Z axis; (90,270) is self-mirroring.
            psis = tuple((360 - p) % 360 for p in psis)
        for psi in psis:
            prop_blade(bm, cx, psi)
        _annular_y(bm, cx, 0.370, 0.380, 0.127, 0.143, 24)
        _annular_y(bm, cx, 0.496, 0.504, 0.150, 0.166, 12)
        _annular_y(bm, cx, 0.616, 0.624, 0.142, 0.158, 12)
    g("Engine", 2 * (2 + V6_PROPS_PER_NACELLE + 3))

def v6_nozzle(bm):
    # N1 keel girders (buried 14 mm under the belly chord, 2 mm proud ->
    # intersect the hull skin in all displace states; keels are the ONLY
    # nozzle geometry below the bell start y=0.62), N2 nose ring + 4 nose ribs.
    for sgn in (1, -1):
        keel_loft(bm, sgn, -0.72, 0.48, 12)
    nose_ring(bm)
    for td in (45, 135, 225, 315):
        th = math.radians(td)
        box(bm, 0.0404 * math.cos(th), -0.826, 0.005 + 0.0404 * math.sin(th),
            0.007, 0.010, 0.007)
    g("Nozzle", 7)
# ---------------------------------------------------------------- pipeline glue
def ob_from_bm(bm, ob):
    bm.to_mesh(ob.data); bm.normal_update()
    return ob

def greeble_verts(bm, base):
    # NOTE: identity-based set diff (verified I501 headless probe) -> skip is
    # ineffective and EVERY vert with normal.length >= 0.5 is displaced;
    # v6 greebles are added POST-displace (hull/wings/engine) or on the
    # crisp parts (cockpit/fin/nozzle), so they stay where placed.
    return set(bm.verts) - base

# ---------------------------------------------------------------- HULL (v5 verbatim + v6 H1-H4)
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
    box(bm, 0.0, 0.05, 0.2162, 0.045, 0.300, 0.014)           # dorsal spine (z nudge: clear dorsal z-fight)
    # belly F/M/A moved POST-bevel (run9: skip set ineffective per greeble_verts note)
    box(bm, 0.330, 0.02, 0.005, 0.014, 0.060, 0.045)          # vent R
    box(bm, -0.330, 0.02, 0.005, 0.014, 0.060, 0.045)         # vent L
    box(bm, 0.0, 0.46, 0.190, 0.009, 0.009, 0.090)            # antenna mast
    box(bm, 0.0, 0.46, 0.090, 0.020, 0.020, 0.012)            # mast base
    rot_box(bm, (0.045, 0.45, 0.175), (0.007, 0.007, 0.085), (0.0, 0.45, 0.10), (1,0,0), -0.30)  # strut R
    rot_box(bm, (-0.045, 0.45, 0.175), (0.007, 0.007, 0.085), (0.0, 0.45, 0.10), (1,0,0), 0.30)   # strut L
    box(bm, 0.0, 0.05, -0.2624, 0.055, 0.160, 0.008)          # belly catwalk plank (z nudge)
    box(bm, 0.070, -0.05, -0.2422, 0.006, 0.020, 0.026)       # catwalk strut F (z nudge)
    box(bm, 0.070, 0.1512, -0.2410, 0.006, 0.020, 0.026)        # catwalk strut A (z nudge)
    box(bm, 0.045, -0.09, -0.2428, 0.004, 0.006, 0.014)       # rail post F (z nudge)
    box(bm, 0.045, 0.19, -0.2416, 0.004, 0.006, 0.014)        # rail post A (z nudge)
    cable(bm, (0.0, 0.46, 0.115), (0.20, 0.40, 0.02), 0.005)  # stay cable R
    cable(bm, (0.0, 0.46, 0.115), (-0.20, 0.40, 0.02), 0.005) # stay cable L
    box(bm, 0.0, -0.42, 0.200, 0.050, 0.050, 0.010)            # filler plate
    g("Hull", 17)  # run9: belly F/M/A counted post-bevel (g 3 below)
    bm.normal_update()
    bevel_ob(ob_from_bm(bm, ob), 0.007, 40.0)
    bm = bmesh.new(); bm.from_mesh(ob.data)
    bmesh.ops.subdivide_edges(bm, edges=bm.edges[:], cuts=1, smooth=0)
    # bold non-boolean panels on the COARSE side faces
    sel = [f for f in bm.faces
           if abs(f.normal.x) > 0.55 and -0.52 < f.calc_center_median().y < 0.42
           and f.calc_area() > 0.0012]
    inset_guarded(bm, sel, 0.020, -0.012, HULL_INSET_N)
    mid = set(e for f in bm.faces if HULL_MID_Y[0] < f.calc_center_median().y < HULL_MID_Y[1] for e in f.edges)
    bmesh.ops.subdivide_edges(bm, edges=list(mid), cuts=1, smooth=0)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    bm.normal_update()
    mid2_y0, mid2_y1 = HULL_MID_Y[0], (HULL_MID_Y[0] + HULL_MID_Y[1]) / 2.0
    mid2 = set(e for f in bm.faces if mid2_y0 < f.calc_center_median().y < mid2_y1 for e in f.edges)
    bmesh.ops.subdivide_edges(bm, edges=list(mid2), cuts=1, smooth=0)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    bm.normal_update()
    # v6 I501: third subdiv band under the frame cage (cut-ladder: narrow HULL_MID3_Y)
    mid3 = set(e for f in bm.faces if HULL_MID3_Y[0] < f.calc_center_median().y < HULL_MID3_Y[1] for e in f.edges)
    bmesh.ops.subdivide_edges(bm, edges=list(mid3), cuts=1, smooth=0)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    bm.normal_update()
    displace(bm, HULL_AMP, HULL_RIB, HULL_FREQ, SEED, skip=greeble_verts(bm, base))
    # I501 run9: final bevel BEFORE v6 greebles -> H1-H4 boxes stay crisp (no bevel
    # chamfer strips on posts/ribs/hatch -> rib/post z-fight pairs removed at source)
    bm.to_mesh(ob.data); bm.free(); ob.data.update()
    bevel_ob(ob, 0.006, 45.0)
    bm = bmesh.new(); bm.from_mesh(ob.data)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    bm.normal_update()
    # belly F/M/A POST-bevel (crisp planar boxes; embedded ~15-25 mm vs +/-12 mm displace)
    box(bm, 0.0, -0.148, -0.233, 0.100, 0.160, 0.018)          # belly step F
    box(bm, 0.0, 0.05, -0.2413, 0.120, 0.140, 0.020)          # belly step M (z drop run11: top -0.2188->-0.2213 vs isl116 z -0.2192 -> gap 0.0021 build)
    box(bm, 0.0, 0.24, -0.2306, 0.0980, 0.110, 0.018)          # belly step A (z nudge)
    g("Hull", 3)
    # v6 H1-H4 POST-bevel (embeds 20-47 mm vs +/-12 mm displace -> always intersect)
    v6_h1(bm)
    v6_h2(bm)
    v6_h3(bm, 1)
    v6_h3(bm, -1)
    v6_h4(bm)
    bm.to_mesh(ob.data); bm.free(); ob.data.update()
    return ob

# ---------------------------------------------------------------- WINGS (v5 verbatim + v6 bands)
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
    v6_wings(bm)  # v6 panel bands + tip plates PRE-displace (15 mm embed vs +/-8 mm)
    displace(bm, WING_AMP, WING_RIB, WING_FREQ, SEED + 1, skip=greeble_verts(bm, base))
    bm.to_mesh(ob.data); bm.free(); ob.data.update()
    bevel_ob(ob, 0.006, 45.0)
    return ob

# ---------------------------------------------------------------- COCKPIT (v5 verbatim + v6 cage)
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
    box(bm, 0.0, -0.30, 0.365, 0.003, 0.003, 0.025)   # canopy antenna
    g("Cockpit", 10)
    v6_cockpit(bm)  # canopy frame cage + windshield + wipers (crisp, undisplaced part)
    bm.to_mesh(ob.data); bm.free(); ob.data.update()
    bevel_ob(ob, 0.006, 45.0)
    return ob

# ---------------------------------------------------------------- FIN (v5 verbatim + v6 rivets)
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
    box(bm, 0.0, 0.50, 0.33, 0.13, 0.006, 0.006)                 # tail crossbar
    g("Fin", 1)
    bm.normal_update()
    bevel_ob(ob_from_bm(bm, ob), 0.007, 40.0)
    bm = bmesh.new(); bm.from_mesh(ob.data)
    bmesh.ops.subdivide_edges(bm, edges=bm.edges[:], cuts=1, smooth=0)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    sel = [f for f in bm.faces if abs(f.normal.x) > 0.85 and f.calc_area() > 0.0010]
    inset_guarded(bm, sel, 0.012, -0.007, FIN_INSET_N)
    v6_fin(bm)  # rivet bosses + spar ribs (crisp, undisplaced part)
    bm.to_mesh(ob.data); bm.free(); ob.data.update()
    bevel_ob(ob, 0.006, 45.0)
    return ob
# ---------------------------------------------------------------- ENGINE (v5 verbatim + v6 props)

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
    pre_props = set(bm.verts)  # same bmesh tree -> identity membership exact
    v6_engine(bm)  # POST-displace (8 mm lip/band half-widths vs +/-6 mm displace)
    # PROP CLEARANCE (spec E1 / S4 flame-plume model), asserted at bmesh stage
    # pre-final-bevel, exact scope: only v6 prop-assembly verts (spinner+blades;
    # the annular bands sit at y<=0.624 so the y filter drops them). NOTE: `base`
    # above is from the OLD bmesh tree -- BMVert membership is identity-based, so
    # it cannot scope this check; `pre_props` is captured in THIS tree, directly
    # before v6_engine().
    for v in bm.verts:
        if v not in pre_props and v.co.y > 0.735:
            d = math.hypot(1.6 * v.co.x, 1.26 * v.co.z)
            need = 1.405 * v.co.y - 0.80 + 0.015
            if d < need:
                print("PROP_CLEAR_FAIL", [round(c, 4) for c in v.co],
                      "d", round(d, 4), "<", round(need, 4))
                raise SystemExit("PROP_CLEAR_FAIL")
    print("PROP_CLEAR_OK (bmesh, prop assembly)")
    bm.to_mesh(ob.data); bm.free(); ob.data.update()
    bevel_ob(ob, 0.006, 45.0)
    return ob

# ---------------------------------------------------------------- NOZZLE (v5 verbatim + v6 keels/nose)
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
    v6_nozzle(bm)  # keel girders + nose ring + nose ribs (crisp, undisplaced part)
    bm.to_mesh(ob.data); bm.free(); ob.data.update()
    bevel_ob(ob, 0.006, 45.0)
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

def newmat(name, use_vc, base):
    # v6: 3-arg. Base Color ALWAYS set (non-VC: factor only; VC: glTF exporter
    # keeps it as baseColorFactor and three.js multiplies COLOR_0 into it).
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

def bake_hull_v6(ob, k):
    # v6 hull COLOR_0: v5 light-bake + shadow regions a-f (deterministic order,
    # re-clamped [0.30,1.55] after each region; multi-region verts accumulate).
    me = ob.data
    attr = me.color_attributes.new(name="Color", type='FLOAT_COLOR', domain='POINT')
    n = len(me.vertices)
    verts = me.vertices
    vals = [clamp(1.0 + k * verts[i].normal.dot(L), 0.30, 1.55) for i in range(n)]
    # (a) girder shadows: 16 rows x girder thetas, 32 mm radius, 50 mm y-band
    for gy in range(16):
        y = -0.72 + 1.2 * gy / 15.0
        for td in girder_thetas():
            th = math.radians(td)
            px, pz, nx, nz = decagon_at(y, th)
            cx = px + nx * 0.012
            cz = pz + nz * 0.012
            for i in range(n):
                co = verts[i].co
                if (co.x - cx) ** 2 + (co.z - cz) ** 2 < 0.032 ** 2 and abs(co.y - y) < 0.05:
                    vals[i] = clamp(vals[i] * 0.82, 0.30, 1.55)
    # (b) rib-ring shadow bands
    for yrib in V6_RIB_Y:
        for i in range(n):
            if abs(verts[i].co.y - yrib) < 0.028:
                vals[i] = clamp(vals[i] * 0.85, 0.30, 1.55)
    # (c) skid-pod shadows (belly sides)
    for i in range(n):
        co = verts[i].co
        if 0.28 < abs(co.x) < 0.42 and co.z < -0.16 and -0.12 < co.y < 0.30:
            vals[i] = clamp(vals[i] * 0.80, 0.30, 1.55)
    # (d) nose-rib band
    for i in range(n):
        if abs(verts[i].co.y + 0.826) < 0.028:
            vals[i] = clamp(vals[i] * 0.85, 0.30, 1.55)
    # (e) mast shadow
    for i in range(n):
        co = verts[i].co
        if co.x ** 2 + (co.y + 0.39) ** 2 + (co.z - 0.20) ** 2 < 0.05 ** 2:
            vals[i] = clamp(vals[i] * 0.80, 0.30, 1.55)
    # (f) keel shadows (centerline belly)
    for i in range(n):
        co = verts[i].co
        if 0.015 < abs(co.x) < 0.085 and co.z < -0.12 and -0.80 < co.y < 0.58:
            vals[i] = clamp(vals[i] * 0.82, 0.30, 1.55)
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

def main():
    purge()
    hull    = build_hull()
    wings   = build_wings()
    cockpit = build_cockpit()
    fin     = build_fin()
    engine  = build_engine()
    nozzle  = build_nozzle()
    parts = (hull, wings, cockpit, fin, engine, nozzle)
    for ob in parts:
        cleanup(ob)
        triangulate_recalc(ob)
    for ob in parts:
        t = tris_of(ob)
        print("PART", ob.name, "tris", t, "verts", len(ob.data.vertices))
        if t > CAPS[ob.name]:
            raise SystemExit("CAP_FAIL " + ob.name + " " + str(t) + " > " + str(CAPS[ob.name]))
    fh = bake_hull_v6(hull, K_HULL)
    fw = bake(wings, K_WING)
    print("FACET hull   p10", round(fh['p10'],4), "p50", round(fh['p50'],4), "p90", round(fh['p90'],4), "spread", round(fh['spread'],4))
    print("FACET wings  p10", round(fw['p10'],4), "p50", round(fw['p50'],4), "p90", round(fw['p90'],4), "spread", round(fw['spread'],4))
    assert fh['spread'] >= 0.35, "hull spread < 0.35"
    assert fw['spread'] >= 0.35, "wings spread < 0.35"
    mh = newmat("VR_Ship_Hull", True, HULLC)
    mw = newmat("VR_Ship_Wing", True, WINGC)
    mc = newmat("VR_Ship_Cockpit", False, COKC)
    for ob, mat in ((hull, mh), (nozzle, mh), (engine, mh), (wings, mw), (fin, mw), (cockpit, mc)):
        ob.data.materials.clear()
        ob.data.materials.append(mat)
        finish(ob)
    # ---- BUILD-SPACE asserts (PRE-SCALE) ----
    allv = [v.co for ob in parts for v in ob.data.vertices]
    zmin = min(c.z for c in allv)
    ymin = min(c.y for c in allv)
    print("PRESCALE minz", round(zmin,4), "miny", round(ymin,4))
    assert zmin >= -0.3333, "skid pod below -0.3333 (%.4f)" % zmin
    assert ymin >= -0.94, "nose below -0.94 (%.4f)" % ymin
    rim_r = max(math.hypot(v.co.x, v.co.z + 0.02) for v in nozzle.data.vertices if v.co.y >= 0.915)
    print("NOZZLE rim r", round(rim_r, 4))
    assert rim_r >= 0.189, "central bell rim < 0.189 (%.4f)" % rim_r
    keels = [v.co for v in nozzle.data.vertices
             if abs(v.co.x) < 0.08 and v.co.z < -0.10 and v.co.y < 0.62]
    assert keels, "no keel verts found"
    print("KEELS n", len(keels), "maxy", round(max(c.y for c in keels), 4))
    assert max(c.y for c in keels) <= 0.61, "keel above 0.61"
    # prop-tip clearance vs flame plume: asserted at bmesh stage in
    # build_engine() (exact prop-assembly scope; a mesh-wide check here
    # over-broadly flags 28 static nacelle inner-ring verts, which spec E1
    # does not cover).
    # ---- scale to local (game) space ----
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
    assert 3.60 <= span_x <= 4.40, "v6 span band broken"
    assert 2.34 <= span_y <= 2.86, "v6 length band broken"
    hz = max(zs) - min(zs)
    print("LOCAL height span", round(hz,4))
    assert 0.82 <= hz <= 1.06, "v6 height band broken (%.4f)" % hz
    total = sum(tris_of(ob) for ob in parts)
    print("TOTAL_TRIS", total)
    assert total <= TOTAL_HARD, "total tris over hard cap " + str(TOTAL_HARD)
    if total > TOTAL_CAP:
        print("TOTAL_WARN", total, ">", TOTAL_CAP)
    print("GREEBLES", GREBBLES, "total", sum(GREBBLES.values()))
    out = EVID + "ship_v6.glb"
    for ob in parts:
        ob.select_set(True)
    bpy.context.view_layer.objects.active = hull
    bpy.ops.export_scene.gltf(
        filepath=out, export_format='GLB', use_selection=True,
        export_yup=True, export_apply=True, export_materials='EXPORT',
        export_vertex_color='MATERIAL', export_image_format='AUTO',
        export_skins=False, export_animations=False,
        export_normals=True, export_texcoords=False, export_tangents=False)
    print("GLB_BYTES", os.path.getsize(out))
    bpy.ops.wm.save_as_mainfile(filepath=EVID + "ship_v6.blend")
    print("ALL_DONE")

main()