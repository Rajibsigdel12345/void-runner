import io
p = r"E:/Game/.evidence/I591/build_warden_v3.py"
s = io.open(p, encoding="ascii").read()
old = "bevel_ob(hull, BEVEL_OFF, 52.0, minlen_k=30.0)"
assert s.count(old) == 1
s = s.replace(old, "bevel_ob(hull, BEVEL_OFF, 52.0, minlen_k=57.0)")
io.open(p, "w", encoding="ascii", newline="\n").write(s)
print("PATCH591G5_OK")