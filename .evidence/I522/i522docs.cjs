const fs = require("fs");
let fails = 0;
function hex16(p) { return fs.readFileSync(p).slice(0, 16).toString("hex"); }
function rep1(s, a, r, label) { const n = s.split(a).length - 1; if (n !== 1) { console.log("FAIL " + label + " anchor count " + n); fails++; throw new Error(label); } return s.split(a).join(r); }
function edit(p, fn, label) {
  const before = hex16(p);
  const b = fs.readFileSync(p);
  const s = b.toString("latin1");
  const out = fn(s);
  fs.writeFileSync(p, Buffer.from(out, "latin1"));
  const after = hex16(p);
  if (before !== after) { console.log("FAIL " + label + " BOM/head bytes changed " + before + " -> " + after); fails++; }
  console.log("OK " + label + " head16 " + before);
}
const AG = "E:/Game/AGENTS.md";
const EP = "E:/Game/production/epics.md";
const ST = "E:/Game/production/stories.md";
const IT = "E:/Game/production/iterations.md";
const TL = "E:/Game/production/timeline.md";
const CL = "E:/Game/CHANGELOG.md";
const AC = "E:/Game/production/session-state/active.md";

edit(AG, (s) => {
  s = rep1(s, "CAMPAIGN (3 linear levels: per-zone identity", "CAMPAIGN (4 linear levels (E69 level 4 'Necro Reef'): per-zone identity", "A1");
  s = rep1(s, "Art assets: 28 Blender-made GLBs in assets/ (~2,273 KB (2,327,964 B) / 55,075 tris):", "Art assets: 31 Blender-made GLBs in assets/ (~2,857 KB (2,925,988 B) / 63,617 tris (I517 measurement)):", "A2");
  s = rep1(s, "8 ships 19,490 t, all Blender 5.2.3 headless)", "8 ships 19,490 t; E69 new fleet I516/I517: phantom 2,336 / hauler 3,506 / bulwark 2,700 t; 11 ships, all Blender 5.2.3 headless)", "A3");
  s = rep1(s, "-> 4,956,989 (I516); E69 close floor to be measured at G69.0; prior:", "-> 4,956,989 (I516) -> 5,254,934 (I518-I522, code-only growth); CLOSE FLOOR E69 = 845,066 B measured at G69.0 (I522: 6,100,000 - 5,254,934; headroom >= 102,400 B floor -> cut ladder C1..C5 NOT invoked); prior:", "A4");
  s = rep1(s, "must stay EXACT - re-pin WITH measurement only when a shipped mesh/geometry changes.", "must stay EXACT - re-pin WITH measurement only when a shipped mesh/geometry changes; plus `node .evidence/I491/pwa491.mjs` (dist server :5199) -> 'SUMMARY 11/11' (SW + manifest + offline boot - the 5th harness of the G69.0 gate set per the E69 scope-check).", "A5");
  return s;
}, "AGENTS.md");

