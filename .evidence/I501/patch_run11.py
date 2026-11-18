import io
p = r"E:\Game\.evidence\I501\build_ship_v6.py"
s = io.open(p, encoding="utf-8", newline="").read()

# (1) tables after V6_RIB_Y
old1 = "V6_RIB_Y = (-0.64, -0.43, -0.21, 0.00, 0.21, 0.40, 0.52)\n"
new1 = old1 + """# run11: per-(ring,k) rib y-centers. Base drift 0 (yk0 = ring_y); b-members {k1,k6,k10} of
# same-chord rib pairs get +/-0.002. Solver v3 (solve_ribs.py): all rib y-faces clear the 33
# skin + 28 post y-planes by >= 0.0022 build (skin planes verified vs skin_planes2 run10).
V6_RIB_YK = (
    (-0.6400, -0.6420, -0.6400, -0.6400, -0.6400, -0.6400, -0.6420, -0.6400, -0.6400, -0.6400, -0.6420, -0.6400, -0.6400),  # ri0 y=-0.64
    (-0.4300, -0.4320, -0.4300, -0.4300, -0.4300, -0.4300, -0.4320, -0.4300, -0.4300, -0.4300, -0.4320, -0.4300, -0.4300),  # ri1 y=-0.43
    (-0.2100, -0.2120, -0.2100, -0.2100, -0.2100, -0.2100, -0.2120, -0.2100, -0.2100, -0.2100, -0.2120, -0.2100, -0.2100),  # ri2 y=-0.21
    ( 0.0000, -0.0020,  0.0000,  0.0000,  0.0000,  0.0000, -0.0020,  0.0000,  0.0000,  0.0000, -0.0020,  0.0000,  0.0000),  # ri3 y= 0.00
    ( 0.2100,  0.2080,  0.2100,  0.2100,  0.2100,  0.2100,  0.2080,  0.2100,  0.2100,  0.2100,  0.2080,  0.2100,  0.2100),  # ri4 y=+0.21
    ( 0.4000,  0.4020,  0.4000,  0.4000,  0.4000,  0.4000,  0.4020,  0.4000,  0.4000,  0.4000,  0.4020,  0.4000,  0.4000),  # ri5 y=+0.40
    ( 0.5200,  0.5180,  0.5200,  0.5200,  0.5200,  0.5200,  0.5180,  0.5200,  0.5200,  0.5200,  0.5180,  0.5200,  0.5200),  # ri6 y=+0.52
)
# run11: rib k9 sits on decagon side 6 WITH post 235 (identical box orientation): off 0.018->0.024
# separates the coplanar radial inner-face pair (islands 77x89, gap 0.00011 mesh) by ~0.008 mesh.
V6_RIB_OFF = {1: 0.018, 5: 0.018, 9: 0.024, 12: 0.018}
# run11: ribs k6/k9 share their decagon side with posts 155/235 -> tangential faces near-coplanar
# (gaps 0.00131 / 0.00009 mesh). tang half 0.075->0.079 moves both tang faces +0.004..0.006 mesh.
V6_RIB_TANG = {6: 0.079, 9: 0.079}
"""
assert s.count(old1) == 1, ("old1", s.count(old1))
s = s.replace(old1, new1)

# (2) yk table lookup
old2 = "            yk = y + 0.0015 * (((k * 7 + 3) % m) - (m // 2)) + 0.002 * (((ri * 5 + 1) % 7) - 3)  # unique-y per rib + per-ring 0.002-quantum shift: breaks coincident rib/SKIN y-planes\n"
new2 = "            yk = V6_RIB_YK[ri][k]  # run11: solver table (0 base drift; clears all skin+post y-planes by >=0.0022 build)\n"
assert s.count(old2) == 1, ("old2", s.count(old2))
s = s.replace(old2, new2)

# (3) per-rib off
old3 = "            off = 0.018 if k in (1, 5, 9, 12) else 0.006  # widened radial separation: rib x post min face gap 0.006 build (taper-convergence safe)\n"
new3 = "            off = V6_RIB_OFF.get(k, 0.006)  # run11: per-rib radial offset (k9 widened vs post 235 co-side radial faces)\n"
assert s.count(old3) == 1, ("old3", s.count(old3))
s = s.replace(old3, new3)

# (4) per-rib tang half
old4 = "            rot_box(bm, c, (0.075, 0.016, 0.030), c, (0, 1, 0), math.atan2(nx, nz))\n"
new4 = "            rot_box(bm, c, (V6_RIB_TANG.get(k, 0.075), 0.016, 0.030), c, (0, 1, 0), math.atan2(nx, nz))  # run11: k6/k9 tang widened vs post co-side tang faces\n"
assert s.count(old4) == 1, ("old4", s.count(old4))
s = s.replace(old4, new4)

# (5) belly_M drop
old5 = "    box(bm, 0.0, 0.05, -0.2388, 0.120, 0.140, 0.020)          # belly step M (z nudge)\n"
new5 = "    box(bm, 0.0, 0.05, -0.2413, 0.120, 0.140, 0.020)          # belly step M (z drop run11: top -0.2188->-0.2213 vs isl116 z -0.2192 -> gap 0.0021 build)\n"
assert s.count(old5) == 1, ("old5", s.count(old5))
s = s.replace(old5, new5)

io.open(p, "w", encoding="utf-8", newline="").write(s)
print("PATCH_RUN11_OK")