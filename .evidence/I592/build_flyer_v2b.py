import bpy, bmesh, math, os
from mathutils import Matrix, Vector

# I592 (ST-559, E84): flyer v2 "crescent scout" - remaster of the I508 legacy-4
# disc (1,770 t, sil96 0.0413 = the ambiguous-disc read, F5).
# Character per design/e84-enemy-remaster-research.md section 4 (FINAL):
#   slim 12-gon spine + 2 substantial crescent blades (sharp tips, XY slabs
#   z -0.06..0.08) + recessed magenta dome; reads as a crescent scout at 96 px.
# Two nodes: VR_Flyer_Body + VR_Flyer_Dome (bit-identical names, I508 contract;
# the /dome|core/i node takes the emissive slot in flyerMesh.js).
# Build space: +X forward, +Z up, +Y lateral (export_yup -> game +X fwd / +Y up).
# Placement invariants (frozen, probe_legacy592.py on the I508 legacy GLB):
#   body x [-1.25, 1.30], up [-0.3571, 0.3740], lat +/-1.05;
#   dome x-c +0.05, up -> 0.58, lat +/-0.30; union M = 2.55.
# Frozen contract: per-node tri (body AIM 1850 / HARD 2310; dome AIM 150 /
# HARD 190); GATE-OVERRIDE-E84-S1 sil96 [0.0351, 0.0475] STRICT (legacy 0.0413,
# mechanism STANDS - no re-baseline); GLB <= 150,000 B target / 200,000 B hard;
# fleet bake L = (-0.45, -0.55, 0.70).normalized(); export flags verbatim per
# production/scope-check-E84.md.
# Re-work budget: 1 rework per ship max (post-audit-gate change only).
# v2b (I592 rework): Fix A - the -Y blade is a 180deg ROTATION of the +Y blade (pinwheel); greeble coords rotated to sit ON the -Y slab (first build Y-mirrored them: 5 greebles floated). Fix B embed_pass same as stinger.
EVID = "E:/Game/.evidence/I592/"
L = Vector((-0.45, -0.55, 0.70)).normalized()   # fleet-standard bake light (frozen)
K_BODY = 0.55
K_DOME = 0.94            # flat high bake for the emissive slot (I508: 0.94)
BODY_AIM, BODY_HARD = 1850, 2310
DOME_AIM, DOME_HARD = 150, 190
BEVEL_OFF = 0.015
K_LADDER = [2.5, 3.0, 4.0, 5.0, 6.0, 8.0, 10.0, 12.0, 16.0, 20.0, 24.0]
ZC = 0.01                # spine centerline z
ROT12 = math.radians(15) # 12-gon rot: facet centers at 0/30/60..
ROT8 = math.radians(22.5) # 8-gon rot: facet centers at 22.5/67.5..

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
    bpy.context.scene.collection.objects.link(ob)
    return ob

def tris_of(ob):
    return sum(max(len(p.vertices) - 2, 0) for p in ob.data.polygons)

def _boxfaces(vs):
    return [(0,2,6,4),(1,5,7,3),(0,4,5,1),(2,3,7,6),(0,1,3,2),(4,5,7,6)]

def box(bm, cx, cy, cz, hx, hy, hz):
    o = []
    for dz in (-hz, hz):
        for dy in (-hy, hy):
            for dx in (-hx, hx):
                o.append(bm.verts.new((cx + dx, cy + dy, cz + dz)))
    for f in _boxfaces(o):
        bm.faces.new((o[a] for a in f))

def pyramid(bm, cx, cy, cz, r, h, sides=4, rot=0.0):
    base = []
    for i in range(sides):
        a = rot + 2 * math.pi * i / sides
        base.append(bm.verts.new((cx + r * math.cos(a), cy + r * math.sin(a), cz)))
    apex = bm.verts.new((cx, cy, cz + h))
    for i in range(sides):
        j = (i + 1) % sides
        bm.faces.new((base[i], base[j], apex))
    bm.faces.new(list(reversed(base)))