edit(EP, (s) => {
  s = rep1(s, "- Status: OPEN (I514); IN PROGRESS (I515).", "- Status: CLOSED (I522, opened I514).", "B1");
  s = rep1(s, "Next: I521 = ST-487 (balance).", " ST-488 DONE I522 (G69.0 close gate WITH MEASUREMENT, probe-only zero src: 5 fresh harness re-runs ALL GREEN [causal495 3-arm EXACT (webgl + default 0/0 on the seed-9876 pin set; webgpu err=0 + 3 documented warns); causal483 CAUSAL456 PASS; playframe483 + playframe491 PLAYFRAME456 PASS A 22/25,781 + 11/180 B 52/55,400 hv=0/gv=0; pwa491 SUMMARY 11/11] + CLOSE FLOOR 845,066 B WITH MEASUREMENT [dist 5,254,934 B/184 re-measured, +0 B; 6,100,000 - 5,254,934; headroom >= 102,400 B floor -> cut ladder C1..C5 NOT invoked; ceiling HOLDS] + ST-487 residuals ADJUDICATED = ACCEPT-WITH-DOCUMENTATION [R1 kiter TTK 1.4667 s < 2.0 s (frozen levers exhausted), R7 0/10 wave-20 (pre-E69 content), R8 consequence of R7] per the frozen no-second-fiddle-pass policy (spec Appendix A.4; deferred to E70: phantom 2->3-hit HP or cloak/strike timing + endless wave-13-20 beatability) + AGENTS.md refresh [4 levels, fleet 31 GLBs, close floor, pwa491 in bar]; vendor pins EXACT 8/8; quality bar 6/6 measured). E69 CLOSED 9/9 (ST-480 I514 / ST-481 I515 / ST-482 I516 / ST-483 I517 / ST-484 I518 / ST-485 I519 / ST-486 I520 / ST-487 I521 / ST-488 I522). Next: E70 (candidate: R1 + R7 balance follow-up WITH MEASUREMENT) / standing-queue items (camera framing + cockpit FPV / PWA+mobile D-pad+menu reorg / enemy art-direction pass).", "B2");
  return s;
}, "epics.md");

edit(ST, (s) => {
  const line = "STATUS (I522): ST-488 DONE (I522) - G69.0 close gate WITH MEASUREMENT (probe-only, zero src): 5 fresh harness re-runs ALL GREEN [causal495 3-arm: webgl + default 18/18 EXACT on the seed-9876 pin set (score 11334/kills 57/W2/combo 15/shots 198/acc 0.2878787878787879/time 36.14999999999923 s/replay 2169-2220/console 0/0) + webgpu report-only err=0 warn=3 (documented I498 baseline dirt: powerPreference x1 + AttributeNode uv x2); causal483 CAUSAL456 PASS; playframe483 + playframe491 PLAYFRAME456 PASS (A 22/25,781 + 11/180, B 52/55,400 hv=0/gv=0, console 0/0); pwa491 SUMMARY 11/11] - dist re-measured 5,254,934 B/184 (+0 B vs I521, byte-identical zero src) -> CLOSE FLOOR E69 = 845,066 B (6,100,000 - 5,254,934; >= 102,400 B floor -> cut ladder C1..C5 NOT invoked; 6,100,000 B pre-registered ceiling HOLDS) - ST-487 residuals ADJUDICATED per spec Appendix A.4 + the frozen no-second-fiddle-pass policy: R1 (kiter median TTK 1.4667 s < 2.0 s floor; frozen levers exhausted) + R7 (0/10 wave-20; kiter dies pre-E69 waves 5-12) + R8 (null, consequence of R7) = ACCEPT-WITH-DOCUMENTATION, zero src in ST-488; DEFERRED to E70 (phantom 2-hit -> 3-hit HP or cloak/strike timing; endless wave-13-20 beatability) - vendor pins EXACT 8/8 (raw 104F561458997220/613E370F76638FDE/EAFEAD3154EC0609/D8F3CDB8B85B799A; dist-min A65DE049A7F38B40/7AB0784CD2532367/F549248412C62B9A/7FF9ACF50F006017) - AGENTS.md refreshed (4 levels / fleet 31 GLBs / close floor / pwa491 in the bar) - E69 CLOSED 9/9 (ST-480 I514 / ST-481 I515 / ST-482 I516 / ST-483 I517 / ST-484 I518 / ST-485 I519 / ST-486 I520 / ST-487 I521 / ST-488 I522) - 1,187/1,187 + build 0 + BOM delta 0 + hygiene (3 servers killed, ports ECONNREFUSED, one headless tab per harness, all closed).\r\n";
  const a = "STATUS (I521): ST-487 DONE (I521)";
  return rep1(s, a, line + a, "C1");
}, "stories.md");

