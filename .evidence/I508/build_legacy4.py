import bpy, bmesh, math, mathutils
EV = r"E:/Game/.evidence/I508"
OUT = {"stinger": EV + r"/stinger.glb", "drone": EV + r"/drone.glb",
       "warden": EV + r"/warden.glb", "flyer": EV + r"/flyer.glb"}
BUDGET = {
 "VR_Stinger_Body": (1260, 1580), "VR_Stinger_Core": (140, 180),
 "VR_Drone": (1350, 1700),
 "VR_Warden_Hull": (650, 840), "VR_Warden_Armor": (750, 960),
 "VR_Flyer_Body": (1200, 1540), "VR_Flyer_Dome": (200, 250),
}
RAD = {"stinger": 1.94, "drone": 1.41, "warden": 3.99, "flyer": 1.69}
NODES = {
 "stinger": ["VR_Stinger_Body", "VR_Stinger_Core"],
 "drone": ["VR_Drone"],
 "warden": ["VR_Warden_Hull", "VR_Warden_Armor"],
 "flyer": ["VR_Flyer_Body", "VR_Flyer_Dome"],
}
made = {}
def new_obj(name, me):
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    return ob
def to_obj(bm, name):
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me); bm.free()
    return new_obj(name, me)
def join(objs, name):
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs: o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.join()
    objs[0].name = name
    objs[0].data.name = name
    return objs[0]
def ring(bm, x, r, n, zf=1.0):
    vs = []
    for i in range(n):
        a = i * 2.0 * math.pi / n
        vs.append(bm.verts.new((x, r * math.cos(a), r * math.sin(a) * zf)))
    return vs
def tube(bm, stations, n, zf=1.0, cap_front=False, cap_back=False, tip_front=None, tip_back=None):
    rings = [ring(bm, x, r, n, zf) for (x, r) in stations]
    for k in range(len(rings) - 1):
        A, B = rings[k], rings[k + 1]
        for i in range(n):
            j = (i + 1) % n
            bm.faces.new((A[i], A[j], B[j], B[i]))
    if cap_back:
        c = bm.verts.new((stations[0][0] - 0.12, 0.0, 0.0))
        for i in range(n):
            bm.faces.new((c, rings[0][(i + 1) % n], rings[0][i]))
    if cap_front:
        c = bm.verts.new((stations[-1][0] + 0.12, 0.0, 0.0))
        for i in range(n):
            bm.faces.new((c, rings[-1][i], rings[-1][(i + 1) % n]))
    if tip_front is not None:
        c = bm.verts.new((tip_front, 0.0, 0.0))
        for i in range(n):
            bm.faces.new((c, rings[-1][i], rings[-1][(i + 1) % n]))
    if tip_back is not None:
        c = bm.verts.new((tip_back, 0.0, 0.0))
        for i in range(n):
            bm.faces.new((c, rings[0][(i + 1) % n], rings[0][i]))
    return rings
def box(bm, cx, cy, cz, sx, sy, sz):
    vs = []
    for dx in (-1, 1):
        for dy in (-1, 1):
            for dz in (-1, 1):
                vs.append(bm.verts.new((cx + dx * sx, cy + dy * sy, cz + dz * sz)))
    for f in ((0,1,3,2),(4,6,7,5),(0,2,6,4),(1,5,7,3),(0,4,5,1),(2,3,7,6)):
        try: bm.faces.new([vs[i] for i in f])
        except ValueError: pass
def plate(bm, A0, A1, B0, B1, nu, nv, t=0.02, both=True):
    def grid(sign):
        vs = []
        for v in range(nv + 1):
            row = []
            for u in range(nu + 1):
                u2, v2 = u / float(nu), v / float(nv)
                x = (A0[0] + (A1[0] - A0[0]) * u2) * (1 - v2) + (B0[0] + (B1[0] - B0[0]) * u2) * v2
                y = (A0[1] + (A1[1] - A0[1]) * u2) * (1 - v2) + (B0[1] + (B1[1] - B0[1]) * u2) * v2
                z = (A0[2] + (A1[2] - A0[2]) * u2) * (1 - v2) + (B0[2] + (B1[2] - B0[2]) * u2) * v2
                row.append(bm.verts.new((x, y, z + sign * t)))
            vs.append(row)
        for v in range(nv):
            for u in range(nu):
                if sign > 0:
                    bm.faces.new((vs[v][u], vs[v][u+1], vs[v+1][u+1], vs[v+1][u]))
                else:
                    bm.faces.new((vs[v+1][u+1], vs[v+1][u], vs[v][u], vs[v][u+1]))
    grid(+1)
    if both: grid(-1)