def ngon_xy(bm, cx, cy, z, r, sides, rot):
    vs = []
    for i in range(sides):
        a = rot + 2 * math.pi * i / sides
        vs.append(bm.verts.new((cx + r * math.cos(a), cy + r * math.sin(a), z)))
    return vs

def ring_ell(bm, x, ry, rz, sides, rot, cz, cy=0.0):
    # ellipse ring in the YZ plane at x, centered (cy, cz) - the REAL 3D ring
    vs = []
    for i in range(sides):
        a = rot + 2 * math.pi * i / sides
        vs.append(bm.verts.new((x, cy + ry * math.cos(a), cz + rz * math.sin(a))))
    return vs

def loft_ell(bm, stations, sides, rot, zc):
    # multi-station elliptical n-gon loft along +X; stations = [(x, ry, rz), ...]
    rings = []
    for (x, ry, rz) in stations:
        rings.append(ring_ell(bm, x, ry, rz, sides, rot, zc))
    for i in range(len(rings) - 1):
        b, t = rings[i], rings[i + 1]
        for k in range(sides):
            j = (k + 1) % sides
            bm.faces.new((b[k], b[j], t[j], t[k]))
    bm.faces.new(list(reversed(rings[0])))
    bm.faces.new(rings[-1])

def loft_z(bm, stations, cx, sides, rot):
    # multi-station circular loft along +Z at x=cx; stations = [(z, r), ...]
    # (the dome-axis helper the draft collars required)
    rings = []
    for (z, r) in stations:
        rings.append(ngon_xy(bm, cx, 0.0, z, r, sides, rot))
    for i in range(len(rings) - 1):
        b, t = rings[i], rings[i + 1]
        for k in range(sides):
            j = (k + 1) % sides
            bm.faces.new((b[k], b[j], t[j], t[k]))
    bm.faces.new(list(reversed(rings[0])))
    bm.faces.new(rings[-1])

def wedge_y(bm, pts, hy):
    # closed polygon in the XZ plane (pts = [(x, z), ...]), extruded +/-hy about y=0
    top = [bm.verts.new((p[0], hy, p[1])) for p in pts]
    bot = [bm.verts.new((p[0], -hy, p[1])) for p in pts]
    n = len(pts)
    for i in range(n):
        j = (i + 1) % n
        bm.faces.new((top[i], top[j], bot[j], bot[i]))
    bm.faces.new(list(reversed(top)))
    bm.faces.new(bot)

def wedge_z(bm, pts, hz):
    # closed polygon in the XY plane (pts = [(x, y), ...]), extruded +/-hz about z=0
    top = [bm.verts.new((p[0], p[1], hz)) for p in pts]
    bot = [bm.verts.new((p[0], p[1], -hz)) for p in pts]
    n = len(pts)
    for i in range(n):
        j = (i + 1) % n
        bm.faces.new((top[i], top[j], bot[j], bot[i]))
    bm.faces.new(list(reversed(top)))
    bm.faces.new(bot)

def slab_xy(bm, pts, z0, z1):
    # closed polygon in the XY plane (pts = [(x, y), ...], CCW), asymmetric slab
    # from z0 to z1 (the crescent-blade slab z -0.06..0.08)
    top = [bm.verts.new((p[0], p[1], z1)) for p in pts]
    bot = [bm.verts.new((p[0], p[1], z0)) for p in pts]
    n = len(pts)
    for i in range(n):
        j = (i + 1) % n
        bm.faces.new((top[i], top[j], bot[j], bot[i]))
    bm.faces.new(list(reversed(top)))
    bm.faces.new(bot)

def _chk(bm):
    bm.edges.ensure_lookup_table()
    nm = sum(1 for e in bm.edges if len(e.link_faces) > 2 or (len(e.link_faces) == 2 and e.link_faces[0] is e.link_faces[1]))
    deg = sum(1 for e in bm.edges if e.calc_length() < 1e-6)
    bnd = sum(1 for e in bm.edges if e.is_boundary)
    return nm, deg, bnd

