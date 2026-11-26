p = "E:/Game/.evidence/I591/build_warden_v2.py"
lines = open(p, encoding="utf-8").read().split("\n")
def sub(old, new):
    for i, ln in enumerate(lines):
        if old in ln:
            lines[i] = ln.replace(old, new); return
    raise SystemExit("anchor not found: " + old)
sub("def bevel_ob(ob, offset=0.015, ang=40.0):", "def bevel_ob(ob, offset=0.015, ang=40.0, minlen_k=3.0):")
sub("if e.calc_length() >= offset * 3.0:", "if e.calc_length() >= offset * minlen_k:")
sub("bevel_ob(hull, BEVEL_OFF, 50.0)", "bevel_ob(hull, BEVEL_OFF, 52.0, minlen_k=5.0)")
open(p, "w", encoding="utf-8", newline="\n").write("\n".join(lines))
print("PATCH_C_OK")
