const d = require("../I574/sweep573.json");
const runs = d.runs;
for (const r of runs) {
  const kb = r.killingBlow;
  if (kb.wave===5 || kb.wave===6) {
    console.log([
      "seed", r.seed, "w", kb.wave,
      "src", kb.source, "exact", kb.clsExact, "primary", kb.clsPrimary,
      "mp", kb.monolithProbable,
      "v", kb.attribDetail&&kb.attribDetail.v, "why", kb.attribDetail&&kb.attribDetail.why,
      "score", kb.score.score, "kills", kb.score.kills
    ].join(" | "));
  }
}