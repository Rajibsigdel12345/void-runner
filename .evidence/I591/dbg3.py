import bpy, bmesh
src = open("E:/Game/.evidence/I591/build_warden_v2.py").read()
pre = src.split("def main():")[0]
ns = {}
exec(pre, ns)
ns["purge"]()
hull = ns["newmesh"]("VR_Warden_Hull")
bm = bmesh.new()
ns["hull_parts"](bm)
bm.to_mesh(hull.data); bm.free(); hull.data.update()
ns["cleanup"](hull)
bm2 = bmesh.new(); bm2.from_mesh(hull.data)
bnd = [e for e in bm2.edges if e.is_boundary]
print("BND count", len(bnd))
# cluster by z and radius
import math
for e in bnd:
    v0 = e.verts[0].co; v1 = e.verts[1].co
    cx = (v0.x+v1.x)/2; cy=(v0.y+v1.y)/2; cz=(v0.z+v1.z)/2
    r = math.sqrt(cx*cx+cy*cy)
    print("BND z %.3f r %.3f a %.0f" % (cz, r, math.degrees(math.atan2(cy,cx))))
bm2.free()
