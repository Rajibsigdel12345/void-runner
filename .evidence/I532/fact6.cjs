const fs = require("fs");
const path = require("path");
function walk(d) {
  let out = [];
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) out = out.concat(walk(p));
    else if (p.endsWith(".js")) out.push(p);
  }
  return out;
}
for (const f of walk("E:/Game/src")) {
  const t = fs.readFileSync(f, "utf8");
  if (/gunship/i.test(t)) {
    console.log("=== " + f + " ===");
    const lines = t.split("\n");
    lines.forEach((ln, n) => { if (/gunship/i.test(ln)) console.log("L" + (n+1) + ": " + ln.trim().slice(0, 180)); });
  }
}
