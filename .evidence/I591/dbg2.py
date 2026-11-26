src = open(r"E:\Game\.evidence\I591\build_drone_v2.py", encoding="ascii").read()
pre = src.split("def main():")[0]
ns = {}
exec(pre, ns)
import bmesh, math, bpy
def purge():
    for ob in list(bpy.data.objects):
        bpy.data.objects.remove(ob, do_unlink=True)
purge()
ob = ns["newmesh"]("VR_Drone_dbg")
bm = bmesh.new()
ns["spine"](bm); ns["arm"](bm, 1); ns["arm"](bm, -1); ns["core"](bm)
ns["arm_greebles"](bm, 1); ns["arm_greebles"](bm, -1)
ns["box"](bm, 0.0, 0.10, 0.40, 0.030, 0.34, 0.035)
ns["box"](bm, 0.0, 0.05, -0.08, 0.055, 0.30, 0.045)
ns["pyramid"](bm, 0.0, -0.78, 0.02, 0.075, 0.10, 4, math.radians(45))
bm.to_mesh(ob.data); bm.free(); ob.data.update()
ns["cleanup"](ob)
ns["triangulate_recalc"](ob)
bm = bmesh.new(); bm.from_mesh(ob.data)
bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
bm.normal_update()
ang_r = math.radians(40.0); off = 0.012
es = []
for e in bm.edges:
    lf = e.link_faces
    if len(lf) == 2:
        n1 = lf[0].normal; n2 = lf[1].normal
        if n1.length > 0.5 and n2.length > 0.5 and n1.angle(n2) > ang_r:
            if e.calc_length() >= off * 3.0:
                es.append(e)
print("sel", len(es))
bmesh.ops.bevel(bm, geom=es, offset=off, offset_type="OFFSET", segments=1, profile=0.7, affect="EDGES", clamp_overlap=True)
bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
bad = []
for e in bm.edges:
    if e.is_boundary or not e.is_manifold:
        v = [round(c,2) for c in e.verts[0].co]
        bad.append((round(e.calc_length(),3), v))
print("bad", len(bad))
for b in bad[:25]:
    print("BAD", b[0], b[1])
