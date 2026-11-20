const fs = require("fs");
const p = "AGENTS.md";
let raw = fs.readFileSync(p, "utf8");
const bomsBefore = (raw.match(/\uFEFF/g) || []).length;
function rep(s, from, to, label) {
  const n = s.split(from).length - 1;
  if (n !== 1) throw new Error("anchor count " + n + " != 1 for " + label);
  return s.replace(from, to);
}
// (a) asset line byte true-up
raw = rep(raw,
  "(~3,077 KB (3,150,354 B) / 72,449 tris (I541 measurement, cap 3,080 KB / 73,000 t))",
  "(~3,137 KB (3,212,232 B) / 72,449 tris (I547 G74.0 measurement; I541 figure pre-final-export, tris unchanged since), cap 3,080 KB / 73,000 t)",
  "asset-line");
// (b) dist chain tail + CLOSE FLOOR E74 (E73 floor demoted to prior)
raw = rep(raw,
  "-> 5,542,040 (I542 G73.0 gate, code-only); CLOSE FLOOR E73 = 557,960 B measured at G73.0 (I542: 6,100,000 - 5,542,040; headroom >= 102,400 B floor -> cut ladder C1..C2 NOT invoked); prior: CLOSE FLOOR E72",
  "-> 5,544,996 (I544 menu reorg, +2,956) -> 5,548,452 (I545 mobile landscape, +3,456) -> 5,559,215 (I546 PWA install hardening, +10,763; I547 byte-identical, 189 files); CLOSE FLOOR E74 = 540,785 B measured at G74.0 (I547: 6,100,000 - 5,559,215; headroom >= 102,400 B floor -> cut ladder C1..C4 NOT invoked); prior: CLOSE FLOOR E73 = 557,960 B measured at G73.0 (I542: 6,100,000 - 5,542,040; headroom >= 102,400 B floor -> cut ladder C1..C2 NOT invoked); prior: CLOSE FLOOR E72",
  "dist-tail-floor");
fs.writeFileSync(p, raw, "utf8");
const raw2 = fs.readFileSync(p, "utf8");
console.log("BOMs", (raw2.match(/\uFEFF/g) || []).length, "(before", bomsBefore + ")");
console.log("LEN", raw2.length, "BYTES", Buffer.byteLength(raw2, "utf8"));
for (const n of ["3,212,232", "5,559,215", "CLOSE FLOOR E74 = 540,785 B", "I547 G74.0 measurement"]) {
  console.log(JSON.stringify(n), raw2.indexOf(n));
}
for (const n of ["3,150,354", "(I542 G73.0 gate, code-only); CLOSE FLOOR E73"]) {
  console.log("gone?", JSON.stringify(n), raw2.indexOf(n) === -1);
}