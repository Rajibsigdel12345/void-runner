const fs = require("fs");
const t = fs.readFileSync("E:/Game/.evidence/I517/build_e69b.py", "utf8");
const i = t.indexOf("bulwark");
console.log("--- build_e69b.py around 'bulwark' ---");
for (let k = 0; k < 6; k++) {
  const idx = t.indexOf("bulwark", k === 0 ? 0 : idx0);
  if (idx === -1) break;
  idx0 = idx + 1;
}
// simpler: print all lines mentioning bulwark + 6 lines after each
const lines = t.split("\n");
lines.forEach((ln, n) => {
  if (/bulwark/i.test(ln)) {
    console.log(`L${n+1}: ` + lines.slice(n, n + 8).join(" | ").slice(0, 600));
    console.log("---");
  }
});
const g = fs.readFileSync("E:/Game/.evidence/I509/build_remaster4.py", "utf8");
const gl = g.split("\n");
gl.forEach((ln, n) => {
  if (/gunship/i.test(ln)) {
    console.log(`G L${n+1}: ` + gl.slice(n, n + 5).join(" | ").slice(0, 500));
    console.log("---");
  }
});
