import bpy, bmesh, math, os
from mathutils import Matrix, Vector

# I592 (ST-559, E84): stinger v2 "canard missile dart" - the remaster of the I508
# legacy-4 needle (1,572 t body + 160 t core, sil96 0.0231 = the 1px-line read, F3).
# Character per design/e84-enemy-remaster-research.md section 4 (FINAL):
#   longest L/W in the fleet, FORWARD CANARDS, inline nose-spike glow (NO ball nose),
#   reads as a pointed needle at 96 px. Contrast slot F7: long dart (missile).
# Two nodes: VR_Stinger_Body + VR_Stinger_Core (bit-identical names, I508 contract).
# Build space: +X forward, +Z up, +Y lateral (export_yup -> game +X fwd / +Y up).
# Placement invariants (measured I592 probe_legacy592.py on the I508 legacy GLB):
#   body bbox x [-1.67, 2.05]; core local x [1.93, 2.35] (nose spike, r 0.085);
#   union M = 4.02 (x -1.67..2.35) - keeps the S1-R2 box-math ceiling 0.0281-0.0286.
# Frozen contract: per-node tri (body AIM 1820 / HARD 2260; core AIM 180 / HARD 240);
# GATE-OVERRIDE-E84-S1-R2 sil96 [0.024, 0.028] (measured at the audit step, applied
# WITH MEASUREMENT first build - gate_divergence591.md); GLB <= 150,000 B target /
# 200,000 B hard; fleet bake L = (-0.45, -0.55, 0.70).normalized(); export flags
# verbatim per production/scope-check-E84.md.
# I592-r2 (this script) fixes the r1 plan flaws found pre-run:
#   (1) r1 loft_x built rings in the XY plane (flat ribbon, zero z thickness) -
#       the legacy bug that made the F3 "1px line" read; r2 lofts in YZ (ring_ell).
#   (2) r1 main() ran a second to_mesh after the fins, REPLACING the fuselage;
#       r2 builds the whole body in ONE bmesh.
#   (3) r1 barrel r 0.185-0.545 flat + greebles buried inside the barrel surface;
#       r2 = solid elliptical 12-gon barrel (ry max 0.52 / rz max 0.575, zc 0.05
#       the frozen box center) sized for the S1-R2 85-95% solid-box fill class,
#       with every greeble straddling the surface.
# v2b (I592 rework): Fix B embed_pass - rigidly settle floating greeble islands into the host hull (post-bevel, pre-bake). See p1gate592.md.
EVID = "E:/Game/.evidence/I592/"
L = Vector((-0.45, -0.55, 0.70)).normalized()   # fleet-standard bake light (frozen)
K_BODY = 0.55
K_CORE = 0.94            # flat high bake for the emissive slot (I508: 0.94)
BODY_AIM, BODY_HARD = 1820, 2260
CORE_AIM, CORE_HARD = 180, 240
BEVEL_OFF = 0.015
K_LADDER = [2.5, 3.0, 4.0, 5.0, 6.0, 8.0, 10.0, 12.0, 16.0, 20.0, 24.0]
ZC = 0.05                # barrel centerline z (frozen box z center)
ROT = math.radians(15)   # 12-gon rot: facet centers at 0/30/60.., vertices at 45deg family

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
    # ellipse ring in the YZ plane at x, centered (cy, cz) - the REAL 3D barrel ring
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

def ring_band_ell(bm, xc, roy_o, roz_o, roy_i, roz_i, hw, sides, rot, zc, bottom=True):
    # raised elliptical band: outer wall + top annulus (+ bottom annulus);
    # no inner wall (buried in the barrel)
    ob = ring_ell(bm, xc - hw, roy_o, roz_o, sides, rot, zc)
    ib = ring_ell(bm, xc - hw, roy_i, roz_i, sides, rot, zc)
    ot = ring_ell(bm, xc + hw, roy_o, roz_o, sides, rot, zc)
    it = ring_ell(bm, xc + hw, roy_i, roz_i, sides, rot, zc)
    for i in range(sides):
        j = (i + 1) % sides
        bm.faces.new((ob[i], ob[j], ot[j], ot[i]))
        bm.faces.new((ot[i], ot[j], it[j], it[i]))
        if bottom:
            bm.faces.new((ob[i], ib[i], ib[j], ob[j]))
        bm.faces.new((ib[i], ib[j], it[j], it[i]))

