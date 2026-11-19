const fs = require("fs");
const p = ".evidence/I525/sweep525.mjs";
let b = fs.readFileSync(p, "latin1");
function rep1(anchor, repl, label) {
  const c = b.split(anchor).length - 1;
  if (c !== 1) { console.error("FAIL " + label + ": occurrences " + c); process.exit(1); }
  b = b.replace(anchor, repl);
  console.log("ok " + label);
}
rep1(
  'if (d.source === "bullet") { clsExact = d.attributed; clsPrimary = d.attributed; }',
  'const BMAP = { boss_monolith: "MONOLITH", boss_splicer: "SPLICER" };\n          if (d.source === "bullet") { clsExact = d.attributed; clsPrimary = BMAP[d.attributed] || d.attributed; }',
  "bullet-class-map"
);
rep1(
  'const cleared = rows.map(x => x.clearSecs).filter(x => x !== null);',
  'const cleared = rows.map(x => x.clearTick ? (x.clearTick - x.startTick) * DT : null).filter(x => x !== null);',
  "clearsecs"
);
rep1(
  ': "ALIVE at cap (wave " + (r.waveTable ? "?" : "?") + ")");',
  ': "ALIVE at cap (wave " + (Object.keys(r.waveTable).length ? Math.max(...Object.keys(r.waveTable).map(Number)) : 0) + ")");',
  "alive-line"
);
fs.writeFileSync(p, b, "latin1");
console.log("patched, bytes:", b.length);