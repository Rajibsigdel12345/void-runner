import bpy, bmesh, math, os
from mathutils import Vector, Matrix

# I591 (ST-558, E84): warden v3 "solid turret bulwark" - the I591 rework of the
# v2 scattered-slab read (P-gate defect: scattered slabs, not a bulwark).
# Two nodes: VR_Warden_Hull + VR_Warden_Armor (bit-identical names).
# Build space: +X span, +Y forward (nose/faceplate +Y), +Z up. Both objects
# centered at the origin (in-code armor scale-retracts around origin - the
# armor-origin contract in gate_divergence591.md: z-symmetric mid-hull plates).
# Frozen contract: production/scope-check-E84.md + design brief S4.1 (hull AIM
# 1250 / HARD 1550; armor AIM 750 / HARD 950) + GATE-OVERRIDE-E84-S2-R2
# (sil96 [0.018, 0.026] center 0.022, measured in the audit step) + GLB <=
# 150,000 B target / 200,000 B hard + extent bands (union): span_x 4.65-4.95,
# length_y 3.9-4.6, height_z 1.4-2.0.
#
# Implementation clarifications vs the hand-verified plan (all frozen params -
# positions, radial outer, z-symmetry, feature count, budgets, extent bands -
# preserved; each plan feature that would have been buried in the solid hull or
# z-fighting-coincident was repositioned so it is actually visible):
# - hull wall ribs r 1.98 -> 2.04 (plan r 1.98 outer face 2.02 < hex flat 2.0565 = buried)
# - hull wall vents r 2.02 -> 2.05 (same burial; outer 2.08, +0.024 past the flat)
# - forward skids zc -0.68 -> -0.65 (plan z -0.78 would break the verified min z -0.75)
# - deck bolts split r 2.05 (vertex angles) / 1.80 (flat centers): plan's single
#   r 2.05 at flat-center angles floats 0.19 off the deck edge (deck flat 1.86)
# - turret bolts at k*60 (vertex angles), not k*60+30 (plan angles sit 0.037 off
#   the turret base flat 1.0826)
# - armor slab: plan's faceplate was z-fighting-coincident with the core outer
#   face (both 2.28) and its inner panel + 4 nubs were fully buried in the solid
#   core/hull. Repositioned, same 11 boxes: core hr 0.20 (outer 2.23) + faceplate
#   2.18-2.28 (raised +0.05) + cap lips + side fins at toff +/-0.44 + 4 corner
#   brackets at (2.24, +/-0.42, +/-0.26) + center boss diamond (2.23, 45deg).
#   Outer reach 2.3007 -> protrusion 0.2442 <= 0.25 past the hex flat 2.0565.
EVID = "E:/Game/.evidence/I591/"
L = Vector((-0.45, -0.55, 0.70)).normalized()   # fleet-standard bake light (frozen)
K_HULL = 0.55
K_ARMOR = 0.70
HULL_AIM, HULL_HARD = 1250, 1550
ARM_AIM, ARM_HARD = 750, 950

BEVEL_OFF = 0.015

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
    o = [o[0], o[1], o[2], o[3], o[4], o[5], o[6], o[7]]
    for f in _boxfaces(o):
        bm.faces.new((o[a] for a in f))

def box_zrot(bm, cx, cy, cz, hr, ht, hz, ang):
    ca, sa = math.cos(ang), math.sin(ang)
    vs = []
    for dz in (-hz, hz):
        for dy in (-ht, ht):
            for dx in (-hr, hr):
                x = cx + dx * ca - dy * sa
                y = cy + dx * sa + dy * ca
                vs.append(bm.verts.new((x, y, cz + dz)))
    order = [0, 1, 2, 3, 4, 5, 6, 7]
    for f in _boxfaces(order):
        bm.faces.new((vs[a] for a in f))

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

def ngon(bm, cx, cy, cz, r, sides, rot):
    vs = []
    for i in range(sides):
        a = rot + 2 * math.pi * i / sides
        vs.append(bm.verts.new((cx + r * math.cos(a), cy + r * math.sin(a), cz)))
    return vs