def nozzle(bm, cx, rcy, rcz, a_deg, w=0.06, r_root=0.055, r_tip=0.040):
    # 8-gon faceted exhaust nozzle tube at (cx, rcy, rcz)
    a = math.radians(a_deg)
    r0 = ring_ell(bm, cx - w / 2, r_root, r_root, 8, a, rcz, rcy)
    r1 = ring_ell(bm, cx, r_root - 0.006, r_root - 0.006, 8, a, rcz, rcy)
    r2 = ring_ell(bm, cx + w / 2, r_tip, r_tip, 8, a, rcz, rcy)
    for i in range(8):
        j = (i + 1) % 8
        bm.faces.new((r0[i], r0[j], r1[j], r1[i]))
        bm.faces.new((r1[i], r1[j], r2[j], r2[i]))
    bm.faces.new(list(reversed(r2)))
    bm.faces.new(r0)

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
def body_parts(bm):
    # 1 fuselage: solid elliptical 12-gon missile barrel, needle apex at x 2.05
    loft_ell(bm, [(-1.67, 0.30, 0.34), (-1.50, 0.42, 0.46), (-1.10, 0.50, 0.54),
                  (-0.50, 0.53, 0.57), (0.20, 0.52, 0.575), (0.80, 0.50, 0.53),
                  (1.30, 0.38, 0.42), (1.60, 0.22, 0.25), (1.85, 0.10, 0.11),
                  (2.05, 0.012, 0.014)], 12, ROT, ZC)
    # 2 raised nose band (elliptical ring at x 1.30)
    ring_band_ell(bm, 1.30, 0.40, 0.45, 0.35, 0.39, 0.035, 12, ROT, ZC)
    # 3 raised tail band (elliptical ring at x -1.50)
    ring_band_ell(bm, -1.50, 0.45, 0.50, 0.40, 0.44, 0.035, 12, ROT, ZC)
    # 4 six exhaust nozzles (ring at x -1.58, facet centers)
    for a in (0, 60, 120, 180, 240, 300):
        ar = math.radians(a)
        nozzle(bm, -1.58, 0.40 * math.cos(ar), ZC + 0.44 * math.sin(ar), a)

def body_fins(bm):
    # 4 tail fins (swept-forward tips): top to z 0.638, bottom to -0.5379,
    # sides to y +/-0.5395 (y-span invariant)
    wedge_y(bm, [(-1.67, 0.10), (-1.67, 0.40), (-1.00, 0.638), (-1.00, 0.30)], 0.045)   # top
    wedge_y(bm, [(-1.67, -0.10), (-1.67, -0.36), (-1.00, -0.5379), (-1.00, -0.26)], 0.045)  # bottom
    wedge_z(bm, [(-1.67, 0.10), (-1.67, 0.32), (-1.00, 0.5395), (-1.00, 0.24)], 0.045)   # +y
    wedge_z(bm, [(-1.67, -0.10), (-1.67, -0.32), (-1.00, -0.5395), (-1.00, -0.24)], 0.045)  # -y
    # dorsal blade (x -0.95..0.90, top to 0.638) + ventral keel (bottom to -0.5379)
    wedge_y(bm, [(-0.95, 0.26), (0.90, 0.638), (0.90, 0.44), (-0.95, 0.30)], 0.05)
    wedge_y(bm, [(-0.50, -0.34), (0.80, -0.5379), (0.80, -0.40), (-0.50, -0.28)], 0.045)
    # 4 forward canards (cross cluster: the v2 character vs the legacy tail-only read)
    # 5-pt planforms with embedded roots on the fat barrel
    wedge_z(bm, [(1.05, 0.25), (1.55, 0.34), (1.80, 0.5395), (1.70, 0.44), (1.15, 0.30)], 0.035)   # +y
    wedge_z(bm, [(1.05, -0.25), (1.55, -0.34), (1.80, -0.5395), (1.70, -0.44), (1.15, -0.30)], 0.035)  # -y
    wedge_y(bm, [(1.05, 0.35), (1.45, 0.42), (1.68, 0.56), (1.56, 0.46), (1.15, 0.38)], 0.035)     # top
    wedge_y(bm, [(1.15, -0.16), (1.45, -0.22), (1.68, -0.42), (1.56, -0.36), (1.30, -0.30)], 0.035)  # bottom

