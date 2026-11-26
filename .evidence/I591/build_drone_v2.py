import bpy, bmesh, math, os
from mathutils import Vector, Matrix

# I591 (ST-558, E84): drone v2 "boomerang" - compact V / pronged swarm unit.
# Build space: +X span, +Y length (NOSE -Y, TAIL +Y), +Z up. Export export_yup=True
# -> glTF +X span, +Y up, +Z nose. Frozen contract: production/scope-check-E84.md +
# design/e84-enemy-remaster-research.md (drone brief: two swept prongs + small central
# spine + central glow core; single node VR_Drone; AIM 1,900 / HARD 2,400 tris;
# sil96 STRICT [0.0792, 0.1072]; legacy extent [2.1, 1.7, 1.1421]; GLB <= 150,000 B
# target / 200,000 B hard). Output to .evidence/I591/ ONLY (never assets/).
EVID = "E:/Game/.evidence/I591/"
L = Vector((-0.45, -0.55, 0.70)).normalized()   # build-space bake light
K_DRONE = 0.60
AIM_TRIS, HARD_TRIS = 1900, 2400

# ---- tune knobs (single rework lever set) ----
NPE = 10          # arm grid per-edge subdivision (10 -> 11x11 verts per face)
BEVEL_OFF = 0.012

def clamp(v, lo, hi):
    return lo if v < lo else (hi if v > hi else v)

def purge():
    for ob in list(bpy.data.objects):
        bpy.data.objects.remove(ob, do_unlink=True)
    for coll in (bpy.data.meshes, bpy.data.materials):
        for b in list(coll):
            if b.users == 0:
                coll.remove(b)

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

def rot_box(bm, center, half, pivot, ang):
    m = Matrix.Rotation(ang, 3, (0, 0, 1))
    pv = Vector(pivot)
    vs = []
    for dx in (-half[0], half[0]):
        for dy in (-half[1], half[1]):
            for dz in (-half[2], half[2]):
                co = m @ (Vector(center) + Vector((dx, dy, dz)) - pv) + pv
                vs.append(bm.verts.new(co))
    for f in _boxfaces(vs):
        bm.faces.new(f)

def pyramid(bm, cx, cy, cz, r, h, sides=4, rot=0.0):
    base = [bm.verts.new((cx + r * math.cos(rot + 2*math.pi*i/sides),
                          cy + r * math.sin(rot + 2*math.pi*i/sides), cz)) for i in range(sides)]
    apex = bm.verts.new((cx, cy, cz + h))
    for i in range(sides):
        j = (i + 1) % sides
        bm.faces.new((base[i], base[j], apex))
    bm.faces.new(list(reversed(base)))

def _chk(bm):
    bnd = sum(1 for e in bm.edges if len(e.link_faces) == 1)
    nm = sum(1 for e in bm.edges if len(e.link_faces) > 2)
    deg = sum(1 for f in bm.faces if f.calc_area() < 1e-8)
    return nm, deg, bnd

def cleanup(ob):
    bm = bmesh.new(); bm.from_mesh(ob.data)
    bmesh.ops.dissolve_degenerate(bm, dist=1e-6, edges=bm.edges[:])
    tiny = [f for f in bm.faces if f.calc_area() < 1e-8]
    if tiny:
        bmesh.ops.delete(bm, geom=tiny, context='FACES')
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    nm, deg, bnd = _chk(bm)
    print("CLEANUP", ob.name, "nm", nm, "degen", deg, "bnd", bnd)
    bm.to_mesh(ob.data); bm.free(); ob.data.update()

def triangulate_recalc(ob):
    bm = bmesh.new(); bm.from_mesh(ob.data)
    bmesh.ops.triangulate(bm, faces=bm.faces[:], quad_method='BEAUTY', ngon_method='EAR_CLIP')
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    bm.to_mesh(ob.data); bm.free(); ob.data.update()

