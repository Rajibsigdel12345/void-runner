import bpy, bmesh, math, mathutils
EV = r"E:/Game/.evidence/I535"
OUT = EV + r"/bulwark_v2.glb"
BUDGET = {
 "VR_Shield": (1850, 2300), "VR_Spine": (700, 950), "VR_Core": (400, 550),
}
RAD_TGT = 1.55
PLACE = {n: ((0,0,0),(1,1,1)) for n in ("VR_Shield","VR_Spine","VR_Core")}
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
def boxx(bm, cx, cy, cz, sx, sy, sz, rot):
    vs = []
    for dx in (-1,1):
        for dy in (-1,1):
            for dz in (-1,1):
                p = mathutils.Vector((dx*sx, dy*sy, dz*sz))
                p.rotate(mathutils.Euler((rot,0,0)))
                vs.append(bm.verts.new((cx+p.x, cy+p.y, cz+p.z)))
    for f in ((0,1,3,2),(4,6,7,5),(0,2,6,4),(1,5,7,3),(0,4,5,1),(2,3,7,6)):
        try: bm.faces.new([vs[i] for i in f])
        except ValueError: pass
def hexring(bm, x, r, ph=0.0):
    vs = []
    for i in range(6):
        a = ph + i*2.0*math.pi/6
        vs.append(bm.verts.new((x, r*math.cos(a), r*math.sin(a))))
    return vs
def hexplate(bm, x, r, nu, ph=0.0):
    c0 = bm.verts.new((x, 0.0, 0.0))
    rings = []
    for k in range(1, nu+1):
        rr = r*k/nu
        vs = []
        for i in range(6):
            a = ph + i*2.0*math.pi/6
            vs.append(bm.verts.new((x, rr*math.cos(a), rr*math.sin(a))))
        rings.append(vs)
    R0 = rings[0]
    for i in range(6):
        try: bm.faces.new((c0, R0[(i+1)%6], R0[i]))
        except ValueError: pass
    for k in range(nu-1):
        A, B = rings[k], rings[k+1]
        for i in range(6):
            j=(i+1)%6
            try: bm.faces.new((A[i], A[j], B[j], B[i]))
            except ValueError: pass
    return rings[-1]
def hexridge(bm, x0, r_in, r_out, lift=0.038, ph=0.0):
    # raised trapezoidal band around the hex perimeter (RIDGE - forward rule, no inset)
    ob = hexring(bm, x0, r_out, ph); ib = hexring(bm, x0, r_in, ph)
    oc = hexring(bm, x0+lift, r_out-0.015, ph); ic = hexring(bm, x0+lift, r_in+0.015, ph)
    for i in range(6):
        j = (i+1)%6
        bm.faces.new((ob[i], ob[j], oc[j], oc[i]))
        bm.faces.new((oc[j], oc[i], ic[i], ic[j]))
        bm.faces.new((ib[j], ib[i], ic[i], ic[j]))
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

# ================= BULWARK v2 "hex-shield guardian" =================
# --- VR_Shield: thick hex plate, 3 raised ridge bands, corner pylons, hub, rim ---
bm = bmesh.new()
front_o = hexplate(bm, 0.26, 1.00, 32)
back_o  = hexplate(bm, -0.04, 1.00, 32)
for i in range(6):
    j = (i+1)%6
    try: bm.faces.new((front_o[i], front_o[j], back_o[j], back_o[i]))
    except ValueError: pass
hexridge(bm, 0.26, 0.44, 0.58)
hexridge(bm, 0.26, 0.70, 0.84)
hexridge(bm, 0.26, 0.88, 0.95)
for i in range(6):
    a = i*2.0*math.pi/6
    box(bm, 0.11, 1.00*math.cos(a), 1.00*math.sin(a), 0.11, 0.09, 0.09)   # corner pylons
for i in range(6):
    a = (i+0.5)*2.0*math.pi/6
    box(bm, 0.27, 0.97*math.cos(a), 0.97*math.sin(a), 0.05, 0.04, 0.04)   # front edge bolts
for i in range(6):
    a = (i+0.5)*2.0*math.pi/6
    box(bm, 0.11, 0.62*math.cos(a), 0.62*math.sin(a), 0.07, 0.08, 0.08)   # mid-face turrets
for i in range(6):
    a = (i+0.5)*2.0*math.pi/6
    boxx(bm, -0.065, 0.80*math.cos(a), 0.80*math.sin(a), 0.04, 0.14, 0.16, a)  # raised rear gussets
