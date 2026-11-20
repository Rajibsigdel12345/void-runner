const fs = require("fs");
let s = fs.readFileSync("E:/Game/.evidence/I536/repins536.cjs", "utf8");
const old = '["// Per-node extents: I509 TRUE-AXIS measurements (glb_probe.mjs; 10% band).",\n "// Per-node extents: I536 TRUE-AXIS measurements (probe536.mjs; 10% band)."],';
if (!s.includes(old)) { console.error("PAIR NOT FOUND"); process.exit(1); }
const nw = '["// Per-node extents: I509 TRUE-AXIS measurements (glb_probe.mjs; 10% band).\\r\\n  const he = primExtents({ buf, json, binOff }, \'VR_Gunship_Hull\');",\n "// Per-node extents: I536 TRUE-AXIS measurements (probe536.mjs; 10% band).\\r\\n  const he = primExtents({ buf, json, binOff }, \'VR_Gunship_Hull\');"],';
s = s.replace(old, nw);
fs.writeFileSync("E:/Game/.evidence/I536/repins536.cjs", s);
console.log("PAIR_UPDATED");
