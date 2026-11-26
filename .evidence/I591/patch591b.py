p = "E:/Game/.evidence/I591/build_warden_v2.py"
lines = open(p, encoding="utf-8").read().split("\n")
# 1) cap the dome loft bottom (fixes the 6 boundary edges)
for i, ln in enumerate(lines):
    if ln.strip() == 'bm.faces.new(list(reversed(r2)))':
        lines[i] = ln + "\n    bm.faces.new(r0)   # dome bottom cap (was open, buried in collar)"
        break
else:
    raise SystemExit("dome cap anchor not found")
# 2) raise hull bevel angle 40 -> 50 to cut beveled-edge count
for i, ln in enumerate(lines):
    if 'bevel_ob(hull, BEVEL_OFF, 40.0)' in ln:
        lines[i] = ln.replace('bevel_ob(hull, BEVEL_OFF, 40.0)', 'bevel_ob(hull, BEVEL_OFF, 50.0)')
        break
else:
    raise SystemExit("hull bevel anchor not found")
open(p, "w", encoding="utf-8", newline="\n").write("\n".join(lines))
print("PATCH_B_OK")
