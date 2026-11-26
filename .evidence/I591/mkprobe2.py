import io
p = r"E:/Game/.evidence/I591/dbg_hull2.py"
s = io.open(p, encoding="ascii").read()
old = """    bands = {}
    for e in bm.edges:
        if e.calc_length() < 0.015 * 30.0: continue
        if len(e.link_faces) < 2: continue
        a = math.degrees(e.link_faces[0].normal.angle(e.link_faces[1].normal))
        if a <= 52.0: continue
        k = int(a // 10) * 10
        bands[k] = bands.get(k, 0) + 1
    print("PROBE bands", sorted(bands.items()))
"""
new = """    lb = {}
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
"""
assert s.count(old) == 1
s = s.replace(old, new)
io.open(p, "w", encoding="ascii", newline="\n").write(s)
print("PROBE2_WRITTEN")