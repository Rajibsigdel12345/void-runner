import io
p = r"E:/Game/.evidence/I591/build_drone_v2.py"
s = io.open(p, encoding="ascii").read()
old = "ARM_ZT = [0.41, 0.65, 0.37, 0.39]"
assert s.count(old) == 1, "anchor not unique"
s = s.replace(old, "ARM_ZT = [0.44, 0.68, 0.40, 0.42]")
io.open(p, "w", encoding="ascii", newline="\n").write(s)
print("PATCH591H_OK")