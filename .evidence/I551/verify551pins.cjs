// I551: verify-only pin check against the already-patched config.js (patch applied by cfg551.cjs).
const fs = require("fs");
const path = require("path");
(async () => {
  const cfg = await import("file:///E:/Game/src/core/config.js");
  const lvl = await import("file:///E:/Game/src/core/level.js");
  const sto = await import("file:///E:/Game/src/core/storage.js");
  const C = cfg.CONFIG;
  const pins = {};
  function eq(name, got, want) {
    const ok = JSON.stringify(got) === JSON.stringify(want);
    pins[name] = { got, want, ok };
    if (!ok) throw new Error("PIN FAIL " + name + ": got " + JSON.stringify(got) + " want " + JSON.stringify(want));
  }
  eq("levelCount", lvl.levelCount(), 5);
  eq("levelLength5", lvl.levelLength(5), 440);
  eq("levelLengths", [1, 2, 3, 4, 5].map((l) => lvl.levelLength(l)), [330, 370, 400, 420, 440]);
  eq("campaignLength", lvl.campaignLength(), 1960);
  eq("levelStartDistance5", lvl.levelStartDistance(5), 1520);
  eq("bossDistance5", lvl.bossDistance(5), 440);
  eq("bossKind5", lvl.bossKind(5), "archon");
  eq("bossKinds", [1, 2, 3, 4, 5].map((l) => lvl.bossKind(l)), ["monolith", "splicer", "monolith-prime", "abyssal", "archon"]);
  eq("checkpoints5", lvl.checkpointsForLevel(5), [
    { zone: 1, distance: 0 }, { zone: 2, distance: 100 }, { zone: 3, distance: 220 }, { zone: 4, distance: 350 }
  ]);
  eq("isFinalLevel4", lvl.isFinalLevel(4), false);
  eq("isFinalLevel5", lvl.isFinalLevel(5), true);
  eq("isCampaignComplete5at440", lvl.isCampaignComplete(5, 440), true);
  eq("isCampaignComplete4at420", lvl.isCampaignComplete(4, 420), false);
  eq("palettesZenith", ["zenith-1", "zenith-2", "zenith-3", "zenith-4"].map((p) => C.levels.palettes[p]), [
    { sky: 0x03060f, stars: 0xbcd8ff, floor: 0x0d1830, grid: 0x14243c, accent: 0x2a5cff },
    { sky: 0x040814, stars: 0xc8e0ff, floor: 0x101c36, grid: 0x182a42, accent: 0x2a7aff },
    { sky: 0x050a18, stars: 0xd4e8ff, floor: 0x13203c, grid: 0x1c304a, accent: 0x3d95ff },
    { sky: 0x070c1e, stars: 0xe0f0ff, floor: 0x172444, grid: 0x203654, accent: 0x4da8ff }
  ]);
  eq("cbHp5", C.campaignBoss.hp[5], 175);
  eq("cbPhases5", C.campaignBoss.phases[5], 3);
  eq("cbScore5", C.campaignBoss.score[5], 3400);
  const m = new Map();
  const mem = { get: (k) => (m.has(k) ? m.get(k) : null), set: (k, v) => m.set(k, v), remove: (k) => m.delete(k) };
  const st = new sto.Storage(mem);
  st.setCampaignProgress(99);
  eq("storageClamp99", st.getCampaignProgress(), 5);
  eq("storageNoLower", (st.setCampaignProgress(2), st.getCampaignProgress()), 5);
  eq("storageNoEqual", (st.setCampaignProgress(5), st.getCampaignProgress()), 5);
  fs.writeFileSync(path.resolve(__dirname, "config551.json"), JSON.stringify({ pass: true, pins }, null, 2));
  console.log("CONFIG551 PASS - all pins verified");
})().catch((e) => { console.error("CONFIG551 FAIL:", e.message); process.exit(1); });