def cleanup(ob):
    bm = bmesh.new(); bm.from_mesh(ob.data)
    bmesh.ops.remove_doubles(bm, verts=bm.verts[:], dist=1e-5)
    for p in [p for p in bm.faces if len(p.verts) < 3 or p.calc_area() < 1e-8]:
        bm.faces.remove(p)
    bm.verts.ensure_lookup_table()
    for v in [v for v in bm.verts if not v.link_faces]:
        bm.verts.remove(v)
    bm.normal_update()
    nm, deg, bnd = _chk(bm)
    print("CLEANUP", ob.name, "nm", nm, "degen", deg, "bnd", bnd)
    assert nm == 0, "cleanup produced non-manifold"
    assert bnd == 0, "cleanup left boundary edges"
    bm.to_mesh(ob.data); bm.free(); ob.data.update()

def triangulate_recalc(ob):
    bm = bmesh.new(); bm.from_mesh(ob.data)
    bmesh.ops.triangulate(bm, faces=bm.faces[:])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    bm.normal_update()
    bm.to_mesh(ob.data); bm.free(); ob.data.update()

def bevel_trial(ob, k):
    # dry-run bevel on a bmesh copy; returns (tri_count, edge_count, nm, bnd)
    bm = bmesh.new(); bm.from_mesh(ob.data)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    bm.normal_update()
    ang_r = math.radians(40.0)
    es = []
    for e in bm.edges:
        lf = e.link_faces
        if len(lf) == 2:
            n1 = lf[0].normal; n2 = lf[1].normal
            if n1.length > 0.5 and n2.length > 0.5 and n1.angle(n2) > ang_r:
                if e.calc_length() >= BEVEL_OFF * k:
                    es.append(e)
    bmesh.ops.bevel(bm, geom=es, offset=BEVEL_OFF, offset_type="OFFSET", segments=1, profile=0.7,
                    affect="EDGES", clamp_overlap=True)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    nm, deg, bnd = _chk(bm)
    ntri = sum(max(len(p.verts) - 2, 0) for p in bm.faces)
    bm.free()
    return ntri, len(es), nm, bnd

def bevel_ob(ob, k, ang=40.0):
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
                if e.calc_length() >= BEVEL_OFF * k:
                    es.append(e)
    bmesh.ops.bevel(bm, geom=es, offset=BEVEL_OFF, offset_type="OFFSET", segments=1, profile=0.7,
                    affect="EDGES", clamp_overlap=True)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    nm, deg, bnd = _chk(bm)
    print("BEVEL", ob.name, "k", k, "sel", len(es), "bnd", bnd, "nm", nm, "degen", deg)
    assert nm == 0, "bevel produced non-manifold edges"
    assert bnd == 0, "bevel left boundary edges"
    bm.to_mesh(ob.data); bm.free(); ob.data.update()

def pick_k(ob, aim, hard):
    print("LADDER", ob.name)
    for k in K_LADDER:
        ntri, nes, nm, bnd = bevel_trial(ob, k)
        print("  k=%g -> tris %d (edges %d, nm %d, bnd %d)" % (k, ntri, nes, nm, bnd))
        if nm == 0 and bnd == 0 and aim <= ntri <= hard:
            print("PICK", ob.name, "k", k, "tris", ntri)
            return k, ntri
    raise SystemExit("K_LADDER_FAIL %s: no k lands in [%d, %d]" % (ob.name, aim, hard))

def bake(ob, k, flat=None):
    me = ob.data
    attr = me.color_attributes.new(name="Color", type='FLOAT_COLOR', domain='POINT')
    vals = []
    for v in me.vertices:
        co = v.co
        if flat is not None:
            d = flat
        else:
            d = max(co.x * -L.x + co.y * -L.y + co.z * -L.z, 0.0)
        d = min(1.0, k + d)
        vals.append(d)
    # per-face average of vertex values (triangulated mesh: 3 verts)
    for p in me.polygons:
        if len(p.vertices) == 3:
            fl = sum(vals[i] for i in p.vertices) / 3.0
        else:
            fl = sum(vals[i] for i in p.vertices) / len(p.vertices)
        for i in p.vertices:
            attr.data[i].color = (fl, fl, fl, 1.0)
    xs = [vals[i] for i in range(len(vals))]
    xs.sort()
    n = len(xs)
    p10 = xs[int(n * 0.10)]; p50 = xs[int(n * 0.50)]; p90 = xs[int(n * 0.90)]
    return {'p10': p10, 'p50': p50, 'p90': p90, 'spread': p90 - p10}

