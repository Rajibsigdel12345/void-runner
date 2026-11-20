const fs = require("fs");
const raw = fs.readFileSync("AGENTS.md", "utf8");
console.log("LEN", raw.length, "BYTES", Buffer.byteLength(raw, "utf8"));
const boms = (raw.match(/\uFEFF/g) || []).length;
console.log("BOMs", boms);
for (const needle of ["22/25,781", "32,717", "69,272", "55,400", "5,383,468", "5,542,040", "5,559,215", "3,150,354", "3,212,232", "CLOSE FLOOR E72", "CLOSE FLOOR E74", "72,449", "ship v7", "I541", "I546"]) {
  console.log(JSON.stringify(needle), raw.indexOf(needle));
}
const i72 = raw.indexOf("CLOSE FLOOR E72");
console.log("--- around CLOSE FLOOR E72 ---");
console.log(JSON.stringify(raw.slice(i72 - 700, i72 + 300)));
const i3150 = raw.indexOf("3,150,354");
console.log("--- around 3,150,354 ---");
console.log(JSON.stringify(raw.slice(i3150 - 300, i3150 + 400)));