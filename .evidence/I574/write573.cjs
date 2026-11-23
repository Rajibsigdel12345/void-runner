// I574 writer: rules573.md (FROZEN pre-run) + sweep573.mjs (clone of .evidence/I570/sweep569.mjs;
// ONLY changes: header comment, seeds 57300+i, output names, rules refs, and the branch-decision
// block -> the E80 frozen B/A*/C adjudication (design/e80-splicer-wave10-wall-research.md sec.6).
// Kiter + bullet attribution asserted VERBATIM.
const fs = require("fs");
const path = require("path");
const dir = __dirname;

const RULES = `# I574 / ST-541 - E80 PRE-LEVER RE-AUDIT (frozen rules)

Frozen BEFORE running sweep573. Open story: ZERO src changes (harness +
docs only); re-audits the registered Splicer wave-10 wall (sweep571 at
I571: 30/30 died, median death wave 10, H = 0.467 (14/30), SPLICER 8/30,
wave-10 cluster 13/30; same-tree composite H span 0.400-0.667 across
sweep565/567/569/571 - the wall is STABLE, R-2 seed variance) on fresh
seeds, feeding the FROZEN E80 adjudication for lever [2]
(splicer.maxHp 30 -> 24, src/core/config.js:322, one line).

## 1. Protocol (lineage of .evidence/I570/rules569.md, verbatim)

- FULL director from wave 1 (NO isolation): const w = new World(new RNG(seed)); w.begin();
- Cap: 36000 ticks (600 s) at DT = 1/60.
- Pilot: the I328 frozen kiter, VERBATIM as carried in
  .evidence/I570/sweep569.mjs (12 u standoff, weave Math.sin(t/90)*4,
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

## 2. Seed set (I574)

- sweep573: 30 seeds 57300+i, i = 0..29. FRESH seeds (not nested in
  56400/56500/56700/56900/57100) so the pre-lever re-audit is an
  independent confirmation of the Splicer wave-10 wall.

## 3. Adjudication (FROZEN, verbatim from design/e80-splicer-wave10-wall-research.md sec.6)

Thresholds verbatim from rules564: H = (MONOLITH + SPLICER + WARDEN)
share of killing blows; W10 = wave-10 killing-blow cluster /30; W5 =
wave-5 cluster /30.
- (B) H >= 0.600 AND SPLICER = largest single source -> lever [2].
- (A*) 0.400 < H < 0.600 AND SPLICER = largest single source AND
  W10 >= W5 -> lever [2] (the pre-registered single-boss extension -
  the composite premise is MEASURED dead: RETIRES NONE 21/21, 0/23
  Monoliths alive at wave-8 start, so a sub-0.600 H here is seed
  variance on a single-boss wall, not a composite). Recorded WITH
  MEASUREMENT when used.
- (C) otherwise (H <= 0.400, or SPLICER not the largest single source,
  or W10 < W5) -> ST-542 VOID + accept (E78-lever pattern, docs-only
  close).
- "Largest single source" is decided on the PRIMARY killing-blow tally:
  SPLICER must strictly exceed every other single-source class count
  (a tie is NOT "the largest" -> falls through to C). Deterministic.
- Material divergence from design/e80-splicer-wave10-wall-research.md
  -> RECORD + REGISTER before any code change (I570 pattern); the
  extension re-derives nothing.

## 4. Expected outcome (pre-registered)

Reproduce the single-boss Splicer wall: SPLICER the largest single
source, W10 in the 11-16/30 band (sweep569/571/567: 16/13/11), H in the
same-tree 0.400-0.667 span (sweep565/567/569/571) -> adjudication B or
A* most likely; C possible. If the picture is materially different
(e.g. a non-SPLICER source is strictly largest), it is recorded and
registered in I574 before any code change; the frozen lever and
acceptance are NOT re-derived.

## 5. Invariants (unchanged)

- Kiter verbatim; full director; cap 36000 ticks; DT 1/60.
- The 15 hit-event payload tags - no new tags.
- Branch rule source: design/e80-splicer-wave10-wall-research.md sec.6
  (frozen at I573; applied verbatim) - supersedes the generic E70/E79
  branch code in the cloned harness ONLY for the branch-decision block.
- Zero src changes in this story: .evidence-only harness, shipped bundle
  byte-identical (6,430,174 B / 203 expected).

## 6. Label hygiene

- Header line prints the real seeds (57300+i) and the real rules file.
- Denominators print runs.length, not a stale constant.
- The adjudication line prints ALL inputs (H, SPLICER count, W10, W5,
  largest source) so the branch is auditable from results573.txt alone.
- JSON (sweep573.json) + per-run lines remain the authoritative records.
`;

