import bpy, bmesh, math, mathutils
EV = r"E:/Game/.evidence/I509"
OUT = {"hunter": EV + r"/hunter.glb", "gunship": EV + r"/gunship.glb",
       "sentry": EV + r"/sentry.glb", "wasp": EV + r"/wasp.glb"}
# FROZEN tri budgets (spec 3.2): node -> (aim, cap); gate is aim <= tris <= cap
BUDGET = {
 "VR_Hunter_Hull": (2000, 2160), "VR_Hunter_Fin": (900, 1040), "VR_Hunter_Core": (250, 300),
 "VR_Gunship_Hull": (1500, 1740), "VR_Gunship_Nacelle": (500, 580), "VR_Gunship_Bay": (300, 360),
 "VR_Sentry_Platform": (1700, 1930), "VR_Sentry_Base": (300, 350),
 "VR_Sentry_Barrel": (550, 640), "VR_Sentry_Charge": (250, 280),
 "VR_Wasp_Hull": (1320, 1540), "VR_Wasp_Wing": (2200, 2500), "VR_Wasp_Nose": (240, 280),
}
# RAD class gate: half diagonal of the PLACED union bbox (hull at origin; other
# nodes at their code placements, base scales). Class targets documented, NOT
# config radii (I508 pattern tie is superseded by node-local placements).
RAD = {"hunter": 0.95, "gunship": 1.75, "sentry": 1.95, "wasp": 1.65}
# code placements (build space: +X fwd, +Y lateral, +Z up)
PLACE = {
 "hunter":   {"VR_Hunter_Hull": ((0,0,0), (1,1,1)), "VR_Hunter_Fin": ((-0.72,0,0), (0.4,0.6,1)), "VR_Hunter_Core": ((0.44,0,0), (1,1,1))},
 "gunship":  {"VR_Gunship_Hull": ((0,0,0), (1,1,1)), "VR_Gunship_Nacelle": ((0,-0.88,-0.56), (1,1,1)), "VR_Gunship_Bay": ((1.44,0,0.16), (1,1,1))},
 "sentry":   {"VR_Sentry_Platform": ((0,0,0), (1,1,1)), "VR_Sentry_Base": ((0,0,0), (1,1,1)), "VR_Sentry_Barrel": ((0.99,0,0), (1,1,1)), "VR_Sentry_Charge": ((1.76,0,0), (1,1,1))},
 "wasp":     {"VR_Wasp_Hull": ((0,0,0), (1,1,1)), "VR_Wasp_Wing": ((-0.2025,0,0), (1,1,1)), "VR_Wasp_Nose": ((1.08,0,0), (1,1,1))},
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
def ring2(bm, x, ry, rz, n):
    vs = []
    for i in range(n):
        a = i * 2.0 * math.pi / n
        vs.append(bm.verts.new((x, ry * math.cos(a), rz * math.sin(a))))
    return vs
def tube2(bm, stations, n, cap_front=False, cap_back=False, tip_front=None, tip_back=None):
    rings = [ring2(bm, x, ry, rz, n) for (x, ry, rz) in stations]
    for k in range(len(rings) - 1):
        A, B = rings[k], rings[k + 1]
        for i in range(n):
            j = (i + 1) % n
            bm.faces.new((A[i], A[j], B[j], B[i]))
    if cap_back:
        c = bm.verts.new((stations[0][0] - 0.10, 0.0, 0.0))
        for i in range(n):
            bm.faces.new((c, rings[0][(i + 1) % n], rings[0][i]))
    if cap_front:
        c = bm.verts.new((stations[-1][0] + 0.10, 0.0, 0.0))
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
def ringz(bm, z, rx, ry, n, cx=0.0, cy=0.0):
    vs = []
    for i in range(n):
        a = i * 2.0 * math.pi / n
        vs.append(bm.verts.new((cx + rx * math.cos(a), cy + ry * math.sin(a), z)))
    return vs
def col(bm, stations, n, cx=0.0, cy=0.0, cap_top=True, cap_bot=True):
    rings = [ringz(bm, z, rx, ry, n, cx, cy) for (z, rx, ry) in stations]
    for k in range(len(rings) - 1):
        A, B = rings[k], rings[k + 1]
        for i in range(n):
            j = (i + 1) % n
            bm.faces.new((A[i], A[j], B[j], B[i]))
    if cap_bot:
        c = bm.verts.new((cx, cy, stations[0][0] - 0.001))
        for i in range(n):
            bm.faces.new((c, rings[0][i], rings[0][(i + 1) % n]))
    if cap_top:
        c = bm.verts.new((cx, cy, stations[-1][0] + 0.001))
        for i in range(n):
            bm.faces.new((c, rings[-1][(i + 1) % n], rings[-1][i]))
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
def sphere(bm, cx, cy, cz, rx, ry, rz, nu, nv, lat0=0.0, lat1=None):
    if lat1 is None: lat1 = math.pi
    rows = []
    for v in range(nv + 1):
        lat = lat0 + (lat1 - lat0) * v / nv
        row = []
        for u in range(nu):
            a = u * 2.0 * math.pi / nu
            row.append(bm.verts.new((cx + rx * math.sin(lat) * math.cos(a),
                                     cy + ry * math.sin(lat) * math.sin(a),
                                     cz + rz * math.cos(lat))))
        rows.append(row)
    for v in range(nv):
        for u in range(nu):
            u2 = (u + 1) % nu
            if v == 0:
                bm.faces.new((rows[0][u], rows[1][u2], rows[1][u]))
            elif v == nv - 1:
                bm.faces.new((rows[v][u2], rows[v + 1][u2], rows[v][u]))
            else:
                bm.faces.new((rows[v][u], rows[v + 1][u], rows[v + 1][u2], rows[v][u2]))
def torus(bm, cx, R, r, nm, nn):
    prev = None
    first = None
    for i in range(nm):
        a = i * 2.0 * math.pi / nm
        row = []
        for j in range(nn):
            b = j * 2.0 * math.pi / nn
            rr = R + r * math.cos(b)
            row.append(bm.verts.new((cx + r * math.sin(b), rr * math.cos(a), rr * math.sin(a))))
        if first is None: first = row
        if prev is not None:
            for j in range(nn):
                j2 = (j + 1) % nn
                bm.faces.new((prev[j], prev[j2], row[j2], row[j]))
        prev = row
    for j in range(nn):
        j2 = (j + 1) % nn
        bm.faces.new((prev[j], prev[j2], first[j2], first[j]))
def hash3(x, y, z):
    h = (int(round(x * 1000)) * 73856093) ^ (int(round(y * 1000)) * 19349663) ^ (int(round(z * 1000)) * 83492791)
    h &= 0x7fffffff
    return (h % 83) / 82.0

# ================= HUNTER "manta" v2 =================
bm = bmesh.new()
tube2(bm, [(-0.70, 0.06, 0.05), (-0.52, 0.26, 0.09), (-0.30, 0.44, 0.12), (-0.05, 0.53, 0.14),
           (0.15, 0.50, 0.13), (0.32, 0.36, 0.11), (0.44, 0.20, 0.08), (0.50, 0.08, 0.05)],
      16, cap_back=True, tip_front=0.52)
band_inset(bm, -0.51, -0.31)
band_inset(bm, -0.06, 0.16)
band_inset(bm, 0.33, 0.45)
tube2(bm, [(-0.55, 0.025, 0.08), (-0.35, 0.055, 0.16), (-0.10, 0.06, 0.19), (0.12, 0.055, 0.17),
           (0.30, 0.04, 0.13), (0.40, 0.02, 0.09)], 12, cap_front=True, cap_back=True)
for i in range(14):
    a = i * 2.0 * math.pi / 14
    box(bm, 0.435, 0.135 * math.cos(a), 0.02 + 0.135 * math.sin(a), 0.045, 0.045, 0.05)
for i in range(20):
    a = i * 2.0 * math.pi / 20
    box(bm, -0.30, 0.445 * math.cos(a), 0.12 * math.sin(a), 0.10, 0.04, 0.035)
for i in range(12):
    a = i * 2.0 * math.pi / 12 + 0.2
    box(bm, 0.05, 0.505 * math.cos(a), 0.13 * math.sin(a), 0.08, 0.035, 0.03)
for s in (-1, 1):
    plate(bm, (0.06, 0.0, -0.35), (0.06, 0.0, 0.52),
              (-0.06, 0.0, -0.42), (-0.06, 0.0, 0.55), 6, 5, t=0.015)
    plate(bm, (0.10, s * 0.20, -0.10), (-0.10, s * 0.20, -0.12),
              (0.16, s * 0.44, 0.30), (-0.04, s * 0.44, 0.30), 5, 4, t=0.014)
plate(bm, (-0.45, 0.28, -0.115), (-0.45, -0.28, -0.115),
          (-0.10, 0.30, -0.125), (-0.10, -0.30, -0.125), 7, 3, t=0.012, both=False)
for i in range(8):
    box(bm, 0.24, 0.28 * math.cos(i * 0.785), 0.06 * math.sin(i * 0.785), 0.05, 0.03, 0.025)
for i in range(38):
    a = i * 2.0 * math.pi / 38 + 0.08
    box(bm, -0.05 + (i % 5) * 0.05, 0.47 * math.cos(a), 0.125 * math.sin(a), 0.045, 0.028, 0.024)
made["hunter_hull"] = [to_obj(bm, "VR_Hunter_Hull")]
bm = bmesh.new()
plate(bm, (0.05, 0.0, -0.35), (0.05, 0.0, 0.52),
          (-0.06, 0.0, -0.42), (-0.06, 0.0, 0.55), 8, 16, t=0.016)
for s in (-1, 1):
    plate(bm, (0.04, s * 0.10, -0.15), (0.04, s * 0.38, 0.10),
              (-0.06, s * 0.12, -0.22), (-0.06, s * 0.42, 0.14), 5, 10, t=0.014)
for i in range(5):
    box(bm, -0.005, 0.0, -0.20 + i * 0.15, 0.055, 0.03, 0.02)
made["hunter_fin"] = [to_obj(bm, "VR_Hunter_Fin")]
bm = bmesh.new()
sphere(bm, 0.0, 0.0, 0.0, 0.11, 0.10, 0.12, 16, 9)
made["hunter_core"] = [to_obj(bm, "VR_Hunter_Core")]
print("HUNTER_DONE", flush=True)

# ================= GUNSHIP "brute" v2 =================
bm = bmesh.new()
tube2(bm, [(-0.65, 0.28, 0.32), (-0.45, 0.46, 0.55), (-0.15, 0.54, 0.65), (0.15, 0.54, 0.65),
           (0.45, 0.48, 0.58), (0.75, 0.40, 0.48), (1.00, 0.30, 0.36), (1.15, 0.20, 0.24),
           (1.35, 0.10, 0.12)], 16, cap_back=True)
band_inset(bm, -0.44, -0.16)
band_inset(bm, -0.14, 0.16)
band_inset(bm, 0.46, 0.74)
band_inset(bm, 1.01, 1.14)
tube2(bm, [(-0.50, 0.10, 0.16), (-0.20, 0.12, 0.20), (0.10, 0.12, 0.20), (0.40, 0.10, 0.17),
           (0.70, 0.08, 0.13), (0.95, 0.05, 0.08)], 10, cap_front=True, cap_back=True)
for s in (-1, 1):
    plate(bm, (0.15, s * 0.40, 0.10), (0.15, s * 1.00, 0.20),
              (-0.30, s * 0.40, 0.16), (-0.55, s * 1.00, 0.26), 11, 7, t=0.016)
    plate(bm, (-0.15, s * 0.95, 0.20), (-0.15, s * 0.95, 0.45),
              (-0.40, s * 0.95, 0.24), (-0.40, s * 0.95, 0.42), 3, 4, t=0.014)
box(bm, 1.18, 0.0, 0.05, 0.09, 0.06, 0.055)
for s in (-1, 1):
    box(bm, 1.14, s * 0.13, 0.02, 0.10, 0.05, 0.045)
for (dx, dz) in ((1, 1), (1, -1), (-1, 1), (-1, -1)):
    box(bm, 1.21, dx * 0.075, 0.05 + dz * 0.075, 0.115, 0.022, 0.022)
for i in range(14):
    a = i * 2.0 * math.pi / 14 + 0.17
    box(bm, -0.30, 0.47 * math.cos(a), 0.56 * math.sin(a), 0.12, 0.045, 0.04)
for i in range(10):
    a = i * 2.0 * math.pi / 10
    box(bm, 0.60, 0.42 * math.cos(a), 0.50 * math.sin(a), 0.09, 0.04, 0.035)
made["gunship_hull"] = [to_obj(bm, "VR_Gunship_Hull")]
bm = bmesh.new()
tube2(bm, [(-0.55, 0.30, 0.30), (-0.30, 0.36, 0.36), (0.05, 0.37, 0.37), (0.35, 0.34, 0.34),
           (0.55, 0.28, 0.28)], 14, cap_back=True)
band_inset(bm, -0.29, -0.06)
band_inset(bm, 0.06, 0.34)
tube2(bm, [(-0.55, 0.24, 0.24), (-0.72, 0.17, 0.17)], 14, tip_back=-0.84)
for i in range(10):
    a = i * 2.0 * math.pi / 10
    box(bm, 0.55, 0.29 * math.cos(a), 0.29 * math.sin(a), 0.05, 0.045, 0.045)
for i in range(8):
    a = i * 2.0 * math.pi / 8 + 0.3
    box(bm, -0.05, 0.375 * math.cos(a), 0.375 * math.sin(a), 0.10, 0.035, 0.03)
for (dy, dz) in ((0.7, 0), (-0.7, 0), (0, 0.7), (0, -0.7)):
    box(bm, 0.56, dy * 0.10, dz * 0.10, 0.05, 0.025, 0.025)
made["gunship_nacelle"] = [to_obj(bm, "VR_Gunship_Nacelle")]
bm = bmesh.new()
tube2(bm, [(0.10, 0.16, 0.16), (-0.02, 0.20, 0.20)], 16, cap_front=True, cap_back=True)
c0 = bm.verts.new((-0.02, 0.0, 0.0))
r0 = [v for v in bm.verts if abs(v.co.x + 0.02) < 0.001]
for i in range(16):
    try: bm.faces.new((c0, r0[(i + 1) % 16], r0[i]))
    except ValueError: pass
for i in range(10):
    a = i * 2.0 * math.pi / 10
    box(bm, -0.02, 0.10 * math.cos(a), 0.10 * math.sin(a), 0.09, 0.02, 0.02)
for i in range(10):
    a = i * 2.0 * math.pi / 10 + 0.31
    box(bm, 0.0, 0.205 * math.cos(a), 0.205 * math.sin(a), 0.05, 0.035, 0.035)
made["gunship_bay"] = [to_obj(bm, "VR_Gunship_Bay")]
print("GUNSHIP_DONE", flush=True)

# ================= SENTRY "watchtower" v2 =================
bm = bmesh.new()
col(bm, [(-0.19, 1.02, 1.02), (-0.09, 1.06, 1.06), (0.0, 1.02, 1.02), (0.10, 0.95, 0.95), (0.19, 0.88, 0.88)], 6, cap_top=False, cap_bot=True)
for i in range(6):
    a = i * 2.0 * math.pi / 6 + math.pi / 6
    box(bm, 1.04 * math.cos(a), 1.04 * math.sin(a), 0.0, 0.05, 0.05, 0.12)
    box(bm, 0.90 * math.cos(a), 0.90 * math.sin(a), -0.14, 0.08, 0.045, 0.045)
for i in range(12):
    a = i * 2.0 * math.pi / 12
    box(bm, 1.08 * math.cos(a), 1.08 * math.sin(a), -0.03, 0.035, 0.035, 0.16)
col(bm, [(0.0, 0.55, 0.55), (0.45, 0.50, 0.50), (0.60, 0.55, 0.55)], 12, cap_top=False, cap_bot=False)
for i in range(12):
    a = i * 2.0 * math.pi / 12
    box(bm, 0.22, 0.525 * math.cos(a), 0.525 * math.sin(a), 0.06, 0.04, 0.035)
col(bm, [(0.42, 0.88, 0.88), (0.62, 0.85, 0.85)], 6, cap_top=True, cap_bot=False)
for i in range(6):
    a = i * 2.0 * math.pi / 6 + math.pi / 6
    box(bm, 0.865 * math.cos(a), 0.865 * math.sin(a), 0.52, 0.05, 0.05, 0.22)
sphere(bm, 0.0, 0.0, 0.60, 0.58, 0.58, 0.42, 16, 5, lat1=math.pi / 2)
for i in range(6):
    a = i * 2.0 * math.pi / 6 + 0.26
    box(bm, 0.54 * math.cos(a), 0.54 * math.sin(a), 0.75, 0.03, 0.03, 0.12)
for i in range(3):
    a = i * 2.0 * math.pi / 3 + 0.5
    box(bm, 0.92 * math.cos(a), 0.92 * math.sin(a), 0.30, 0.025, 0.025, 0.12)
for i in range(6):
    a = i * 2.0 * math.pi / 6 + math.pi / 6
    ca, sa = math.cos(a), math.sin(a)
    x1 = 0.88 * ca + 0.35 * sa; y1 = 0.88 * sa - 0.35 * ca
    x2 = 0.88 * ca - 0.35 * sa; y2 = 0.88 * sa + 0.35 * ca
    plate(bm, (x1, y1, 0.15), (x2, y2, 0.15), (x1, y1, -0.15), (x2, y2, -0.15), 5, 4, t=0.012)
for i in range(6):
    a = i * 2.0 * math.pi / 6
    ca, sa = math.cos(a), math.sin(a)
    x1 = 0.96 * ca + 0.22 * sa; y1 = 0.96 * sa - 0.22 * ca
    x2 = 0.96 * ca - 0.22 * sa; y2 = 0.96 * sa + 0.22 * ca
    plate(bm, (x1, y1, 0.17), (x2, y2, 0.17), (x1, y1, -0.17), (x2, y2, -0.17), 3, 3, t=0.011)
for i in range(10):
    box(bm, -0.40 + i * 0.09, 0.42 * math.cos(i * 1.3), 0.55 + 0.10 * math.sin(i * 0.9), 0.025, 0.025, 0.06)
for i in range(8):
    box(bm, 0.56 * math.cos(i * 0.785), 0.56 * math.sin(i * 0.785), 0.30, 0.04, 0.04, 0.06)
made["sentry_platform"] = [to_obj(bm, "VR_Sentry_Platform")]
bm = bmesh.new()
box(bm, 0.0, 0.0, -0.02, 1.30, 0.28, 0.06)
for i in range(8):
    box(bm, -1.10 + i * 0.30, 0.285 * (1 if i % 2 == 0 else -1), -0.02, 0.05, 0.025, 0.045)
for s in (-1, 1):
    box(bm, s * 1.32, 0.0, -0.02, 0.06, 0.24, 0.07)
    box(bm, s * 0.95, 0.0, -0.10, 0.14, 0.20, 0.05)
for i in range(6):
    box(bm, -0.90 + i * 0.36, 0.0, 0.045, 0.10, 0.24, 0.02)
for i in range(8):
    box(bm, -1.05 + i * 0.30, 0.29, 0.02, 0.05, 0.02, 0.03)
made["sentry_base"] = [to_obj(bm, "VR_Sentry_Base")]
bm = bmesh.new()
tube2(bm, [(-0.55, 0.14, 0.14), (-0.30, 0.16, 0.16), (0.10, 0.15, 0.15), (0.30, 0.13, 0.13)],
      14, cap_back=True)
band_inset(bm, -0.29, -0.06)
tube2(bm, [(0.30, 0.20, 0.20), (0.42, 0.24, 0.24)], 14, tip_front=0.48, cap_back=True)
for i in range(8):
    a = i * 2.0 * math.pi / 8
    box(bm, 0.36, 0.225 * math.cos(a), 0.225 * math.sin(a), 0.05, 0.03, 0.03)
box(bm, -0.05, 0.0, 0.185, 0.16, 0.05, 0.035)
box(bm, -0.05, 0.0, 0.22, 0.06, 0.03, 0.05)
box(bm, 0.10, 0.0, 0.20, 0.05, 0.03, 0.04)
for i in range(12):
    a = i * 2.0 * math.pi / 12
    box(bm, -0.55, 0.155 * math.cos(a), 0.155 * math.sin(a), 0.05, 0.035, 0.035)
for i in range(8):
    a = i * 2.0 * math.pi / 8 + 0.4
    box(bm, -0.38, 0.165 * math.cos(a), 0.165 * math.sin(a), 0.08, 0.028, 0.028)
made["sentry_barrel"] = [to_obj(bm, "VR_Sentry_Barrel")]
bm = bmesh.new()
torus(bm, 0.0, 0.075, 0.028, 16, 8)
made["sentry_charge"] = [to_obj(bm, "VR_Sentry_Charge")]
print("SENTRY_DONE", flush=True)

# ================= WASP "hornet" v2 =================
bm = bmesh.new()
tube2(bm, [(-0.75, 0.08, 0.10), (-0.58, 0.19, 0.22), (-0.34, 0.10, 0.12), (-0.16, 0.11, 0.13),
           (0.02, 0.28, 0.32), (0.24, 0.31, 0.35), (0.44, 0.25, 0.29), (0.62, 0.14, 0.17),
           (0.78, 0.05, 0.06)], 14, cap_back=True, tip_front=0.82)
band_inset(bm, -0.57, -0.35)
band_inset(bm, -0.15, 0.03)
band_inset(bm, 0.45, 0.61)
plate(bm, (-0.52, 0.0, 0.05), (-0.52, 0.0, 0.26),
          (-0.72, 0.0, 0.02), (-0.72, 0.0, 0.20), 4, 6, t=0.012)
for s in (-1, 1):
    plate(bm, (-0.50, s * 0.05, 0.0), (-0.50, s * 0.18, 0.02),
              (-0.68, s * 0.05, 0.0), (-0.68, s * 0.16, 0.10), 3, 4, t=0.011)
for i in range(10):
    a = i * 2.0 * math.pi / 10
    box(bm, -0.25, 0.125 * math.cos(a), 0.125 * math.sin(a), 0.05, 0.03, 0.03)
for i in range(16):
    a = i * 2.0 * math.pi / 16 + 0.2
    box(bm, 0.10, 0.30 * math.cos(a), 0.34 * math.sin(a), 0.07, 0.03, 0.028)
for i in range(8):
    a = i * 2.0 * math.pi / 8
    box(bm, -0.45, 0.185 * math.cos(a), 0.215 * math.sin(a), 0.06, 0.03, 0.028)
for s in (-1, 1):
    plate(bm, (0.06, s * 0.16, 0.30), (0.06, s * 0.34, 0.30),
              (-0.10, s * 0.14, 0.28), (-0.10, s * 0.30, 0.28), 4, 3, t=0.010, both=False)
box(bm, -0.78, 0.0, 0.02, 0.06, 0.035, 0.035)
box(bm, -0.83, 0.0, 0.02, 0.035, 0.025, 0.025)
for i in range(6):
    box(bm, 0.30 + (i % 2) * 0.10, 0.20 * math.cos(i * 1.05), 0.26 * math.sin(i * 1.05), 0.045, 0.028, 0.026)
for i in range(16):
    a = i * 2.0 * math.pi / 16 + 0.1
    box(bm, -0.10 + (i % 4) * 0.06, 0.13 * math.cos(a), 0.14 * math.sin(a), 0.035, 0.022, 0.02)
made["wasp_hull"] = [to_obj(bm, "VR_Wasp_Hull")]
bm = bmesh.new()
# I509 FIX (wing mirror): the first build dropped the -Y mirror of the "WingL+R
# (double blade)" spec - both airfoil plates sat at +Y and spar/rib/tip details
# were +Y-only (the s-loop collapsed to s*0.0 / (1 if s>0 else 1)). Rebuilt as an
# explicit per-side loop; spar half-extent 0.9 -> 0.6 keeps the spar under the
# blade (tip 1.10 < blade tip 1.18) so the silhouette span stays the approved 2.36
# (mirrored spar at 0.9 would stick 0.27 past the blade and blow the RAD gate).
for s in (-1, 1):
    plate(bm, (0.10, s * 0.06, 0.10), (0.10, s * 1.18, 0.14),
          (-0.16, s * 0.06, 0.10), (-0.16, s * 1.18, 0.16), 14, 9, t=0.013)
    plate(bm, (0.10, s * 0.06, -0.10), (0.10, s * 1.18, -0.14),
          (-0.16, s * 0.06, -0.10), (-0.16, s * 1.18, -0.16), 14, 9, t=0.013)
    for i in range(3):
        box(bm, -0.03, s * (0.30 + i * 0.30), 0.0, 0.13, 0.05, 0.05)
    for i in range(8):
        box(bm, -0.02 + (i % 2) * 0.05, s * (0.20 + i * 0.12), 0.125, 0.09, 0.02, 0.018)
    box(bm, 0.115, s * 0.55, 0.0, 0.03, 0.6, 0.02)
    box(bm, -0.16, s * 1.19, 0.13, 0.05, 0.04, 0.03)
    box(bm, -0.16, s * 1.19, -0.13, 0.05, 0.04, 0.03)
    box(bm, 0.10, s * 1.19, 0.12, 0.04, 0.035, 0.025)
    box(bm, 0.10, s * 1.19, -0.12, 0.04, 0.035, 0.025)
made["wasp_wing"] = [to_obj(bm, "VR_Wasp_Wing")]
bm = bmesh.new()
tube2(bm, [(-0.22, 0.06, 0.06), (-0.05, 0.085, 0.085), (0.10, 0.06, 0.06), (0.20, 0.025, 0.025)],
      12, tip_front=0.30, cap_back=True)
for i in range(8):
    a = i * 2.0 * math.pi / 8
    box(bm, -0.20, 0.075 * math.cos(a), 0.075 * math.sin(a), 0.04, 0.028, 0.028)
for i in range(6):
    a = i * 2.0 * math.pi / 6 + 0.3
    box(bm, 0.02, 0.07 * math.cos(a), 0.07 * math.sin(a), 0.03, 0.024, 0.024)
made["wasp_nose"] = [to_obj(bm, "VR_Wasp_Nose")]
print("WASP_DONE", flush=True)

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
def bake_hunter_hull(x, y, z):
    if z > 0.14 and x < 0.36: return 0.78
    if x > 0.22 and z > -0.02: return 0.70
    if x < -0.55 or x > 0.46: return 0.36
    if z < -0.02: return 0.30
    return hband(x, y, z, 0.44, 0.58)
def bake_hunter_fin(x, y, z):
    return hband(x, y, z, 0.34, 0.44)
def bake_hunter_core(x, y, z):
    return 0.90
def bake_gunship_hull(x, y, z):
    if z > 0.62 and abs(y) < 0.14 and -0.5 < x < 0.95: return 0.70
    if x > 1.08 and math.hypot(y, z) < 0.30: return 0.38
    if z > 0.45: return 0.62
    if z < -0.30: return 0.30
    return hband(x, y, z, 0.42, 0.54)
def bake_gunship_nacelle(x, y, z):
    if x < -0.45: return 0.26
    if x > 0.42: return 0.66
    return hband(x, y, z, 0.40, 0.52)
def bake_gunship_bay(x, y, z):
    return 0.95
def bake_sentry_platform(x, y, z):
    if math.hypot(x, y) < 0.60 and z > 0.60: return 0.72
    if z > 0.40 and math.hypot(x, y) < 0.90: return 0.58
    if z > 0.18: return 0.62
    return hband(x, y, z, 0.44, 0.48)
def bake_sentry_base(x, y, z):
    return 0.34
def bake_sentry_barrel(x, y, z):
    if x > 0.28: return 0.66
    return hband(x, y, z, 0.42, 0.58)
def bake_sentry_charge(x, y, z):
    return 0.95
def bake_wasp_hull(x, y, z):
    if x > 0.18: return 0.72
    if x > -0.10: return 0.62
    if x > -0.36: return 0.40
    return 0.34
def bake_wasp_wing(x, y, z):
    if abs(y) > 0.90: return 0.36
    return hband(x, y, z, 0.50, 0.62)
def bake_wasp_nose(x, y, z):
    return 0.95
BAKES = {
 "VR_Hunter_Hull": bake_hunter_hull, "VR_Hunter_Fin": bake_hunter_fin, "VR_Hunter_Core": bake_hunter_core,
 "VR_Gunship_Hull": bake_gunship_hull, "VR_Gunship_Nacelle": bake_gunship_nacelle, "VR_Gunship_Bay": bake_gunship_bay,
 "VR_Sentry_Platform": bake_sentry_platform, "VR_Sentry_Base": bake_sentry_base,
 "VR_Sentry_Barrel": bake_sentry_barrel, "VR_Sentry_Charge": bake_sentry_charge,
 "VR_Wasp_Hull": bake_wasp_hull, "VR_Wasp_Wing": bake_wasp_wing, "VR_Wasp_Nose": bake_wasp_nose,
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
 "hunter": [made["hunter_hull"][0], made["hunter_fin"][0], made["hunter_core"][0]],
 "gunship": [made["gunship_hull"][0], made["gunship_nacelle"][0], made["gunship_bay"][0]],
 "sentry": [made["sentry_platform"][0], made["sentry_base"][0], made["sentry_barrel"][0], made["sentry_charge"][0]],
 "wasp": [made["wasp_hull"][0], made["wasp_wing"][0], made["wasp_nose"][0]],
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
        off, scl = PLACE[asset][ob.name]
        for v in ob.data.vertices:
            for k in range(3):
                w = (v.co[k] * scl[k]) + off[k]
                mn[k] = min(mn[k], w); mx[k] = max(mx[k], w)
    diag = math.sqrt(sum((mx[k] - mn[k]) ** 2 for k in range(3))) / 2.0
    tgt = RAD[asset]
    print("RAD", asset, round(diag, 3), "target", tgt, "class", round(diag / tgt, 3),
          "mn", [round(v, 2) for v in mn], "mx", [round(v, 2) for v in mx], flush=True)
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
