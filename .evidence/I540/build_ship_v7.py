import bpy, bmesh, math, os
from mathutils import Vector, Matrix

# I540 (ST-506, E73): ship v7 "warship airship" - BUILD at final game scale (SCALE 1.0),
# gondola space: +X span, +Y length (NOSE -Y, TAIL +Y), +Z up. Export export_yup=True
# -> glTF +X span, +Y up, +Z nose. Same axis convention as v6 (I501), no scale pass.
# Design basis: design/e73-ship-v7-research.md (D1-D6 defect fixes, YouTube chapter cites).
EVID = "E:/Game/.evidence/I540/"
L = Vector((-0.45, -0.55, 0.70)).normalized()   # build-space bake light (glTF (-0.45,0.70,0.55))
K_HULL, K_WING = 0.60, 0.80                     # v6 formula unchanged
SEED = 54077
SIDES = 12
SIDES_N = 12

# ---- v7 cut-ladder knobs (density tuning; all asserted below) ----
V7_HULL_BAND4 = True      # 4th subdiv band (core 15%)
V7_FORMERS = 9            # former rib rows
V7_FORMER_CELLS = 12      # cells per former (one per decagon facet)
V7_CELL_RINGS = 4         # subtle cell rings
V7_TRENCH_PANELS = 4      # lower-trench inset panels
V7_TRENCH_PIPES = 3       # pipe runs
V7_PORTH = 8              # portholes per side flank
V7_WING_SUBDIV2 = True    # 2nd wing subdiv band
V7_NAC_RINGS = 6          # sponson nacelle rings
V7_CENT_RINGS = 8         # centerline stack rings
V7_FINR = 4               # cooling-fin rings per stack
V7_NOZ_STEPS = 3          # exhaust lip steps per stack
V7_ENG_BEVEL = 68.0        # engine bevel pass-1 angle deg (45 too greedy: sel 1432)
V7_NOZ_BEVEL = 68.0        # nozzle bevel pass-1 angle deg
V7_NOZ_SUBDIV = False      # nozzle aft subdiv (no displace on nozzle: pure count, cut)
CAPS = {"VR_Ship_Hull": 17500, "VR_Ship_Engine": 6800, "VR_Ship_Fin": 3000,
        "VR_Ship_Wings": 4400, "VR_Ship_Cockpit": 3300, "VR_Ship_Nozzle": 3100}
AIMS = {"VR_Ship_Hull": 15000, "VR_Ship_Engine": 5800, "VR_Ship_Fin": 2400,
        "VR_Ship_Wings": 3600, "VR_Ship_Cockpit": 2600, "VR_Ship_Nozzle": 2600}
TOTAL_HARD, TOTAL_AIM = 36000, 32000

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
    zax = (p1 - p0).normalized()
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

def bevel_ob(ob, offset=0.006, ang=40.0):
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
    GREBBLES[part] = GREBBLES.get(part, 0) + n

def ring_c(bm, cx, y, zc, r, sides=SIDES_N):
    return [bm.verts.new((cx + r * math.cos(2.0 * math.pi * i / sides), y, zc + r * math.sin(2.0 * math.pi * i / sides))) for i in range(sides)]

def cell_ring(bm, y, w, zc, h, t, sides=SIDES):
    # elliptical ring band (protruding 0.015 from the local hull ring), y-t..y+t
    a = [bm.verts.new(((w + 0.015) * math.cos(2.0 * math.pi * i / sides), y - t,
                       zc + (h + 0.015) * math.sin(2.0 * math.pi * i / sides))) for i in range(sides)]
    b = [bm.verts.new(((w + 0.015) * math.cos(2.0 * math.pi * i / sides), y + t,
                       zc + (h + 0.015) * math.sin(2.0 * math.pi * i / sides))) for i in range(sides)]
    for i in range(sides):
        j = (i + 1) % sides
        bm.faces.new((a[i], a[j], b[j], b[i]))
    bm.faces.new(list(reversed(a)))
    bm.faces.new(b)

def disc_z(bm, cx, cy, z0, z1, r, sides):
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

def _cyl_y(bm, cx, y0, y1, cz, r, sides, zoff=0.0):
    a = [bm.verts.new((cx + r * math.cos(2.0 * math.pi * i / sides), y0,
                       cz + zoff + r * math.sin(2.0 * math.pi * i / sides))) for i in range(sides)]
    b = [bm.verts.new((cx + r * math.cos(2.0 * math.pi * i / sides), y1,
                       cz + zoff + r * math.sin(2.0 * math.pi * i / sides))) for i in range(sides)]
    bm.faces.new(list(reversed(a)))
    bm.faces.new(b)
    for i in range(sides):
        j = (i + 1) % sides
        bm.faces.new((a[i], a[j], b[j], b[i]))

