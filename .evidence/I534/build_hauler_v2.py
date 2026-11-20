import bpy, bmesh, math
EV = r"E:/Game/.evidence/I534"
OUT = {"hauler": EV + r"/hauler_v2.glb"}
BUDGET = {
 "VR_Hull": (1900, 2500), "VR_SponsonL": (450, 640), "VR_SponsonR": (450, 640),
 "VR_Hatch": (250, 380), "VR_Stack": (400, 560),
}
RAD = {"hauler": 1.10}
PLACE = {"hauler": {n: ((0,0,0),(1,1,1)) for n in ("VR_Hull","VR_SponsonL","VR_SponsonR","VR_Hatch","VR_Stack")}}
made = {}
def new_obj(name, me):
    ob = bpy.data.objects.new(name, me); bpy.context.scene.collection.objects.link(ob); return ob
def to_obj(bm, name):
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:]); me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free(); return new_obj(name, me)
def ringb(bm, x, cx, cy, ry, rz, n, q):
    vs = []
    for i in range(n):
        a = i*2.0*math.pi/n
        c = math.cos(a); s = math.sin(a)
        y = cx + ry*math.copysign(abs(c)**q, c)
        z = cy + rz*math.copysign(abs(s)**q, s)
        vs.append(bm.verts.new((x, y, z)))
    return vs
def tube2b(bm, stations, n, q, cap_front=False, cap_back=False, tip_front=None, tip_back=None):
    rings = [ringb(bm, x, cx, cy, ry, rz, n, q) for (x, cx, cy, ry, rz) in stations]
    for k in range(len(rings)-1):
        A, B = rings[k], rings[k+1]
        for i in range(n):
            j = (i+1) % n; bm.faces.new((A[i], A[j], B[j], B[i]))
    if cap_back:
        c = bm.verts.new((stations[0][0]-0.10, stations[0][1], stations[0][2]))
        for i in range(n): bm.faces.new((c, rings[0][(i+1)%n], rings[0][i]))
    if cap_front:
        c = bm.verts.new((stations[-1][0]+0.10, stations[-1][1], stations[-1][2]))
        for i in range(n): bm.faces.new((c, rings[-1][i], rings[-1][(i+1)%n]))
    if tip_front is not None:
        c = bm.verts.new((tip_front, stations[-1][1], stations[-1][2]))
        for i in range(n): bm.faces.new((c, rings[-1][i], rings[-1][(i+1)%n]))
    if tip_back is not None:
        c = bm.verts.new((tip_back, rings[0][1].co.y, rings[0][1].co.z))
        for i in range(n): bm.faces.new((c, rings[0][(i+1)%n], rings[0][i]))
    return rings
def ridge3(bm, st, i0, i1, i2, n, q, lift):
    def rd(i, mid):
        x, yc, zc, ry, rz = st[i]
        if mid: ry += lift; rz += lift
        return (x, yc, zc, ry, rz)
    rings = [ringb(bm, x, yc, zc, ry, rz, n, q) for (x, yc, zc, ry, rz) in (rd(i0, False), rd(i1, True), rd(i2, False))]
    for k in range(len(rings)-1):
        A, B = rings[k], rings[k+1]
        for i in range(n):
            j = (i+1) % n; bm.faces.new((A[i], A[j], B[j], B[i]))
def box(bm, cx, cy, cz, sx, sy, sz):
    vs = []
    for dx in (-1,1):
        for dy in (-1,1):
            for dz in (-1,1): vs.append(bm.verts.new((cx+dx*sx, cy+dy*sy, cz+dz*sz)))
    for f in ((0,1,3,2),(4,6,7,5),(0,2,6,4),(1,5,7,3),(0,4,5,1),(2,3,7,6)):
        try: bm.faces.new([vs[i] for i in f])
        except ValueError: pass
def plate(bm, A0, A1, B0, B1, nu, nv, t=0.02, both=True):
    def grid(sign):
        vs = []
        for v in range(nv+1):
            row = []
            for u in range(nu+1):
                u2, v2 = u/float(nu), v/float(nv)
                x = (A0[0]+(A1[0]-A0[0])*u2)*(1-v2) + (B0[0]+(B1[0]-B0[0])*u2)*v2
                y = (A0[1]+(A1[1]-A0[1])*u2)*(1-v2) + (B0[1]+(B1[1]-B0[1])*u2)*v2
                z = (A0[2]+(A1[2]-A0[2])*u2)*(1-v2) + (B0[2]+(B1[2]-B0[2])*u2)*v2
                row.append(bm.verts.new((x, y, z+sign*t)))
            vs.append(row)
        for v in range(nv):
            for u in range(nu):
                if sign > 0: bm.faces.new((vs[v][u], vs[v][u+1], vs[v+1][u+1], vs[v+1][u]))
                else: bm.faces.new((vs[v+1][u+1], vs[v+1][u], vs[v][u], vs[v][u+1]))
    grid(+1)
    if both: grid(-1)
