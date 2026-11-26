src = open(r"E:\Game\.evidence\I591\build_drone_v2.py", encoding="ascii").read()
pre = src.split("def main():")[0]
ns = {}
exec(pre, ns)
bmesh = ns["bmesh"]; math = ns["math"]
def bnd_count(bm):
    bm.edges.ensure_lookup_table()
    return sum(1 for e in bm.edges if e.is_boundary)
bm = bmesh.new(); ns["spine"](bm); print("spine bnd", bnd_count(bm), "verts", len(bm.verts)); bm.free()
bm = bmesh.new(); ns["arm"](bm, 1); print("arm bnd", bnd_count(bm), "verts", len(bm.verts)); bm.free()
bm = bmesh.new(); ns["core"](bm); print("core bnd", bnd_count(bm), "verts", len(bm.verts)); bm.free()
bm = bmesh.new(); ns["arm_greebles"](bm, 1); print("arm_greebles bnd", bnd_count(bm), "verts", len(bm.verts)); bm.free()
