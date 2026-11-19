const fs = require("fs");
const j = JSON.parse(fs.readFileSync(".evidence/I525/sweep525.json", "latin1"));
for (const r of j.runs) {
  const kb = r.killingBlow;
  if (kb && kb.source === "bullet") {
    console.log("seed " + r.seed + " wave " + kb.wave + " attributed=" + kb.attributed);
    console.log("  detail:", JSON.stringify(kb.attribDetail));
  }
}
// also show hitLog tails for 52703 to see its bullet hits
const r3 = j.runs.find(r => r.seed === 52703);
console.log("52703 hitLog:", JSON.stringify(r3.hitLog));