def _cone_y(bm, cx, ybase, zc, rbase, ytip, sides):
    base = [bm.verts.new((cx + rbase * math.cos(2.0 * math.pi * i / sides), ybase,
                          zc + rbase * math.sin(2.0 * math.pi * i / sides))) for i in range(sides)]
    tip = bm.verts.new((cx, ytip, zc))
    bm.faces.new(list(reversed(base)))
    for i in range(sides):
        j = (i + 1) % sides
        bm.faces.new((base[i], base[j], tip))

def _annular_y(bm, cx, zc, y0, y1, rin, rout, sides):
    a_in = [bm.verts.new((cx + rin * math.cos(2.0 * math.pi * i / sides), y0,
                          zc + rin * math.sin(2.0 * math.pi * i / sides))) for i in range(sides)]
    a_out = [bm.verts.new((cx + rout * math.cos(2.0 * math.pi * i / sides), y0,
                           zc + rout * math.sin(2.0 * math.pi * i / sides))) for i in range(sides)]
    b_in = [bm.verts.new((cx + rin * math.cos(2.0 * math.pi * i / sides), y1,
                          zc + rin * math.sin(2.0 * math.pi * i / sides))) for i in range(sides)]
    b_out = [bm.verts.new((cx + rout * math.cos(2.0 * math.pi * i / sides), y1,
                           zc + rout * math.sin(2.0 * math.pi * i / sides))) for i in range(sides)]
    for i in range(sides):
        j = (i + 1) % sides
        bm.faces.new((a_in[i], a_in[j], b_in[j], b_in[i]))
        bm.faces.new((a_out[j], a_out[i], b_out[i], b_out[j]))
        bm.faces.new((a_in[i], a_out[i], a_out[j], a_in[j]))
        bm.faces.new((b_out[i], b_in[i], b_in[j], b_out[j]))

# ---------------------------------------------------------------- v7 HULL ring table
# gondola space, FINAL game scale. y: nose -1.30 (apex) .. tail +0.95 (cap).
# belly z ~ -0.38 (gate: glTF min-y >= -0.400), top z ~ 1.08 (brief y ..+1.10).
RINGS = [
    (-1.24, 0.050, 0.280, 0.040), (-1.16, 0.120, 0.290, 0.110),
    (-1.05, 0.240, 0.300, 0.220), (-0.90, 0.380, 0.310, 0.360),
    (-0.72, 0.500, 0.320, 0.480), (-0.52, 0.585, 0.330, 0.580),
    (-0.30, 0.640, 0.340, 0.665), (-0.06, 0.650, 0.350, 0.730),
    (0.18, 0.640, 0.350, 0.720), (0.40, 0.605, 0.355, 0.700),
    (0.60, 0.540, 0.360, 0.660), (0.76, 0.450, 0.365, 0.600),
    (0.86, 0.350, 0.370, 0.530), (0.92, 0.250, 0.375, 0.450),
]
APEX = (0.0, -1.30, 0.280)
TAILCAP = (0.0, 0.95, 0.38)
FORMER_Y = (-1.02, -0.77, -0.52, -0.27, -0.02, 0.23, 0.48, 0.72, 0.86)  # ~0.25 u pitch
CELL_RING_Y = (-0.92, -0.38, 0.22, 0.68)

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

def decagon_at(y, th):
    # true decagon chord point + chord normal at angle th (skin-seated greebles)
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
    return (px, pz, nx, nz)# ---------------------------------------------------------------- v7 shared helpers
def decagon_pts(w, zc, h, sides=SIDES):
    return [(w * math.cos(2.0 * math.pi * i / sides),
             zc + h * math.sin(2.0 * math.pi * i / sides)) for i in range(sides)]

def ring(bm, y, w, zc, h, sides=SIDES):
    return [bm.verts.new((px, y, pz)) for (px, pz) in decagon_pts(w, zc, h, sides)]

def ob_from_bm(bm, ob):
    bm.to_mesh(ob.data); bm.normal_update()
    return ob

# ---------------------------------------------------------------- v7 WING tables
# slim sponson airfoil (py = build-y offset, pz = build-z offset); 11-pt closed
# profile. Root station x=0.45 embeds in the hull flank (hull half-width ~0.55 at
# z~0.28 there); tip station lands x = +/-2.0 exactly (span pin 4.0).
AIR7 = [(-0.35, 0.000), (-0.20, 0.032), (-0.04, 0.048), (0.14, 0.042),
        (0.28, 0.028), (0.32, 0.010), (0.24, -0.022), (0.02, -0.036),
        (-0.22, -0.018)]
