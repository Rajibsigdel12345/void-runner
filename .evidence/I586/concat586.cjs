const fs = require("fs");
const base = "E:/Game/.evidence/I586/";
const parts = ["v8c1.py","v8c1b.py","v8c2a.py","v8c2b.py","v8c3.py","v8c4.py","v8c5.py","v8c6.py"];
let out = "";
for (const p of parts) {
  const s = fs.readFileSync(base + p, "utf8").replace(/^\uFEFF/, "");
  out += s + "\n";
}
fs.writeFileSync(base + "build_ship_v8.py", out, "utf8");
console.log("WROTE build_ship_v8.py", Buffer.byteLength(out), "bytes");
