// I582 writer: sweep581.mjs (clone of .evidence/I578/sweep577.mjs;
// ONLY changes: header comment, seeds 58100+i, output names (sweep581.json,
// results581.txt), rules refs, the M56' metric computation, and the
// branch-decision block -> the E82 FROZEN 4-branch B/A*/G/C adjudication
// (design/e82-monolith-wave5-wall-ii-research.md sec.6, verbatim).
// Kiter + bullet attribution asserted VERBATIM.
// NOTE: rules581.md (FROZEN PRE-RUN) was written directly (separate step,
// same directory); this builder transforms the harness only. House pattern
// of .evidence/I578/write577.cjs.
const fs = require("fs");
const path = require("path");
const dir = __dirname;

const src = fs.readFileSync(path.join(dir, "..", "I578", "sweep577.mjs"), "utf8");

function rep1(s, from, to, label) {
  const i = s.indexOf(from);
  if (i === -1) throw new Error("NOT FOUND: " + label);
  const j = s.indexOf(from, i + 1);
  if (j !== -1) throw new Error("MULTIPLE: " + label);
  return s.slice(0, i) + to + s.slice(i + from.length);
}

const NEWHEADER =
  "// I582 E82 open: pre-lever re-audit of the registered wave-5 Monolith wall (sweep577 at I578: 30/30 died, median death wave 9, wave-5/6 band 11/30; MONOLITH-primary 7/30 + post-kill residual 4/30 [deltas 4/54/72/77 ticks, all within the frozen 180-tick window -> M56' = 11/30 vs E81 M56 = 7/30]; same-tree wave-5 band span 7-12/30 across sweep567/569/571/573/577 - STABLE, R-2 seed variance; I581 extraction: ALL 11 band deaths are BOLTS, inFight 7 + postKillResidual 4, V-DECODE burst-class 10 / aimed-class 1 / ambiguous 0, ZERO rock/contact in the band) through the SAME harness as sweep577.mjs (rules re-frozen in .evidence/I582/rules581.md) with fresh seeds 58100+i, 30 seeds, E82 FROZEN 4-branch B/A*/G/C adjudication (design/e82-monolith-wave5-wall-ii-research.md sec.6 - gap-free tiling of the (B56, M56') space, the E81 PROCESS FINDING (d) fix). Deterministic. Expected: reproduce the wave-5 Monolith wall (B56 in the 7-12/30 band -> B or A* most likely; G or C possible).\n" +
  "// 30 seeds 58100+i, FULL director from wave 1 (no isolation), kiter pilot\n" +
  "// (I328 frozen, VERBATIM as carried in .evidence/I574/sweep573.mjs), cap 36000 ticks\n" +
  "// at DT = 1/60. All rules frozen in .evidence/I582/rules581.md (lineage of rules577.md, E82 labels).\n";

const NEWBRANCH =
  "// ---------- E82 adjudication (rules581.md sec.3, FROZEN - 4 cells, gap-free; verbatim from design/e82-monolith-wave5-wall-ii-research.md sec.6) ----------\n" +
  "const b56 = runs.filter(r => r.died && r.killingBlow && (r.killingBlow.wave === 5 || r.killingBlow.wave === 6)).length;\n" +
  "const m56 = runs.filter(r => r.died && r.killingBlow && (r.killingBlow.wave === 5 || r.killingBlow.wave === 6) && r.killingBlow.clsPrimary === \"MONOLITH\").length; // E81 def - reported for R-6 comparability only, NOT adjudicated on\n" +
  "const m56p = runs.filter(r => {\n" +
  "  if (!r.died || !r.killingBlow) return false;\n" +
  "  const kb = r.killingBlow;\n" +
  "  if (kb.wave !== 5 && kb.wave !== 6) return false;\n" +
  "  if (kb.clsPrimary === \"MONOLITH\") return true;\n" +
  "  if (kb.clsPrimary === \"bullet_unknown\") {\n" +
  "    return (r.bossDeaths || []).some(b => b.kind === \"monolith\" && b.tick <= kb.tick && kb.tick - b.tick <= 180);\n" +
  "  }\n" +
  "  return false;\n" +
  "}).length; // M56' FROZEN (E82 doc sec.6; 180-tick = 3 s window sized by the measured post-kill residuals)\n" +
  "let branch;\n" +
  "if (b56 >= 12) {\n" +
  "  branch = \"B (Monolith wave-5 wall): B56 \" + b56 + \"/\" + runs.length + \" >= 12/30 -> apply the FROZEN E82 lever boss.burst.every 4.0 -> 4.8 (ST-550/I583)\";\n" +
  "} else if (b56 >= 10 && b56 <= 11 && m56p >= 8) {\n" +
  "  branch = \"A* (pre-registered single-boss extension): B56 \" + b56 + \"/\" + runs.length + \" in [10,11] AND M56' \" + m56p + \"/\" + runs.length + \" >= 8/30 -> apply the FROZEN E82 lever boss.burst.every 4.0 -> 4.8 (ST-550/I583; recorded WITH MEASUREMENT)\";\n" +
  "} else if (b56 >= 10 && b56 <= 11 && m56p <= 7) {\n" +
  "  branch = \"G (C-equivalent accept): ST-550 VOID + accept + document (B56 \" + b56 + \"/\" + runs.length + \" in [10,11]; M56' \" + m56p + \"/\" + runs.length + \" <= 7/30) -> the cell UNCOVERED at E81 under the M56-only metric (E82 doc sec.6)\";\n" +
  "} else {\n" +
  "  branch = \"C (accept-with-documentation): ST-550 VOID (B56 \" + b56 + \"/\" + runs.length + \" <= 9/30; M56' \" + m56p + \"/\" + runs.length + \") -> E78-lever pattern, docs-only close\";\n" +
  "}";

