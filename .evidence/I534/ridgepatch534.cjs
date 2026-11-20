const fs = require("fs");
const p = "E:/Game/.evidence/I534/build_hauler_v2.py";
let s = fs.readFileSync(p, "utf8");
s = s.replace(/\r\n/g, "\n");
function rep(oldStr, newStr, label){
  oldStr = oldStr.replace(/\r\n/g, "\n");
  newStr = newStr.replace(/\r\n/g, "\n");
  if (s.indexOf(oldStr) === -1) { console.error("NOTFOUND: " + label); process.exit(2); }
  if (s.indexOf(oldStr) !== s.lastIndexOf(oldStr)) { console.error("MULTI: " + label); process.exit(3); }
  s = s.replace(oldStr, newStr); console.log("OK " + label);
}
rep("def box(bm, cx, cy, cz, sx, sy, sz):",
`def ridge3(bm, st, i0, i1, i2, n, q, lift):
    def rd(i, mid):
        x, yc, zc, ry, rz = st[i]
        if mid: ry += lift; rz += lift
        return (x, yc, zc, ry, rz)
    rings = [ringb(bm, x, yc, zc, ry, rz, n, q) for (x, yc, zc, ry, rz) in (rd(i0, False), rd(i1, True), rd(i2, False))]
    for k in range(len(rings)-1):
        A, B = rings[k], rings[k+1]
        for i in range(n):
            j = (i+1) % n; bm.faces.new((A[i], A[j], B[j], B[i]))
def box(bm, cx, cy, cz, sx, sy, sz):`, "R1-ridge3");
rep(`def make_centers(st):
    pts = [(p[0], p[1], p[2]) for p in st]
    def f(x):
        if x <= pts[0][0]: return (pts[0][1], pts[0][2])
        if x >= pts[-1][0]: return (pts[-1][1], pts[-1][2])
        for i in range(len(pts)-1):
            (x0, y0, z0), (x1, y1, z1) = pts[i], pts[i+1]
            if x0 <= x <= x1:
                t = (x-x0)/(x1-x0); return (y0+(y1-y0)*t, z0+(z1-z0)*t)
        return (pts[-1][1], pts[-1][2])
    return f
`, "", "R2-make_centers");
rep(`def band_inset(bm, xlo, xhi, thick=0.02, depth=0.03, centers=None):
    fs = [f for f in bm.faces if xlo < (sum(v.co.x for v in f.verts)/len(f.verts)) < xhi]
    if not fs: return
    res = bmesh.ops.inset_region(bm, faces=fs, thickness=thick, depth=0.0)
    inner = res.get("faces_new") or res.get("faces") or []
    vs = set()
    for f in inner: vs.update(f.verts)
    ov = set()
    for f in bm.faces:
        if not (xlo < (sum(v.co.x for v in f.verts)/len(f.verts)) < xhi): ov.update(f.verts)
    vs.difference_update(ov)
    for v in vs:
        cy_, cz_ = centers(v.co.x) if centers else (0.0, 0.0)
        dy, dz = v.co.y - cy_, v.co.z - cz_
        d = math.hypot(dy, dz)
        if d > 1e-6:
            v.co.y += dy/d*depth; v.co.z += dz/d*depth
`, "", "R3-band_inset");
rep(`band_inset(bm, -0.80, -0.52)
band_inset(bm, -0.34, -0.06)
band_inset(bm, 0.00, 0.27)
band_inset(bm, 0.30, 0.55)
band_inset(bm, 0.62, 0.77)
`,
`ridge3(bm, HULL_ST, 0, 1, 2, 40, 0.5, 0.03)
ridge3(bm, HULL_ST, 3, 4, 5, 40, 0.5, 0.03)
ridge3(bm, HULL_ST, 5, 6, 7, 40, 0.5, 0.03)
ridge3(bm, HULL_ST, 7, 8, 9, 40, 0.5, 0.03)
ridge3(bm, HULL_ST, 10, 11, 12, 40, 0.5, 0.03)
`, "R4-hull");
rep(`    sfc = make_centers(sst)
    band_inset(bm, -0.36, -0.10, centers=sfc)
    band_inset(bm, 0.26, 0.46, centers=sfc)
`,
`    ridge3(bm, sst, 0, 1, 2, 22, 2.0/3.0, 0.02)
    ridge3(bm, sst, 3, 4, 5, 22, 2.0/3.0, 0.02)
`, "R5-sponson");
if (/band_inset|make_centers/.test(s)) { console.error("LEFTOVER band_inset/make_centers"); process.exit(4); }
s = s.replace(/\n/g, "\r\n");
fs.writeFileSync(p, s, "utf8");
console.log("PATCH_OK");