STATIONS7 = [(0.45, -0.02, -0.02, 1.0, 1.0), (0.85, -0.02, -0.015, 0.97, 0.98),
             (1.20, -0.01, -0.01, 0.90, 0.92), (1.50, 0.0, 0.0, 0.80, 0.80),
             (1.72, 0.01, 0.01, 0.66, 0.64), (1.88, 0.02, 0.02, 0.50, 0.46),
             (1.97, 0.02, 0.025, 0.32, 0.30), (2.00, 0.02, 0.025, 0.12, 0.10)]
# tip finlet (closed (y,z) profile), prism x 1.955..2.005
WINGLET7 = [(-0.14, 0.020), (0.00, 0.020), (0.06, 0.080), (0.00, 0.160), (-0.14, 0.140)]

# ---------------------------------------------------------------- v7 ENGINE tables
# build space (y, r) ring lofts per stack. Central stack cx=0 cz=0.18 (embeds in
# hull tail bay 0.78..0.92, exposed 0.92..1.24). Sponson nacelles cx=+/-1.30
# cz=0.10 mounted ON the wing spar (intersect by design, no booleans).
ENR7C = [(0.78, 0.20), (0.84, 0.24), (0.90, 0.27), (0.97, 0.29),
         (1.05, 0.295), (1.13, 0.285), (1.20, 0.265), (1.24, 0.25)]
ENR7S = [(0.82, 0.16), (0.90, 0.19), (0.98, 0.21), (1.06, 0.215),
         (1.14, 0.20), (1.18, 0.185)]