def finish(ob):
    _uv = ob.data.uv_layers
    if len(_uv) > 0:
        ob.data.uv_layers.remove(_uv[0])
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
# ---------------------------------------------------------------- body
BLADE_R = [(-0.60, 0.12), (-0.20, 0.68), (0.35, 1.00), (1.05, 1.05),
           (0.65, 0.70), (0.30, 0.42), (-0.15, 0.22)]
BLADE_L = [(-x, -y) for (x, y) in reversed(BLADE_R)]

def body_parts(bm):
    # 1 spine: slim 12-gon elliptical loft, needle nose x 1.30, notch dip at
    #   x 0.05 (rz 0.33 -> 0.24) for the dome well
    loft_ell(bm, [(-1.25, 0.16, 0.18), (-0.85, 0.26, 0.30), (-0.20, 0.32, 0.33),
                  (0.05, 0.30, 0.24), (0.45, 0.27, 0.28), (0.95, 0.16, 0.17),
                  (1.18, 0.06, 0.07), (1.30, 0.012, 0.012)], 12, ROT12, ZC)
    # 2 twin crescent blades (XY slabs z -0.06..0.08, sharp tips at (1.05, 1.05))
    slab_xy(bm, BLADE_R, -0.06, 0.08)
    slab_xy(bm, BLADE_L, -0.06, 0.08)
    # 3 per-blade greebles (mirrored; every box straddles the blade slab)
    for s in (1, -1):
        # 2 leading-edge ridge strips (straddle the leading edge, z 0.06..0.19;
        # outer edge kept <= 1.0475 so the lat invariant holds near the tip)
        if s > 0:
            slab_xy(bm, [(-0.22, 0.655), (0.37, 0.975), (0.37, 1.03), (-0.22, 0.71)], 0.06, 0.19)
            slab_xy(bm, [(0.424, 0.960), (0.739, 0.9825), (0.731, 1.0475), (0.416, 1.025)], 0.06, 0.19)
        else:
            # FIX A (I592 rework): the -Y blade is a 180deg ROTATION of the +Y
            # blade (pinwheel), not a Y-mirror: greeble coords rotated 180deg
            # so they sit ON the -Y blade slab (first build Y-mirrored them;
            # 5 greebles floated in space, gaps 0.066-0.805)
            slab_xy(bm, [(0.22, -0.655), (-0.37, -0.975), (-0.37, -1.03), (0.22, -0.71)], 0.06, 0.19)
            slab_xy(bm, [(-0.424, -0.960), (-0.739, -0.9825), (-0.731, -1.0475), (-0.416, -1.025)], 0.06, 0.19)
        # tip pod (180deg-rotated for s<0: straddles the -Y blade near the tip)
        if s > 0:
            box(bm, 1.02, 1.01, ZC, 0.05, 0.035, 0.075)
        else:
            box(bm, -1.02, -1.01, ZC, 0.05, 0.035, 0.075)
        # mid panel (180deg-rotated for s<0, straddles the slab)
        if s > 0:
            box(bm, 0.15, 0.55, ZC, 0.18, 0.10, 0.075)
        else:
            box(bm, -0.15, -0.55, ZC, 0.18, 0.10, 0.075)
        # root fairing (180deg-rotated for s<0: straddles the -Y root edge)
        if s > 0:
            box(bm, -0.35, 0.17, ZC, 0.15, 0.05, 0.075)
        else:
            box(bm, 0.35, -0.17, ZC, 0.15, 0.05, 0.075)
        # trailing-edge pylon (180deg-rotated for s<0, on the -Y blade edge)
        if s > 0:
            box(bm, 0.55, 0.62, ZC, 0.06, 0.05, 0.075)
        else:
            box(bm, -0.55, -0.62, ZC, 0.06, 0.05, 0.075)

