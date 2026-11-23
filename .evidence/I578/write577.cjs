// I578 writer: rules577.md (FROZEN pre-run) + sweep577.mjs (clone of .evidence/I574/sweep573.mjs;
// ONLY changes: header comment, seeds 57700+i, output names, rules refs, and the branch-decision
// block -> the E81 frozen B/A*/C adjudication (design/e81-monolith-wave5-wall-research.md sec.6).
// Kiter + bullet attribution asserted VERBATIM.
const fs = require("fs");
const path = require("path");
const dir = __dirname;

const RULES = `# I578 / ST-545 - E81 PRE-LEVER RE-AUDIT (frozen rules)

Frozen BEFORE running sweep577. Open story: ZERO src changes (harness +
docs only); re-audits the registered wave-5 Monolith wall (sweep573 at
I574: 30/30 died, median death wave 9, wave-5/6 band 13/30 = largest
wave band, MONOLITH 10/30 = largest single source, H = 0.567 (17/30);
same-tree wave-5 band span 7-12/30 across sweep567/569/571/573 - the
wall is STABLE, R-2 seed variance; I577 death-detail extraction: ALL 13
band deaths are BOLTS, 10 MONOLITH-primary + 3 post-kill residual,
ZERO rock/contact in the band) on fresh seeds, feeding the FROZEN E81
adjudication for the E81 lever (boss.burst.every 4.0 -> 4.8,
src/core/config.js:300, one line).

## 1. Protocol (lineage of .evidence/I574/rules573.md, verbatim)

- FULL director from wave 1 (NO isolation): const w = new World(new RNG(seed)); w.begin();
- Cap: 36000 ticks (600 s) at DT = 1/60.
- Pilot: the I328 frozen kiter, VERBATIM as carried in
  .evidence/I574/sweep573.mjs (12 u standoff, weave Math.sin(t/90)*4,
  fire < 18 u, x2 repulsion, no-target -> center thrust + fire t%30).
- Run ends at w.gameOver (lives -> 0) or the cap. A capped run is
  recorded with died=false and contributes no killing blow.
- Killing-blow attribution: the 15 payload tags on the hit events
  (I525, permanent telemetry) + clsPrimary resolution per the I525 rules
  (monolith probable rocks included in the primary tally, reported
  separately in strict).
- Threat list: the rules564 extended list (sweeper w18+ wgt 1.5; beacon
  w19+ wgt 2 physical-only; speed-8 bolt attribution sweeper > mine).
  UNCHANGED.

## 2. Seed set (I578)

- sweep577: 30 seeds 57700+i, i = 0..29. FRESH seeds (not nested in
  56400/56500/56700/56900/57100/57300) so the pre-lever re-audit is an
  independent confirmation of the wave-5 Monolith wall.

## 3. Adjudication (FROZEN, verbatim from design/e81-monolith-wave5-wall-research.md sec.6)

Metrics (frozen): B56 = deaths on wave in {5,6} (any attribution) -
baseline 13/30 (sweep573); M56 = deaths on wave in {5,6} AND
clsPrimary == MONOLITH - baseline 10/30.
- (B) B56 >= 12/30 -> apply the lever (boss.burst.every 4.0 -> 4.8).
- (A*) 10 <= B56 <= 11 AND M56 >= 8/30 -> apply the lever (the
  pre-registered single-boss extension - justified by the MEASURED
  single-boss premise: the same fight every time; a sub-12 band here is
  seed variance on a single-boss wall, not wall absence). Recorded WITH
  MEASUREMENT when used.
- (C) B56 <= 9/30 -> ST-546 VOID + accept (E78-lever pattern, docs-only
  close).
- Material divergence from design/e81-monolith-wave5-wall-research.md
  -> RECORD + REGISTER before any code change (I570 pattern); the
  extension re-derives nothing.

## 4. Expected outcome (pre-registered)

Reproduce the wave-5 Monolith wall: B56 in the same-tree 7-12/30 band
(sweep567/569/571/573: 10/7/9/12), M56 tracking MONOLITH-primary in the
band (sweep573: 10/30) -> adjudication B or A* most likely; C possible
if the band lands <= 9/30. If the picture is materially different
(e.g. the band is dominated by non-bolt deaths, or a non-MONOLITH
source dominates MONOLITH-primary in the band), it is recorded and
registered in I578 before any code change; the frozen lever and
acceptance are NOT re-derived.

## 5. Invariants (unchanged)

- Kiter verbatim; full director; cap 36000 ticks; DT 1/60.
- The 15 hit-event payload tags - no new tags.
- Branch rule source: design/e81-monolith-wave5-wall-research.md sec.6
  (frozen at I577; applied verbatim) - supersedes the generic E70/E79
  branch code in the cloned harness ONLY for the branch-decision block.
- Zero src changes in this story: .evidence-only harness, shipped bundle
  byte-identical (6,430,174 B / 203 expected).

## 6. Label hygiene

- Header line prints the real seeds (57700+i) and the real rules file.
- Denominators print runs.length, not a stale constant.
- The adjudication line prints ALL inputs (B56, M56) so the branch is
  auditable from results577.txt alone.
- JSON (sweep577.json) + per-run lines remain the authoritative records.
`;