# ---------------------------------------------------------------- v7 FIN tables
# closed (y,z) profiles; prism_x extrudes along +x (sgn mirrors to -x).
FIN7D = [(0.45, 0.75), (0.66, 0.95), (0.80, 1.10), (0.88, 1.20), (0.92, 1.20), (0.92, 0.75)]
FIN7V = [(0.48, -0.10), (0.68, -0.22), (0.82, -0.32), (0.88, -0.34), (0.92, -0.34), (0.92, -0.10)]
RUDDER7 = [(0.86, 0.55), (0.94, 0.62), (0.96, 0.55), (0.94, 0.48)]# ---------------------------------------------------------------- v7 HULL
# ovoid gondola loft (apex + 14 rings + tail cap), vertical growth only:
# belly z -0.38 .. top z 1.08 (v6 was 0.95 tall; D1 "flat slab" fix).
def build_hull7():
    ob = newmesh("VR_Ship_Hull"); bm = bmesh.new()
    apex = bm.verts.new(APEX)
    rv = [ring(bm, y, w, zc, h) for (y, w, zc, h) in RINGS]
    for i in range(SIDES):
        bm.faces.new((apex, rv[0][i], rv[0][(i + 1) % SIDES]))
    for rii in range(len(rv) - 1):
        a, b = rv[rii], rv[rii + 1]
        for i in range(SIDES):
            j = (i + 1) % SIDES
            bm.faces.new((a[i], a[j], b[j], b[i]))
    rc = bm.verts.new(TAILCAP)
    rt = rv[-1]
    for i in range(SIDES):
        bm.faces.new((rt[i], rt[(i + 1) % SIDES], rc))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    bm.normal_update()
    # ---- PRE-subdiv greebles (embedded >= 20 mm vs +/-8 mm displace) ----
    box(bm, 0.0, -1.26, 0.285, 0.022, 0.035, 0.055)   # nose sensor snout
    box(bm, 0.0, -0.15, 0.990, 0.055, 0.550, 0.050)  # dorsal spine light band
    box(bm, 0.0, -0.72, 1.020, 0.030, 0.050, 0.030)  # forward light
    box(bm, 0.0, -0.75, 0.985, 0.090, 0.075, 0.030)  # roof hatch
    box(bm, 0.30, 0.50, 0.780, 0.020, 0.020, 0.090)  # antenna mast (R flank)
    box(bm, 0.30, 0.50, 0.745, 0.035, 0.045, 0.020)  # mast base
    box(bm, 0.0, 0.0, -0.355, 0.060, 0.500, 0.010)   # belly catwalk
    box(bm, 0.070, -0.30, -0.330, 0.006, 0.020, 0.026)  # catwalk strut F
    box(bm, 0.070, 0.30, -0.330, 0.006, 0.020, 0.026)   # catwalk strut A
    cable(bm, (0.30, 0.50, 0.865), (0.16, 0.42, 0.62), 0.004)  # stay R
    cable(bm, (-0.16, 0.42, 0.62), (0.30, 0.50, 0.865), 0.004) # stay L (mirror)
    g("Hull", 11)
    bm.normal_update()
    bevel_ob(ob_from_bm(bm, ob), 0.006, 45.0)
    bm = bmesh.new(); bm.from_mesh(ob.data)
    bmesh.ops.subdivide_edges(bm, edges=bm.edges[:], cuts=1, smooth=0)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:]); bm.normal_update()
    bands = [(-1.24, -0.72), (-0.6, 0.5), (-0.3, 0.2), (0.6, 0.92)]
    if V7_HULL_BAND4:
        bands.append((-0.15, 0.15))
    for (y0, y1) in bands:
        sel = set(e for f in bm.faces if y0 < f.calc_center_median().y < y1 for e in f.edges)
        bmesh.ops.subdivide_edges(bm, edges=list(sel), cuts=1, smooth=0)
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:]); bm.normal_update()
    BANDS2 = [(-0.45, 0.35), (-0.15, 0.15)]
    for (y0, y1) in BANDS2:
        sel = set(e for f in bm.faces if y0 < f.calc_center_median().y < y1 for e in f.edges)
        bmesh.ops.subdivide_edges(bm, edges=list(sel), cuts=1, smooth=0)
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:]); bm.normal_update()
    displace(bm, 0.008, 0.002, 3.0, SEED)
    bm.to_mesh(ob.data); bm.free(); ob.data.update()
    bevel_ob(ob, 0.005, 45.0)
    bm = bmesh.new(); bm.from_mesh(ob.data)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:]); bm.normal_update()
    # ---- POST-bevel crisp greebles (crisp: added after all displacement) ----
    # former rib rows: cells hugging the 12-gon skin (raised formers, ~0.25 u pitch)
    for yf in FORMER_Y[:V7_FORMERS]:
        for ci in range(SIDES):
            th = 2.0 * math.pi * ci / SIDES
            px, pz, nx, nz = decagon_at(yf, th)
            if nz < -0.8:
                off, hh = 0.006, 0.008   # belly cell: stay above -0.399 gate
            else:
                off, hh = 0.012, 0.014
            cx = px + nx * off
            cz = pz + nz * off
            rot_box(bm, (cx, yf, cz), (0.030, 0.011, hh),
                    (cx, yf, cz), (0, 1, 0), th + math.pi / 2.0)
    g("Hull", V7_FORMERS * SIDES)
    # porthole row, lower flanks (th -35 deg / 215 deg -> z ~ 0.05..0.15)
    for i in range(V7_PORTH):
        y = -0.85 + i * (1.45 / (V7_PORTH - 1))
        for th in (math.radians(-35), math.radians(215)):
            px, pz, nx, nz = decagon_at(y, th)
            box(bm, px + nx * 0.010, y, pz + nz * 0.010, 0.014, 0.020, 0.014)
    g("Hull", 2 * V7_PORTH)
    # dark-trench inset panels (th -60 deg / 240 deg -> z ~ -0.28)
    for y in (-0.45, 0.25):
        for th in (math.radians(-60), math.radians(240)):
            px, pz, nx, nz = decagon_at(y, th)
            box(bm, px + nx * 0.008, y, pz + nz * 0.008, 0.050, 0.100, 0.020)
    g("Hull", 4)
    # trench pipe runs: 2/side, 2 segments each, surface-seated (th -50 / 230 deg)
    for (ya, yb) in ((-0.80, -0.30), (-0.05, 0.50)):
        ym = (ya + yb) / 2.0
        for th in (math.radians(-50), math.radians(230)):
            px, pz, nx, nz = decagon_at(ym, th)
            cx = px + nx * 0.008
            cz = pz + nz * 0.008
            _cyl_y(bm, cx, ya, yb, cz, 0.020, 6)
            box(bm, cx, ym, cz, 0.026, 0.008, 0.026)  # joint flange
    g("Hull", 8)
    # subtle cell rings (protruding elliptical bands)
    for y in CELL_RING_Y[:V7_CELL_RINGS]:
        w, zc, h = _ring_at(y)
        cell_ring(bm, y, w, zc, h, 0.012)
    g("Hull", V7_CELL_RINGS)
    bm.to_mesh(ob.data); bm.free(); ob.data.update()
    return ob# ---------------------------------------------------------------- v7 WINGS