def body_fins(bm):
    # 4 tail fins: top to z 0.374, bottom to -0.3571, sides to y +/-0.55
    wedge_y(bm, [(-1.25, 0.05), (-1.25, 0.25), (-0.75, 0.374), (-0.75, 0.18)], 0.04)
    wedge_y(bm, [(-1.25, -0.05), (-1.25, -0.25), (-0.75, -0.3571), (-0.75, -0.18)], 0.04)
    wedge_z(bm, [(-1.25, 0.05), (-1.25, 0.15), (-0.75, 0.55), (-0.75, 0.16)], 0.04)
    wedge_z(bm, [(-1.25, -0.05), (-1.25, -0.15), (-0.75, -0.55), (-0.75, -0.16)], 0.04)
    # 6-box tail ring at x -1.22 on the spine ellipse (hx 0.025 keeps x >= -1.245)
    for a in (0, 60, 120, 180, 240, 300):
        ar = math.radians(a)
        box(bm, -1.22, 0.163 * math.cos(ar), ZC + 0.183 * math.sin(ar), 0.025, 0.032, 0.032)
    # 4 forward canards (cross cluster: the v2 character vs the legacy disc read)
    wedge_z(bm, [(0.80, 0.08), (1.10, 0.20), (1.22, 0.42), (1.12, 0.30)], 0.03)
    wedge_z(bm, [(0.80, -0.08), (1.10, -0.20), (1.22, -0.42), (1.12, -0.30)], 0.03)
    wedge_y(bm, [(0.80, 0.04), (1.10, 0.14), (1.22, 0.30), (1.12, 0.22)], 0.03)
    wedge_y(bm, [(0.90, -0.04), (1.10, -0.12), (1.20, -0.26), (1.12, -0.18)], 0.03)

def body_greeble(bm):
    # 12 flank ribs (3 x-stations x 4 diagonal angles, straddle the spine)
    for (x, ry, rz) in ((-0.50, 0.292, 0.316), (0.05, 0.30, 0.24), (0.60, 0.237, 0.247)):
        for a in (45, 135, 225, 315):
            ar = math.radians(a)
            box(bm, x, ry * 1.03 * math.cos(ar), ZC + rz * 1.03 * math.sin(ar),
                0.045, 0.028, 0.028)
    # 5 dorsal/ventral strips (straddle the spine top/bottom)
    box(bm, -0.55, 0.0, 0.32, 0.25, 0.05, 0.02)     # dorsal rear
    box(bm, 0.35, 0.0, 0.28, 0.12, 0.05, 0.02)      # dorsal front
    box(bm, -0.45, 0.0, -0.305, 0.30, 0.05, 0.02)   # ventral rear
    box(bm, 0.15, 0.0, -0.285, 0.25, 0.05, 0.025)   # ventral mid
    box(bm, 0.75, 0.0, -0.19, 0.10, 0.05, 0.02)     # ventral front
    # 4 tail brackets (diagonal, just ahead of the tail ring)
    for a in (45, 135, 225, 315):
        ar = math.radians(a)
        box(bm, -1.10, 0.1975 * 1.03 * math.cos(ar), ZC + 0.245 * 1.03 * math.sin(ar),
            0.04, 0.028, 0.028)
    # 4 belly strakes (2 mid + 2 forward, straddle the spine bottom)
    box(bm, 0.0, 0.12, -0.248, 0.28, 0.025, 0.025)
    box(bm, 0.0, -0.12, -0.248, 0.28, 0.025, 0.025)
    box(bm, 0.30, 0.12, -0.255, 0.22, 0.025, 0.025)
    box(bm, 0.30, -0.12, -0.255, 0.22, 0.025, 0.025)
    box(bm, 0.95, 0.09, -0.16, 0.06, 0.02, 0.02)
    box(bm, 0.95, -0.09, -0.16, 0.06, 0.02, 0.02)
    # 2 mid-hull intakes + 2 flank pods (straddle the flank)
    box(bm, -0.30, 0.29, ZC, 0.08, 0.028, 0.06)
    box(bm, -0.30, -0.29, ZC, 0.08, 0.028, 0.06)
    box(bm, 0.60, 0.24, ZC, 0.05, 0.028, 0.045)
    box(bm, 0.60, -0.24, ZC, 0.05, 0.028, 0.045)
    # 2 nose sensors (straddle the nose flank)
    box(bm, 1.10, 0.095, ZC, 0.02, 0.02, 0.02)
    box(bm, 1.10, -0.095, ZC, 0.02, 0.02, 0.02)
    # 6 nose rivets (6-gon family)
    for a in (0, 60, 120, 180, 240, 300):
        ar = math.radians(a)
        box(bm, 1.00, 0.138 * 1.02 * math.cos(ar), ZC + 0.148 * 1.02 * math.sin(ar),
            0.015, 0.012, 0.012)

