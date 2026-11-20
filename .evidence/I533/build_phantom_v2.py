import bpy, bmesh, math, mathutils
EV = r"E:/Game/.evidence/I533"
OUT = {"phantom": EV + r"/phantom_v2.glb"}
BUDGET = {
 "VR_Hull": (1800, 2400), "VR_PodL": (300, 500), "VR_PodR": (300, 500), "VR_Nose": (200, 320),
}
RAD = {"phantom": 0.80}
PLACE = {"phantom": {n: ((0,0,0),(1,1,1)) for n in ("VR_Hull","VR_PodL","VR_PodR","VR_Nose")}}
made = {}
def new_obj(name, me):
    ob = bpy.data.objects.new(name, me); bpy.context.scene.collection.objects.link(ob); return ob
def to_obj(bm, name):
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:]); me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free(); return new_obj(name, me)
def ring2(bm, x, ry, rz, n):
    vs = []; [vs.append(bm.verts.new((x, ry*math.cos(i*2.0*math.pi/n), rz*math.sin(i*2.0*math.pi/n)))) for i in range(n)]; return vs
def tube2(bm, stations, n, cap_front=False, cap_back=False, tip_front=None, tip_back=None):
    rings = [ring2(bm, x, ry, rz, n) for (x, ry, rz) in stations]
    for k in range(len(rings)-1):
        A, B = rings[k], rings[k+1]
        for i in range(n):
            j = (i+1) % n; bm.faces.new((A[i], A[j], B[j], B[i]))
    if cap_back:
        c = bm.verts.new((stations[0][0]-0.10, 0.0, 0.0))
        for i in range(n): bm.faces.new((c, rings[0][(i+1)%n], rings[0][i]))
    if cap_front:
        c = bm.verts.new((stations[-1][0]+0.10, 0.0, 0.0))
        for i in range(n): bm.faces.new((c, rings[-1][i], rings[-1][(i+1)%n]))
    if tip_front is not None:
        c = bm.verts.new((tip_front, 0.0, 0.0))
        for i in range(n): bm.faces.new((c, rings[-1][i], rings[-1][(i+1)%n]))
    if tip_back is not None:
        c = bm.verts.new((tip_back, 0.0, 0.0))
        for i in range(n): bm.faces.new((c, rings[0][(i+1)%n], rings[0][i]))
    return rings
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
def band_inset(bm, xlo, xhi, thick=0.02, depth=0.03):
    fs = [f for f in bm.faces if xlo < (sum(v.co.x for v in f.verts)/len(f.verts)) < xhi]
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
def torus(bm, cx, R, r, nm, nn):
    prev = None; first = None
    for i in range(nm):
        a = i*2.0*math.pi/nm; row = []
        for j in range(nn):
            b = j*2.0*math.pi/nn; rr = R + r*math.cos(b)
            row.append(bm.verts.new((cx+r*math.sin(b), rr*math.cos(a), rr*math.sin(a))))
        if first is None: first = row
        if prev is not None:
            for j in range(nn):
                j2 = (j+1)%nn; bm.faces.new((prev[j], prev[j2], row[j2], row[j]))
        prev = row
    for j in range(nn):
        j2 = (j+1)%nn; bm.faces.new((prev[j], prev[j2], first[j2], first[j]))
def hash3(x, y, z):
    h = (int(round(x*1000))*73856093) ^ (int(round(y*1000))*19349663) ^ (int(round(z*1000))*83492791)
    h &= 0x7fffffff; return (h % 83)/82.0