# two slim sponson spars (lofted 11-pt airfoil, 8 stations), tips x=+/-2.0
# (span pin), root embedded in the hull flanks.
def build_wings7():
    ob = newmesh("VR_Ship_Wings"); bm = bmesh.new()
    for sgn in (1, -1):
        wing_loft(bm, sgn, AIR7, STATIONS7)
        prism_x(bm, sgn, WINGLET7, 1.955, 2.005)
        box(bm, sgn * 0.70, 0.0, 0.048, 0.030, 0.060, 0.012)   # rib band F
        box(bm, sgn * 1.10, 0.0, 0.046, 0.030, 0.060, 0.012)   # rib band M
        box(bm, sgn * 1.50, 0.0, 0.042, 0.030, 0.060, 0.012)   # rib band A
        cable(bm, (sgn * 1.50, -0.06, 0.02), (sgn * 0.40, 0.16, 0.55), 0.005)  # stay
    g("Wings", 8)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    bm.normal_update()
    bevel_ob(ob_from_bm(bm, ob), 0.006, 45.0)
    bm = bmesh.new(); bm.from_mesh(ob.data)
    bmesh.ops.subdivide_edges(bm, edges=bm.edges[:], cuts=1, smooth=0)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:]); bm.normal_update()
    if V7_WING_SUBDIV2:
        mid = set(e for f in bm.faces
                  if 0.90 < abs(f.calc_center_median().x) < 1.50 for e in f.edges)
        bmesh.ops.subdivide_edges(bm, edges=list(mid), cuts=1, smooth=0)
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:]); bm.normal_update()
    for sgn in (1, -1):
        sel = [f for f in bm.faces
               if abs(f.normal.z) > 0.85 and 0.30 < sgn * f.calc_center_median().x < 1.90
               and f.calc_area() > 0.002]
        inset_guarded(bm, sel, 0.014, -0.007, 8)
    displace(bm, 0.006, 0.002, 3.5, SEED + 1)
    bm.to_mesh(ob.data); bm.free(); ob.data.update()
    bevel_ob(ob, 0.005, 45.0)
    return ob

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

# ---------------------------------------------------------------- v7 ENGINE
# BAY: 2 sponson nacelles on the spar (x=+/-1.30) + 1 centerline aft stack.
# All mouths inside glTF -z [0.8..1.3] (build y 0.8..1.3); the code flame apex
# (build y 0.8) sits inside the central stack.
def build_engine7():
    ob = newmesh("VR_Ship_Engine"); bm = bmesh.new()
    cenv = [ring_c(bm, 0.0, y, 0.18, r, SIDES_N) for (y, r) in ENR7C]
    for rii in range(len(cenv) - 1):
        a, b = cenv[rii], cenv[rii + 1]
        for i in range(SIDES_N):
            j = (i + 1) % SIDES_N
            bm.faces.new((a[i], a[j], b[j], b[i]))
    bm.faces.new(list(reversed(cenv[0]))); bm.faces.new(cenv[-1])
    for sgn in (1, -1):
        sv = [ring_c(bm, sgn * 1.30, y, 0.10, r, SIDES_N) for (y, r) in ENR7S]
        for rii in range(len(sv) - 1):
            a, b = sv[rii], sv[rii + 1]
            for i in range(SIDES_N):
                j = (i + 1) % SIDES_N
                bm.faces.new((a[i], a[j], b[j], b[i]))
        bm.faces.new(list(reversed(sv[0]))); bm.faces.new(sv[-1])
    # cowl struts: nacelle tops -> central stack
    box(bm, 0.825, 1.02, 0.380, 0.450, 0.030, 0.025)
    box(bm, -0.825, 1.02, 0.380, 0.450, 0.030, 0.025)
    # intake lips (forward annulus) + cooling-fin rings
    _annular_y(bm, 0.0, 0.18, 0.765, 0.795, 0.190, 0.230, 24)
    for sgn in (1, -1):
        _annular_y(bm, sgn * 1.30, 0.10, 0.805, 0.835, 0.150, 0.190, 16)
    for y in (0.86, 0.97, 1.08, 1.18):
        r = _enr_at(ENR7C, y)
        _annular_y(bm, 0.0, 0.18, y - 0.012, y + 0.012, r + 0.015, r + 0.035, 16)
    for sgn in (1, -1):
        for y in (0.88, 0.96, 1.04, 1.12):
            r = _enr_at(ENR7S, y)
            _annular_y(bm, sgn * 1.30, 0.10, y - 0.010, y + 0.010, r + 0.015, r + 0.030, 12)
    # intake struts (8, around the central forward cap)
    for i in range(8):
        th = 2.0 * math.pi * i / 8.0
        box(bm, 0.160 * math.cos(th), 0.80, 0.18 + 0.160 * math.sin(th),
            0.020, 0.016, 0.014)
    # nacelle side pods (4)
    for sgn in (1, -1):
        box(bm, sgn * 1.30, 0.92, 0.330, 0.050, 0.090, 0.022)
        box(bm, sgn * 1.30, 0.98, -0.130, 0.050, 0.090, 0.022)
    # cowl ribs on the central stack (6)
    for i in range(6):
        th = 2.0 * math.pi * i / 6.0 + 0.5
        box(bm, 0.300 * math.cos(th), 1.06, 0.18 + 0.300 * math.sin(th),
            0.016, 0.050, 0.016)
    g("Engine", 8 + 4 + 6 + 2 + 1 + 2)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    bm.normal_update()
    print("ENG7 pre-bevel1 tris", tris_of(ob))
    bevel_ob(ob_from_bm(bm, ob), 0.005, V7_ENG_BEVEL)
    print("ENG7 post-bevel1 tris", tris_of(ob))
    bm = bmesh.new(); bm.from_mesh(ob.data)
    aft = set(e for f in bm.faces if f.calc_center_median().y > 1.15 for e in f.edges)
    bmesh.ops.subdivide_edges(bm, edges=list(aft), cuts=1, smooth=0)
    print("ENG7 post-subdiv tris", sum(len(f.verts) - 2 for f in bm.faces))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:]); bm.normal_update()
    displace(bm, 0.005, 0.0, 3.0, SEED + 2)
    bm.to_mesh(ob.data); bm.free(); ob.data.update()
    bevel_ob(ob, 0.004, 60.0)
    print("ENG7 final tris", tris_of(ob))
    return ob

