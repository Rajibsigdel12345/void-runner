import ast
p = "E:/Game/.evidence/I501/build_ship_v6.py"
t = open(p, encoding="utf-8").read()
edits = [
 ("            yk = y + 0.003 * ((k % 3) - 1)  # per-rib y-stagger: breaks rib-rib coplanar top/bottom (z-fight), sub-pixel, stays embedded",
  "            yk = y + 0.0015 * (((k * 7 + 3) % m) - (m // 2))  # unique-y per rib (m distinct, >=0.0015 build apart): no two share a horizontal face -> rib-rib z-fight 0"),
 ("    box(bm, 0.0, 0.05, 0.215, 0.045, 0.300, 0.014)            # dorsal spine",
  "    box(bm, 0.0, 0.05, 0.2162, 0.045, 0.300, 0.014)           # dorsal spine (z nudge: clear dorsal z-fight)"),
 ("    box(bm, 0.0, 0.05, -0.240, 0.120, 0.140, 0.020)           # belly step M",
  "    box(bm, 0.0, 0.05, -0.2388, 0.120, 0.140, 0.020)          # belly step M (z nudge)"),
 ("    box(bm, 0.0, 0.24, -0.233, 0.100, 0.110, 0.018)           # belly step A",
  "    box(bm, 0.0, 0.24, -0.2306, 0.100, 0.110, 0.018)          # belly step A (z nudge)"),
 ("    box(bm, 0.0, 0.05, -0.266, 0.055, 0.160, 0.008)           # belly catwalk plank",
  "    box(bm, 0.0, 0.05, -0.2624, 0.055, 0.160, 0.008)          # belly catwalk plank (z nudge)"),
 ("    box(bm, 0.070, -0.05, -0.247, 0.006, 0.020, 0.026)        # catwalk strut F",
  "    box(bm, 0.070, -0.05, -0.2422, 0.006, 0.020, 0.026)       # catwalk strut F (z nudge)"),
 ("    box(bm, 0.070, 0.15, -0.247, 0.006, 0.020, 0.026)         # catwalk strut A",
  "    box(bm, 0.070, 0.15, -0.2410, 0.006, 0.020, 0.026)        # catwalk strut A (z nudge)"),
 ("    box(bm, 0.045, -0.09, -0.250, 0.004, 0.006, 0.014)        # rail post F",
  "    box(bm, 0.045, -0.09, -0.2428, 0.004, 0.006, 0.014)       # rail post F (z nudge)"),
 ("    box(bm, 0.045, 0.19, -0.250, 0.004, 0.006, 0.014)         # rail post A",
  "    box(bm, 0.045, 0.19, -0.2416, 0.004, 0.006, 0.014)        # rail post A (z nudge)"),
 ("    box(bm, 0.0, -0.39, 0.200, 0.030, 0.030, 0.015)",
  "    box(bm, 0.0, -0.39, 0.1988, 0.030, 0.030, 0.015)  # z nudge: clear mast z-fight"),
]
for old, new in edits:
    n = t.count(old)
    assert n == 1, f"count {n} for: {old[:50]!r}"
    t = t.replace(old, new)
# spokes: -0.3135 appears exactly twice (center + pivot)
assert t.count("-0.3135") == 2, f"spoke -0.3135 count {t.count('-0.3135')}"
t = t.replace("-0.3135", "-0.3147")
open(p, "w", encoding="utf-8", newline="\n").write(t)
ast.parse(t)
print("PATCHED 11 edits + spoke z-nudge; AST OK")