# ================= PHANTOM v2 "cloaker dart" =================
# +X forward (nose), +Y lateral, +Z up. Identity node transforms, absolute part-space.
bm = bmesh.new()
tube2(bm, [
 (-0.60,0.025,0.020), (-0.50,0.095,0.075), (-0.38,0.155,0.125), (-0.24,0.185,0.145),
 (-0.10,0.192,0.148), (0.04,0.185,0.142), (0.18,0.160,0.122), (0.32,0.125,0.095),
 (0.46,0.090,0.068), (0.60,0.058,0.044), (0.72,0.036,0.028), (0.80,0.024,0.018),
], 36, cap_back=True, tip_front=0.86)
band_inset(bm, -0.58, -0.46)
band_inset(bm, -0.42, -0.30)
band_inset(bm, -0.20, -0.08)
band_inset(bm, -0.02, 0.10)
band_inset(bm, 0.18, 0.30)
band_inset(bm, 0.38, 0.50)
band_inset(bm, 0.56, 0.66)
band_inset(bm, 0.70, 0.80)
# dorsal fin (y=0, thin in Y, swept back)
plate(bm, (-0.10,0.0,0.135), (-0.10,0.0,0.240), (-0.60,0.0,0.055), (-0.60,0.0,0.180), 9, 4, t=0.014, both=True)
# panel strakes along the sides (welded, not floating)
for s in (-1, 1):
    plate(bm, (-0.20, s*0.190, 0.050), (-0.20, s*0.190, -0.050), (0.20, s*0.150, 0.040), (0.20, s*0.150, -0.040), 6, 3, t=0.008, both=False)
# cockpit panel line
plate(bm, (-0.24,0.0,0.150), (-0.24,0.0,0.150), (-0.10,0.0,0.152), (-0.10,0.0,0.152), 4, 1, t=0.006, both=True)
made["phantom_hull"] = [to_obj(bm, "VR_Hull")]
# two FLUSH canopy pods welded to the hull top
for s in (-1, 1):
    bm = bmesh.new()
    plate(bm, (-0.20, s*0.055, 0.130), (-0.20, s*0.200, 0.148), (0.14, s*0.055, 0.130), (0.14, s*0.200, 0.148), 8, 4, t=0.013, both=True)
    sphere(bm, -0.03, s*0.128, 0.162, 0.120, 0.068, 0.052, 16, 7)
    band_inset(bm, -0.18, -0.10)
    plate(bm, (0.10, s*0.065, 0.138), (0.10, s*0.190, 0.148), (0.16, s*0.128, 0.148), (0.16, s*0.128, 0.138), 3, 2, t=0.008, both=False)
    made[("phantom_podL" if s<0 else "phantom_podR")] = [to_obj(bm, ("VR_PodL" if s<0 else "VR_PodR"))]
# nose / sensor housing (glow slot)
bm = bmesh.new()
sphere(bm, 0.745, 0.0, 0.012, 0.062, 0.050, 0.042, 12, 7)
torus(bm, 0.715, 0.048, 0.014, 12, 5)
band_inset(bm, 0.70, 0.82)
made["phantom_nose"] = [to_obj(bm, "VR_Nose")]
print("PHANTOM_DONE", flush=True)

# ================= BAKE + MATERIALS + EXPORT =================
def bake(ob, fn):
    me = ob.data; attr = me.color_attributes.new(name="Color", type="FLOAT_COLOR", domain="POINT")
    for i, v in enumerate(me.vertices):
        val = min(0.96, max(0.22, fn(v.co.x, v.co.y, v.co.z))); attr.data[i].color = (val, val, val, 1.0)
def hband(x, y, z, lo, hi): return lo + (hi-lo)*hash3(x, y, z)
def bake_hull(x, y, z):
    if x > 0.55 and z > -0.02: return 0.64
    if x < -0.58: return 0.34
    if z < -0.05: return 0.36
    if z > 0.12: return 0.60
    return hband(x, y, z, 0.46, 0.58)
def bake_pod(x, y, z):
    if z > 0.15: return 0.68
    return hband(x, y, z, 0.44, 0.54)
def bake_nose(x, y, z): return 0.90
BAKES = {"VR_Hull": bake_hull, "VR_PodL": bake_pod, "VR_PodR": bake_pod, "VR_Nose": bake_nose}
def mat(name):
    m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree; bsdf = nt.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (0.8, 0.8, 0.8, 1.0); vc = nt.nodes.new("ShaderNodeVertexColor"); vc.layer_name = "Color"
    nt.links.new(vc.outputs["Color"], bsdf.inputs["Base Color"]); return m
GROUPS = {"phantom": [made["phantom_hull"][0], made["phantom_podL"][0], made["phantom_podR"][0], made["phantom_nose"][0]]}
for ob in sum(GROUPS.values(), []):
    bake(ob, BAKES[ob.name]); ob.data.materials.append(mat(ob.name + "Mat"))
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
