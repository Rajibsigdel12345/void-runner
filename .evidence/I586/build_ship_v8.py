import bpy, bmesh, math, os
from mathutils import Vector, Matrix

# I586 (ST-553, E83): ship v8 "rigid airship warship" - BUILD at final game scale (SCALE 1.0),
# gondola space: +X span, +Y length (NOSE -Y, TAIL +Y), +Z up. Export export_yup=True
# -> glTF +X span, +Y up, +Z nose. Same axis convention as v7 (I540), no scale pass.
# Frozen contract: production/scope-check-E83.md (v8 brief R8.1-R8.6; per-node AIM/CAP;
# v7 contract FROZEN verbatim: 3 materials, vertex colors on Hull+Wing mats only,
# grayscale bake formula, pinned windows, export flags). Output to .evidence/I586/ ONLY.
EVID = "E:/Game/.evidence/I586/"
L = Vector((-0.45, -0.55, 0.70)).normalized()   # build-space bake light (glTF (-0.45,0.70,0.55))
K_HULL, K_WING = 0.60, 0.80                     # v7 formula unchanged
SEED = 58677
SIDES = 16
SIDES_N = 16

# ---- v8 cut-ladder knobs (density tuning; all asserted below) ----
V8_FORMERS = 19             # transverse former rib rows (16 cells each)
V8_GOTH_ST = 16             # stations per gothic longitudinal rib
V8_PORTH = 8                # portholes per row per side (2 rows -> 16/side)
V8_CELL_RINGS = 8           # subtle cell rings
V8_TURRET_SUB = 2           # turret icosphere subdivisions
V8_GOND_ST = 6              # belly gondola stations
V8_HULL_BANDC = True        # 3rd subdiv band (chase-cam 0.30..0.86)
V8_WING_SUBDIV2 = True      # 2nd wing subdiv band
V8_ENG_PODS = 3             # inboard side pods per nacelle
V8_ENG_STRUTS = 12          # central intake struts
V8_ENG_RIBS = 8             # central cowl ribs
V8_ENG_SUBDIV = True        # engine band subdiv (y > 0.80)
V8_ENG_FINR_C = 4           # cooling-fin rings central
V8_ENG_FINR_I = 3           # cooling-fin rings inboard
V8_ENG_FINR_O = 2           # cooling-fin rings outboard
V8_NOZ_STEPS_C = 3          # central lip steps
V8_NOZ_STEPS_S = 4          # sponson lip steps (tune-up: 3 -> 4, tops 1.25/1.23 <= 1.3005)
V8_NOZ_SIDES_C = 16        # central lip step sides (match the 20-side central stack)
V8_NOZ_BOLTS = 20           # lip bolts (12 central + 8 inboard)
V8_COK_SUB = 4              # cockpit icosphere subdivisions
V8_COK_TOPSUB = True        # cockpit top subdiv band
V8_ENG_BEVEL = 68.0
V8_NOZ_BEVEL = 55.0
CAPS = {"VR_Ship_Hull": 33000, "VR_Ship_Engine": 13500, "VR_Ship_Fin": 5500,
        "VR_Ship_Wings": 7000, "VR_Ship_Cockpit": 8000, "VR_Ship_Nozzle": 5500}
AIMS = {"VR_Ship_Hull": 28000, "VR_Ship_Engine": 11500, "VR_Ship_Fin": 4000,
        "VR_Ship_Wings": 5500, "VR_Ship_Cockpit": 6500, "VR_Ship_Nozzle": 4500}
TOTAL_HARD, TOTAL_AIM = 65000, 60000

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

# ---- v8 subdivision/band knobs (tune ladder; see run log) ----
V8_HULL_SUBALL = True     # global hull subdiv after bevel1
V8_HULL_BANDA = True      # hull midship band (-0.50, 0.30)
V8_HULL_BANDB = True      # hull core band (-0.15, 0.15)
V8_HULL_BANDC = True      # hull nose band (-1.24, -0.55)
V8_HULL_BANDD = False     # hull tail band (0.30, 0.86) [tune-up lever]
V8_HULL_SUB2A = True      # hull 2nd-pass subdiv on the midship band (-0.50, 0.30) [tune-up]
V8_WING_SUBALL  = True    # wings: global subdiv after bevel1
V8_WING_SUBDIVA = False   # wing band A |x| 0.60..1.60 [tune-up lever]
V8_WING_SUBDIVB = True    # wing band B |x| 0.95..1.35 [tune-up lever]
V8_WING_SUBDIVC = False   # wing band C |x| 1.20..1.50 [tune-up lever]
V8_ENG_SUBDIV   = True    # engine band y > V8_ENG_SUBDIV_Y
V8_ENG_SUBDIV2  = False   # engine band y > V8_ENG_SUBDIV2_Y [fine tune-up]
V8_ENG_SUBDIV3  = False   # engine band y > V8_ENG_SUBDIV3_Y [coarse tune-up]
V8_ENG_SUBDIV_Y   = 1.00
V8_ENG_SUBDIV2_Y  = 1.05
V8_ENG_SUBDIV3_Y  = 0.80
V8_COK_TOPSUB   = True    # cockpit top band z > 1.15, |x| < 0.25
V8_COK_TOPSUB2  = False   # cockpit band z > 1.05, |x| < 0.30 [tune-up]
V8_FIN_SUBALL   = True    # fin: global subdiv after bevel1
V8_FIN_DORSAL   = True    # fin dorsal band z > 0.92
V8_FIN_DORSAL2  = False   # fin dorsal2 band z > 0.75 [tune-up lever]
V8_HULL_SUB2B = True      # hull: nearest-N faces to y=-0.10 within (-0.50,0.30) [sized from run2]
V8_HULL_SUB2B_N = 112
V8_WING_SUB2B = True      # wing: nearest-N faces to |x|=1.10 within (0.75,1.45) [sized from run2]
V8_WING_SUB2B_N = 110
V8_ENG_SUB2B  = False     # engine: nearest-N faces y>0.95 sorted by -y [insurance, off]
V8_ENG_SUB2B_N = 0
V8_COK_SUBALLZ = True      # cockpit: subdivide all faces with center z < V8_COK_SUBALLZ_Z [sized from run3]
V8_COK_SUBALLZ_Z = 1.08

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