def prism(bm, cx, cy, cz0, cz1, r, sides, rot):
    b = ngon(bm, cx, cy, cz0, r, sides, rot)
    t = ngon(bm, cx, cy, cz1, r, sides, rot)
    for i in range(sides):
        j = (i + 1) % sides
        bm.faces.new((b[i], b[j], t[j], t[i]))
    bm.faces.new(list(reversed(b)))
    bm.faces.new(t)

def ngon_y(bm, cx, cz, y, r, sides, rot):
    vs = []
    for i in range(sides):
        a = rot + 2 * math.pi * i / sides
        vs.append(bm.verts.new((cx + r * math.cos(a), y, cz + r * math.sin(a))))
    return vs

def prism_y(bm, cx, cz, y0, y1, r, sides, rot):
    b = ngon_y(bm, cx, cz, y0, r, sides, rot)
    t = ngon_y(bm, cx, cz, y1, r, sides, rot)
    for i in range(sides):
        j = (i + 1) % sides
        bm.faces.new((b[i], b[j], t[j], t[i]))
    bm.faces.new(list(reversed(b)))
    bm.faces.new(t)

def ring_y(bm, cx, cz, y0, y1, r0, r1, sides, rot):
    bo = ngon_y(bm, cx, cz, y0, r0, sides, rot)
    bi = ngon_y(bm, cx, cz, y0, r1, sides, rot)
    to = ngon_y(bm, cx, cz, y1, r0, sides, rot)
    ti = ngon_y(bm, cx, cz, y1, r1, sides, rot)
    for i in range(sides):
        j = (i + 1) % sides
        bm.faces.new((bo[i], bo[j], to[j], to[i]))
        bm.faces.new((bi[i], ti[i], ti[j], bi[j]))
        bm.faces.new((bo[i], bi[i], bi[j], bo[j]))
        bm.faces.new((to[i], to[j], ti[j], ti[i]))

def ring_xy(bm, cx, cy, z0, z1, r0, r1, sides, rot):
    # annular band between two N-gons in the XY plane (closed tube section)
    bo = ngon(bm, cx, cy, z0, r0, sides, rot)
    bi = ngon(bm, cx, cy, z0, r1, sides, rot)
    to = ngon(bm, cx, cy, z1, r0, sides, rot)
    ti = ngon(bm, cx, cy, z1, r1, sides, rot)
    for i in range(sides):
        j = (i + 1) % sides
        bm.faces.new((bo[i], bo[j], to[j], to[i]))
        bm.faces.new((bi[i], ti[i], ti[j], bi[j]))
        bm.faces.new((bo[i], bi[i], bi[j], bo[j]))
        bm.faces.new((to[i], to[j], ti[j], ti[i]))

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

def bevel_ob(ob, offset=0.015, ang=40.0, minlen_k=3.0):
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
                if e.calc_length() >= offset * minlen_k:
                    es.append(e)
    bmesh.ops.bevel(bm, geom=es, offset=offset, offset_type="OFFSET", segments=1, profile=0.7,
                    affect="EDGES", clamp_overlap=True)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    nm, deg, bnd = _chk(bm)
    print("BEVEL", ob.name, "sel", len(es), "bnd", bnd, "nm", nm, "degen", deg)
    assert nm == 0, "bevel produced non-manifold edges"
    bm.to_mesh(ob.data); bm.free(); ob.data.update()

def bake(ob, k, lens_c=None, lens_r=0.20, belly_z=-0.45):
    me = ob.data
    attr = me.color_attributes.new(name="Color", type='FLOAT_COLOR', domain='POINT')
    vals = []
    for v in me.vertices:
        val = clamp(1.0 + k * v.normal.dot(L), 0.30, 1.55)
        if lens_c is not None and (v.co - lens_c).length < lens_r:
            val = clamp(val * 1.30, 0.30, 1.55)
        if v.co.z < belly_z:
            val = clamp(val * 0.86, 0.30, 1.55)
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