# ---------------------------------------------------------------- v7 NOZZLE
# exhaust lip steps + inner cones + aft keel. Central mouth reaches build y 1.30
# (= glTF -1.30; length pin 2.60); sponson mouths 1.225.
def build_nozzle7():
    ob = newmesh("VR_Ship_Nozzle"); bm = bmesh.new()
    cr = [0.25, 0.23, 0.21, 0.19]
    for i in range(V7_NOZ_STEPS):
        y0 = 1.24 + 0.02 * i
        _annular_y(bm, 0.0, 0.18, y0, y0 + 0.02, cr[i + 1], cr[i], 16)
    sr = [0.185, 0.17, 0.155, 0.14]
    for sgn in (1, -1):
        for i in range(V7_NOZ_STEPS):
            y0 = 1.18 + 0.015 * i
            _annular_y(bm, sgn * 1.30, 0.10, y0, y0 + 0.015, sr[i + 1], sr[i], 12)
    _cone_y(bm, 0.0, 1.30, 0.18, 0.19, 1.26, 16)
    _cone_y(bm, 1.30, 1.225, 0.10, 0.14, 1.19, 12)
    _cone_y(bm, -1.30, 1.225, 0.10, 0.14, 1.19, 12)
    box(bm, 0.0, 1.22, 0.060, 0.018, 0.025, 0.050)   # aft keel (centerline)
    cable(bm, (0.0, 1.20, 0.05), (1.30, 1.18, 0.10), 0.005)
    cable(bm, (-1.30, 1.18, 0.10), (0.0, 1.20, 0.05), 0.005)
    # lip bolts (12, around the sponson mouths)
    for sgn in (1, -1):
        for i in range(6):
            th = 2.0 * math.pi * i / 6.0
            _hex_x(bm, sgn * 1.30 + 0.150 * math.cos(th), sgn * 1.30 + 0.150 * math.cos(th) + 0.02,
                   1.185, 0.10 + 0.150 * math.sin(th), 0.012)
    g("Nozzle", 12 + 3 + 2)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    bm.normal_update()
    print("NOZ7 pre-bevel1 tris", tris_of(ob))
    bevel_ob(ob_from_bm(bm, ob), 0.004, V7_NOZ_BEVEL)
    print("NOZ7 post-bevel1 tris", tris_of(ob))
    bm = bmesh.new(); bm.from_mesh(ob.data)
    cent = set(e for f in bm.faces
               if abs(f.calc_center_median().x) < 0.45 and f.calc_center_median().y > 1.15
               for e in f.edges) if V7_NOZ_SUBDIV else set()
    bmesh.ops.subdivide_edges(bm, edges=list(cent), cuts=1, smooth=0)
    print("NOZ7 post-subdiv tris", sum(len(f.verts) - 2 for f in bm.faces))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:]); bm.normal_update()
    bm.to_mesh(ob.data); bm.free(); ob.data.update()
    bevel_ob(ob, 0.004, 45.0)
    print("NOZ7 final tris", tris_of(ob))
    return ob# ---------------------------------------------------------------- v7 COCKPIT