def bevel_ob(ob, offset=0.012, ang=40.0):
    bm = bmesh.new(); bm.from_mesh(ob.data)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    bm.normal_update()
    ang_r = math.radians(ang)
    es = []
    for e in bm.edges:
        lf = e.link_faces
        if len(lf) == 2:
            n1 = lf[0].normal; n2 = lf[1].normal
            if n1.length > 0.5 and n2.length > 0.5 and n1.angle(n2) > ang_r:
                if e.calc_length() >= offset * 3.0:
                    es.append(e)
    bmesh.ops.bevel(bm, geom=es, offset=offset, offset_type="OFFSET", segments=1, profile=0.7,
                    affect="EDGES", clamp_overlap=True)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    nm, deg, bnd = _chk(bm)
    print("BEVEL", ob.name, "sel", len(es), "bnd", bnd, "nm", nm, "degen", deg)
    assert nm == 0, "bevel produced non-manifold edges"
    bm.to_mesh(ob.data); bm.free(); ob.data.update()

def bake_drone(ob, k):
    # base grayscale value bake + the central glow core baked brighter (the role's
    # signature emissive slot) + belly shadow.
    me = ob.data
    attr = me.color_attributes.new(name="Color", type='FLOAT_COLOR', domain='POINT')
    lens_c = Vector((0.0, -0.42, 0.50))
    vals = []
    for v in me.vertices:
        vn = v.normal
        val = clamp(1.0 + k * vn.dot(L), 0.30, 1.55)
        if (v.co - lens_c).length < 0.26 and v.co.z > 0.30:
            val = clamp(val * 1.30, 0.30, 1.55)      # glow-core bright bake
        if v.co.z < -0.20:
            val = clamp(val * 0.86, 0.30, 1.55)       # belly shadow
        vals.append(val)
        attr.data[len(vals) - 1].color = (val, val, val, 1.0)
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

def newmat(name, base):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    bsdf = nt.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (base[0], base[1], base[2], 1.0)
    vc = nt.nodes.new("ShaderNodeVertexColor")
    vc.layer_name = "Color"
    nt.links.new(vc.outputs["Color"], bsdf.inputs["Base Color"])
    return mat

# ---------------------------------------------------------------- geometry
# Spine: 4-sided (diamond) loft along Y, nose apex at the front vertex (-Y).
SPINE_ST = [  # (y, half_w, zc, half_h)
    (-0.85, 0.035, 0.10, 0.035),
    (-0.60, 0.140, 0.16, 0.130),
    (-0.25, 0.220, 0.19, 0.170),
    ( 0.15, 0.220, 0.19, 0.160),
    ( 0.50, 0.140, 0.21, 0.110),
    ( 0.85, 0.035, 0.22, 0.035),
]

def spine(bm):
    rings = []
    for (y, w, zc, hh) in SPINE_ST:
        rings.append([
            bm.verts.new((-w, y, zc)),
            bm.verts.new((0.0, y, zc + hh)),
            bm.verts.new((w, y, zc)),
            bm.verts.new((0.0, y, zc - hh)),
        ])
    for ri in range(len(rings) - 1):
        a, b = rings[ri], rings[ri + 1]
        for i in range(4):
            j = (i + 1) % 4
            bm.faces.new((a[i], a[j], b[j], b[i]))
    bm.faces.new(list(reversed(rings[0])))
    bm.faces.new(rings[-1])

# Arm (prong): bilinear grid over the planform quad, top/bottom shells + edge caps.
# Right arm; the left is the mirror in X.
ARM_C = [  # (x, y) planform: c0 root-lead, c1 tip, c2 trail-outer, c3 trail-inner
    (0.18, -0.72),
    (1.05,  0.30),
    (0.64,  0.85),
    (0.30,  0.40),
]
ARM_ZT = [0.44, 0.68, 0.40, 0.42]     # top z at c0..c3
ARM_ZB = [-0.40, 0.44, -0.10, -0.18]  # bottom z at c0..c3

def bilin(u, v, px):
    return ((1 - u) * (1 - v) * px[0] + u * (1 - v) * px[1]
            + u * v * px[2] + (1 - u) * v * px[3])