# ---------------------------------------------------------------- hull
def hull_parts(bm):
    # 1 base hex slab (circumradius 2.375 -> span_x 4.75; flats at 2.0565)
    prism(bm, 0, 0, -0.75, 0.55, 2.375, 6, 0.0)
    # 2 raised deck hex (buried 0.005 in the slab top)
    prism(bm, 0, 0, 0.545, 0.72, 2.15, 6, 0.0)
    # 3 parapet ring (inner 2.00 buried in the deck edge, outer 2.20; bottom buried 0.005 in the deck)
    ring_xy(bm, 0, 0, 0.715, 0.88, 2.20, 2.00, 6, 0.0)
    # 4 turret base hex
    prism(bm, 0, 0, 0.715, 0.88, 1.25, 6, 0.0)
    # 5 dome loft (3 tiers + cap; bottom cap buried in the turret base)
    r0 = ngon(bm, 0, 0, 0.88, 0.88, 6, 0.0)
    r1 = ngon(bm, 0, 0, 1.10, 0.55, 6, 0.0)
    r2 = ngon(bm, 0, 0, 1.22, 0.24, 6, 0.0)
    for i in range(6):
        j = (i + 1) % 6
        bm.faces.new((r0[i], r0[j], r1[j], r1[i]))
        bm.faces.new((r1[i], r1[j], r2[j], r2[i]))
    bm.faces.new(list(reversed(r2)))
    bm.faces.new(r0)
    # 6 front faceplate (8-gon, z 0.42..1.02, y 1.95..2.20; base buried 0.106 in the slab flat)
    prism_y(bm, 0, 0.72, 1.95, 2.20, 0.30, 8, math.pi / 8)
    # 7 bridge arm (turret front y 1.0826 -> faceplate; closes the plan's floating-faceplate gap)
    box(bm, 0, 1.45, 0.72, 0.16, 0.55, 0.10)
    # 8 lens frame (8-gon ring, front at y 2.26 = hull max y)
    ring_y(bm, 0, 0.72, 2.19, 2.26, 0.24, 0.17, 8, math.pi / 8)
    # 9 lens pyramid (base recessed inside the frame, apex at y 2.245)
    base = ngon_y(bm, 0, 0.72, 2.205, 0.14, 8, math.pi / 8)
    apex = bm.verts.new((0, 2.245, 0.72))
    for i in range(8):
        j = (i + 1) % 8
        bm.faces.new((base[i], base[j], apex))
    bm.faces.new(list(reversed(base)))

def hull_greeble1(bm):
    # 12 deck bolts (6 at vertex angles r 2.05, 6 at flat centers r 1.80 - both on the deck top)
    for k in range(12):
        a = math.radians(k * 30)
        r = 2.05 if k % 2 == 0 else 1.80
        pyramid(bm, r * math.cos(a), r * math.sin(a), 0.72, 0.05, 0.06, 4, math.radians(45))
    # 6 wall ribs on the base slab flats (outer 2.08, +0.024 past the flat 2.0565)
    for deg in (30, 90, 150, 210, 270, 330):
        a = math.radians(deg)
        box_zrot(bm, 2.04 * math.cos(a), 2.04 * math.sin(a), -0.10, 0.04, 0.55, 0.32, a)
    # 6 deck corner pads
    for k in range(6):
        a = math.radians(k * 60)
        box(bm, 1.9 * math.cos(a), 1.9 * math.sin(a), 0.72, 0.06, 0.06, 0.02)
    # 2 raised slab panel rings (r 2.395 -> flats 2.0745, +0.018 past the slab flat)
    prism(bm, 0, 0, -0.30, -0.24, 2.395, 6, 0.0)
    prism(bm, 0, 0, 0.10, 0.16, 2.395, 6, 0.0)
    # 2 forward skids (z -0.75..-0.55 hold the min z; front 2.08, +0.024 past the flat)
    box(bm, 0.45, 1.52, -0.65, 0.12, 0.56, 0.10)
    box(bm, -0.45, 1.52, -0.65, 0.12, 0.56, 0.10)
    # 2 skid end caps
    box(bm, 0.45, 2.05, -0.66, 0.09, 0.05, 0.08)
    box(bm, -0.45, 2.05, -0.66, 0.09, 0.05, 0.08)
    # rear engine stub (protrudes 0.103 past the rear flat -2.0565)
    box(bm, 0.0, -2.02, -0.10, 0.30, 0.14, 0.24)
    # 2 engine ports
    box(bm, 0.15, -2.17, -0.10, 0.09, 0.04, 0.13)
    box(bm, -0.15, -2.17, -0.10, 0.09, 0.04, 0.13)
    # 6 turret bolts (vertex angles, on the turret base top r 1.25)
    for k in range(6):
        a = math.radians(k * 60)
        pyramid(bm, 1.12 * math.cos(a), 1.12 * math.sin(a), 0.88, 0.04, 0.06, 4, math.radians(45))
    # 2 deck sensor blades
    pyramid(bm, 0.55, 1.35, 0.72, 0.06, 0.10, 4, math.radians(45))
    pyramid(bm, -0.55, 1.35, 0.72, 0.06, 0.10, 4, math.radians(45))