const IT_ENTRY = "## I522 - ST-488: G69.0 close gate WITH MEASUREMENT - E69 CLOSED 9/9 (probe-only, zero src)\n"
+ "- R1 5 fresh harness re-runs ALL GREEN (dev :5173 + dist :4200 + dist :5199 hidden; one headless Chromium tab per harness, all closed; servers killed + all 3 ports ECONNREFUSED):\n"
+ "  - causal495 (dist :4200) -> CAUSAL495 PASS, 3 arms: webgl + default 18/18 EXACT on the seed-9876 pin set (score 11334 / kills 57 / W2 / combo 15 / shots 198 / acc 0.2878787878787879 / time 36.14999999999923 s / replay 2169-2220 / speed 4 / afterQ MENU / glb all-ready / rock radii L 2.2 M 1.3 S 0.7 / console 0/0 both pages); webgpu arm report-only: err=0 warn=3 (powerPreference x1 + AttributeNode uv x2 = the documented I498 baseline dirt). NO re-pins - zero core drift: all E69 work is wave-13/15/17-gated and the pin windows (waves 1-2) draw zero new RNG.\n"
+ "  - causal483 (dev :5173) -> CAUSAL456 PASS EXACT (same pin set, console 0/0).\n"
+ "  - playframe483 + playframe491 (dev :5173) -> PLAYFRAME456 PASS EXACT (A MENU 22/25,781 + 11/180; B PLAYING reseed 71201 frame 50 52/55,400 hv=0/gv=0; console A 0/0 B 0/0). NO re-pins.\n"
+ "  - pwa491 (dist :5199) -> SUMMARY 11/11 (SW active + root scope + controller on reload; manifest 200 manifest+json standalone 512 any+maskable start_url+scope; offline boot; no NaN; console 0/0).\n"
+ "- R2 dist ceiling re-derived WITH MEASUREMENT (scope-check E69 section 5 pre-registration): measured dist 5,254,934 B / 184 files (byte-identical to I521 - zero src this iteration) vs the pre-registered 6,100,000 B ceiling -> headroom 845,066 B >= 102,400 B floor -> CUT LADDER C1..C5 NOT INVOKED; the 6,100,000 B ceiling HOLDS as the G69.0 close state. CLOSE FLOOR E69 = 845,066 B (E68 precedent: close floor = the headroom measured at the gate).\n"
+ "- R3 ST-487 residuals ADJUDICATED (spec Appendix A.4; frozen policy .evidence/I521/rules.md - at most ONE tuning pass, spent at ST-487; no second fiddle pass): ACCEPT-WITH-DOCUMENTATION, zero src in ST-488 - R1 (phantom1 kiter median TTK 1.4667 s < 2.0 s floor; frozen levers exhausted: orbitR moved smallest-first, targetOpacity no better trade), R7 (0/10 runs reach wave 20; kiter dies on pre-E69 waves 5-12; no E69 lever can reach it), R8 (null ratio, direct consequence of R7). DEFERRED to E70 WITH MEASUREMENT: phantom TTK next-lever candidates (phantom 2-hit -> 3-hit HP, or cloak/strike timing) + endless wave-13-20 beatability (R7 = pre-E69 pilot-vs-arena tuning).\n"
+ "- R4 vendor pins EXACT 8/8 (raw: three.module 104F561458997220 / core 613E370F76638FDE / webgpu EAFEAD3154EC0609 / tsl D8F3CDB8B85B799A; dist-min: module A65DE049A7F38B40 / core 7AB0784CD2532367 / webgpu F549248412C62B9A / tsl 7FF9ACF50F006017; git diff vendor/ empty - zero src).\n"
+ "- R5 AGENTS.md refreshed (docs-only): genre line 3 -> 4 campaign levels (E69 level 4 'Necro Reef'); art-assets line 28 -> 31 GLBs (2,925,988 B / 63,617 t, + phantom 2,336 / hauler 3,506 / bulwark 2,700 t); quality bar #4 -> CLOSE FLOOR E69 = 845,066 B + chain -> 5,254,934 (I518-I522); quality bar #6 + pwa491 SUMMARY 11/11 (the 5-harness gate set per scope-check section 2).\n"
+ "- R6 bookkeeping: epics.md E69 Status -> CLOSED (I522) + ST-488 DONE I522 + E69 CLOSED 9/9; stories.md STATUS (I522) line (before the I521 line); timeline.md I522 line; CHANGELOG I522 line; active.md I522 note (follow-up commit); .evidence/I522/ (pids.txt + harness stdout captures, force-added).\n"
+ "- Quality bar 6/6 (measured): npm test 1,187/1,187 + build exit 0 + 5-harness ALL GREEN console 0/0 (no NaN) + dist 5,254,934 B / 184 < 6,100,000 (headroom 845,066 B) + vendor pins EXACT 8/8 + PLAYFRAME456 PASS EXACT + CAUSAL495 PASS EXACT + BOM delta 0 (docs-only edits).\n"
+ "- E69 CLOSED 9/9 (ST-480 I514 / ST-481 I515 / ST-482 I516 / ST-483 I517 / ST-484 I518 / ST-485 I519 / ST-486 I520 / ST-487 I521 / ST-488 I522). Next: E70 (candidate scope: R1 phantom TTK lever + R7 endless wave-13-20 beatability, both WITH MEASUREMENT) / standing-queue items (camera framing + cockpit FPV / PWA+mobile D-pad+menu reorg / enemy art-direction pass).\n";
edit(IT, (s) => {
  const a = "ST-487 residuals R1/R7/R8 per spec Appendix A).\n";
  return rep1(s, a, a + "\n" + IT_ENTRY, "D1");
}, "iterations.md");

