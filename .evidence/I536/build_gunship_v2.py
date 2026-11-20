import bpy, bmesh, math, mathutils
EV = r"E:/Game/.evidence/I536"
OUT = EV + r"/gunship_v2.glb"
BUDGET = {
 "VR_Gunship_Hull":    (1600, 2150),
 "VR_Gunship_Nacelle": (550, 800),
 "VR_Gunship_Bay":     (220, 400),
}
RAD_TGT = 1.75
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
            j=(i+1)%n; bm.faces.new((A[i], A[j], B[j], B[i]))
    if cap_back:
        c = bm.verts.new((stations[0][0]-0.10, stations[0][1], stations[0][2]))
        for i in range(n): bm.faces.new((c, rings[0][(i+1)%n], rings[0][i]))
    if tip_front is not None:
        c = bm.verts.new((tip_front, stations[-1][1], stations[-1][2]))
        for i in range(n): bm.faces.new((c, rings[-1][i], rings[-1][(i+1)%n]))
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
            j=(i+1)%n; bm.faces.new((A[i], A[j], B[j], B[i]))
def box(bm, cx, cy, cz, sx, sy, sz):
    vs = []
    for dx in (-1,1):
        for dy in (-1,1):
            for dz in (-1,1): vs.append(bm.verts.new((cx+dx*sx, cy+dy*sy, cz+dz*sz)))
    for f in ((0,1,3,2),(4,6,7,5),(0,2,6,4),(1,5,7,3),(0,4,5,1),(2,3,7,6)):
        try: bm.faces.new([vs[i] for i in f])
        except ValueError: pass
def sphere(bm, cx, cy, cz, rx, ry, rz, nu, nv):
    rows = []
    for v in range(nv+1):
        lat = math.pi*v/nv
        row = []
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
def torus(bm, cx, R, r, nm, nn):
    prev = None; first = None
    for i in range(nm):
        a = i*2.0*math.pi/nm
        row = []
        for j in range(nn):
            b = j*2.0*math.pi/nn
            rr = R + r*math.cos(b)
            row.append(bm.verts.new((cx + r*math.sin(b), rr*math.cos(a), rr*math.sin(a))))
        if first is None: first = row
        if prev is not None:
            for j in range(nn):
                j2=(j+1)%nn
                bm.faces.new((prev[j], prev[j2], row[j2], row[j]))
        prev = row
    for j in range(nn):
        j2=(j+1)%nn
        bm.faces.new((prev[j], prev[j2], first[j2], first[j]))
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
def hash3(x, y, z):
    h = (int(round(x*1000))*73856093) ^ (int(round(y*1000))*19349663) ^ (int(round(z*1000))*83492791)
    h &= 0x7fffffff
    return (h % 83) / 82.0
def hband(x, y, z, lo, hi):
    return lo + (hi-lo)*hash3(x, y, z)

# ============ GUNSHIP v2 "brute" - build space +X fwd / +Y lateral / +Z up ============
bm = bmesh.new()
ST = [
 (-1.18, 0, 0, 0.28, 0.24),
 (-0.98, 0, 0, 0.62, 0.48),
 (-0.62, 0, 0, 0.84, 0.50),
 (-0.24, 0, 0, 0.96, 0.52),
 ( 0.16, 0, 0, 0.92, 0.48),
 ( 0.56, 0, 0, 0.76, 0.40),
 ( 0.96, 0, 0, 0.60, 0.32),
 ( 1.24, 0, 0, 0.48, 0.26),
 ( 1.42, 0, 0, 0.40, 0.22),
]
tube2b(bm, ST, 40, 0.55, cap_back=True)
ridge3(bm, ST, 0, 2, 4, 40, 0.55, 0.040)
ridge3(bm, ST, 3, 5, 7, 40, 0.55, 0.034)
ridge3(bm, ST, 6, 7, 8, 40, 0.55, 0.028)
SP = [
 (-0.95, 0, 0.53, 0.15, 0.09),
 (-0.55, 0, 0.64, 0.18, 0.11),
 (-0.10, 0, 0.68, 0.19, 0.12),
 ( 0.30, 0, 0.65, 0.18, 0.11),
 ( 0.70, 0, 0.53, 0.15, 0.09),
 ( 0.95, 0, 0.42, 0.11, 0.07),
]
tube2b(bm, SP, 12, 1.8, cap_back=True, tip_front=1.04)
box(bm, 0.62, 0, 0.66, 0.15, 0.12, 0.10)
box(bm, 0.78, 0, 0.70, 0.02, 0.08, 0.05)
for s in (-1, 1):
    plate(bm, (0.52, s*0.13, 0.58), (0.72, s*0.13, 0.58), (0.52, s*0.13, 0.74), (0.72, s*0.13, 0.74), 2, 2, t=0.012)