def arm(bm, sgn):
    n = NPE
    top = []; bot = []
    for j in range(n + 1):      # v: c0 -> c3 (lead -> trail)
        rowt = []; rowb = []
        for i in range(n + 1):  # u: c0 -> c1 (root -> tip)
            u = i / n; v = j / n
            x = sgn * bilin(u, v, [c[0] for c in ARM_C])
            y = bilin(u, v, [c[1] for c in ARM_C])
            zt = bilin(u, v, ARM_ZT)
            zb = bilin(u, v, ARM_ZB)
            th = (zt - zb) * max((1 - u) ** 0.7, 0.17)   # thickness taper to a near-point tip
            zm = (zt + zb) / 2.0
            rowt.append(bm.verts.new((x, y, zm + th / 2.0)))
            rowb.append(bm.verts.new((x, y, zm - th / 2.0)))
        top.append(rowt); bot.append(rowb)
    for j in range(n):
        for i in range(n):
            bm.faces.new((top[j][i], top[j][i + 1], top[j + 1][i + 1], top[j + 1][i]))
            bm.faces.new((bot[j][i], bot[j][i + 1], bot[j + 1][i + 1], bot[j + 1][i]))
    for i in range(n):  # lead edge (v=0, c0->c1)
        bm.faces.new((top[0][i], top[0][i + 1], bot[0][i + 1], bot[0][i]))
    for i in range(n):  # trail edge (v=1, c2->c3)
        bm.faces.new((top[n][i], bot[n][i], bot[n][i + 1], top[n][i + 1]))
    for j in range(n):  # tip edge (u=n, c1->c2)
        bm.faces.new((top[j][n], top[j + 1][n], bot[j + 1][n], bot[j][n]))
    for j in range(n):  # inner edge (u=0, c3->c0)
        bm.faces.new((top[j][0], bot[j][0], bot[j + 1][0], top[j + 1][0]))

def arm_greebles(bm, sgn):
    ang = math.radians(24)
    pv = Vector((sgn * 0.45, -0.35, 0.0))
    # root engine block (top, near the root)
    rot_box(bm, (sgn * 0.42, -0.38, 0.335), (0.13, 0.17, 0.075), pv, -ang)
    # second intake block outboard
    rot_box(bm, (sgn * 0.62, -0.02, 0.40), (0.10, 0.13, 0.060), pv, -ang)
    # rib strip mid-arm
    rot_box(bm, (sgn * 0.60, 0.12, 0.335), (0.045, 0.30, 0.022), pv, -ang)
    # tip sensor pod (small pyramid at the prong tip, top)
    pyramid(bm, sgn * 0.97, 0.34, 0.50, 0.065, 0.11, 4, math.radians(45))
    # belly skid under the root
    box(bm, sgn * 0.34, -0.30, -0.28, 0.09, 0.14, 0.05)

def core(bm):
    # central glow lens: 8-sided top cone on a collar skirt; profile (cross-section)
    # is the closed loop apex_t -> girdle -> col_t -> col_b -> apex_b, so every ring
    # edge is shared by exactly 2 faces (no caps on interior rings).
    cx, cy = 0.0, -0.42
    gird = [bm.verts.new((cx + 0.15 * math.cos(2*math.pi*i/8 + math.pi/8),
                          cy + 0.15 * math.sin(2*math.pi*i/8 + math.pi/8), 0.48)) for i in range(8)]
    apex_t = bm.verts.new((cx, cy, 0.75))
    apex_b = bm.verts.new((cx, cy, 0.34))
    col_t = [bm.verts.new((cx + 0.185 * math.cos(2*math.pi*i/8 + math.pi/8),
                           cy + 0.185 * math.sin(2*math.pi*i/8 + math.pi/8), 0.44)) for i in range(8)]
    col_b = [bm.verts.new((cx + 0.185 * math.cos(2*math.pi*i/8 + math.pi/8),
                           cy + 0.185 * math.sin(2*math.pi*i/8 + math.pi/8), 0.36)) for i in range(8)]
    for i in range(8):
        j = (i + 1) % 8
        bm.faces.new((gird[i], gird[j], apex_t))                # top cone
        bm.faces.new((gird[i], gird[j], col_t[j], col_t[i]))    # girdle -> collar top shelf
        bm.faces.new((col_t[i], col_t[j], col_b[j], col_b[i]))  # collar band
        bm.faces.new((col_b[i], col_b[j], apex_b))              # base fan to bottom apex