edit(TL, (s) => {
  const a = "abyssal boss Option A + persistence 4; 1,187 tests; dist 5,254,934 B; pins EXACT)\n";
  return rep1(s, a, a + "- 2026-11-19  I522 (ST-488: G69.0 close gate WITH MEASUREMENT - 5 fresh harness re-runs ALL GREEN [causal495 3-arm EXACT (webgl/default 0/0; webgpu err=0 warn=3 documented), causal483 CAUSAL456 PASS, playframe483/491 PLAYFRAME456 PASS (A 22/25,781 + 11/180, B 52/55,400 hv=0/gv=0), pwa491 SUMMARY 11/11] + dist 5,254,934 B/184 re-measured (+0 B) -> CLOSE FLOOR 845,066 B (6,100,000 - 5,254,934; headroom >= 102,400 B floor, cut ladder C1..C5 NOT invoked, ceiling HOLDS) + ST-487 residuals R1/R7/R8 ADJUDICATED = ACCEPT-WITH-DOCUMENTATION (frozen no-second-fiddle-pass policy; deferred to E70: phantom 2->3-hit HP or cloak/strike timing + endless wave-13-20 beatability) + AGENTS.md refresh [4 levels, fleet 31 GLBs, close floor, pwa491 in bar] - E69 CLOSED 9/9; 1,187 tests; quality bar 6/6; vendor pins EXACT 8/8. Next: E70 (candidate: R1 + R7 balance follow-up WITH MEASUREMENT) / standing queue [camera+FPV / PWA+mobile+menu / enemy art pass].)\n", "E1");
}, "timeline.md");

