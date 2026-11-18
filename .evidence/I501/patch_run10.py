# patch_run10.py - fixes from zf run9 (17 island-pairs):
#  (a) 14 rib x post pairs -> widen radial offset separation 0.010/0.014 -> 0.006/0.018
#  (b) (109,123) rib_+0.40_k03 x hatch_lid -> lid cz 0.1342 -> 0.1352 (bottom 0.1202 -> 0.1212)
#  (c) (8,209)/(8,215) SKIN x rib y-faces -> ring-dependent yk jitter term
import io
p = r"E:\Game\.evidence\I501\build_ship_v6.py"
s = io.open(p, encoding="utf-8").read()
reps = [
    ("    for y in V6_RIB_Y:",
     "    for ri, y in enumerate(V6_RIB_Y):"),
    ("yk = y + 0.0015 * (((k * 7 + 3) % m) - (m // 2))  # unique-y per rib (m distinct, >=0.0015 build apart): no two share a horizontal face -> rib-rib z-fight 0",
     "yk = y + 0.0015 * (((k * 7 + 3) % m) - (m // 2)) + 0.002 * (((ri * 5 + 1) % 7) - 3)  # unique-y per rib + per-ring 0.002-quantum shift: breaks coincident rib/SKIN y-planes"),
    ("off = 0.014 if k in (1, 5, 9, 12) else 0.010  # second-rib radial step (double-occupancy chords 0/3/6/8)",
     "off = 0.018 if k in (1, 5, 9, 12) else 0.006  # widened radial separation: rib x post min face gap 0.006 build (taper-convergence safe)"),
    ("box(bm, 0.0, 0.42, 0.1342, 0.030, 0.055, 0.014)",
     "box(bm, 0.0, 0.42, 0.1352, 0.030, 0.055, 0.014)"),
]
for old, new in reps:
    n = s.count(old)
    assert n == 1, "count %d for: %s" % (n, old[:60])
    s = s.replace(old, new)
io.open(p, "w", encoding="utf-8", newline="\n").write(s)
print("PATCH_RUN10 OK - 4 replacements")