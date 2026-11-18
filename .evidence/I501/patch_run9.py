import io
P = r'E:\Game\.evidence\I501\build_ship_v6.py'
s = io.open(P, encoding='utf-8').read()

def rep(s, old, new, tag):
    c = s.count(old)
    assert c == 1, (tag, c)
    return s.replace(old, new)

s = rep(s, "HULL_MID3_Y = (-0.14, 0.09)", "HULL_MID3_Y = (-0.12, 0.09)", "R1 MID3")

belly_old = (
    "    box(bm, 0.0, -0.148, -0.233, 0.100, 0.160, 0.018)          # belly step F\n"
    "    box(bm, 0.0, 0.05, -0.2388, 0.120, 0.140, 0.020)          # belly step M (z nudge)\n"
    "    box(bm, 0.0, 0.24, -0.2306, 0.0980, 0.110, 0.018)          # belly step A (z nudge)\n"
)
belly_new = "    # belly F/M/A moved POST-bevel (run9: skip set ineffective per greeble_verts note)\n"
s = rep(s, belly_old, belly_new, "R2 belly-move-out")

s = rep(s, "box(bm, 0.326, 0.02,", "box(bm, 0.330, 0.02,", "R3 ventR")
s = rep(s, "box(bm, -0.326, 0.02,", "box(bm, -0.330, 0.02,", "R4 ventL")

s = rep(s, '    g("Hull", 20)\n', '    g("Hull", 17)  # run9: belly F/M/A counted post-bevel (g 3 below)\n', "R5 gcount")

tail_old = (
    "    displace(bm, HULL_AMP, HULL_RIB, HULL_FREQ, SEED, skip=greeble_verts(bm, base))\n"
    "    # v6 H1-H4 POST-displace (embeds 20-47 mm vs +/-12 mm displace -> always intersect)\n"
    "    v6_h1(bm)\n"
    "    v6_h2(bm)\n"
    "    v6_h3(bm, 1)\n"
    "    v6_h3(bm, -1)\n"
    "    v6_h4(bm)\n"
    "    bm.to_mesh(ob.data); bm.free(); ob.data.update()\n"
    "    bevel_ob(ob, 0.006, 45.0)\n"
    "    return ob\n"
)
tail_new = (
    "    displace(bm, HULL_AMP, HULL_RIB, HULL_FREQ, SEED, skip=greeble_verts(bm, base))\n"
    "    # I501 run9: final bevel BEFORE v6 greebles -> H1-H4 boxes stay crisp (no bevel\n"
    "    # chamfer strips on posts/ribs/hatch -> rib/post z-fight pairs removed at source)\n"
    "    bm.to_mesh(ob.data); bm.free(); ob.data.update()\n"
    "    bevel_ob(ob, 0.006, 45.0)\n"
    "    bm = bmesh.new(); bm.from_mesh(ob.data)\n"
    "    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])\n"
    "    bm.normal_update()\n"
    "    # belly F/M/A POST-bevel (crisp planar boxes; embedded ~15-25 mm vs +/-12 mm displace)\n"
    "    box(bm, 0.0, -0.148, -0.233, 0.100, 0.160, 0.018)          # belly step F\n"
    "    box(bm, 0.0, 0.05, -0.2388, 0.120, 0.140, 0.020)          # belly step M (z nudge)\n"
    "    box(bm, 0.0, 0.24, -0.2306, 0.0980, 0.110, 0.018)          # belly step A (z nudge)\n"
    "    g(\"Hull\", 3)\n"
    "    # v6 H1-H4 POST-bevel (embeds 20-47 mm vs +/-12 mm displace -> always intersect)\n"
    "    v6_h1(bm)\n"
    "    v6_h2(bm)\n"
    "    v6_h3(bm, 1)\n"
    "    v6_h3(bm, -1)\n"
    "    v6_h4(bm)\n"
    "    bm.to_mesh(ob.data); bm.free(); ob.data.update()\n"
    "    return ob\n"
)
s = rep(s, tail_old, tail_new, "R6 tail-reorder")

io.open(P, 'w', encoding='utf-8', newline='').write(s)
print("PATCH_RUN9_OK")