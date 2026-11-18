import io
p = r"E:\Game\.evidence\I501\build_ship_v6.py"
s = io.open(p, encoding="utf-8", newline="").read()

# (A) run11 13-elem V6_RIB_YK table -> run12 V6_RIB_YK_FIX overrides
oldA = (
    "# run11: per-(ring,k) rib y-centers. Base drift 0 (yk0 = ring_y); b-members {k1,k6,k10} of\n"
    "# same-chord rib pairs get +/-0.002. Solver v3 (solve_ribs.py): all rib y-faces clear the 33\n"
    "# skin + 28 post y-planes by >= 0.0022 build (skin planes verified vs skin_planes2 run10).\n"
    "V6_RIB_YK = (\n"
    "    (-0.6400, -0.6420, -0.6400, -0.6400, -0.6400, -0.6400, -0.6420, -0.6400, -0.6400, -0.6400, -0.6420, -0.6400, -0.6400),  # ri0 y=-0.64\n"
    "    (-0.4300, -0.4320, -0.4300, -0.4300, -0.4300, -0.4300, -0.4320, -0.4300, -0.4300, -0.4300, -0.4320, -0.4300, -0.4300),  # ri1 y=-0.43\n"
    "    (-0.2100, -0.2120, -0.2100, -0.2100, -0.2100, -0.2100, -0.2120, -0.2100, -0.2100, -0.2100, -0.2120, -0.2100, -0.2100),  # ri2 y=-0.21\n"
    "    ( 0.0000, -0.0020,  0.0000,  0.0000,  0.0000,  0.0000, -0.0020,  0.0000,  0.0000,  0.0000, -0.0020,  0.0000,  0.0000),  # ri3 y= 0.00\n"
    "    ( 0.2100,  0.2080,  0.2100,  0.2100,  0.2100,  0.2100,  0.2080,  0.2100,  0.2100,  0.2100,  0.2080,  0.2100,  0.2100),  # ri4 y=+0.21\n"
    "    ( 0.4000,  0.4020,  0.4000,  0.4000,  0.4000,  0.4000,  0.4020,  0.4000,  0.4000,  0.4000,  0.4020,  0.4000,  0.4000),  # ri5 y=+0.40\n"
    "    ( 0.5200,  0.5180,  0.5200,  0.5200,  0.5200,  0.5200,  0.5180,  0.5200,  0.5200,  0.5200,  0.5180,  0.5200,  0.5200),  # ri6 y=+0.52\n"
    ")\n"
)
newA = (
    "# run12: run11's 0-base-drift table put most ribs at the exact ring y; every same-ring rib\n"
    "# has (0,+/-1,0) y-face normals -> 45 new coplanar rib-x-rib y island-pairs (run11 zf:\n"
    "# 204 face / 45 island pairs). Restore the run10 unique-y formula (min adjacent y-gap\n"
    "# 0.009 build = 0.0126 mesh, ~10x the flagged-gap ceiling 0.00131 mesh) + per-cell\n"
    "# overrides for the 4 rib x skin/post y-pairs the run10 formula alone hit (run10 zf had\n"
    "# 8 island pairs total = these 4 + tang 11x24 + rad 77x89 + tang 68x70 + belly 95x116):\n"
    "#   (2,3)  k3  ri2: bottom -0.2165 vs post 65 gi06 bottom -0.2162 (gap 0.0003 build)\n"
    "#   (2,12) k12 ri2: bottom -0.2195 vs skin -0.2200 (gap 0.0005 build)\n"
    "#   (3,1)  k1  ri3: top +0.0200 vs skin +0.0200 (co-plane)\n"
    "#   (6,11) k11 ri6: top +0.5300 vs post 305 gi13 top +0.5300 (co-plane)\n"
    "# Each override re-verified vs skin/post planes AND same-ring neighbor y-gaps (min\n"
    "# 0.003 build = 0.0042 mesh). Probe (zf_final.py) is the arbiter.\n"
    "V6_RIB_YK_FIX = {(2, 3): -0.0275, (2, 12): +0.003, (3, 1): -0.006, (6, 11): +0.006}\n"
)
assert s.count(oldA) == 1, ("oldA", s.count(oldA))
s = s.replace(oldA, newA)

# (B) V6_RIB_OFF: k9 0.006 -> 0.015 (run11's 0.006 co-planned same-side k8 x k9 radial faces)
oldB = (
    "# run11: rib k9 sits on decagon side 6 WITH post 235 (identical box orientation): off 0.018->0.006\n"
    "# (inward, joins default group) separates the near-coplanar radial face pair (islands 77x89,\n"
    "# gaps 0.00011/0.00021 mesh) by ~0.016 mesh AND raises zmin (k9 is the bottommost element:\n"
    "# run10 zmin -0.3297 vs floor -0.3333 -> run11 ~-0.318). Outward was tested and FAILED the floor.\n"
    "V6_RIB_OFF = {1: 0.018, 5: 0.018, 12: 0.018}\n"
)
newB = (
    "# run12: k9 sits on decagon side 6 WITH post 235 (identical box orientation). off 0.012\n"
    "# (= post off) is forbidden (re-creates the radial co-plane 77x89); 0.024 outward FAILED\n"
    "# the zmin floor (zmin -0.3368 < -0.3333, run11 build fail #1); 0.006 (run11) co-planned\n"
    "# the same-side k8 x k9 radial faces (island-pair k08 x k09 in run11 zf). 0.015: vs k8\n"
    "# (0.006) gap 0.009 build / 0.012 mesh; vs post 235 (0.012) gap 0.003 build / 0.0041 mesh\n"
    "# (4x eps). k9 zmin -0.3267 -> floor margin 0.0066.\n"
    "V6_RIB_OFF = {1: 0.018, 5: 0.018, 9: 0.015, 12: 0.018}\n"
)
assert s.count(oldB) == 1, ("oldB", s.count(oldB))
s = s.replace(oldB, newB)

# (C) restore run10 unique-y formula + per-cell FIX term
oldC = "            yk = V6_RIB_YK[ri][k]  # run11: solver table (0 base drift; clears all skin+post y-planes by >=0.0022 build)\n"
newC = "            yk = y + 0.0015 * (((k * 7 + 3) % m) - (m // 2)) + 0.002 * (((ri * 5 + 1) % 7) - 3) + V6_RIB_YK_FIX.get((ri, k), 0.0)  # run12: run10 unique-y + 4 per-cell skin/post fixes (V6_RIB_YK_FIX)\n"
assert s.count(oldC) == 1, ("oldC", s.count(oldC))
s = s.replace(oldC, newC)

io.open(p, "w", encoding="utf-8", newline="").write(s)
# post-conditions
s2 = io.open(p, encoding="utf-8", newline="").read()
assert "V6_RIB_YK_FIX = {(2, 3): -0.0275, (2, 12): +0.003, (3, 1): -0.006, (6, 11): +0.006}" in s2
assert s2.count("V6_RIB_YK_FIX") == 2, s2.count("V6_RIB_YK_FIX")
assert "V6_RIB_YK[ri][k]" not in s2
assert "V6_RIB_OFF = {1: 0.018, 5: 0.018, 9: 0.015, 12: 0.018}" in s2
print("PATCH_RUN12_OK")