# ---------------------------------------------------------------- dome
def dome_parts(bm):
    # recessed well: 2 stepped solid collars (lower r 0.30 z 0.26..0.285,
    # upper r 0.29 z 0.285..0.30) - FIX 1: loft_z (the draft used loft_xy,
    # which lofts along X, not Z)
    loft_z(bm, [(0.26, 0.30), (0.285, 0.30)], 0.05, 8, ROT8)
    loft_z(bm, [(0.285, 0.29), (0.30, 0.29)], 0.05, 8, ROT8)
    # faceted dome loft (8-gon, 5 stations, flat tip r 0.012 at z 0.57)
    loft_z(bm, [(0.295, 0.28), (0.41, 0.25), (0.50, 0.17), (0.555, 0.08), (0.57, 0.012)],
           0.05, 8, ROT8)
    # 4 ridge spikes (shoulder, 45deg family) - FIX 2: cz 0.49 constant
    for a in (45, 135, 225, 315):
        ar = math.radians(a)
        pyramid(bm, 0.05, 0.155 * math.cos(ar), 0.49, 0.02, 0.025, 4, math.radians(45))
    # 4 well bolts (cardinal, on the upper collar) - FIX 3: cy 0.245 cos, cz 0.295
    for a in (0, 90, 180, 270):
        ar = math.radians(a)
        pyramid(bm, 0.05, 0.245 * math.cos(ar), 0.295, 0.012, 0.015, 4, math.radians(45))
    # top boss - FIX 4: apex z 0.58 <= 0.581
    pyramid(bm, 0.05, 0.0, 0.565, 0.04, 0.015, 8, ROT8)

# ---------------------------------------------------------------- I592 v2b rework: embed_pass
def _islands(bm):
    bm.verts.ensure_lookup_table()
    seen = set(); out = []
    for v in bm.verts:
        if v.index in seen:
            continue
        stack = [v]; comp = set()
        while stack:
            u = stack.pop()
            if u.index in comp:
                continue
            comp.add(u.index)
            for e in u.link_edges:
                w = e.other_vert(u)
                if w.index not in comp:
                    stack.append(w)
        seen |= comp; out.append(comp)
    return out

def _tri_count(bm, comp):
    return sum(max(0, len(f.verts) - 2) for f in bm.faces
               if all(v.index in comp for v in f.verts))

def _raycount(hostob, origin, d, maxhits=5):
    o = origin + d * 1e-6
    n = 0
    for _ in range(maxhits):
        hit, loc, nrm, idx = hostob.ray_cast(o, d)
        if not hit:
            return n
        n += 1
        o = loc + d * 1e-4
    return n

def _inside(hostob, p):
    return (_raycount(hostob, p, Vector((0, 0, 1))) % 2 == 1
            and _raycount(hostob, p, Vector((1, 0, 0))) % 2 == 1)