fs.writeFileSync(path.join(dir, "rules573.md"), RULES, "utf8");

const src = fs.readFileSync(path.join(dir, "..", "I570", "sweep569.mjs"), "utf8");

function rep1(s, from, to, label) {
  const i = s.indexOf(from);
  if (i === -1) throw new Error("NOT FOUND: " + label);
  const j = s.indexOf(from, i + 1);
  if (j !== -1) throw new Error("MULTIPLE: " + label);
  return s.slice(0, i) + to + s.slice(i + from.length);
}

const NEWHEADER =
  "// I574 E80 open: pre-lever re-audit of the registered Splicer wave-10 wall (sweep571 at I571: 30/30 died, median death wave 10, H = 0.467, SPLICER 8/30, wave-10 cluster 13/30; same-tree H span 0.400-0.667 across sweep565/567/569/571) through the SAME harness as sweep569.mjs (rules re-frozen in .evidence/I574/rules573.md) with fresh seeds 57300+i, 30 seeds, E80 FROZEN B/A*/C adjudication (design/e80-splicer-wave10-wall-research.md sec.6). Deterministic. Expected: reproduce the single-boss Splicer wall (SPLICER largest single source, W10 11-16/30, H in the 0.400-0.667 span -> adjudication B or A* most likely; C possible).\n" +
  "// 30 seeds 57300+i, FULL director from wave 1 (no isolation), kiter pilot\n" +
  "// (I328 frozen, VERBATIM as carried in .evidence/I570/sweep569.mjs), cap 36000 ticks\n" +
  "// at DT = 1/60. All rules frozen in .evidence/I574/rules573.md (lineage of rules569.md, E80 labels).\n";

const NEWBRANCH =
  "// ---------- E80 adjudication (rules573.md sec.3, FROZEN) ----------\n" +
  "const hFrac = hPrimary / runs.length;\n" +
  "const splCount = tPrimary.SPLICER || 0;\n" +
  "const largestSource = Object.keys(tPrimary).length ? Object.entries(tPrimary).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0][0] : null;\n" +
  "const largestCount = largestSource ? tPrimary[largestSource] : 0;\n" +
  "const splLargest = splCount > 0 && Object.entries(tPrimary).every(([k, c]) => k === \"SPLICER\" || c < splCount);\n" +
  "const w10 = runs.filter(r => r.died && r.killingBlow && r.killingBlow.wave === 10).length;\n" +
  "const w5 = runs.filter(r => r.died && r.killingBlow && r.killingBlow.wave === 5).length;\n" +
  "const hLabel = hFrac >= 0.600 ? \">= 0.600\" : (hFrac <= 0.400 ? \"<= 0.400\" : \"in (0.400, 0.600)\");\n" +
  "let branch;\n" +
  "if (hFrac >= 0.600 && splLargest) {\n" +
  "  branch = \"B (heavyweight wall): H \" + hFrac.toFixed(3) + \" >= 0.600 AND SPLICER largest single source -> E70 frozen lever [2] splicer.maxHp 30 -> 24 (ST-542/I575)\";\n" +
  "} else if (hFrac > 0.400 && hFrac < 0.600 && splLargest && w10 >= w5) {\n" +
  "  branch = \"A* (pre-registered single-boss extension): 0.400 < H \" + hFrac.toFixed(3) + \" < 0.600 AND SPLICER largest AND W10 \" + w10 + \" >= W5 \" + w5 + \" -> E70 frozen lever [2] splicer.maxHp 30 -> 24 (ST-542/I575; recorded WITH MEASUREMENT)\";\n" +
  "} else {\n" +
  "  branch = \"C (accept-with-documentation): ST-542 VOID (H \" + hFrac.toFixed(3) + \" \" + hLabel + \"; SPLICER \" + splCount + \"/\" + runs.length + (splLargest ? \" = largest\" : \" NOT largest (largest=\" + largestSource + \" \" + largestCount + \")\") + \"; W10 \" + w10 + \"/\" + runs.length + \"; W5 \" + w5 + \"/\" + runs.length + \") -> E78-lever pattern, docs-only close\";\n" +
  "}";