def band_inset(bm, xlo, xhi, thick=0.02, depth=0.03):
    fs = [f for f in bm.faces if xlo < (sum(v.co.x for v in f.verts) / len(f.verts)) < xhi]
    if not fs: return
    res = bmesh.ops.inset_region(bm, faces=fs, thickness=thick, depth=0.0)
    inner = res.get("faces_new") or res.get("faces") or []
    for f in inner:
        bmesh.ops.translate(bm, verts=list(f.verts), vec=f.normal * depth)
def dome_x(bm, cx, r, n, rings, zf=1.0):
    st = []
    for k in range(rings):
        t = math.radians(90.0) * (k + 1) / rings
        st.append((cx + r * math.cos(t), r * math.sin(t)))
    rv = [ring(bm, x, rr, n, zf) for (x, rr) in st]
    c = bm.verts.new((cx + r, 0.0, 0.0))
    for i in range(n):
        bm.faces.new((c, rv[0][i], rv[0][(i + 1) % n]))
    for k in range(len(rv) - 1):
        A, B = rv[k], rv[k + 1]
        for i in range(n):
            j = (i + 1) % n
            bm.faces.new((A[i], A[j], B[j], B[i]))
def slab(bm, cx, cy, cz, L, W, T, g=5):
    n0 = len(bm.faces)
    x0, x1, y0, y1, z0, z1 = cx - L/2, cx + L/2, cy - W/2, cy + W/2, cz - T/2, cz + T/2
    vs = {}
    nx, ny, nz = g, g, 2
    for ix in range(nx + 1):
        for iy in range(ny + 1):
            for iz in range(nz + 1):
                vs[(ix, iy, iz)] = bm.verts.new((x0 + (x1 - x0) * ix / nx,
                                                y0 + (y1 - y0) * iy / ny,
                                                z0 + (z1 - z0) * iz / nz))
    def q(a, b, c, d):
        try: bm.faces.new((vs[a], vs[b], vs[c], vs[d]))
        except ValueError: pass
    for ix in range(nx):
        for iy in range(ny):
            q((ix,iy,0), (ix+1,iy,0), (ix+1,iy+1,0), (ix,iy+1,0))
            q((ix,iy+1,1), (ix+1,iy+1,1), (ix+1,iy,1), (ix,iy,1))
    for ix in range(nx):
        for iz in range(nz):
            q((ix,0,iz), (ix+1,0,iz), (ix+1,0,iz+1), (ix,0,iz+1))
            q((ix+1,ny,iz+1), (ix,ny,iz+1), (ix,ny,iz), (ix+1,ny,iz))
    for iy in range(ny):
        for iz in range(nz):
            q((0,iy,iz), (0,iy,iz+1), (0,iy+1,iz+1), (0,iy+1,iz))
            q((nx,iy+1,iz+1), (nx,iy,iz+1), (nx,iy,iz), (nx,iy+1,iz))
    big = list(bm.faces[n0:n0 + 2 * g * g])
    res = bmesh.ops.inset_region(bm, faces=big, thickness=0.06, depth=0.0)
    inner = res.get("faces_new") or res.get("faces") or []
    for f in inner:
        bmesh.ops.translate(bm, verts=list(f.verts), vec=f.normal * 0.04)
def hash3(x, y, z):
    h = (int(round(x * 1000)) * 73856093) ^ (int(round(y * 1000)) * 19349663) ^ (int(round(z * 1000)) * 83492791)
    h &= 0x7fffffff
    return (h % 83) / 82.0
def tris(ob):
    return sum(len(p.vertices) - 2 for p in ob.data.polygons)

# ================= STINGER "needle" =================
bm = bmesh.new()
tube(bm, [(-1.55, 0.24), (-1.20, 0.33), (-0.85, 0.42), (-0.45, 0.47), (-0.05, 0.48),
          (0.40, 0.45), (0.85, 0.38), (1.25, 0.24), (1.50, 0.12)], 24, cap_back=True, tip_front=2.05)
band_inset(bm, -1.19, -0.86)
band_inset(bm, -0.44, 0.06)
band_inset(bm, 0.41, 0.84)
for i in range(16):
    a = i * 2.0 * math.pi / 16
    box(bm, -0.05, 0.46 * math.cos(a), 0.46 * math.sin(a), 0.26, 0.05, 0.05)
