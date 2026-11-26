import io, bmesh, bpy
p = r"E:/Game/.evidence/I591/build_warden_v3.py"
src = io.open(p, encoding="ascii").read()
# cut everything from the hull-build section onward: reuse module top by execing up to the build function
marker = "def build_all"
if marker not in src:
    marker = "if __name__"
head = src.split(marker)[0]
ns = {}
exec(compile(head, p, "exec"), ns)
# now call whatever constructs the hull pre-bevel
print("FUNCS:", [k for k in ns if not k.startswith("_")][:40])