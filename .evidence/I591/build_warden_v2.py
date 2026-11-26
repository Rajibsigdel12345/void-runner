import bpy, bmesh, math, os
from mathutils import Vector, Matrix

# I591 (ST-558, E84): warden v2 "turret bulwark" - squat wide hex slab + center
# turret hump + 3 thick symmetric armor slabs + front recessed core; NO loose
# debris. Two nodes: VR_Warden_Hull + VR_Warden_Armor (bit-identical names).
# Build space: +X span, +Y forward (nose/faceplate +Y), +Z up. Both objects
# centered at the origin (in-code armor scale-retracts around origin).
# Frozen contract: production/scope-check-E84.md + design/e84-enemy-remaster-
# research.md S4.1 (hull AIM 1250 / HARD 1550; armor AIM 750 / HARD 950) +
# GATE-OVERRIDE-E84-S2 (sil96 [0.045, 0.060], measured in the audit step) +
# GLB <= 150,000 B target / 200,000 B hard + extent bands (union):
# span_x 4.65-4.95, length_y 3.9-4.6, height_z 1.4-2.0.
EVID = "E:/Game/.evidence/I591/"
L = Vector((-0.45, -0.55, 0.70)).normalized()   # fleet-standard bake light (frozen)
K_HULL = 0.55
K_ARMOR = 0.70
HULL_AIM, HULL_HARD = 1250, 1550
ARM_AIM, ARM_HARD = 750, 950

# ---- tune knobs (single rework lever set) ----
BEVEL_OFF = 0.015
GUSSET = True      # armor per-slab support wedges (tri lever)
NUBS = 4           # armor per-slab corner nubs (4 or 6)

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
    # order: 0(-x,-y,-z) 1(-x,-y,+z) 2(-x,+y,-z) 3(-x,+y,+z) 4(+x,-y,-z) 5(+x,-y,+z) 6(+x,+y,-z) 7(+x,+y,+z)
    o = [o[0], o[1], o[2], o[3], o[4], o[5], o[6], o[7]]
    for f in _boxfaces(o):
        bm.faces.new((o[a] for a in f))

def box_zrot(bm, cx, cy, cz, hr, ht, hz, ang):
    # box with local X radial, local Y tangential, Z up; rotated ang about Z.
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
    # ring in the XZ plane at fixed y
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
    # annular band between two radii at two y positions (closed tube section)
    bo = ngon_y(bm, cx, cz, y0, r0, sides, rot)
    bi = ngon_y(bm, cx, cz, y0, r1, sides, rot)
    to = ngon_y(bm, cx, cz, y1, r0, sides, rot)
    ti = ngon_y(bm, cx, cz, y1, r1, sides, rot)
    for i in range(sides):
        j = (i + 1) % sides
        bm.faces.new((bo[i], bo[j], to[j], to[i]))      # outer
        bm.faces.new((bi[i], ti[i], ti[j], bi[j]))      # inner
        bm.faces.new((bo[i], bi[i], bi[j], bo[j]))      # back annulus
        bm.faces.new((to[i], to[j], ti[j], ti[i]))      # front annulus

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
    A = [math.radians(a) for a in (30, 150, 270)]
    # 1 hex base plate
    prism(bm, 0, 0, -0.60, -0.42, 0.55, 6, 0.0)
    # 2 raised deck hex (buried 0.005 into the plate top)
    prism(bm, 0, 0, -0.425, -0.39, 0.44, 6, 0.0)
    # 3 ribs out to the armor slabs
    for a in A:
        box_zrot(bm, 1.325 * math.cos(a), 1.325 * math.sin(a), -0.37, 0.925, 0.06, 0.05, a)
    # 4 collar flange (buried 0.015 into the plate)
    prism(bm, 0, 0, -0.435, -0.20, 0.50, 6, 0.0)
    # 5 turret dome hump (6-sided loft + cap)
    r0 = ngon(bm, 0, 0, -0.42, 0.46, 6, 0.0)
    r1 = ngon(bm, 0, 0, 0.10, 0.34, 6, 0.0)
    r2 = ngon(bm, 0, 0, 0.85, 0.16, 6, 0.0)
    for i in range(6):
        j = (i + 1) % 6
        bm.faces.new((r0[i], r0[j], r1[j], r1[i]))
        bm.faces.new((r1[i], r1[j], r2[j], r2[i]))
    bm.faces.new(list(reversed(r2)))
    bm.faces.new(r0)   # dome bottom cap (was open, buried in collar)
    # 6 front faceplate (8-sided housing on the +Y dome face)
    prism_y(bm, 0, 0.30, 0.20, 0.44, 0.24, 8, math.pi / 8)
    # 7 recessed lens frame (octagonal ring, back buried 0.01 in the faceplate)
    ring_y(bm, 0, 0.30, 0.43, 0.52, 0.19, 0.13, 8, math.pi / 8)
    # 8 lens pyramid (base recessed 0.02 inside the frame front)
    base = ngon_y(bm, 0, 0.30, 0.445, 0.12, 8, math.pi / 8)
    apex = bm.verts.new((0, 0.50, 0.30))
    for i in range(8):
        j = (i + 1) % 8
        bm.faces.new((base[i], base[j], apex))
    bm.faces.new(list(reversed(base)))
    # 9 forward skid runners (buried 0.07 into the hex +Y edge)
    box(bm,  0.35, 1.20, -0.37, 0.13, 0.75, 0.12)
    box(bm, -0.35, 1.20, -0.37, 0.13, 0.75, 0.12)
    # 10 runner end caps
    box(bm,  0.35, 1.95, -0.37, 0.10, 0.06, 0.09)
    box(bm, -0.35, 1.95, -0.37, 0.10, 0.06, 0.09)
    # 11 rear engine stub at the a=270 rib end
    box(bm, 0.0, -2.10, -0.37, 0.14, 0.10, 0.10)
    # 12 bolts around the collar top
    for k in range(12):
        a = math.radians(k * 30)
        pyramid(bm, 0.44 * math.cos(a), 0.44 * math.sin(a), -0.20, 0.025, 0.04, 4, math.radians(45))
    # 13 vent slits on the ribs (3 per rib)
    for a in A:
        for off in (-0.4, 0.0, 0.4):
            r = 1.325 + off
            box_zrot(bm, r * math.cos(a), r * math.sin(a), -0.315, 0.10, 0.04, 0.015, a)
    # 14 corner pads on the plate (buried 0.0025)
    for k in range(6):
        a = math.radians(k * 60)
        box(bm, 0.50 * math.cos(a), 0.50 * math.sin(a), -0.4075, 0.05, 0.05, 0.015)
    # 15 dome panel rings (2 raised 6-sided rings, buried in the dome)
    for (zc, rr) in ((0.25, 0.310), (0.50, 0.250)):
        prism(bm, 0, 0, zc - 0.015, zc + 0.015, rr, 6, 0.0)