def body_greeble(bm):
    # 2 flank panel ridges (mid barrel, straddling the y surface)
    box(bm, 0.0, 0.51, ZC, 0.30, 0.025, 0.09)
    box(bm, 0.0, -0.51, ZC, 0.30, 0.025, 0.09)
    # 2 spine/belly panels (straddling the z surface)
    box(bm, -0.10, 0.0, ZC + 0.55, 0.28, 0.10, 0.035)
    box(bm, -0.10, 0.0, ZC - 0.55, 0.28, 0.10, 0.035)
    # 2 nose sensor blades
    pyramid(bm, 1.55, 0.27, ZC, 0.05, 0.03, 4, math.radians(45))
    pyramid(bm, 1.55, -0.27, ZC, 0.05, 0.03, 4, math.radians(45))
    # 6 nose rivets (sides + diagonals)
    for a in (0, 45, 135, 180, 225, 315):
        ar = math.radians(a)
        pyramid(bm, 1.78, 0.175 * math.cos(ar), ZC + 0.175 * math.sin(ar), 0.025, 0.02, 4, math.radians(45))
    # 4 canard root fairings (straddle the barrel at the canard roots)
    box(bm, 1.10, 0.44, ZC, 0.06, 0.05, 0.05)
    box(bm, 1.10, -0.44, ZC, 0.06, 0.05, 0.05)
    box(bm, 1.12, 0.0, ZC + 0.48, 0.06, 0.05, 0.05)
    box(bm, 1.12, 0.0, ZC - 0.42, 0.06, 0.05, 0.05)
    # 4 tail band brackets (straddle the tail ring at 45deg family)
    for a in (45, 135, 225, 315):
        ar = math.radians(a)
        box(bm, -1.50, 0.44 * math.cos(ar), ZC + 0.49 * math.sin(ar), 0.05, 0.04, 0.04)
    # 2 belly strakes (long thin boxes under the fuselage at y +/-0.20)
    box(bm, -0.20, 0.20, ZC - 0.53, 0.35, 0.03, 0.03)
    box(bm, -0.20, -0.20, ZC - 0.53, 0.35, 0.03, 0.03)

# ---------------------------------------------------------------- core
def core_parts(bm):
    # faceted glow spike, placement invariant x [1.93, 2.35]
    loft_xy(bm, [(1.93, 0.050), (1.99, 0.085), (2.12, 0.078), (2.26, 0.048), (2.345, 0.012)], 8, math.radians(22.5))
    # collar ring (8-gon at x 1.945..1.975, r 0.105 outer / 0.052 inner)
    ring_band_core(bm, 1.96, 0.105, 0.052, 0.015, 8, math.radians(22.5), bottom=True)
    # 2 step bumps (solid 6-gon prisms straddling the spike surface)
    loft_xy(bm, [(2.035, 0.100), (2.065, 0.100)], 6, math.radians(30))
    loft_xy(bm, [(2.185, 0.076), (2.215, 0.076)], 6, math.radians(30))
    # 4 ridge gems (radial-out pyramids straddling the spike at x 2.14)
    for a in (45, 135, 225, 315):
        ridge_gem(bm, 2.14, 0.062, a)

def loft_xy(bm, stations, sides, rot):
    rings = []
    for (x, r) in stations:
        rings.append(ring_ell(bm, x, r, r, sides, rot, 0.0))   # YZ-plane ring (XY was the legacy flat-ribbon bug)
    for i in range(len(rings) - 1):
        b, t = rings[i], rings[i + 1]
        for k in range(sides):
            j = (k + 1) % sides
            bm.faces.new((b[k], b[j], t[j], t[k]))
    bm.faces.new(list(reversed(rings[0])))
    bm.faces.new(rings[-1])

