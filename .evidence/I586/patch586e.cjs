const fs = require("fs");
const base = "E:/Game/.evidence/I586/";
function patch(file, pairs) {
  let s = fs.readFileSync(base + file, "utf8");
  const hadBom = s.charCodeAt(0) === 0xfeff;
  if (hadBom) s = s.replace(/^\uFEFF/, "");
  for (const p of pairs) {
    const n = s.split(p[0]).length - 1;
    if (n !== 1) { console.log("ANCHOR_FAIL " + file + " count=" + n + " for " + JSON.stringify(p[0])); process.exit(2); }
    s = s.split(p[0]).join(p[1]);
  }
  fs.writeFileSync(base + file, (hadBom ? "\uFEFF" : "") + s, "utf8");
  console.log("PATCHED " + file);
}
patch("v8c1.py", [
  ["V8_NOZ_STEPS_S = 3", "V8_NOZ_STEPS_S = 4"]
]);
patch("v8c1b.py", [
  ["V8_HULL_SUB2B_N = 120", "V8_HULL_SUB2B_N = 112"],
  ["V8_COK_SUBALLZ_Z = 1.10", "V8_COK_SUBALLZ_Z = 1.08"]
]);
console.log("ALL_PATCHED_586e");
