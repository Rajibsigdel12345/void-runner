import io
p = r"E:\Game\.evidence\I501\build_ship_v6.py"
s = io.open(p, encoding="utf-8", newline="").read()
old = """# run11: rib k9 sits on decagon side 6 WITH post 235 (identical box orientation): off 0.018->0.024
# separates the coplanar radial inner-face pair (islands 77x89, gap 0.00011 mesh) by ~0.008 mesh.
V6_RIB_OFF = {1: 0.018, 5: 0.018, 9: 0.024, 12: 0.018}"""
new = """# run11: rib k9 sits on decagon side 6 WITH post 235 (identical box orientation): off 0.018->0.006
# (inward, joins default group) separates the near-coplanar radial face pair (islands 77x89,
# gaps 0.00011/0.00021 mesh) by ~0.016 mesh AND raises zmin (k9 is the bottommost element:
# run10 zmin -0.3297 vs floor -0.3333 -> run11 ~-0.318). Outward was tested and FAILED the floor.
V6_RIB_OFF = {1: 0.018, 5: 0.018, 12: 0.018}"""
assert s.count(old) == 1, s.count(old)
s = s.replace(old, new)
io.open(p, "w", encoding="utf-8", newline="").write(s)
print("AMEND_OK")