for i in range(7):
    a = i * 2.0 * math.pi / 7 + 0.3
    box(bm, -1.30, 0.30 * math.cos(a), 0.30 * math.sin(a), 0.12, 0.04, 0.04)
for s in (-1, 1):
    plate(bm, (0.35, s * 0.30, 0.02), (0.00, s * 0.30, 0.02),
              (-0.75, s * 0.42, 0.42), (-1.15, s * 0.42, 0.62), 8, 6, t=0.018)
for i in range(16):
    a = i * 2.0 * math.pi / 16
    box(bm, -1.54, 0.27 * math.cos(a), 0.27 * math.sin(a), 0.10, 0.045, 0.045)
made["stinger"] = [to_obj(bm, "VR_Stinger_Body")]
bm = bmesh.new()
rv = [ring(bm, 1.95 + 0.10 * k, 0.085 - 0.014 * k, 16) for k in range(5)]
c0 = bm.verts.new((1.93, 0.0, 0.0))
for i in range(16): bm.faces.new((c0, rv[0][(i + 1) % 16], rv[0][i]))
for k in range(4):
    A, B = rv[k], rv[k + 1]
    for i in range(16):
        j = (i + 1) % 16
        bm.faces.new((A[i], A[j], B[j], B[i]))
ct = bm.verts.new((2.34, 0.0, 0.0))
for i in range(16): bm.faces.new((ct, rv[4][i], rv[4][(i + 1) % 16]))
made["stinger"].append(to_obj(bm, "VR_Stinger_Core"))

# ================= DRONE "seeker-fly" =================
bm = bmesh.new()
tube(bm, [(-0.88, 0.18), (-0.70, 0.30), (-0.45, 0.42), (-0.15, 0.50), (0.15, 0.52),
          (0.40, 0.46), (0.60, 0.34), (0.78, 0.20)], 18, cap_back=True, tip_front=0.98)
band_inset(bm, -0.69, -0.46)
band_inset(bm, -0.14, 0.16)
band_inset(bm, 0.41, 0.59)
for i in range(14):
    a = i * 2.0 * math.pi / 14
    box(bm, -0.05, 0.50 * math.cos(a), 0.50 * math.sin(a), 0.14, 0.04, 0.04)
for i in range(6):
    a = i * 2.0 * math.pi / 6 + 0.5
    box(bm, -0.55, 0.40 * math.cos(a), 0.40 * math.sin(a), 0.10, 0.04, 0.04)
for s in (-1, 1):
    plate(bm, (0.18, s * 0.16, 0.05), (-0.12, s * 0.16, 0.05),
              (-0.38, s * 0.85, 0.22), (-0.62, s * 0.72, 0.26), 10, 5, t=0.016)
for i in range(10):
    a = i * 2.0 * math.pi / 10
    box(bm, -0.96, 0.17 * math.cos(a), 0.17 * math.sin(a), 0.08, 0.04, 0.04)
for s in (-1, 1):
    box(bm, -0.60, s * 0.74, 0.30, 0.06, 0.04, 0.10)
    box(bm, -0.42, s * 0.80, 0.26, 0.06, 0.04, 0.10)
    box(bm, -0.75, s * 0.68, 0.32, 0.05, 0.04, 0.09)
dr_body = to_obj(bm, "VR_Drone_Body")
bm = bmesh.new()
dome_x(bm, 0.72, 0.34, 20, 5)
dr_eye = to_obj(bm, "VR_Drone_Eye")
made["drone"] = [join([dr_body, dr_eye], "VR_Drone")]

# ================= WARDEN "bulwark" =================
bm = bmesh.new()
tube(bm, [(-1.40, 1.28), (-1.10, 1.38), (-0.80, 1.45), (-0.45, 1.50), (0.0, 1.52),
          (0.45, 1.50), (0.80, 1.44), (1.10, 1.34), (1.40, 1.24)], 6, cap_front=True, cap_back=True)
band_inset(bm, -1.09, -0.81, thick=0.05, depth=0.05)
band_inset(bm, -0.44, 0.01, thick=0.05, depth=0.05)
band_inset(bm, 0.46, 0.79, thick=0.05, depth=0.05)
for i in range(16):
    a = i * 2.0 * math.pi / 6 + 0.26
    box(bm, 0.0, 1.50 * math.cos(a), 1.50 * math.sin(a), 0.80, 0.06, 0.06)