def bandz(bm, zlo, zhi, thick=0.02, depth=0.03):
    fs = [f for f in bm.faces if zlo < (sum(v.co.z for v in f.verts)/len(f.verts)) < zhi]
    if not fs: return
    res = bmesh.ops.inset_region(bm, faces=fs, thickness=thick, depth=0.0)
    inner = res.get("faces_new") or res.get("faces") or []
    for f in inner: bmesh.ops.translate(bm, verts=list(f.verts), vec=f.normal*depth)
def sphere(bm, cx, cy, cz, rx, ry, rz, nu, nv, lat0=0.0, lat1=None):
    if lat1 is None: lat1 = math.pi
    rows = []
    for v in range(nv+1):
        lat = lat0 + (lat1-lat0)*v/nv; row = []
        for u in range(nu):
            a = u*2.0*math.pi/nu
            row.append(bm.verts.new((cx+rx*math.sin(lat)*math.cos(a), cy+ry*math.sin(lat)*math.sin(a), cz+rz*math.cos(lat))))
        rows.append(row)
    for v in range(nv):
        for u in range(nu):
            u2 = (u+1)%nu
            if v == 0: bm.faces.new((rows[0][u], rows[1][u2], rows[1][u]))
            elif v == nv-1: bm.faces.new((rows[v][u2], rows[v+1][u2], rows[v+1][u]))
            else: bm.faces.new((rows[v][u], rows[v+1][u], rows[v+1][u2], rows[v][u2]))
def torush(bm, cz, cx, cy, R, r, nm, nn):
    prev = None; first = None
    for i in range(nm):
        a = i*2.0*math.pi/nm; row = []
        for j in range(nn):
            b = j*2.0*math.pi/nn; rr = R + r*math.cos(b)
            row.append(bm.verts.new((cx+rr*math.cos(a), cy+rr*math.sin(a), cz+r*math.sin(b))))
        if first is None: first = row
        if prev is not None:
            for j in range(nn):
                j2 = (j+1)%nn; bm.faces.new((prev[j], prev[j2], row[j2], row[j]))
        prev = row
    for j in range(nn):
        j2 = (j+1)%nn; bm.faces.new((prev[j], prev[j2], first[j2], first[j]))
def ringz(bm, z, cx, cy, r, n):
    vs = []
    for i in range(n):
        a = i*2.0*math.pi/n
        vs.append(bm.verts.new((cx + r*math.cos(a), cy + r*math.sin(a), z)))
    return vs
def tubez(bm, stations, n):
    rings = [ringz(bm, z, cx, cy, r, n) for (z, cx, cy, r) in stations]
    for k in range(len(rings)-1):
        A, B = rings[k], rings[k+1]
        for i in range(n):
            j = (i+1) % n; bm.faces.new((A[i], A[j], B[j], B[i]))
    return rings
def hash3(x, y, z):
    h = (int(round(x*1000))*73856093) ^ (int(round(y*1000))*19349663) ^ (int(round(z*1000))*83492791)
    h &= 0x7fffffff; return (h % 83)/82.0