fs.writeFileSync(path.join(dir, "rules577.md"), RULES, "utf8");

const src = fs.readFileSync(path.join(dir, "..", "I574", "sweep573.mjs"), "utf8");

function rep1(s, from, to, label) {
  const i = s.indexOf(from);
  if (i === -1) throw new Error("NOT FOUND: " + label);
  const j = s.indexOf(from, i + 1);
  if (j !== -1) throw new Error("MULTIPLE: " + label);
  return s.slice(0, i) + to + s.slice(i + from.length);
}

const NEWHEADER =
  "// I578 E81 open: pre-lever re-audit of the registered wave-5 Monolith wall (sweep573 at I574: 30/30 died, median death wave 9, wave-5/6 band 13/30 (largest wave band), MONOLITH 10/30 = largest single source, H 0.567 (17/30); same-tree wave-5 band span 7-12/30 across sweep565/567/569/571/573; I577 extraction: ALL 13 band deaths are BOLTS, 10 MONOLITH-primary + 3 post-kill residual, ZERO rock/contact in the band) through the SAME harness as sweep573.mjs (rules re-frozen in .evidence/I578/rules577.md) with fresh seeds 57700+i, 30 seeds, E81 FROZEN B/A*/C adjudication (design/e81-monolith-wave5-wall-research.md sec.6). Deterministic. Expected: reproduce the wave-5 Monolith wall (B56 in the 7-12/30 band -> adjudication B or A* most likely; C possible).\n" +
  "// 30 seeds 57700+i, FULL director from wave 1 (no isolation), kiter pilot\n" +
  "// (I328 frozen, VERBATIM as carried in .evidence/I574/sweep573.mjs), cap 36000 ticks\n" +
  "// at DT = 1/60. All rules frozen in .evidence/I578/rules577.md (lineage of rules573.md, E81 labels).\n";