let s = src;
const hEnd = s.indexOf("import { World }");
if (hEnd === -1) throw new Error("header end not found");
s = NEWHEADER + s.slice(hEnd);

s = rep1(s, "const SEEDS = Array.from({ length: 30 }, (_, i) => 57700 + i);",
  "const SEEDS = Array.from({ length: 30 }, (_, i) => 58100 + i);", "seeds");
s = rep1(s, 'tag: "sweep577"', 'tag: "sweep581"', "tag");
s = rep1(s, '"./sweep577.json"', '"./sweep581.json"', "json name");
s = rep1(s, 'frozen: ".evidence/I578/rules577.md",', 'frozen: ".evidence/I582/rules581.md",', "frozen ref");
s = rep1(s, '"./results577.txt"', '"./results581.txt"', "results name");
s = rep1(s,
  'lines.push("I578 E81 (30 seeds 57700+i, full director, kiter, cap " + CAP + " ticks) - pre-lever re-audit of the Monolith wave-5 wall (E81 B/A*/C adjudication)");',
  'lines.push("I582 E82 (30 seeds 58100+i, full director, kiter, cap " + CAP + " ticks) - pre-lever re-audit of the Monolith wave-5 wall (E82 4-branch B/A*/G/C adjudication)");',
  "results header");
s = rep1(s,
  'lines.push("rules: .evidence/I578/rules577.md   generated ',
  'lines.push("rules: .evidence/I582/rules581.md   generated ',
  "rules line");
s = rep1(s,
  'lines.push("ADJUDICATION INPUTS: B56 " + b56 + "/" + runs.length + " (wave 5-6 band, any attribution) | M56 " + m56 + "/" + runs.length + " (band AND clsPrimary MONOLITH)");',
  'lines.push("ADJUDICATION INPUTS: B56 " + b56 + "/" + runs.length + " (wave 5-6 band, any attribution) | M56 " + m56 + "/" + runs.length + " (band AND clsPrimary MONOLITH; E81 def - R-6 comparability only) | M56\' " + m56p + "/" + runs.length + " (band AND [MONOLITH primary OR bullet_unknown + monolithDeath within 180 ticks BEFORE death]; FROZEN E82 def - ADJUDICATED ON M56\')");',
  "adjudication line");

const bStart = s.indexOf("// ---------- E81 adjudication (rules577.md sec.3, FROZEN) ----------");
if (bStart === -1) throw new Error("branch block start not found");
const bEndMark = "\n\nconst med = ";
const bEnd = s.indexOf(bEndMark, bStart);
if (bEnd === -1) throw new Error("branch block end not found");
s = s.slice(0, bStart) + NEWBRANCH + s.slice(bEnd);

function extract(s2, from, toMark) {
  const i = s2.indexOf(from);
  if (i === -1) throw new Error("extract from not found: " + from.slice(0, 40));
  const j = s2.indexOf(toMark, i + from.length);
  if (j === -1) throw new Error("extract to not found: " + toMark.slice(0, 40));
  return s2.slice(i, j);
}
if (extract(src, "const PILOTS = {", "};\n\nconst TIMED") !== extract(s, "const PILOTS = {", "};\n\nconst TIMED")) throw new Error("KITER NOT VERBATIM");
if (extract(src, "function attributeBullet(w, st, evData, tick) {", "\n}\n\nfunction runSweep(seed) {") !== extract(s, "function attributeBullet(w, st, evData, tick) {", "\n}\n\nfunction runSweep(seed) {")) throw new Error("ATTRIBUTION NOT VERBATIM");

const body = s.slice(s.indexOf("import { World }"));
for (const bad of ["57700", "rules577", "sweep577", "results577", "I578", "ST-545", "E81 adjudication", "E81 B/A*/C"]) {
  if (body.indexOf(bad) !== -1) throw new Error("stale label in body: " + bad);
}

fs.writeFileSync(path.join(dir, "sweep581.mjs"), s, "utf8");
console.log("sweep581.mjs bytes:", fs.statSync(path.join(dir, "sweep581.mjs")).size);
console.log("OK: kiter + attribution verbatim; all targeted replacements unique; no stale labels");