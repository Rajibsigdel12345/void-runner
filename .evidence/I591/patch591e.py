p = "E:/Game/.evidence/I591/build_warden_v2.py"
lines = open(p, encoding="utf-8").read().split("\n")
def sub(old, new):
    for i, ln in enumerate(lines):
        if old in ln:
            lines[i] = ln.replace(old, new); return
    raise SystemExit("anchor not found: " + old)
sub("P(2.53, 0.0, 0.0, 0.06, 0.30, 0.50)", "P(2.49, 0.0, 0.0, 0.06, 0.30, 0.50)")
sub("P(2.545, toff, z, 0.06, 0.06, 0.06, math.radians(45))", "P(2.46, toff, z, 0.06, 0.06, 0.06, math.radians(45))")
open(p, "w", encoding="utf-8", newline="\n").write("\n".join(lines))
print("PATCH_E_OK")