const NEWBRANCH =
  "// ---------- E81 adjudication (rules577.md sec.3, FROZEN) ----------\n" +
  "const b56 = runs.filter(r => r.died && r.killingBlow && (r.killingBlow.wave === 5 || r.killingBlow.wave === 6)).length;\n" +
  "const m56 = runs.filter(r => r.died && r.killingBlow && (r.killingBlow.wave === 5 || r.killingBlow.wave === 6) && r.killingBlow.clsPrimary === \"MONOLITH\").length;\n" +
  "let branch;\n" +
  "if (b56 >= 12) {\n" +
  "  branch = \"B (Monolith wave-5 wall): B56 \" + b56 + \"/\" + runs.length + \" >= 12/30 -> apply the FROZEN E81 lever boss.burst.every 4.0 -> 4.8 (ST-546/I579)\";\n" +
  "} else if (b56 >= 10 && b56 <= 11 && m56 >= 8) {\n" +
  "  branch = \"A* (pre-registered single-boss extension): B56 \" + b56 + \"/\" + runs.length + \" in [10,11] AND M56 \" + m56 + \"/\" + runs.length + \" >= 8/30 -> apply the FROZEN E81 lever boss.burst.every 4.0 -> 4.8 (ST-546/I579; recorded WITH MEASUREMENT)\";\n" +
  "} else {\n" +
  "  branch = \"C (accept-with-documentation): ST-546 VOID (B56 \" + b56 + \"/\" + runs.length + \" <= 9/30; M56 \" + m56 + \"/\" + runs.length + \") -> E78-lever pattern, docs-only close\";\n" +
  "}";

let s = src;
const hEnd = s.indexOf("import { World }");
if (hEnd === -1) throw new Error("header end not found");
s = NEWHEADER + s.slice(hEnd);

s = rep1(s, "const SEEDS = Array.from({ length: 30 }, (_, i) => 57300 + i);",
  "const SEEDS = Array.from({ length: 30 }, (_, i) => 57700 + i);", "seeds");
s = rep1(s, 'tag: "sweep573"', 'tag: "sweep577"', "tag");
s = rep1(s, '"./sweep573.json"', '"./sweep577.json"', "json name");
s = rep1(s, 'frozen: ".evidence/I574/rules573.md",', 'frozen: ".evidence/I578/rules577.md",', "frozen ref");
s = rep1(s, '"./results573.txt"', '"./results577.txt"', "results name");
s = rep1(s,
  'lines.push("I574 E80 (30 seeds 57300+i, full director, kiter, cap " + CAP + " ticks) - pre-lever re-audit of the Splicer wave-10 wall (E80 B/A*/C adjudication)");',
  'lines.push("I578 E81 (30 seeds 57700+i, full director, kiter, cap " + CAP + " ticks) - pre-lever re-audit of the Monolith wave-5 wall (E81 B/A*/C adjudication)");',
  "results header");
s = rep1(s,
  'lines.push("rules: .evidence/I574/rules573.md   generated ',
  'lines.push("rules: .evidence/I578/rules577.md   generated ',
  "rules line");
s = rep1(s,
  'lines.push("ADJUDICATION INPUTS: H " + hPrimary + "/" + runs.length + " (" + hFrac.toFixed(3) + ") | SPLICER " + splCount + "/" + runs.length + (splLargest ? " [largest single source]" : " [NOT largest; largest=" + largestSource + " " + largestCount + "]") + " | W10 " + w10 + "/" + runs.length + " | W5 " + w5 + "/" + runs.length);',
  'lines.push("ADJUDICATION INPUTS: B56 " + b56 + "/" + runs.length + " (wave 5-6 band, any attribution) | M56 " + m56 + "/" + runs.length + " (band AND clsPrimary MONOLITH)");',
  "adjudication line");

const bStart = s.indexOf("// ---------- E80 adjudication (rules573.md sec.3, FROZEN) ----------");
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
for (const bad of ["57300", "rules573", "sweep573", 'tag: "sweep573"', "results573", "I574", "E80", "ST-542", "Splicer wave-10", "sweep571"]) {
  if (body.indexOf(bad) !== -1) throw new Error("stale label in body: " + bad);
}

fs.writeFileSync(path.join(dir, "sweep577.mjs"), s, "utf8");
console.log("rules577.md bytes:", fs.statSync(path.join(dir, "rules577.md")).size);
console.log("sweep577.mjs bytes:", fs.statSync(path.join(dir, "sweep577.mjs")).size);
console.log("OK: kiter + attribution verbatim; all targeted replacements unique; no stale labels");