for i in range(6):
    a = i * 2.0 * math.pi / 6
    box(bm, -1.46, 1.42 * math.cos(a), 1.42 * math.sin(a), 0.10, 0.08, 0.08)
    box(bm, 1.46, 1.42 * math.cos(a), 1.42 * math.sin(a), 0.10, 0.08, 0.08)
for i in range(10):
    a = i * 2.0 * math.pi / 10
    box(bm, -1.52, 1.10 * math.cos(a), 1.10 * math.sin(a), 0.08, 0.06, 0.06)
wd_hull = to_obj(bm, "VR_Warden_HullRow")
bm = bmesh.new()
dome_x(bm, 1.30, 0.44, 12, 3)
for i in range(8):
    a = i * 2.0 * math.pi / 8
    bx = bm.verts.new((1.34, 0.56 * math.cos(a), 0.56 * math.sin(a)))
    by = bm.verts.new((1.34, 0.56 * math.cos(a + 0.20), 0.56 * math.sin(a + 0.20)))
    tip = bm.verts.new((1.18, 0.30 * math.cos(a + 0.10), 0.30 * math.sin(a + 0.10)))
    bm.faces.new((bx, by, tip))
for i in range(6):
    a = i * 2.0 * math.pi / 6 + 0.4
    box(bm, 1.26, 0.60 * math.cos(a), 0.60 * math.sin(a), 0.06, 0.05, 0.05)
wd_core = to_obj(bm, "VR_Warden_CoreRow")
made["warden_hull"] = [join([wd_hull, wd_core], "VR_Warden_Hull")]
bm = bmesh.new()
slab(bm, 0.0, 0.0, 1.55, 4.8, 2.4, 0.42)
slab(bm, 0.0, 1.95, 0.0, 4.8, 0.42, 2.2)
slab(bm, 0.0, -1.95, 0.0, 4.8, 0.42, 2.2)
made["warden_armor"] = [to_obj(bm, "VR_Warden_Armor")]

# ================= FLYER "swift" =================
bm = bmesh.new()
tube(bm, [(-1.10, 0.24), (-0.80, 0.34), (-0.45, 0.40), (-0.10, 0.42), (0.25, 0.40),
          (0.55, 0.33), (0.80, 0.22), (0.95, 0.14)], 18, zf=0.72, cap_back=True, tip_front=1.30)
band_inset(bm, -0.79, -0.46)
band_inset(bm, -0.09, 0.26)
band_inset(bm, 0.56, 0.79)
for i in range(8):
    a = i * 2.0 * math.pi / 8
    box(bm, -0.10, 0.40 * math.cos(a), 0.30 * math.sin(a), 0.18, 0.04, 0.04)
fl_body = to_obj(bm, "VR_Flyer_FuseRow")
for s in (-1, 1):
    bmv = bmesh.new()
    plate(bmv, (0.25, s * 0.10, 0.02), (-0.15, s * 0.10, 0.02),
                 (0.05, s * 1.05, 0.10), (-0.85, s * 0.85, 0.14), 12, 8, t=0.016)
    plate(bmv, (-0.75, s * 0.10, 0.02), (-0.95, s * 0.10, 0.02),
                 (-1.05, s * 0.30, 0.34), (-1.25, s * 0.26, 0.36), 5, 4, t=0.014)
    fl_body = join([fl_body, to_obj(bmv, "tmp_wing")], "VR_Flyer_WingRow")
fl_body.name = "VR_Flyer_Body"
fl_body.data.name = "VR_Flyer_Body"
made["flyer_body"] = [fl_body]
bm = bmesh.new()
dome_x(bm, 0.0, 0.30, 22, 6)
fl_dome = to_obj(bm, "VR_Flyer_Dome")
fl_dome.data.transform(mathutils.Matrix.Rotation(math.radians(-90), 4, "Y"))
fl_dome.data.transform(mathutils.Matrix.Translation((0.05, 0.0, 0.28)))
made["flyer_dome"] = [fl_dome]
print("BUILD_PART_DONE", flush=True)

# ================= BAKE + MATERIALS + EXPORT =================
def bake(ob, fn):
    me = ob.data
    attr = me.color_attributes.new(name="Color", type="FLOAT_COLOR", domain="POINT")
    for i, v in enumerate(me.vertices):
        val = fn(v.co.x, v.co.y, v.co.z)
        val = min(0.96, max(0.22, val))
        attr.data[i].color = (val, val, val, 1.0)
def hband(x, y, z, lo, hi):
    return lo + (hi - lo) * hash3(x, y, z)
