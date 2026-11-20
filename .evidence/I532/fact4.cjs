const fs = require("fs");
const t = fs.readFileSync("E:/Game/.evidence/I516/build_e69a.py", "utf8");
const m = t.match(/OUT\s*=\s*\{[\s\S]*?\}/);
console.log("OUT:", m ? m[0] : "(none)");
const B = t.match(/BUDGET\s*=\s*\{[\s\S]*?\}/);
console.log("BUDGET:", B ? B[0] : "(none)");
const lines = t.split("\n");
lines.forEach((ln, n) => {
  if (/bulwark/i.test(ln)) console.log("L" + (n + 1) + ": " + ln.slice(0, 200));
});
console.log("total lines:", lines.length);