let s = src;
const hEnd = s.indexOf("import { World }");
if (hEnd === -1) throw new Error("header end not found");
s = NEWHEADER + s.slice(hEnd);

s = rep1(s, "const SEEDS = Array.from({ length: 30 }, (_, i) => 56900 + i);",
  "const SEEDS = Array.from({ length: 30 }, (_, i) => 57300 + i);", "seeds");
s = rep1(s, 'tag: "sweep569"', 'tag: "sweep573"', "tag");
s = rep1(s, '"./sweep569.json"', '"./sweep573.json"', "json name");
s = rep1(s, 'frozen: ".evidence/I570/rules569.md",', 'frozen: ".evidence/I574/rules573.md",', "frozen ref");
s = rep1(s, '"./results569.txt"', '"./results573.txt"', "results name");
s = rep1(s,
  'lines.push("I570 E79 open (30 seeds 56900+i, full director, kiter, cap " + CAP + " ticks) - pre-lever re-audit of the composite post-E77 wall (Branch C cross-check of sweep567)");',
  'lines.push("I574 E80 (30 seeds 57300+i, full director, kiter, cap " + CAP + " ticks) - pre-lever re-audit of the Splicer wave-10 wall (E80 B/A*/C adjudication)");',
  "results header");
s = rep1(s,
  'lines.push("rules: .evidence/I570/rules569.md   generated ',
  'lines.push("rules: .evidence/I574/rules573.md   generated ',
  "rules line");
s = rep1(s,
  'lines.push("FRACTION H primary: " + (hPrimary/runs.length).toFixed(3) + " (" + hPrimary + "/" + runs.length + ")   BRANCH DECISION: " + branch);',
  'lines.push("FRACTION H primary: " + (hPrimary/runs.length).toFixed(3) + " (" + hPrimary + "/" + runs.length + ")   BRANCH DECISION: " + branch);\n' +
  'lines.push("ADJUDICATION INPUTS: H " + hPrimary + "/" + runs.length + " (" + hFrac.toFixed(3) + ") | SPLICER " + splCount + "/" + runs.length + (splLargest ? " [largest single source]" : " [NOT largest; largest=" + largestSource + " " + largestCount + "]") + " | W10 " + w10 + "/" + runs.length + " | W5 " + w5 + "/" + runs.length);',
  "adjudication line");

const bStart = s.indexOf("let branch;\nif (hPrimary >= Math.ceil(0.6 * runs.length)) {");
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
if (s.indexOf("56900") !== -1) throw new Error("stale 56900 label remains");

const body = s.slice(s.indexOf("import { World }"));
for (const bad of ["56900", "rules569.md", "sweep569.json", 'tag: "sweep569"']) {
  if (body.indexOf(bad) !== -1) throw new Error("stale label in body: " + bad);
}

fs.writeFileSync(path.join(dir, "sweep573.mjs"), s, "utf8");
console.log("rules573.md bytes:", fs.statSync(path.join(dir, "rules573.md")).size);
console.log("sweep573.mjs bytes:", fs.statSync(path.join(dir, "sweep573.mjs")).size);
console.log("OK: kiter + attribution verbatim; all 8 targeted replacements unique; no stale labels");