def bake_stinger_body(x, y, z):
    if x > 1.10: return 0.88
    if x < -1.45: return 0.30
    if abs(y) > 0.28 and x < -0.10: return 0.34
    if abs(z) > 0.30 and x < -0.90: return 0.34
    return hband(x, y, z, 0.44, 0.62)
def bake_stinger_core(x, y, z):
    return 0.94
def bake_drone(x, y, z):
    if x > 0.90: return 0.34
    if x > 0.55 and math.hypot(y, z) < 0.45: return 0.80
    if abs(y) > 0.30 and z < 0.0: return 0.30
    if x < -0.80: return 0.28
    return hband(x, y, z, 0.46, 0.64)
def bake_warden_hull(x, y, z):
    if x > 1.28 and math.hypot(y, z) < 0.50: return 0.90
    if x > 1.20: return 0.70
    if z < -0.90: return 0.28
    return hband(x, y, z, 0.38, 0.56)
def bake_warden_armor(x, y, z):
    d = min(abs(abs(x) - 2.40), abs(abs(y) - 2.15), abs(abs(z) - 1.76))
    if d < 0.18: return 0.38
    return hband(x, y, z, 0.58, 0.74)
def bake_flyer_body(x, y, z):
    if z > 0.16 and abs(y) < 0.12: return 0.85
    if z < 0.0 and abs(y) > 0.15: return 0.30
    if x > 1.00: return 0.40
    return hband(x, y, z, 0.50, 0.66)
def bake_flyer_dome(x, y, z):
    return 0.92
BAKES = {
 "VR_Stinger_Body": bake_stinger_body, "VR_Stinger_Core": bake_stinger_core,
 "VR_Drone": bake_drone, "VR_Warden_Hull": bake_warden_hull,
 "VR_Warden_Armor": bake_warden_armor, "VR_Flyer_Body": bake_flyer_body,
 "VR_Flyer_Dome": bake_flyer_dome,
}
def mat(name):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    bsdf = nt.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (0.8, 0.8, 0.8, 1.0)
    vc = nt.nodes.new("ShaderNodeVertexColor")
    vc.layer_name = "Color"
    nt.links.new(vc.outputs["Color"], bsdf.inputs["Base Color"])
    return m
GROUPS = {
 "stinger": made["stinger"],
 "drone": made["drone"],
 "warden": made["warden_hull"] + made["warden_armor"],
 "flyer": made["flyer_body"] + made["flyer_dome"],
}
for ob in sum(GROUPS.values(), []):
    bake(ob, BAKES[ob.name])
    ob.data.materials.append(mat(ob.name + "Mat"))
def tris2(ob):
    return sum(len(p.vertices) - 2 for p in ob.data.polygons)
fails = []
for ob in sum(GROUPS.values(), []):
    a, c = BUDGET[ob.name]
    t = tris2(ob)
    print("TRIS", ob.name, t, "aim", a, "cap", c, flush=True)
    if not (a <= t <= c):
        fails.append((ob.name, t, a, c))
for asset, obs in GROUPS.items():
    mn = [1e9, 1e9, 1e9]; mx = [-1e9, -1e9, -1e9]
    for ob in obs:
        for v in ob.data.vertices:
            for k in range(3):
                mn[k] = min(mn[k], v.co[k]); mx[k] = max(mx[k], v.co[k])
    diag = math.sqrt(sum((mx[k] - mn[k]) ** 2 for k in range(3))) / 2.0
    tgt = RAD[asset]
    print("RAD", asset, round(diag, 3), "target", tgt, "class", round(diag / tgt, 3), flush=True)
    if not (0.88 * tgt <= diag <= 1.12 * tgt):
        fails.append((asset, "radius", diag, tgt))
for asset, obs in GROUPS.items():
    bpy.ops.object.select_all(action="DESELECT")
    for ob in obs:
        ob.select_set(True)
    bpy.context.view_layer.objects.active = obs[0]
    bpy.ops.export_scene.gltf(filepath=OUT[asset], export_format="GLB", use_selection=True,
        export_yup=True, export_apply=True, export_materials="EXPORT",
        export_vertex_color="MATERIAL", export_image_format="AUTO",
        export_skins=False, export_animations=False, export_normals=True,
        export_texcoords=False, export_tangents=False)
    print("EXPORT_OK", OUT[asset], flush=True)
if fails:
    print("FAIL", fails, flush=True)
    raise SystemExit(1)
print("ALL_GATES_PASS", flush=True)