def main():
    purge()
    ob = newmesh("VR_Drone")
    bm = bmesh.new()
    spine(bm)
    arm(bm, 1)
    arm(bm, -1)
    core(bm)
    arm_greebles(bm, 1)
    arm_greebles(bm, -1)
    # spine greebles: dorsal fin strip + belly sponson + nose blade
    box(bm, 0.0, 0.10, 0.40, 0.030, 0.34, 0.035)          # dorsal fin
    box(bm, 0.0, 0.05, -0.08, 0.055, 0.30, 0.045)         # belly sponson
    pyramid(bm, 0.0, -0.78, 0.02, 0.075, 0.10, 4, math.radians(45))  # nose blade
    bm.to_mesh(ob.data); bm.free(); ob.data.update()

    cleanup(ob)
    triangulate_recalc(ob)
    t = tris_of(ob)
    print("PART VR_Drone tris", t, "verts", len(ob.data.vertices))
    bevel_ob(ob, BEVEL_OFF, 40.0)
    t = tris_of(ob)
    print("PART VR_Drone tris(after bevel)", t, "verts", len(ob.data.vertices))
    if t > HARD_TRIS:
        raise SystemExit("CAP_FAIL VR_Drone %d > %d" % (t, HARD_TRIS))
    fb = bake_drone(ob, K_DRONE)
    print("FACET drone p10", round(fb['p10'],4), "p50", round(fb['p50'],4),
          "p90", round(fb['p90'],4), "spread", round(fb['spread'],4))
    assert fb['spread'] >= 0.30, "bake spread < 0.30"
    if t < AIM_TRIS:
        raise SystemExit("AIM_FAIL VR_Drone %d < %d" % (t, AIM_TRIS))

    mat = newmat("VR_Drone", (0x6f/255, 0x87/255, 0x96/255))
    ob.data.materials.clear()
    ob.data.materials.append(mat)
    finish(ob)

    allv = [v.co for v in ob.data.vertices]
    xs = [c.x for c in allv]; ys = [c.y for c in allv]; zs = [c.z for c in allv]
    span_x = max(xs) - min(xs); length = max(ys) - min(ys); height = max(zs) - min(zs)
    print("BUILD extent x", round(min(xs),4), round(max(xs),4), "span", round(span_x,4))
    print("BUILD extent y", round(min(ys),4), round(max(ys),4), "len", round(length,4))
    print("BUILD extent z", round(min(zs),4), round(max(zs),4), "h", round(height,4))
    assert 2.05 <= span_x <= 2.15, "span band broken (%.4f)" % span_x
    assert 1.63 <= length <= 1.77, "length band broken (%.4f)" % length
    assert 1.09 <= height <= 1.19, "height band broken (%.4f)" % height

    out = EVID + "drone_v2.glb"
    ob.select_set(True)
    bpy.context.view_layer.objects.active = ob
    bpy.ops.export_scene.gltf(
        filepath=out, export_format='GLB', use_selection=True,
        export_yup=True, export_apply=True, export_materials='EXPORT',
        export_vertex_color='MATERIAL', export_image_format='AUTO',
        export_skins=False, export_animations=False,
        export_normals=True, export_texcoords=False, export_tangents=False)
    gb = os.path.getsize(out)
    print("GLB_BYTES", gb)
    assert gb <= 200000, "GLB hard %d > 200000" % gb
    if gb > 150000:
        print("GLB_WARN", gb, "> 150000")
    bpy.ops.wm.save_as_mainfile(filepath=EVID + "drone_v2.blend")
    print("ALL_DONE")

main()
