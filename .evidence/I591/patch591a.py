p = "E:/Game/.evidence/I591/build_warden_v2.py"
lines = open(p, encoding="utf-8").read().split("\n")
for i, ln in enumerate(lines):
    if 'return [(0, 1, 2, 3), (7, 6, 5, 4)' in ln:
        lines[i] = '    return [(0,2,6,4),(1,5,7,3),(0,4,5,1),(2,3,7,6),(0,1,3,2),(4,5,7,6)]'
        break
else:
    raise SystemExit("box anchor not found")
si = ei = None
for i, ln in enumerate(lines):
    if '0.13, 0.35, 0.55)' in ln and '# core slab' in ln:
        si = i
    if '0.05, 0.06, 0.05, math.radians(45)' in ln:
        ei = i
assert si is not None and ei is not None and ei > si, (si, ei)
new_armor = [
"    P(2.40, 0.0, 0.0, 0.15, 0.34, 0.55)        # thick core slab",
"    P(2.53, 0.0, 0.0, 0.06, 0.30, 0.50)        # outer raised faceplate",
"    P(2.06, 0.0, 0.0, 0.06, 0.28, 0.45)        # inner raised panel",
"    P(2.40, 0.0, 0.58, 0.13, 0.34, 0.05)       # top cap plate",
"    P(2.40, 0.0, -0.58, 0.13, 0.34, 0.05)      # bottom cap plate",
"    for toff in (-0.40, 0.40):                # 2 thick side fins",
"        P(2.40, toff, 0.0, 0.06, 0.09, 0.40)",
"    for toff in (-0.35, 0.35):                # 4 diamond corner nubs",
"        for z in (-0.45, 0.45):",
"            P(2.545, toff, z, 0.06, 0.06, 0.06, math.radians(45))",
]
lines[si:ei+1] = new_armor
open(p, "w", encoding="utf-8", newline="\n").write("\n".join(lines))
print("PATCH_OK lines", len(lines))