# ================= HAULER v2 "squat mine-hauler truck" (I534 FIX PASS) =================
# Fix list (applied after probing the first buggy build):
#  (A) true squircle q = 2/p (hull q=0.5 boxy slab, sponson q=2/3) - the p=4/3
#      superellipse-param form was a PINCHED astroid star (corners to 1/4 radius,
#      floating containers);  (B) tube2b cap vertices now use the per-station cx
#      (stations[k][1]) instead of hardcoded y=0.0 - the Y-offset sponson rings
#      produced a centerline spike;  (C) sponson 5th lug (+12 t -> 456);
#  (D) containers = buried-box design (box bottom under the deck + top plate rim);
#  (E) hatch rim/dome lowered to z 0.375 so the rim straddles the falling deck.
bm = bmesh.new()
HULL_ST = [
 (-0.80, 0.0, 0.0, 0.30, 0.24),
 (-0.68, 0.0, 0.0, 0.43, 0.35),
 (-0.52, 0.0, 0.0, 0.49, 0.40),
 (-0.36, 0.0, 0.0, 0.51, 0.42),
 (-0.20, 0.0, 0.0, 0.52, 0.43),
 (-0.04, 0.0, 0.0, 0.52, 0.43),
 ( 0.12, 0.0, 0.0, 0.51, 0.42),
 ( 0.28, 0.0, 0.0, 0.48, 0.40),
 ( 0.42, 0.0, 0.0, 0.42, 0.35),
 ( 0.54, 0.0, 0.0, 0.33, 0.28),
 ( 0.64, 0.0, 0.0, 0.24, 0.20),
 ( 0.72, 0.0, 0.0, 0.15, 0.12),
 ( 0.78, 0.0, 0.0, 0.08, 0.065),
 ( 0.80, 0.0, 0.0, 0.040, 0.034),
]
tube2b(bm, HULL_ST, 40, 0.5, cap_back=True, tip_front=0.82)
ridge3(bm, HULL_ST, 0, 1, 2, 40, 0.5, 0.03)
ridge3(bm, HULL_ST, 3, 4, 5, 40, 0.5, 0.03)
ridge3(bm, HULL_ST, 5, 6, 7, 40, 0.5, 0.03)
ridge3(bm, HULL_ST, 7, 8, 9, 40, 0.5, 0.03)
ridge3(bm, HULL_ST, 10, 11, 12, 40, 0.5, 0.03)
# 4 LARGE buried-box deck cargo containers (box bottom 0.31 buried 0.03-0.11 under
# the squircle deck; top plate rim at 0.49)
for cx_ in (-0.56, -0.32, -0.08, 0.16):
    box(bm, cx_, 0, 0.40, 0.105, 0.20, 0.09)
    plate(bm, (cx_-0.09,-0.17,0.49),(cx_-0.09,0.17,0.49),(cx_+0.09,-0.17,0.49),(cx_+0.09,0.17,0.49), 4, 2, t=0.008, both=True)
# armored nose panel (flush on the nose slope, both ends embedded)
plate(bm, (0.50,-0.10,0.275), (0.50,0.10,0.275), (0.62,-0.07,0.185), (0.62,0.07,0.185), 4, 2, t=0.010, both=True)
made["hull"] = [to_obj(bm, "VR_Hull")]
# WELDED flush sponsons: centerline hugs the hull taper so the inner face is
# embedded everywhere (NO gaps); 2 inset bands + 5 top lugs each
SPON_ST = [
 (-0.56, 0.485, -0.10, 0.08, 0.15),
 (-0.40, 0.50,  -0.10, 0.08, 0.16),
 (-0.04, 0.52,  -0.10, 0.08, 0.16),
 ( 0.24, 0.49,  -0.10, 0.08, 0.15),
 ( 0.36, 0.455, -0.10, 0.065, 0.12),
 ( 0.44, 0.415, -0.10, 0.05, 0.065),
]
for s in (-1, 1):
    bm = bmesh.new()
    sst = [(x, s*cx, cz, ry, rz) for (x, cx, cz, ry, rz) in SPON_ST]
    tube2b(bm, sst, 22, 2.0/3.0, cap_back=True, tip_front=0.50)
    ridge3(bm, sst, 0, 1, 2, 22, 2.0/3.0, 0.02)
    ridge3(bm, sst, 3, 4, 5, 22, 2.0/3.0, 0.02)
    for (lx, lcx) in [(-0.44, 0.495), (-0.30, 0.50), (-0.02, 0.515), (0.20, 0.49), (0.34, 0.47)]:
        box(bm, lx, s*lcx, 0.045, 0.04, 0.05, 0.035)
    made[("sponL" if s<0 else "sponR")] = [to_obj(bm, ("VR_SponsonL" if s<0 else "VR_SponsonR"))]
# glow hatch: sloped base plate (welded into the front deck) + dome + rim (z 0.375)
bm = bmesh.new()
plate(bm, (0.18,-0.12,0.415), (0.18,0.12,0.415), (0.42,-0.12,0.345), (0.42,0.12,0.345), 5, 3, t=0.015, both=True)
sphere(bm, 0.30, 0.0, 0.375, 0.13, 0.085, 0.105, 14, 8)
torush(bm, 0.375, 0.30, 0.0, 0.105, 0.018, 10, 4)
made["hatch"] = [to_obj(bm, "VR_Hatch")]
# rear exhaust stack: collar + tube (20-gon, 6 stations, open mouth) + 2 bands + deflector + 2 stubs
bm = bmesh.new()
box(bm, -0.72, 0, 0.335, 0.09, 0.13, 0.045)
tubez(bm, [(0.34, -0.72, 0, 0.085), (0.42, -0.72, 0, 0.075), (0.50, -0.72, 0, 0.075), (0.58, -0.72, 0, 0.085), (0.65, -0.72, 0, 0.10), (0.70, -0.72, 0, 0.115)], 20)
bandz(bm, 0.43, 0.50)
bandz(bm, 0.52, 0.58)
plate(bm, (-0.82,-0.09,0.70), (-0.82,0.09,0.70), (-0.62,-0.09,0.70), (-0.62,0.09,0.70), 5, 3, t=0.012, both=True)
box(bm, -0.72, 0.15, 0.30, 0.035, 0.03, 0.03)
box(bm, -0.72, -0.15, 0.30, 0.035, 0.03, 0.03)
made["stack"] = [to_obj(bm, "VR_Stack")]
print("HAULER_DONE", flush=True)