# COMMAND TOWER at the TOP of the ship (z 0.4-0.8, y 0.8-1.1 glTF) - fixes D3
# (buried cockpit). icosphere sub3 core + collar + bridge wing + canopy + stubs.
def build_cockpit7():
    ob = newmesh("VR_Ship_Cockpit"); bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=3, radius=1.0)
    for v in bm.verts:
        v.co = (0.22 * v.co.x, -0.60 + 0.30 * v.co.y, 0.95 + 0.28 * v.co.z)
    _cyl_y(bm, 0.0, -0.70, -0.50, 0.98, 0.26, 12)     # bridge deck ring
    box(bm, 0.0, -0.58, 1.10, 0.300, 0.160, 0.035)   # bridge wing
    box(bm, 0.0, -0.88, 1.02, 0.130, 0.020, 0.100)   # forward canopy band
    box(bm, 0.10, -0.55, 1.14, 0.008, 0.030, 0.100)  # antenna stub R
    box(bm, -0.10, -0.55, 1.14, 0.008, 0.030, 0.100) # antenna stub L
    box(bm, 0.16, -0.66, 1.02, 0.012, 0.050, 0.030)  # panel R
    box(bm, -0.16, -0.66, 1.02, 0.012, 0.050, 0.030) # panel L
    box(bm, 0.0, -0.78, 0.90, 0.040, 0.020, 0.030)   # bow vent
    box(bm, 0.0, -0.42, 0.90, 0.040, 0.020, 0.030)   # aft vent
    _hex_x(bm, 0.14, 0.16, -0.58, 1.06, 0.020)       # periscope R
    _hex_x(bm, -0.16, -0.14, -0.58, 1.06, 0.020)     # periscope L
    box(bm, 0.0, -0.60, 1.245, 0.060, 0.040, 0.010)  # roof plate
    box(bm, 0.08, -0.62, 0.76, 0.015, 0.060, 0.020)  # base vent
    g("Cockpit", 13)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    bm.normal_update()
    bevel_ob(ob_from_bm(bm, ob), 0.004, 45.0)
    bm = bmesh.new(); bm.from_mesh(ob.data)
    up = set(e for f in bm.faces
             if f.calc_center_median().z > 0.98 and abs(f.calc_center_median().x) < 0.30
             for e in f.edges)
    bmesh.ops.subdivide_edges(bm, edges=list(up), cuts=1, smooth=0)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:]); bm.normal_update()
    sel = [f for f in bm.faces
           if abs(f.calc_center_median().x) < 0.28 and 0.70 < f.calc_center_median().z < 1.23
           and f.calc_area() > 0.0004]
    inset_guarded(bm, sel, 0.008, -0.004, 10)
    bm.to_mesh(ob.data); bm.free(); ob.data.update()
    bevel_ob(ob, 0.003, 45.0)
    return ob

# ---------------------------------------------------------------- v7 FIN
# TWIN dorsal/ventral fins + centerline rudder; dorsal tips y~1.2 (rear-readable,
# fixes D5).
def build_fin7():
    ob = newmesh("VR_Ship_Fin"); bm = bmesh.new()
    for sgn in (1, -1):
        prism_x(bm, sgn, FIN7D, 0.10, 0.155)
        prism_x(bm, sgn, FIN7V, 0.10, 0.155)
    prism_x(bm, 1, RUDDER7, 0.0, 0.035)
    box(bm, 0.1275, 0.55, 0.90, 0.020, 0.050, 0.012)   # spar rib DR
    box(bm, -0.1275, 0.55, 0.90, 0.020, 0.050, 0.012)  # spar rib DL
    box(bm, 0.1275, 0.78, 0.72, 0.020, 0.050, 0.012)   # spar rib AR
    box(bm, -0.1275, 0.78, 0.72, 0.020, 0.050, 0.012)  # spar rib AL
    box(bm, 0.1275, 0.90, 1.195, 0.020, 0.025, 0.010)  # tip plate DR
    box(bm, -0.1275, 0.90, 1.195, 0.020, 0.025, 0.010) # tip plate DL
    box(bm, 0.1275, 0.90, -0.335, 0.020, 0.025, 0.010) # tip plate VR
    box(bm, -0.1275, 0.90, -0.335, 0.020, 0.025, 0.010)# tip plate VL
    g("Fin", 8)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    bm.normal_update()
    bevel_ob(ob_from_bm(bm, ob), 0.005, 45.0)
    bm = bmesh.new(); bm.from_mesh(ob.data)
    bmesh.ops.subdivide_edges(bm, edges=bm.edges[:], cuts=1, smooth=0)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:]); bm.normal_update()
    dor = set(e for f in bm.faces if f.calc_center_median().z > 0.92 for e in f.edges)
    bmesh.ops.subdivide_edges(bm, edges=list(dor), cuts=1, smooth=0)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:]); bm.normal_update()
    for sgn in (1, -1):
        sel = [f for f in bm.faces
               if abs(f.normal.x) > 0.85 and sgn * f.calc_center_median().x > 0.05
               and f.calc_center_median().z > 0.70 and f.calc_area() > 0.002]
        inset_guarded(bm, sel, 0.008, -0.004, 4)
    bm.to_mesh(ob.data); bm.free(); ob.data.update()
    bevel_ob(ob, 0.004, 45.0)
    return ob

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

