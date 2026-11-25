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
  ["V8_NOZ_STEPS_C = 4", "V8_NOZ_STEPS_C = 3"],
  ["V8_NOZ_STEPS_S = 4", "V8_NOZ_STEPS_S = 3"],
  ["V8_NOZ_SIDES_C = 20", "V8_NOZ_SIDES_C = 16"]
]);
patch("v8c1b.py", [
  ["V8_HULL_SUB2B_N = 190", "V8_HULL_SUB2B_N = 120"],
  ["V8_WING_SUB2B_N = 160", "V8_WING_SUB2B_N = 110"],
  ["V8_COK_SUBALLZ_Z = 1.00", "V8_COK_SUBALLZ_Z = 1.10"]
]);
patch("v8c5.py", [
  ["for i in range(16):", "for i in range(8):"],
  ["th = 2.0 * math.pi * i / 16.0", "th = 2.0 * math.pi * i / 8.0"],
  ['g("Nozzle", 16 + 8 + 8 + 3 + 2)', 'g("Nozzle", 8 + 8 + 8 + 3 + 2)']
]);
console.log("ALL_PATCHED_586d");