def embed_pass(ob):
    # I592 P-gate rework (frozen design): rigidly settle floating greeble
    # islands into the host hull. Host = islands with >= 55 tris. An island
    # moves only if NO vertex is inside the host solid (ray parity, marching
    # ray_cast) - straddling greebles (partly buried) stay put. Pure
    # translation -> vertex/face/tri counts unchanged. Called after bevel,
    # before bake (bake is position-based).
    bm = bmesh.new(); bm.from_mesh(ob.data)
    islands = _islands(bm)
    host = [c for c in islands if _tri_count(bm, c) >= 55]
    assert host, "EMBED_FAIL %s: no host island (>=55 tris)" % ob.name
    print("EMBED %s islands=%d host=%d host_tris=%s" % (
        ob.name, len(islands), len(host),
        sorted((_tri_count(bm, c) for c in host), reverse=True)), flush=True)
    host_set = set()
    for c in host:
        host_set |= c
    hverts = [bv for bv in bm.verts if bv.index in host_set]
    hv_co = [bv.co[:] for bv in hverts]
    vmap = {bv.index: i for i, bv in enumerate(hverts)}
    hf = [tuple(vmap[v.index] for v in f.verts) for f in bm.faces
          if all(v.index in host_set for v in f.verts)]
    tmp_me = bpy.data.meshes.new(ob.name + "_hosttmp")
    tmp_me.from_pydata(hv_co, [], hf)
    tmp_me.update()
    hostob = bpy.data.objects.new(ob.name + "_hosttmp", tmp_me)
    if ob.users_collection:
        next(iter(ob.users_collection)).objects.link(hostob)
    else:
        bpy.context.scene.collection.objects.link(hostob)
    bpy.context.view_layer.update()
    xs = [c[0] for c in hv_co]; ys = [c[1] for c in hv_co]; zs = [c[2] for c in hv_co]
    center = Vector(((min(xs) + max(xs)) / 2.0, (min(ys) + max(ys)) / 2.0,
                     (min(zs) + max(zs)) / 2.0))
    ext_pt = center + Vector((5.0, 5.0, 5.0))
    c_in = _inside(hostob, center)
    e_out = not _inside(hostob, ext_pt)
    ray_ok = c_in and e_out
    print("EMBED %s ray_cast validation %s (center inside=%s ext outside=%s)" % (
        ob.name, "PASS" if ray_ok else "FAIL -> wireframe fallback", c_in, e_out), flush=True)
    host_vs = [bv.co.copy() for bv in hverts]
    host_es = []
    bm.edges.ensure_lookup_table()
    for e in bm.edges:
        a, b = e.verts
        if a.index in host_set and b.index in host_set:
            host_es.append((a.co.copy(), b.co.copy()))
    n_v0 = len(bm.verts); n_f0 = len(bm.faces)
    moved = 0
    for comp in islands:
        if any(comp == c for c in host):
            continue
        if ray_ok and any(_inside(hostob, bv.co) for bv in bm.verts if bv.index in comp):
            print("EMBED %s island%3d verts=%d tris=%d BURIED - no move" % (
                ob.name, min(comp), len(comp), _tri_count(bm, comp)), flush=True)
            continue
        best = 1e9; bp = None; bq = None
        for bv in bm.verts:
            if bv.index not in comp:
                continue
            p = bv.co
            for a in host_vs:
                d = (p - a).length
                if d < best:
                    best = d; bp = p.copy(); bq = a
            for (a, b) in host_es:
                ab = b - a; l2 = ab.length_squared
                t = 0.0 if l2 < 1e-12 else max(0.0, min(1.0, (p - a).dot(ab) / l2))
                q = a + ab * t
                d = (p - q).length
                if d < best:
                    best = d; bp = p.copy(); bq = q
        if best <= 0.004:
            print("EMBED %s island%3d verts=%d tris=%d TOUCH d=%.4f - no move" % (
                ob.name, min(comp), len(comp), _tri_count(bm, comp), best), flush=True)
            continue
        shift = (best + 0.004) * ((bq - bp) / best)
        for bv in bm.verts:
            if bv.index in comp:
                bv.co = bv.co + shift
        moved += 1
        print("EMBED %s island%3d verts=%d tris=%d FLOAT d=%.4f shift=(%.4f, %.4f, %.4f)" % (
            ob.name, min(comp), len(comp), _tri_count(bm, comp), best,
            shift.x, shift.y, shift.z), flush=True)
    bm.normal_update()
    nm, deg, bnd = _chk(bm)
    assert nm == 0, "EMBED_FAIL %s: non-manifold after embed" % ob.name
    assert bnd == 0, "EMBED_FAIL %s: boundary after embed" % ob.name
    assert len(bm.verts) == n_v0 and len(bm.faces) == n_f0, "EMBED_FAIL %s: topology changed" % ob.name
    bm.to_mesh(ob.data); bm.free(); ob.data.update()
    bpy.data.objects.remove(hostob, do_unlink=True)
    bpy.data.meshes.remove(tmp_me)
    print("EMBED %s moved=%d of %d greeble islands" % (
        ob.name, moved, len(islands) - len(host)), flush=True)
