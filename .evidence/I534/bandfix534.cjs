const fs = require("fs");
const p = "E:/Game/.evidence/I534/build_hauler_v2.py";
let s = fs.readFileSync(p, "utf8");
const eol = s.includes("\r\n") ? "\r\n" : "\n";
let R = [
 [`def band_inset(bm, xlo, xhi, thick=0.02, depth=0.03):
    fs = [f for f in bm.faces if xlo < (sum(v.co.x for v in f.verts)/len(f.verts)) < xhi]
    if not fs: return
    res = bmesh.ops.inset_region(bm, faces=fs, thickness=thick, depth=0.0)
    inner = res.get("faces_new") or res.get("faces") or []
    for f in inner: bmesh.ops.translate(bm, verts=list(f.verts), vec=f.normal*depth)`.split("\n").join(eol),
 `def make_centers(st):
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
def band_inset(bm, xlo, xhi, thick=0.02, depth=0.03, centers=None):
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
            v.co.y += dy/d*depth; v.co.z += dz/d*depth`.split("\n").join(eol)],
 [`    tube2b(bm, [(x, s*cx, cz, ry, rz) for (x, cx, cz, ry, rz) in SPON_ST], 22, 2.0/3.0, cap_back=True, tip_front=0.50)
    band_inset(bm, -0.36, -0.10)
    band_inset(bm, 0.26, 0.46)`.split("\n").join(eol),
 `    sst = [(x, s*cx, cz, ry, rz) for (x, cx, cz, ry, rz) in SPON_ST]
    tube2b(bm, sst, 22, 2.0/3.0, cap_back=True, tip_front=0.50)
    sfc = make_centers(sst)
    band_inset(bm, -0.36, -0.10, centers=sfc)
    band_inset(bm, 0.26, 0.46, centers=sfc)`.split("\n").join(eol)],
];
let n = 0;
for (const [a, b] of R) {
  if (!s.includes(a)) { console.log("MISS", a.slice(0, 60).replace(/\r\n/g, "\\n")); process.exit(1); }
  s = s.replace(a, b); n++;
}
fs.writeFileSync(p, s);
console.log("BAND_FIX_APPLIED", n + "/" + R.length, "EOL", eol === "\r\n" ? "CRLF" : "LF");