edit(CL, (s) => {
  const a = "## [Unreleased]\r\n";
  const line = "- I522: ST-488 E69 - G69.0 close gate WITH MEASUREMENT (probe-only; zero src/assets/vendor change) - 5 fresh harness re-runs ALL GREEN (causal495 3-arm: webgl + default 18/18 EXACT on the seed-9876 pin set, console 0/0, + webgpu report-only err=0 warn=3 = documented I498 baseline dirt; causal483 CAUSAL456 PASS; playframe483 + playframe491 PLAYFRAME456 PASS [A 22/25,781 + 11/180, B 52/55,400 hv=0/gv=0]; pwa491 SUMMARY 11/11) + CLOSE FLOOR RE-DERIVED WITH MEASUREMENT (measured dist 5,254,934 B / 184, +0 B vs I521 -> headroom 845,066 B = E69 close floor; 6,100,000 B pre-registered ceiling HOLDS; headroom >= 102,400 B floor -> cut ladder C1..C5 NOT invoked - I498/I501/I513 precedent) + ST-487 residuals ADJUDICATED = ACCEPT-WITH-DOCUMENTATION per the frozen no-second-fiddle-pass policy (R1 kiter median TTK 1.4667 s < 2.0 s floor, frozen levers exhausted; R7 0/10 wave-20 reached = pre-E69 content; R8 null = consequence of R7; spec Appendix A.4) and DEFERRED to E70 (phantom 2->3-hit HP or cloak/strike timing + endless wave-13-20 beatability, WITH MEASUREMENT) + AGENTS.md refresh (campaign 3 -> 4 levels, fleet 28 -> 31 GLBs 2,925,988 B / 63,617 t, close floor recorded, pwa491 added to the quality bar) + E69 CLOSED 9/9 (ST-480 I514 / ST-481 I515 / ST-482 I516 / ST-483 I517 / ST-484 I518 / ST-485 I519 / ST-486 I520 / ST-487 I521 / ST-488 I522) + quality bar 6/6 (1,187/1,187 + build 0 + dist 5,254,934 B/184 byte-identical + vendor pins EXACT 8/8 + BOM delta 0 + hygiene [3 servers killed, ports ECONNREFUSED, all headless tabs closed]). Next: E70 (candidate: R1 + R7 balance follow-up) / standing-queue items (camera framing + cockpit FPV / PWA+mobile D-pad+menu reorg / enemy art-direction pass).\r\n";
  return rep1(s, a, a + line, "F1");
}, "CHANGELOG.md");

edit(AC, (s) => {
  const a = "ST-487 residuals R1/R7/R8 per spec Appendix A).\n";
  const line = "- notes: I522 done (ST-488 E69 - G69.0 close gate WITH MEASUREMENT, probe-only zero src): 5 fresh harness re-runs ALL GREEN (causal495 3-arm EXACT [webgl/default 0/0 on the seed-9876 pin set, webgpu err=0 warn=3 documented I498 baseline], causal483 CAUSAL456 PASS, playframe483/491 PLAYFRAME456 PASS [A 22/25,781 + 11/180, B 52/55,400 hv=0/gv=0], pwa491 SUMMARY 11/11) + dist 5,254,934 B/184 re-measured (+0 B, byte-identical) -> CLOSE FLOOR E69 = 845,066 B (6,100,000 - 5,254,934; >= 102,400 B floor -> cut ladder NOT invoked; ceiling HOLDS) + ST-487 residuals R1/R7/R8 ADJUDICATED = ACCEPT-WITH-DOCUMENTATION (frozen no-second-fiddle-pass policy, spec Appendix A.4; deferred to E70: phantom 2->3-hit HP or cloak/strike timing + endless wave-13-20 beatability) + AGENTS.md refresh (4 levels, 31 GLBs, close floor, pwa491 in bar) + E69 CLOSED 9/9. 1,187/1,187 + build 0 + vendor pins EXACT 8/8 + BOM delta 0 + hygiene (3 servers killed ECONNREFUSED, all headless tabs closed). Committed (this gate) + push pending. Next: E70 (candidate: R1 + R7 balance follow-up WITH MEASUREMENT) / standing queue (camera framing + cockpit FPV / PWA+mobile D-pad+menu reorg / enemy art pass).\n";
  return rep1(s, a, a + line, "G1");
}, "active.md");

console.log(fails === 0 ? "ALL EDITS OK" : "FAILURES: " + fails);
