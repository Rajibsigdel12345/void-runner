const fs = require("fs");
const src = fs.readFileSync("E:/Game/.evidence/I540/audit540.py", "utf8").replace(/^\uFEFF/, "");
let s = src;
function rep(a, b) { const n = s.split(a).length - 1; s = s.split(a).join(b); console.log("rep " + n + " x: " + a); if (n === 0) process.exit(3); }
rep("E:/Game/.evidence/I540/ship_v7.glb", "E:/Game/.evidence/I586/ship_v8.glb");
rep("E:/Game/.evidence/I540/", "E:/Game/.evidence/I586/");
rep("a540_ship_", "a586_ship_");
rep("AUDIT ship_v7", "AUDIT ship_v8");
fs.writeFileSync("E:/Game/.evidence/I586/audit586.py", s, "utf8");
console.log("WROTE audit586.py", Buffer.byteLength(s), "bytes");