def hull_greeble2(bm):
    # AIM lever: 6 deck bolts + 2 forward sensor blades
    for k in range(6):
        a = math.radians(k * 60 + 30)
        pyramid(bm, 0.35 * math.cos(a), 0.35 * math.sin(a), -0.39, 0.02, 0.05, 4, math.radians(45))
    pyramid(bm,  0.38, 0.25, -0.20, 0.02, 0.12, 4, math.radians(45))
    pyramid(bm, -0.38, 0.25, -0.20, 0.02, 0.12, 4, math.radians(45))

# ---------------------------------------------------------------- armor
def armor_slab(bm, adeg):
    a = math.radians(adeg)
    d = Vector((math.cos(a), math.sin(a), 0))
    t = Vector((-math.sin(a), math.cos(a), 0))
    P = lambda r, toff, z, hr, ht, hz, angoff=0.0: box_zrot(
        bm, (r * d + toff * t).x, (r * d + toff * t).y, z, hr, ht, hz, a + angoff)
    P(2.40, 0.0, 0.0, 0.15, 0.34, 0.55)        # thick core slab
    P(2.49, 0.0, 0.0, 0.06, 0.30, 0.50)        # outer raised faceplate
    P(2.06, 0.0, 0.0, 0.06, 0.28, 0.45)        # inner raised panel
    P(2.40, 0.0, 0.58, 0.13, 0.34, 0.05)       # top cap plate
    P(2.40, 0.0, -0.58, 0.13, 0.34, 0.05)      # bottom cap plate
    for toff in (-0.40, 0.40):                # 2 thick side fins
        P(2.40, toff, 0.0, 0.06, 0.09, 0.40)
    for toff in (-0.35, 0.35):                # 4 diamond corner nubs
        for z in (-0.45, 0.45):
            P(2.46, toff, z, 0.06, 0.06, 0.06, math.radians(45))

def armor_parts(bm):
    for ad in (30, 150, 270):
        armor_slab(bm, ad)

def main():
    purge()
    hull = newmesh("VR_Warden_Hull")
    bm = bmesh.new()
    hull_parts(bm)
    bm.to_mesh(hull.data); bm.free(); hull.data.update()
    cleanup(hull)
    triangulate_recalc(hull)
    th = tris_of(hull)
    print("PART VR_Warden_Hull tris", th, "verts", len(hull.data.vertices))
    bevel_ob(hull, BEVEL_OFF, 52.0, minlen_k=5.0)
    th = tris_of(hull)
    print("PART VR_Warden_Hull tris(after bevel)", th, "verts", len(hull.data.vertices))
    if th > HULL_HARD:
        raise SystemExit("CAP_FAIL VR_Warden_Hull %d > %d" % (th, HULL_HARD))
    fbh = bake(hull, K_HULL, lens_c=Vector((0, 0.46, 0.30)), lens_r=0.20)
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
    fba = bake(armor, K_ARMOR)
    print("FACET armor p10", round(fba['p10'], 4), "p50", round(fba['p50'], 4),
          "p90", round(fba['p90'], 4), "spread", round(fba['p90'], 4) and round(fba['spread'], 4))
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