# ---------------------------------------------------------------- v8 HULL ring table
# 16-gon ovoid envelope. y: nose -1.42 (apex) .. tail +0.90 (cap). Belly z ~ -0.26
# (displace margin to the -0.399 gate), top z ~ 0.86. Long rigid-airship envelope.
RINGS8 = [
    (-1.30, 0.060, 0.240, 0.050), (-1.18, 0.160, 0.250, 0.130),
    (-1.02, 0.300, 0.260, 0.240), (-0.82, 0.430, 0.270, 0.360),
    (-0.58, 0.530, 0.280, 0.450), (-0.32, 0.590, 0.290, 0.520),
    (-0.06, 0.620, 0.300, 0.555), (0.16, 0.610, 0.300, 0.545),
    (0.38, 0.565, 0.300, 0.510), (0.56, 0.490, 0.305, 0.460),
    (0.70, 0.395, 0.310, 0.395), (0.80, 0.300, 0.315, 0.320),
    (0.86, 0.215, 0.320, 0.250), (0.90, 0.140, 0.330, 0.180),
]
APEX8 = (0.0, -1.42, 0.260)
TAILCAP8 = (0.0, 0.90, 0.35)
FORMER_Y8 = (-1.24, -1.12, -1.00, -0.88, -0.76, -0.64, -0.52, -0.40, -0.28, -0.16,
            -0.04, 0.08, 0.20, 0.32, 0.44, 0.56, 0.68, 0.80, 0.87)
CELL_RING_Y8 = (-1.05, -0.70, -0.35, 0.0, 0.30, 0.55, 0.75, 0.85)
GOTH_TH8 = (30.0, 90.0, 150.0, 210.0, 270.0, 330.0)

def _ring_at(y):
    R = RINGS8
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

def facet_at(y, th):
    # true 16-gon chord point + chord normal at angle th (skin-seated greebles)
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

def facet_pts(w, zc, h, sides=SIDES):
    return [(w * math.cos(2.0 * math.pi * i / sides),
             zc + h * math.sin(2.0 * math.pi * i / sides)) for i in range(sides)]

def ring(bm, y, w, zc, h, sides=SIDES):
    return [bm.verts.new((px, y, pz)) for (px, pz) in facet_pts(w, zc, h, sides)]

def ob_from_bm(bm, ob):
    bm.to_mesh(ob.data); bm.normal_update()
    return ob

def gothic_rib(bm, thdeg, y0, y1, nst):
    # longitudinal gothic rib: 4-pt trapezoid section lofted along the envelope
    # at fixed angle thdeg (base sunk 2 mm, crown raised 20 mm). Closed caps.
    th = math.radians(thdeg)
    rows = []
    for k in range(nst):
        t = k / float(nst - 1)
        y = y0 + (y1 - y0) * t
        px, pz, nx, nz = facet_at(y, th)
        tx, tz = -nz, nx
        rows.append([
            bm.verts.new((px - nx * 0.002 - tx * 0.030, y, pz - nz * 0.002 - tz * 0.030)),
            bm.verts.new((px + nx * 0.020 - tx * 0.012, y, pz + nz * 0.020 - tz * 0.012)),
            bm.verts.new((px + nx * 0.020 + tx * 0.012, y, pz + nz * 0.020 + tz * 0.012)),
            bm.verts.new((px - nx * 0.002 + tx * 0.030, y, pz - nz * 0.002 + tz * 0.030)),
        ])
    for rii in range(len(rows) - 1):
        a, b = rows[rii], rows[rii + 1]
        for i in range(4):
            j = (i + 1) % 4
            bm.faces.new((a[i], a[j], b[j], b[i]))
    bm.faces.new(list(reversed(rows[0])))
    bm.faces.new(rows[-1])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])

# ---------------------------------------------------------------- v8 WING tables
# slim sponson airfoil (12-pt closed profile), 9 stations; tip x = +/-2.00 exact
# (span pin 4.00). Root station x=0.45 embeds in the hull flank.
AIR8 = [(-0.38, 0.000), (-0.26, 0.030), (-0.10, 0.050), (0.08, 0.052),
        (0.24, 0.038), (0.34, 0.020), (0.38, 0.000), (0.32, -0.024),
        (0.14, -0.040), (-0.08, -0.042), (-0.26, -0.028), (-0.34, -0.012)]
STATIONS8 = [(0.45, -0.02, -0.02, 1.0, 1.0), (0.75, -0.02, -0.015, 0.94, 0.95),
             (1.05, -0.01, -0.01, 0.86, 0.88), (1.35, 0.0, 0.0, 0.76, 0.78),
             (1.60, 0.01, 0.01, 0.62, 0.64), (1.80, 0.02, 0.015, 0.45, 0.46),
             (1.90, 0.02, 0.02, 0.30, 0.32), (1.96, 0.02, 0.02, 0.18, 0.18),
             (2.00, 0.02, 0.025, 0.10, 0.10)]
# tip finlet (closed (y,z) profile), prism x 1.955..2.005
WINGLET8 = [(-0.14, 0.020), (0.0, 0.020), (0.06, 0.080), (0.0, 0.160), (-0.14, 0.140)]

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