def main():
    purge()
    body = newmesh("VR_Flyer_Body")
    bm = bmesh.new()
    body_parts(bm)
    body_fins(bm)
    body_greeble(bm)
    bm.to_mesh(body.data); bm.free(); body.data.update()
    cleanup(body)
    triangulate_recalc(body)
    t0 = tris_of(body)
    print("PART VR_Flyer_Body tris(raw)", t0, "verts", len(body.data.vertices))
    k, tn = pick_k(body, BODY_AIM, BODY_HARD)
    bevel_ob(body, k, 40.0)
    tb = tris_of(body)
    print("PART VR_Flyer_Body tris(after bevel)", tb, "verts", len(body.data.vertices))
    assert tb <= BODY_HARD, "CAP_FAIL VR_Flyer_Body %d > %d" % (tb, BODY_HARD)
    assert tb >= BODY_AIM, "AIM_FAIL VR_Flyer_Body %d < %d" % (tb, BODY_AIM)
    embed_pass(body)
    fbh = bake(body, K_BODY)
    print("FACET body p10", round(fbh['p10'], 4), "p50", round(fbh['p50'], 4),
          "p90", round(fbh['p90'], 4), "spread", round(fbh['spread'], 4))
    assert fbh['spread'] >= 0.30, "body bake spread < 0.30"

    dome = newmesh("VR_Flyer_Dome")
    bm = bmesh.new()
    dome_parts(bm)
    bm.to_mesh(dome.data); bm.free(); dome.data.update()
    cleanup(dome)
    triangulate_recalc(dome)
    td = tris_of(dome)
    print("PART VR_Flyer_Dome tris", td, "verts", len(dome.data.vertices))
    assert DOME_AIM <= td <= DOME_HARD, "DOME_FAIL %d not in [%d, %d]" % (td, DOME_AIM, DOME_HARD)
    fbd = bake(dome, 0.0, flat=K_DOME)
    print("FACET dome p50", round(fbd['p50'], 4), "(flat)")

    body.data.materials.append(newmat("VR_Flyer_Body", (0x7d/255, 0x68/255, 0x78/255)))
    dome.data.materials.append(newmat("VR_Flyer_Dome", (0x0a/255, 0x0f/255, 0x18/255)))
    finish(body); finish(dome)

    allv = [v.co for v in body.data.vertices] + [v.co for v in dome.data.vertices]
    xs = [c.x for c in allv]; ys = [c.y for c in allv]; zs = [c.z for c in allv]
    print("BUILD extent x", round(min(xs), 4), round(max(xs), 4))
    print("BUILD extent y", round(min(ys), 4), round(max(ys), 4))
    print("BUILD extent z", round(min(zs), 4), round(max(zs), 4))
    assert min(xs) >= -1.251 and max(xs) <= 1.301, "x band broken"
    assert min(ys) >= -1.051 and max(ys) <= 1.051, "y band broken"
    assert min(zs) >= -0.358 and max(zs) <= 0.581, "z band broken"
    assert max(xs) - min(xs) > 2.54, "M too small"

    out = EVID + "flyer_v2.glb"
    for o in (body, dome):
        o.select_set(True)
    bpy.context.view_layer.objects.active = body
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
    bpy.ops.wm.save_as_mainfile(filepath=EVID + "flyer_v2.blend")
    print("ALL_DONE")

main()