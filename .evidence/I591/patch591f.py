import io
p = r"E:/Game/.evidence/I591/build_drone_v2.py"
s = io.open(p, encoding="ascii").read()
old = "ARM_ZT = [0.38, 0.62, 0.34, 0.36]"
assert s.count(old) == 1, "anchor not unique"
s = s.replace(old, "ARM_ZT = [0.41, 0.65, 0.37, 0.39]")
io.open(p, "w", encoding="ascii", newline="\n").write(s)
print("PATCH591F_OK")