def bake_hull_v7(ob, k):
    # v6 base formula + v7 shadow regions (a-e), each re-clamped [0.30,1.55];
    # multi-region verts accumulate (deterministic order).
    me = ob.data
    attr = me.color_attributes.new(name="Color", type='FLOAT_COLOR', domain='POINT')
    n = len(me.vertices)
    verts = me.vertices
    vals = [clamp(1.0 + k * verts[i].normal.dot(L), 0.30, 1.55) for i in range(n)]
    for yf in FORMER_Y:  # (a) former rib shadow bands
        for i in range(n):
            if abs(verts[i].co.y - yf) < 0.030:
                vals[i] = clamp(vals[i] * 0.84, 0.30, 1.55)
    for i in range(n):  # (b) dark lower trench
        co = verts[i].co
        if co.z < -0.12 and abs(co.x) < 0.55 and -0.9 < co.y < 0.5:
            vals[i] = clamp(vals[i] * 0.78, 0.30, 1.55)
    for yr in CELL_RING_Y:  # (c) cell-ring shadow bands
        for i in range(n):
            if abs(verts[i].co.y - yr) < 0.025:
                vals[i] = clamp(vals[i] * 0.85, 0.30, 1.55)
    for i in range(n):  # (d) belly shadow
        if verts[i].co.z < -0.30:
            vals[i] = clamp(vals[i] * 0.85, 0.30, 1.55)
    for i in range(n):  # (e) nose-rib band
        if abs(verts[i].co.y + 1.05) < 0.030:
            vals[i] = clamp(vals[i] * 0.85, 0.30, 1.55)
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
    hull    = build_hull7()
    wings   = build_wings7()
    cockpit = build_cockpit7()
    fin     = build_fin7()
    engine  = build_engine7()
    nozzle  = build_nozzle7()
    parts = (hull, wings, cockpit, fin, engine, nozzle)
    for ob in parts:
        cleanup(ob)
        triangulate_recalc(ob)
    for ob in parts:
        t = tris_of(ob)
        print("PART", ob.name, "tris", t, "verts", len(ob.data.vertices))
        if t > CAPS[ob.name]:
            raise SystemExit("CAP_FAIL " + ob.name + " " + str(t) + " > " + str(CAPS[ob.name]))
    fh = bake_hull_v7(hull, K_HULL)
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
    zmin = min(zs); zmax = max(zs)
    for _ob in parts:
        _zz = [v.co.z for v in _ob.data.vertices]
        print("ZMIN", _ob.name, round(min(_zz), 4))
    span_x = max(xs) - min(xs)
    length = max(ys) - min(ys)
    print("BUILD extent x", round(min(xs),4), round(max(xs),4), "span", round(span_x,4))
    print("BUILD extent y", round(min(ys),4), round(max(ys),4), "len", round(length,4))
    print("BUILD extent z", round(zmin,4), round(zmax,4))
    assert zmin >= -0.399, "belly below -0.399 (%.4f)" % zmin
    assert 3.60 <= span_x <= 4.40, "span band broken (%.4f)" % span_x
    assert 2.34 <= length <= 2.86, "length band broken (%.4f)" % length
    assert max(ys) <= 1.3005, "mouth above build y 1.30 (%.4f)" % max(ys)
    noz_ys = [v.co.y for v in nozzle.data.vertices]
    assert max(noz_ys) >= 1.299, "central mouth does not reach y 1.24..1.30 (%.4f)" % max(noz_ys)
    total = sum(tris_of(ob) for ob in parts)
    print("TOTAL_TRIS", total)
    assert total <= TOTAL_HARD, "total tris over hard cap " + str(TOTAL_HARD)
    if total > TOTAL_AIM:
        print("TOTAL_WARN", total, ">", TOTAL_AIM)
    print("GREEBLES", GREBBLES, "total", sum(GREBBLES.values()))
    out = EVID + "ship_v7.glb"
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
    assert gb <= 850000, "GLB tripwire %d > 850000" % gb
    if gb > 800000:
        print("GLB_WARN", gb, "> 800000")
    bpy.ops.wm.save_as_mainfile(filepath=EVID + "ship_v7.blend")
    print("ALL_DONE")

main()