def hull_greeble2(bm):
    # 12 wall vents, 2 per slab flat (outer 2.08, +0.024 past the flat; above the ribs)
    for fc in (30, 90, 150, 210, 270, 330):
        for off in (-6, 6):
            a = math.radians(fc + off)
            box_zrot(bm, 2.05 * math.cos(a), 2.05 * math.sin(a), 0.25, 0.03, 0.30, 0.03, a)
    # 6 parapet bolts (ring top z 0.88, ring mid-radius 2.10)
    for k in range(6):
        a = math.radians(k * 60 + 30)
        pyramid(bm, 2.10 * math.cos(a), 2.10 * math.sin(a), 0.88, 0.04, 0.05, 4, math.radians(45))
    # 4 dome struts (45deg offsets; inner buried in the dome, outer +0.074 past the face)
    for deg in (45, 135, 225, 315):
        a = math.radians(deg)
        box_zrot(bm, 0.70 * math.cos(a), 0.70 * math.sin(a), 1.00, 0.05, 0.04, 0.10, a)

# ---------------------------------------------------------------- armor
def armor_slab(bm, adeg):
    a = math.radians(adeg)
    d = Vector((math.cos(a), math.sin(a), 0))
    t = Vector((-math.sin(a), math.cos(a), 0))
    def P(r, toff, z, hr, ht, hz, angoff=0.0):
        box_zrot(bm, (r * d + toff * t).x, (r * d + toff * t).y, z, hr, ht, hz, a + angoff)
    P(2.03, 0.0, 0.0, 0.20, 0.45, 0.275)          # core wall (1.83-2.23; inner buried in the slab)
    P(2.23, 0.0, 0.0, 0.05, 0.40, 0.24)           # outer faceplate (2.18-2.28, raised +0.05)
    P(2.03, 0.0, 0.30, 0.22, 0.42, 0.045)         # top cap lip
    P(2.03, 0.0, -0.30, 0.22, 0.42, 0.045)        # bottom cap lip
    P(2.03, -0.44, 0.0, 0.21, 0.06, 0.22)         # side fin L (tab past the core edge)
    P(2.03, 0.44, 0.0, 0.21, 0.06, 0.22)          # side fin R
    for toff in (-0.42, 0.42):                    # 4 corner brackets (diamond)
        for z in (-0.26, 0.26):
            P(2.24, toff, z, 0.06, 0.06, 0.06, math.radians(45))
    P(2.23, 0.0, 0.0, 0.05, 0.05, 0.10, math.radians(45))  # center boss diamond

def armor_parts(bm):
    for ad in (30, 150, 270):
        armor_slab(bm, ad)

