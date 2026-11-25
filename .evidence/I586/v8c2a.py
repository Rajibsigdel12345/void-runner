def bevel_ob(ob, offset=0.006, ang=40.0):
    bm = bmesh.new(); bm.from_mesh(ob.data)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    bm.normal_update()
    ang_r = math.radians(ang)
    minside = offset * 2.2
    es = []
    for e in bm.edges:
        lf = e.link_faces
        if len(lf) == 2:
            n1 = lf[0].normal; n2 = lf[1].normal
            if n1.length > 0.5 and n2.length > 0.5 and n1.angle(n2) > ang_r:
                ok = e.calc_length() >= offset * 3.0
                if ok:
                    for f in lf:
                        for ee in f.edges:
                            if ee.calc_length() < minside:
                                ok = False; break
                        if not ok:
                            break
                if ok:
                    es.append(e)
    bmesh.ops.bevel(bm, geom=es, offset=offset, offset_type="OFFSET", segments=1, profile=0.7,
                    affect="EDGES", clamp_overlap=True)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    nm, deg, zed, bnd = _chk(bm)
    print("BEVEL", ob.name, "sel", len(es), "bnd", bnd, "nm", nm, "degen", deg, "zeroe", zed)
    assert nm == 0, "bevel produced non-manifold edges"
    bm.to_mesh(ob.data); bm.free(); ob.data.update()

def inset_guarded(bm, sel, thickness, depth, cap):
    keep = [f for f in sel if all(e.calc_length() >= thickness * 2.5 for e in f.edges)]
    keep.sort(key=lambda f: -f.calc_area())
    n = min(cap, len(keep))
    if n:
        bmesh.ops.inset_individual(bm, faces=keep[:n], thickness=thickness, depth=depth, use_even_offset=True)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    nm, deg, zed, bnd = _chk(bm)
    print("INSET", n, "candidates", len(keep), "nm", nm, "degen", deg)
    return n

def cleanup(ob):
    bm = bmesh.new(); bm.from_mesh(ob.data)
    bmesh.ops.dissolve_degenerate(bm, dist=1e-6, edges=bm.edges[:])
    tiny = [f for f in bm.faces if f.calc_area() < 1e-8]
    if tiny:
        bmesh.ops.delete(bm, geom=tiny, context='FACES')
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    nm, deg, zed, bnd = _chk(bm)
    print("CLEANUP", ob.name, "nm", nm, "degen", deg, "zeroe", zed, "bnd", bnd)
    bm.to_mesh(ob.data); bm.free(); ob.data.update()

GREBBLES = {}
def g(part, n):
    GREBBLES[part] = GREBBLES.get(part, 0) + n

def ring_c(bm, cx, y, zc, r, sides=SIDES_N):
    return [bm.verts.new((cx + r * math.cos(2.0 * math.pi * i / sides), y, zc + r * math.sin(2.0 * math.pi * i / sides))) for i in range(sides)]

def cell_ring(bm, y, w, zc, h, t, sides=SIDES):
    # elliptical ring band (protruding 0.015 from the local hull ring), y-t..y+t
    a = [bm.verts.new(((w + 0.015) * math.cos(2.0 * math.pi * i / sides), y - t,
                       zc + (h + 0.015) * math.sin(2.0 * math.pi * i / sides))) for i in range(sides)]
    b = [bm.verts.new(((w + 0.015) * math.cos(2.0 * math.pi * i / sides), y + t,
                       zc + (h + 0.015) * math.sin(2.0 * math.pi * i / sides))) for i in range(sides)]
    for i in range(sides):
        j = (i + 1) % sides
        bm.faces.new((a[i], a[j], b[j], b[i]))
    bm.faces.new(list(reversed(a)))
    bm.faces.new(b)

def disc_z(bm, cx, cy, z0, z1, r, sides):
    top = [bm.verts.new((cx + r * math.cos(2.0 * math.pi * i / sides),
                         cy + r * math.sin(2.0 * math.pi * i / sides), z1)) for i in range(sides)]
    bot = [bm.verts.new((cx + r * math.cos(2.0 * math.pi * i / sides),
                         cy + r * math.sin(2.0 * math.pi * i / sides), z0)) for i in range(sides)]
    bm.faces.new(list(reversed(top)))
    bm.faces.new(bot)
    for i in range(sides):
        j = (i + 1) % sides
        bm.faces.new((top[i], top[j], bot[j], bot[i]))

def _hex_x(bm, x0, x1, cy, cz, r, sides=6):
    p0 = [bm.verts.new((x0, cy + r * math.cos(2.0 * math.pi * i / sides),
                        cz + r * math.sin(2.0 * math.pi * i / sides))) for i in range(sides)]
    p1 = [bm.verts.new((x1, cy + r * math.cos(2.0 * math.pi * i / sides),
                        cz + r * math.sin(2.0 * math.pi * i / sides))) for i in range(sides)]
    bm.faces.new(list(reversed(p0)))
    bm.faces.new(p1)
    for i in range(sides):
        j = (i + 1) % sides
        bm.faces.new((p0[i], p0[j], p1[j], p1[i]))

def _cyl_y(bm, cx, y0, y1, cz, r, sides, zoff=0.0):
    a = [bm.verts.new((cx + r * math.cos(2.0 * math.pi * i / sides), y0,
                       cz + zoff + r * math.sin(2.0 * math.pi * i / sides))) for i in range(sides)]
    b = [bm.verts.new((cx + r * math.cos(2.0 * math.pi * i / sides), y1,
                       cz + zoff + r * math.sin(2.0 * math.pi * i / sides))) for i in range(sides)]
    bm.faces.new(list(reversed(a)))
    bm.faces.new(b)
    for i in range(sides):
        j = (i + 1) % sides
        bm.faces.new((a[i], a[j], b[j], b[i]))

def _cone_y(bm, cx, ybase, zc, rbase, ytip, sides):
    base = [bm.verts.new((cx + rbase * math.cos(2.0 * math.pi * i / sides), ybase,
                          zc + rbase * math.sin(2.0 * math.pi * i / sides))) for i in range(sides)]
    tip = bm.verts.new((cx, ytip, zc))
    bm.faces.new(list(reversed(base)))
    for i in range(sides):
        j = (i + 1) % sides
        bm.faces.new((base[i], base[j], tip))

def _annular_y(bm, cx, zc, y0, y1, rin, rout, sides):
    a_in = [bm.verts.new((cx + rin * math.cos(2.0 * math.pi * i / sides), y0,
                          zc + rin * math.sin(2.0 * math.pi * i / sides))) for i in range(sides)]
    a_out = [bm.verts.new((cx + rout * math.cos(2.0 * math.pi * i / sides), y0,
                           zc + rout * math.sin(2.0 * math.pi * i / sides))) for i in range(sides)]
    b_in = [bm.verts.new((cx + rin * math.cos(2.0 * math.pi * i / sides), y1,
                          zc + rin * math.sin(2.0 * math.pi * i / sides))) for i in range(sides)]
    b_out = [bm.verts.new((cx + rout * math.cos(2.0 * math.pi * i / sides), y1,
                           zc + rout * math.sin(2.0 * math.pi * i / sides))) for i in range(sides)]
    for i in range(sides):
        j = (i + 1) % sides
        bm.faces.new((a_in[i], a_in[j], b_in[j], b_in[i]))
        bm.faces.new((a_out[j], a_out[i], b_out[i], b_out[j]))
        bm.faces.new((a_in[i], a_out[i], a_out[j], a_in[j]))
        bm.faces.new((b_out[i], b_in[i], b_in[j], b_out[j]))
