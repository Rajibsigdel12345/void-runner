import fs from "node:fs";
const p = "E:/Game/.evidence/I605/farframe604.mjs";
let src = fs.readFileSync(p, "utf8");
const eol = src.includes("\r\n") ? "\r\n" : "\n";
const L = (a) => a.join(eol);
const reps = [
  [
    ["const refs = [ proj(cam0, look0, p.x, 0, p.y).ndc, proj(cam0, look0, 0, 0, 0).ndc, proj(cam0, look0, -p.x, 0, -p.y).ndc ];"],
    ["const refs = [ proj(cam0, look0, p.x, 0, p.y), proj(cam0, look0, 0, 0, 0), proj(cam0, look0, -p.x, 0, -p.y) ];"]
  ],
  [
    ["const cmp = [ proj(st.cam, st.look, p.x, 0, p.y).ndc, proj(st.cam, st.look, 0, 0, 0).ndc, proj(st.cam, st.look, -p.x, 0, -p.y).ndc ];"],
    ["const cmp = [ proj(st.cam, st.look, p.x, 0, p.y), proj(st.cam, st.look, 0, 0, 0), proj(st.cam, st.look, -p.x, 0, -p.y) ];"]
  ],
  [
    ["      for (let i = 0; i < 3; i++) {",
     "        const dx = Math.abs(refs[i].x - cmp[i].x), dy = Math.abs(refs[i].y - cmp[i].y);",
     "        if (dx > worst[gate].maxDx) worst[gate].maxDx = dx;",
     "        if (dy > worst[gate].maxDy) worst[gate].maxDy = dy;",
     "      }"],
    ["      for (let i = 0; i < 3; i++) {",
     "        const r = refs[i], c = cmp[i];",
     "        if (r.ndc === null || c.ndc === null) {",
     "          if (r.ndc !== null || c.ndc !== null || r.depth !== c.depth) worst[gate].maxDx = 1;",
     "          continue;",
     "        }",
     "        const dx = Math.abs(r.ndc.x - c.ndc.x), dy = Math.abs(r.ndc.y - c.ndc.y);",
     "        if (dx > worst[gate].maxDx) worst[gate].maxDx = dx;",
     "        if (dy > worst[gate].maxDy) worst[gate].maxDy = dy;",
     "      }"]
  ]
];
for (const [a, b] of reps) {
  const A = L(a), B = L(b);
  const n = src.split(A).length - 1;
  if (n !== 1) { console.error("PATCH FAIL count=" + n + " anchor: " + A.split(eol)[0].slice(0, 60)); process.exit(1); }
  src = src.replace(A, B);
}
fs.writeFileSync(p, src, "utf8");
console.log("PATCHED OK");