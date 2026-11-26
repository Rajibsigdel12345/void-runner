p = "E:/Game/.evidence/I591/build_warden_v2.py"
lines = open(p, encoding="utf-8").read().split("\n")
for i, ln in enumerate(lines):
    if 'bevel_ob(armor, BEVEL_OFF, 40.0)' in ln:
        lines[i] = ln.replace('bevel_ob(armor, BEVEL_OFF, 40.0)', 'bevel_ob(armor, BEVEL_OFF, 60.0, minlen_k=9.0)')
        break
else:
    raise SystemExit("armor bevel anchor not found")
open(p, "w", encoding="utf-8", newline="\n").write("\n".join(lines))
print("PATCH_D_OK")
