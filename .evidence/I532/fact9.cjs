const fs = require("fs");
const files = [
  "E:/Game/.evidence/I495/causal495.mjs",
  "E:/Game/.evidence/I491/playframe491.mjs",
];
// find I483 harness files
const fs0 = fs;
const dir = "E:/Game/.evidence/I483";
let i483 = [];
try { i483 = fs0.readdirSync(dir).filter(f => f.endsWith(".mjs")).map(f => dir + "/" + f); } catch {}
for (const f of [...files, ...i483]) {
  let t;
  try { t = fs.readFileSync(f, "utf8"); } catch { continue; }
  console.log("=== " + f + " (" + t.length + " B) ===");
  const lines = t.split("\n");
  lines.forEach((ln, n) => {
    if (/\bwave|seed|frame|t\s*[:=]\s*[0-9]|startAt|jump/i.test(ln)) {
      console.log("L" + (n + 1) + ": " + ln.trim().slice(0, 160));
    }
  });
}
