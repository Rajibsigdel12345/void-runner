// I551 (ST-517, E75) D2: patch config.js with Level 5 "Zenith Spire" data.
// File = BOM + mixed EOLs. Preserves BOM bytes, matches local EOL at each
// insert point, unique-anchor replaceOnce checks, then re-imports the patched
// module and asserts every pin value WITH MEASUREMENT.
const fs = require("fs");
const path = require("path");

const FILE = path.resolve(__dirname, "..", "..", "src", "core", "config.js");
const raw = fs.readFileSync(FILE);
if (raw.slice(0, 3).toString("hex") !== "efbbbf") throw new Error("BOM missing at start");
let s = raw.toString("utf8");

function eolAt(str, idx) { // EOL of the line starting at/after idx
  const cr = str.indexOf("\r", idx);
  const lf = str.indexOf("\n", idx);
  if (cr !== -1 && lf === cr + 1) return "\r\n";
  return "\n";
}
function replaceOnce(str, anchor, replacement, label) {
  const c = str.split(anchor).length - 1;
  if (c !== 1) throw new Error("anchor count " + c + " != 1 for " + label);
  return str.replace(anchor, replacement);
}

// --- Edit 1: new level row after the L4 row ---
const l4zone = "{ name: 'Necro Gauntlet',  length: 90,  paletteId: 'reef-4', hazardProfile: 'gauntlet', enemyMix: ['phantom', 'hauler', 'bulwark', 'mine'], optionalTargets: ['rapid', 'shielded'], checkpointAt: 0 }";
s = replaceOnce(s, l4zone, l4zone, "L4 zone4 line");
const closeIdx = s.indexOf(l4zone) + l4zone.length;
const eol1 = eolAt(s, closeIdx); // EOL after the zone4 line
const tail = "      ] },";
const tailIdx = s.indexOf(tail, closeIdx);
const eol2 = eolAt(s, tailIdx + tail.length); // EOL after the L4 level close
const l5 = [
  "      { name: 'Zenith Spire', boss: 'archon', zones: [ // ST-517 (E75): final level; 'archon' kind lands D4/ST-519 - until then the monolith tint fallback applies (game.js)",
  "        { name: 'Spire Approach',   length: 100, paletteId: 'zenith-1', hazardProfile: 'moderate', enemyMix: ['phantom', 'drone', 'mine'],            optionalTargets: ['golden'],   checkpointAt: 0 },",
  "        { name: 'Halo Circuit',     length: 120, paletteId: 'zenith-2', hazardProfile: 'dense',    enemyMix: ['hunter', 'stinger', 'mine'],           optionalTargets: ['shielded'], checkpointAt: 0 },",
  "        { name: 'Crown Ascent',     length: 130, paletteId: 'zenith-3', hazardProfile: 'gauntlet', enemyMix: ['gunship', 'sentry', 'wasp'],           optionalTargets: ['pod'],      checkpointAt: 0 },",
  "        { name: 'Archon Threshold', length: 90,  paletteId: 'zenith-4', hazardProfile: 'gauntlet', enemyMix: ['phantom', 'bulwark', 'hunter', 'mine'], optionalTargets: ['rapid', 'shielded'], checkpointAt: 0 }",
  "      ] },"
].join(eol2);
s = s.slice(0, tailIdx + tail.length) + eol2 + l5 + s.slice(tailIdx + tail.length + eol2.length);

// --- Edit 2: zenith palettes after reef-4 (add trailing comma to reef-4) ---
const reef4 = "'reef-4': { sky: 0x0c0418, stars: 0xffc0f0, floor: 0x2c1648, grid: 0x3c2260, accent: 0xff3dd6 }";
const rIdx = s.indexOf(reef4);
if (s.split(reef4).length - 1 !== 1) throw new Error("reef-4 anchor count != 1");
const eol3 = eolAt(s, rIdx + reef4.length);
const zen = [
  "'zenith-1': { sky: 0x03060f, stars: 0xbcd8ff, floor: 0x0d1830, grid: 0x14243c, accent: 0x2a5cff },",
  "'zenith-2': { sky: 0x040814, stars: 0xc8e0ff, floor: 0x101c36, grid: 0x182a42, accent: 0x2a7aff },",
  "'zenith-3': { sky: 0x050a18, stars: 0xd4e8ff, floor: 0x13203c, grid: 0x1c304a, accent: 0x3d95ff },",
  "'zenith-4': { sky: 0x070c1e, stars: 0xe0f0ff, floor: 0x172444, grid: 0x203654, accent: 0x4da8ff }"
].map((l) => "      " + l).join(eol3);
s = s.slice(0, rIdx + reef4.length) + "," + eol3 + zen + s.slice(rIdx + reef4.length);

// --- Edit 3: campaignBoss per-level stats ---
const hpA = "hp: { 1: 96, 2: 110, 3: 130, 4: 150 }, // per-level HP (climbing; the weak point gates TTK) ST-486 (E69): +L4";
const hpB = "hp: { 1: 96, 2: 110, 3: 130, 4: 150, 5: 175 }, // per-level HP (climbing; the weak point gates TTK) ST-486 (E69): +L4, ST-517 (E75): +L5";
s = replaceOnce(s, hpA, hpB, "campaignBoss.hp");
const phA = "phases: { 1: 3, 2: 1, 3: 1, 4: 1 }, // C3: L1 full 3-phase; L2-4 single-phase (ST-486: L4 abyssal)";
const phB = "phases: { 1: 3, 2: 1, 3: 1, 4: 1, 5: 3 }, // C3: L1 full 3-phase; L2-4 single-phase (ST-486: L4 abyssal; ST-517: L5 archon 3-phase)";
s = replaceOnce(s, phA, phB, "campaignBoss.phases");
const scA = "score: { 1: 1000, 2: 1400, 3: 2000, 4: 2600 },";
const scB = "score: { 1: 1000, 2: 1400, 3: 2000, 4: 2600, 5: 3400 },";
s = replaceOnce(s, scA, scB, "campaignBoss.score");

// --- Write: preserve BOM + all untouched bytes ---
const body = Buffer.from(s, "utf8");
fs.writeFileSync(FILE, Buffer.concat([raw.slice(0, 3), body]));
const check = fs.readFileSync(FILE);
if (check.slice(0, 3).toString("hex") !== "efbbbf") throw new Error("BOM lost after write");
console.log("write OK, bytes before", raw.length, "after", check.length, "delta", check.length - raw.length);

// --- Verify WITH MEASUREMENT: import patched module, assert pins ---
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
  // storage clamp to new levelCount
  const m = new Map();
  const mem = { get: (k) => (m.has(k) ? m.get(k) : null), set: (k, v) => m.set(k, v), remove: (k) => m.delete(k) };
  const st = new sto.Storage(mem);
  st.setCampaignStartLevel(99);
  eq("storageClamp99", st.getCampaignStartLevel(), 5);
  fs.writeFileSync(path.resolve(__dirname, "config551.json"), JSON.stringify({ pass: true, pins }, null, 2));
  console.log("CONFIG551 PASS - all pins verified");
})().catch((e) => { console.error("CONFIG551 FAIL:", e.message); process.exit(1); });