def main():
    purge()
    hull = newmesh("VR_Warden_Hull")
    bm = bmesh.new()
    hull_parts(bm)
    hull_greeble1(bm)
    hull_greeble2(bm)
    bm.to_mesh(hull.data); bm.free(); hull.data.update()
    cleanup(hull)
    triangulate_recalc(hull)
    th = tris_of(hull)
    print("PART VR_Warden_Hull tris", th, "verts", len(hull.data.vertices))
    bm = bmesh.new(); bm.from_mesh(hull.data); bm.normal_update()
    bm.edges.ensure_lookup_table()
    lb = {}
    for e in bm.edges:
        L = e.calc_length()
        if L < 0.45 or len(e.link_faces) < 2: continue
        a = math.degrees(e.link_faces[0].normal.angle(e.link_faces[1].normal))
        if a <= 52.0: continue
        k = int(L // 0.4) * 10
        lb[k] = lb.get(k, 0) + 1
    print("PROBE lenbands", sorted(lb.items()))
    for lo, hi in ((0.45, 0.85), (0.85, 1.3), (1.3, 99)):
        n = sum(1 for e in bm.edges if lo <= e.calc_length() < hi and len(e.link_faces) == 2
                and math.degrees(e.link_faces[0].normal.angle(e.link_faces[1].normal)) > 52.0)
        print("PROBE count", lo, hi, n)
    raise SystemExit("PROBE_DONE")
    bevel_ob(hull, BEVEL_OFF, 52.0, minlen_k=30.0)
    th = tris_of(hull)
    print("PART VR_Warden_Hull tris(after bevel)", th, "verts", len(hull.data.vertices))
    if th > HULL_HARD:
        raise SystemExit("CAP_FAIL VR_Warden_Hull %d > %d" % (th, HULL_HARD))
    fbh = bake(hull, K_HULL, lens_c=Vector((0, 2.22, 0.72)), lens_r=0.20, belly_z=-0.55)
    print("FACET hull p10", round(fbh['p10'], 4), "p50", round(fbh['p50'], 4),
          "p90", round(fbh['p90'], 4), "spread", round(fbh['spread'], 4))
    assert fbh['spread'] >= 0.30, "hull bake spread < 0.30"
    if th < HULL_AIM:
        raise SystemExit("AIM_FAIL VR_Warden_Hull %d < %d" % (th, HULL_AIM))

    armor = newmesh("VR_Warden_Armor")
    bm = bmesh.new()
    armor_parts(bm)
    bm.to_mesh(armor.data); bm.free(); armor.data.update()
    cleanup(armor)
    triangulate_recalc(armor)
    ta = tris_of(armor)
    print("PART VR_Warden_Armor tris", ta, "verts", len(armor.data.vertices))
    bevel_ob(armor, BEVEL_OFF, 60.0, minlen_k=9.0)
    ta = tris_of(armor)
    print("PART VR_Warden_Armor tris(after bevel)", ta, "verts", len(armor.data.vertices))
    if ta > ARM_HARD:
        raise SystemExit("CAP_FAIL VR_Warden_Armor %d > %d" % (ta, ARM_HARD))
    fba = bake(armor, K_ARMOR, belly_z=-0.15)
    print("FACET armor p10", round(fba['p10'], 4), "p50", round(fba['p50'], 4),
          "p90", round(fba['p90'], 4), "spread", round(fba['spread'], 4))
    assert fba['spread'] >= 0.30, "armor bake spread < 0.30"
    if ta < ARM_AIM:
        raise SystemExit("AIM_FAIL VR_Warden_Armor %d < %d" % (ta, ARM_AIM))

    hull.data.materials.append(newmat("VR_Warden_Hull", (0x2c/255, 0x35/255, 0x48/255)))
    armor.data.materials.append(newmat("VR_Warden_Armor", (0x8f/255, 0xa3/255, 0xc8/255)))
    finish(hull); finish(armor)

    allv = [v.co for v in hull.data.vertices] + [v.co for v in armor.data.vertices]
    xs = [c.x for c in allv]; ys = [c.y for c in allv]; zs = [c.z for c in allv]
    span_x = max(xs) - min(xs); length = max(ys) - min(ys); height = max(zs) - min(zs)
    print("BUILD extent x", round(min(xs), 4), round(max(xs), 4), "span", round(span_x, 4))
    print("BUILD extent y", round(min(ys), 4), round(max(ys), 4), "len", round(length, 4))
    print("BUILD extent z", round(min(zs), 4), round(max(zs), 4), "h", round(height, 4))
    assert 4.65 <= span_x <= 4.95, "span band broken (%.4f)" % span_x
    assert 3.9 <= length <= 4.6, "length band broken (%.4f)" % length
    assert 1.4 <= height <= 2.0, "height band broken (%.4f)" % height

    out = EVID + "warden_v2.glb"
    for o in (hull, armor):
        o.select_set(True)
    bpy.context.view_layer.objects.active = hull
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
    bpy.ops.wm.save_as_mainfile(filepath=EVID + "warden_v2.blend")
    print("ALL_DONE")

main()