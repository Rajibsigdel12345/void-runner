import io, bmesh, math
p = r"E:/Game/.evidence/I591/build_warden_v3.py"
s = io.open(p, encoding="ascii").read()
anchor = "    bevel_ob(hull, BEVEL_OFF, 52.0, minlen_k=30.0)"
assert s.count(anchor) == 1
probe = '''    bm = bmesh.new(); bm.from_mesh(hull.data); bm.normal_update()
    bm.edges.ensure_lookup_table()
    bands = {}
    for e in bm.edges:
        if e.calc_length() < 0.015 * 30.0: continue
        if len(e.link_faces) < 2: continue
        a = math.degrees(e.link_faces[0].normal.angle(e.link_faces[1].normal))
        if a <= 52.0: continue
        k = int(a // 10) * 10
        bands[k] = bands.get(k, 0) + 1
    print("PROBE bands", sorted(bands.items()))
    raise SystemExit("PROBE_DONE")
'''
s = s.replace(anchor, probe + anchor)
io.open(r"E:/Game/.evidence/I591/dbg_hull2.py", "w", encoding="ascii", newline="\n").write(s)
print("PROBE_WRITTEN")