for s in (-1, 1):
    plate(bm, (-0.55, s*0.97, 0.02), (0.30, s*0.97, 0.00), (-0.55, s*0.97, 0.30), (0.30, s*0.97, 0.26), 6, 3, t=0.02)
    plate(bm, (-0.55, s*0.97, -0.02), (0.10, s*0.97, -0.04), (-0.55, s*0.97, -0.30), (0.10, s*0.97, -0.28), 5, 3, t=0.02)
box(bm, 1.46, 0, 0, 0.08, 0.42, 0.26)
box(bm, 1.53, 0, 0.30, 0.11, 0.27, 0.04)
box(bm, 1.53, 0, -0.10, 0.11, 0.27, 0.04)
box(bm, 1.53, 0.28, 0.10, 0.11, 0.04, 0.20)
box(bm, 1.53, -0.28, 0.10, 0.11, 0.04, 0.20)
box(bm, 1.60, 0.12, 0.10, 0.018, 0.03, 0.16)
box(bm, 1.60, -0.12, 0.10, 0.018, 0.03, 0.16)
box(bm, 1.60, 0, -0.06, 0.018, 0.20, 0.03)
for s in (-1, 1):
    for z2 in (0.20, -0.14):
        box(bm, 1.465, s*0.36, z2, 0.03, 0.03, 0.03)
box(bm, -1.20, 0, 0, 0.06, 0.34, 0.30)
for s in (-1, 1):
    for z2 in (-0.14, 0.14):
        box(bm, -1.28, s*0.20, z2, 0.03, 0.03, 0.03)
box(bm, -1.24, 0, 0, 0.02, 0.14, 0.12)
for s in (-1, 1):
    box(bm, -0.10, s*0.60, -0.50, 0.55, 0.06, 0.05)
made["hull"] = [to_obj(bm, "VR_Gunship_Hull")]

bm = bmesh.new()
POD = [
 (-0.62, 0, 0, 0.22, 0.24),
 (-0.46, 0, 0, 0.35, 0.37),
 (-0.16, 0, 0, 0.39, 0.39),
 ( 0.12, 0, 0, 0.38, 0.38),
 ( 0.32, 0, 0, 0.35, 0.36),
 ( 0.46, 0, 0, 0.30, 0.31),
 ( 0.58, 0, 0, 0.24, 0.25),
]
tube2b(bm, POD, 18, 0.5, cap_back=True)
ridge3(bm, POD, 1, 2, 3, 18, 0.5, 0.028)
ridge3(bm, POD, 3, 4, 5, 18, 0.5, 0.028)
torus(bm, -0.63, 0.185, 0.034, 14, 6)
box(bm, -0.615, 0, 0, 0.012, 0.15, 0.16)
torus(bm, 0.59, 0.16, 0.03, 12, 6)
box(bm, 0.585, 0, 0, 0.012, 0.13, 0.14)
box(bm, 0.0, 0, -0.415, 0.28, 0.05, 0.045)
for s in (-1, 1):
    box(bm, 0.10, s*0.40, 0.02, 0.10, 0.035, 0.06)
made["nacelle"] = [to_obj(bm, "VR_Gunship_Nacelle")]

bm = bmesh.new()
plate(bm, (-0.10, -0.24, 0.18), (-0.10, 0.24, 0.18), (0.10, -0.24, 0.18), (0.10, 0.24, 0.18), 4, 1, t=0.012)
plate(bm, (-0.10, -0.24, -0.18), (-0.10, 0.24, -0.18), (0.10, -0.24, -0.18), (0.10, 0.24, -0.18), 4, 1, t=0.012)
plate(bm, (-0.10, -0.24, -0.18), (-0.10, -0.24, 0.18), (0.10, -0.24, -0.18), (0.10, -0.24, 0.18), 1, 3, t=0.012)
plate(bm, (-0.10, 0.24, -0.18), (-0.10, 0.24, 0.18), (0.10, 0.24, -0.18), (0.10, 0.24, 0.18), 1, 3, t=0.012)
plate(bm, (-0.10, -0.24, -0.18), (-0.10, 0.24, -0.18), (-0.10, 0.24, 0.18), (-0.10, -0.24, 0.18), 3, 3, t=0.01)
box(bm, 0.105, 0, 0.18, 0.02, 0.26, 0.035)
box(bm, 0.105, 0, -0.18, 0.02, 0.26, 0.035)
box(bm, 0.105, -0.255, 0, 0.02, 0.035, 0.20)
box(bm, 0.105, 0.255, 0, 0.02, 0.035, 0.20)
box(bm, 0.0, 0, 0.02, 0.085, 0.125, 0.10)
sphere(bm, 0.0, 0, 0.10, 0.085, 0.105, 0.075, 10, 5)
for s in (-1, 1):
    tube2b(bm, [(0.02, s*0.165, -0.02, 0.048, 0.048), (0.13, s*0.165, -0.02, 0.042, 0.042)], 10, 0.6, tip_front=0.17)
