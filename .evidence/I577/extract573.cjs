const d = require("../I574/sweep573.json");
const runs = d.runs;
console.log("tag:", d.tag, "| dt:", d.dt, "| cap:", d.cap, "| n:", runs.length);
const prim = {};
for (const r of runs) prim[r.killingBlow.clsPrimary] = (prim[r.killingBlow.clsPrimary]||0)+1;
console.log("distinct clsPrimary:", JSON.stringify(prim));
const byWave = {};
for (const r of runs) {
  const w = r.killingBlow.wave, p = r.killingBlow.clsPrimary;
  byWave[w] = byWave[w] || {};
  byWave[w][p] = (byWave[w][p]||0)+1;
}
console.log("death wave x primary:");
for (const [w,m] of Object.entries(byWave).sort((a,b)=>+a[0]-+b[0])) console.log("  wave", w, JSON.stringify(m));
console.log("--- wave 5/6 death detail ---");
for (const r of runs) {
  const kb = r.killingBlow;
  if (kb.wave===5 || kb.wave===6) {
    const wt = r.waveTable["5"]||{};
    console.log([
      "seed", r.seed, "wave", kb.wave, "primary", kb.clsPrimary,
      "monoProb", kb.monolithProbable, "why", kb.attribDetail&&kb.attribDetail.why,
      "v", kb.attribDetail&&kb.attribDetail.v, "r", kb.attribDetail&&kb.attribDetail.r,
      "score", kb.score.score, "kills", kb.score.kills, "lives", kb.resources.livesUsed,
      "wpn", kb.resources.weaponLevel, "bomb", kb.resources.bombs,
      "w5start", wt.startTick, "w5clear", wt.clearTick, "w5secs", wt.clearSecs,
      "bossDeaths", JSON.stringify(r.bossDeaths), "deathTick", kb.tick
    ].join(" | "));
  }
}
let h=0; for (const r of runs){const p=r.killingBlow.clsPrimary; if(p==="monolith"||p==="splicer"||p==="warden")h++;}
console.log("H =", h, "/", runs.length, "=", (h/runs.length).toFixed(3));