def ring_band_core(bm, xc, r_out, r_in, hw, sides, rot, bottom):
    ob = ring_ell(bm, xc - hw, r_out, r_out, sides, rot, 0.0)
    ib = ring_ell(bm, xc - hw, r_in, r_in, sides, rot, 0.0)
    ot = ring_ell(bm, xc + hw, r_out, r_out, sides, rot, 0.0)
    it = ring_ell(bm, xc + hw, r_in, r_in, sides, rot, 0.0)
    for i in range(sides):
        j = (i + 1) % sides
        bm.faces.new((ob[i], ob[j], ot[j], ot[i]))
        bm.faces.new((ot[i], ot[j], it[j], it[i]))
        if bottom:
            bm.faces.new((ob[i], ib[i], ib[j], ob[j]))
        bm.faces.new((ib[i], ib[j], it[j], it[i]))

def ridge_gem(bm, x, d, a_deg, r_b=0.016, h=0.022):
    # small 4-sided gem: base buried in the spike, apex radial-out
    n0 = len(bm.verts)
    pyramid(bm, 0.0, 0.0, 0.0, r_b, h, 4, math.radians(45))
    th = math.radians(a_deg)
    M = (Matrix.Translation((x, d * math.cos(th), d * math.sin(th)))
         @ Matrix.Rotation(math.radians(a_deg - 90.0), 4, 'X'))
    for v in bm.verts[n0:]:
        v.co = M @ v.co

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
    body = newmesh("VR_Stinger_Body")
    bm = bmesh.new()
    body_parts(bm)
    body_fins(bm)
    body_greeble(bm)
    bm.to_mesh(body.data); bm.free(); body.data.update()
    cleanup(body)
    triangulate_recalc(body)
    t0 = tris_of(body)
    print("PART VR_Stinger_Body tris(raw)", t0, "verts", len(body.data.vertices))
    k, tn = pick_k(body, BODY_AIM, BODY_HARD)
    bevel_ob(body, k, 40.0)
    tb = tris_of(body)
    print("PART VR_Stinger_Body tris(after bevel)", tb, "verts", len(body.data.vertices))
    assert tb <= BODY_HARD, "CAP_FAIL VR_Stinger_Body %d > %d" % (tb, BODY_HARD)
    assert tb >= BODY_AIM, "AIM_FAIL VR_Stinger_Body %d < %d" % (tb, BODY_AIM)
    embed_pass(body)
    fbh = bake(body, K_BODY)
    print("FACET body p10", round(fbh['p10'], 4), "p50", round(fbh['p50'], 4),
          "p90", round(fbh['p90'], 4), "spread", round(fbh['spread'], 4))
    assert fbh['spread'] >= 0.30, "body bake spread < 0.30"

    core = newmesh("VR_Stinger_Core")
    bm = bmesh.new()
    core_parts(bm)
    bm.to_mesh(core.data); bm.free(); core.data.update()
    cleanup(core)
    triangulate_recalc(core)
    tc = tris_of(core)
    print("PART VR_Stinger_Core tris", tc, "verts", len(core.data.vertices))
    assert CORE_AIM <= tc <= CORE_HARD, "CORE_FAIL %d not in [%d, %d]" % (tc, CORE_AIM, CORE_HARD)
    embed_pass(core)
    fbc = bake(core, 0.0, flat=K_CORE)
    print("FACET core p50", round(fbc['p50'], 4), "(flat)")

    body.data.materials.append(newmat("VR_Stinger_Body", (0x54/255, 0x68/255, 0x8a/255)))
    core.data.materials.append(newmat("VR_Stinger_Core", (0x0a/255, 0x0f/255, 0x18/255)))
    finish(body); finish(core)

    allv = [v.co for v in body.data.vertices] + [v.co for v in core.data.vertices]
    xs = [c.x for c in allv]; ys = [c.y for c in allv]; zs = [c.z for c in allv]
    print("BUILD extent x", round(min(xs), 4), round(max(xs), 4))
    print("BUILD extent y", round(min(ys), 4), round(max(ys), 4))
    print("BUILD extent z", round(min(zs), 4), round(max(zs), 4))
    assert min(xs) >= -1.671 and max(xs) <= 2.351, "x band broken"
    assert min(ys) >= -0.540 and max(ys) <= 0.540, "y band broken"
    assert min(zs) >= -0.539 and max(zs) <= 0.639, "z band broken"
    assert max(xs) - min(xs) > 3.99, "M too small"

    out = EVID + "stinger_v2.glb"
    for o in (body, core):
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
    bpy.ops.wm.save_as_mainfile(filepath=EVID + "stinger_v2.blend")
    print("ALL_DONE")

main()