hub1 = hexplate(bm, 0.27, 0.36, 10)
hub2 = hexplate(bm, 0.30, 0.24, 8)
for i in range(6):
    j = (i+1)%6
    try: bm.faces.new((hub1[i], hub1[j], hub2[j], hub2[i]))
    except ValueError: pass
torus(bm, 0.11, 1.00, 0.045, 34, 8)   # rim
made["shield"] = [to_obj(bm, "VR_Shield")]
# --- VR_Spine: squircle engine block + 2 ridge bands + armor + stack ---
bm = bmesh.new()
SP = [(0.00,0,0,0.10,0.12), (-0.14,0,0,0.155,0.175), (-0.32,0,0,0.20,0.215),
      (-0.50,0,0,0.19,0.205), (-0.66,0,0,0.14,0.155), (-0.76,0,0,0.085,0.10), (-0.82,0,0,0.05,0.06)]
tube2b(bm, SP, 28, 0.5, cap_back=True)
ridge3(bm, SP, 0, 1, 2, 28, 0.5, 0.022)
ridge3(bm, SP, 2, 3, 4, 28, 0.5, 0.022)
for s in (-1, 1):
    plate(bm, (-0.08, s*0.13, 0.05), (-0.08, s*0.40, 0.10),
              (-0.46, s*0.13, 0.03), (-0.46, s*0.40, 0.08), 5, 3, t=0.013)   # side armor
for i in range(6):
    a = i*2.0*math.pi/6
    box(bm, -0.80, 0.09*math.cos(a), 0.09*math.sin(a), 0.045, 0.035, 0.03)   # rear studs
box(bm, -0.87, 0.0, 0.0, 0.07, 0.09, 0.09)                                    # rear stack
made["spine"] = [to_obj(bm, "VR_Spine")]
# --- VR_Core: glow sphere + ring + studs (front face) ---
bm = bmesh.new()
sphere(bm, 0.315, 0.0, 0.0, 0.12, 0.12, 0.12, 13, 7)
torus(bm, 0.315, 0.185, 0.022, 18, 6)
for i in range(6):
    a = i*2.0*math.pi/6
    box(bm, 0.30, 0.145*math.cos(a), 0.145*math.sin(a), 0.035, 0.03, 0.026)
made["core"] = [to_obj(bm, "VR_Core")]
print("BULWARK_V2_DONE", flush=True)

# ================= BAKE + MATERIALS + EXPORT =================
def bake(ob, fn):
    me = ob.data
    attr = me.color_attributes.new(name="Color", type="FLOAT_COLOR", domain="POINT")
    for i, v in enumerate(me.vertices):
        val = fn(v.co.x, v.co.y, v.co.z)
        val = min(0.96, max(0.22, val))
        attr.data[i].color = (val, val, val, 1.0)
def bake_shield(x, y, z):
    r = math.hypot(y, z)
    if r > 0.955: v = 0.46
    elif r > 0.88: v = 0.60
    elif r > 0.84: v = 0.50
    elif r > 0.70: v = 0.60
    elif r > 0.58: v = 0.52
    elif r > 0.44: v = 0.60
    else: v = 0.68
    if x > 0.25: v += 0.03
    if x < -0.03: v -= 0.03
    return v
def bake_spine(x, y, z):
    if x < -0.62: return 0.28
    if x > -0.02: return 0.30
    return hband(x, y, z, 0.32, 0.44)
def bake_core(x, y, z):
    return 0.93
BAKES = {"VR_Shield": bake_shield, "VR_Spine": bake_spine, "VR_Core": bake_core}
def mat(name):
    m = bpy.data.materials.get(name)
    if m is None:
        m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree; bsdf = nt.nodes["Principled BSDF"]
        bsdf.inputs["Base Color"].default_value = (0.8, 0.8, 0.8, 1.0); vc = nt.nodes.new("ShaderNodeVertexColor"); vc.layer_name = "Color"
        nt.links.new(vc.outputs["Color"], bsdf.inputs["Base Color"])
    return m
GROUPS = [made["shield"][0], made["spine"][0], made["core"][0]]
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
print("RAD", "bulwark", round(diag, 3), "target", RAD_TGT, "mn", [round(v,3) for v in mn], "mx", [round(v,3) for v in mx], flush=True)
if not (0.88*RAD_TGT <= diag <= 1.12*RAD_TGT):
    fails.append(("bulwark", "radius", diag, RAD_TGT))
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