# ================= BAKE + MATERIALS + EXPORT =================
def bake(ob, fn):
    me = ob.data; attr = me.color_attributes.new(name="Color", type="FLOAT_COLOR", domain="POINT")
    for i, v in enumerate(me.vertices):
        val = min(0.96, max(0.25, fn(v.co.x, v.co.y, v.co.z))); attr.data[i].color = (val, val, val, 1.0)
def hband(x, y, z, lo, hi): return lo + (hi-lo)*hash3(x, y, z)
def bake_hull(x, y, z):
    if x > 0.55: return 0.62
    if z > 0.47: return 0.64
    if z > 0.25: return 0.58
    if z < -0.20: return 0.32
    if abs(y) > 0.48: return 0.44
    if x < -0.80: return 0.36
    return hband(x, y, z, 0.46, 0.56)
def bake_sponson(x, y, z):
    if z > -0.04: return 0.55
    if z < -0.18: return 0.34
    return hband(x, y, z, 0.42, 0.52)
def bake_hatch(x, y, z): return 0.90
def bake_stack(x, y, z):
    if z > 0.58: return 0.50
    if z < 0.38: return 0.30
    return 0.40
BAKES = {"VR_Hull": bake_hull, "VR_SponsonL": bake_sponson, "VR_SponsonR": bake_sponson, "VR_Hatch": bake_hatch, "VR_Stack": bake_stack}
def mat(name):
    m = bpy.data.materials.get(name)
    if m is None:
        m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree; bsdf = nt.nodes["Principled BSDF"]
        bsdf.inputs["Base Color"].default_value = (0.8, 0.8, 0.8, 1.0); vc = nt.nodes.new("ShaderNodeVertexColor"); vc.layer_name = "Color"
        nt.links.new(vc.outputs["Color"], bsdf.inputs["Base Color"])
    return m
GROUPS = {"hauler": [made["hull"][0], made["sponL"][0], made["sponR"][0], made["hatch"][0], made["stack"][0]]}
for ob in sum(GROUPS.values(), []):
    bake(ob, BAKES[ob.name])
    mname = "VR_SponsonMat" if ob.name in ("VR_SponsonL", "VR_SponsonR") else (ob.name + "Mat")
    ob.data.materials.append(mat(mname))
def tris2(ob): return sum(len(p.vertices)-2 for p in ob.data.polygons)
fails = []
for ob in sum(GROUPS.values(), []):
    a, c = BUDGET[ob.name]; t = tris2(ob); print("TRIS", ob.name, t, "aim", a, "cap", c, flush=True)
    if not (a <= t <= c): fails.append((ob.name, t, a, c))
for asset, obs in GROUPS.items():
    mn = [1e9]*3; mx = [-1e9]*3
    for ob in obs:
        off, scl = PLACE[asset][ob.name]
        for v in ob.data.vertices:
            for k in range(3):
                w = (v.co[k]*scl[k]) + off[k]; mn[k] = min(mn[k], w); mx[k] = max(mx[k], w)
    diag = math.sqrt(sum((mx[k]-mn[k])**2 for k in range(3)))/2.0; tgt = RAD[asset]
    print("RAD", asset, round(diag,3), "target", tgt, "class", round(diag/tgt,3), "mn", [round(v,2) for v in mn], "mx", [round(v,2) for v in mx], flush=True)
    if not (0.88*tgt <= diag <= 1.12*tgt): fails.append((asset, "radius", diag, tgt))
for asset, obs in GROUPS.items():
    bpy.ops.object.select_all(action="DESELECT")
    for ob in obs: ob.select_set(True)
    bpy.context.view_layer.objects.active = obs[0]
    bpy.ops.export_scene.gltf(filepath=OUT[asset], export_format="GLB", use_selection=True,
        export_yup=True, export_apply=True, export_materials="EXPORT",
        export_vertex_color="MATERIAL", export_image_format="AUTO",
        export_skins=False, export_animations=False, export_normals=True,
        export_texcoords=False, export_tangents=False)
    print("EXPORT_OK", OUT[asset], flush=True)
if fails:
    print("FAIL", fails, flush=True); raise SystemExit(1)
print("ALL_GATES_PASS", flush=True)