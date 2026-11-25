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