made["bay"] = [to_obj(bm, "VR_Gunship_Bay")]
print("GUNSHIP_V2_DONE", flush=True)

def bake(ob, fn):
    me = ob.data
    attr = me.color_attributes.new(name="Color", type="FLOAT_COLOR", domain="POINT")
    for i, v in enumerate(me.vertices):
        val = fn(v.co.x, v.co.y, v.co.z)
        val = min(0.96, max(0.22, val))
        attr.data[i].color = (val, val, val, 1.0)
def bake_hull(x, y, z):
    if x > 1.30: return 0.30
    v = hband(x, y, z, 0.40, 0.50)
    if z > 0.55 and x < 1.0: v += 0.10
    elif z > 0.40: v += 0.04
    if z < -0.40: v -= 0.08
    return v
def bake_nacelle(x, y, z):
    if x < -0.55: return 0.26
    if x > 0.50: return 0.34
    v = hband(x, y, z, 0.40, 0.50)
    if -0.32 < x < -0.12 or 0.16 < x < 0.36: v += 0.14
    if z < -0.38: v = 0.30
    return v
def bake_bay(x, y, z):
    if abs(y) > 0.19 or abs(z) > 0.13: return 0.78
    if x > 0.02 and (abs(y - 0.165) < 0.06 or abs(y + 0.165) < 0.06): return 0.95
    if z > 0.06: return 0.96
    return 0.88
BAKES = {"VR_Gunship_Hull": bake_hull, "VR_Gunship_Nacelle": bake_nacelle, "VR_Gunship_Bay": bake_bay}
def mat(name):
    m = bpy.data.materials.get(name)
    if m is None:
        m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree; bsdf = nt.nodes["Principled BSDF"]
        bsdf.inputs["Base Color"].default_value = (0.8, 0.8, 0.8, 1.0); vc = nt.nodes.new("ShaderNodeVertexColor"); vc.layer_name = "Color"
        nt.links.new(vc.outputs["Color"], bsdf.inputs["Base Color"])
    return m
GROUPS = [made["hull"][0], made["nacelle"][0], made["bay"][0]]
for ob in GROUPS:
    bake(ob, BAKES[ob.name])
    ob.data.materials.append(mat(ob.name + "Mat"))
def tris2(ob): return sum(len(p.vertices)-2 for p in ob.data.polygons)
fails = []
for ob in GROUPS:
    a, c = BUDGET[ob.name]; t = tris2(ob); print("TRIS", ob.name, t, "aim", a, "cap", c, flush=True)
    if not (a <= t <= c): fails.append((ob.name, t, a, c))
mn = [1e9]*3; mx = [-1e9]*3
for ob in GROUPS:
    for v in ob.data.vertices:
        for k in range(3):
            mn[k] = min(mn[k], v.co[k]); mx[k] = max(mx[k], v.co[k])
diag = math.sqrt(sum((mx[k]-mn[k])**2 for k in range(3)))/2.0
print("RAD", "gunship", round(diag, 3), "target", RAD_TGT, "mn", [round(v,3) for v in mn], "mx", [round(v,3) for v in mx], flush=True)
if not (0.88*RAD_TGT <= diag <= 1.12*RAD_TGT):
    fails.append(("gunship", "radius", diag, RAD_TGT))
bpy.ops.object.select_all(action="DESELECT")
for ob in GROUPS: ob.select_set(True)
bpy.context.view_layer.objects.active = GROUPS[0]
bpy.ops.export_scene.gltf(filepath=OUT, export_format="GLB", use_selection=True,
    export_yup=True, export_apply=True, export_materials="EXPORT",
    export_vertex_color="MATERIAL", export_image_format="AUTO",
    export_skins=False, export_animations=False, export_normals=True,
    export_texcoords=False, export_tangents=False)
print("EXPORT_OK", OUT, flush=True)
if fails:
    print("FAIL", fails, flush=True)
    raise SystemExit(1)
print("ALL_GATES_PASS", flush=True)
