const fs = require("fs");
function read(p) { return fs.readFileSync(p, "latin1"); }
function write(p, s) { fs.writeFileSync(p, s, "latin1"); }
function repOnce(file, a, r) {
  const s = read(file);
  const n = s.split(a).length - 1;
  if (n !== 1) throw new Error("anchor count " + n + " != 1 in " + file + ": " + a.slice(0, 80));
  write(file, s.replace(a, r));
  console.log("OK rep " + file + " [" + a.slice(0, 40) + "...]");
}
function appendAfterEol(file, eol, content) {
  const s = read(file);
  if (!s.endsWith(eol)) throw new Error("tail EOL mismatch in " + file);
  write(file, s + content);
  console.log("OK append " + file);
}

// 1. AGENTS.md - item 4 dist chain + CLOSE FLOOR E77 line
repOnce("AGENTS.md",
  "(I563, +83: wave-pacing core [killableCount clear check], 203); CLOSE FLOOR E76 = 969,828 B measured at I563",
  "(I563, +83: wave-pacing core [killableCount clear check], 203) -> 6,430,174 (I565, +2: boss.ringEvery lever [2.0->2.5, esbuild minifies 2.0->2 / 2.5->2.5], 203); CLOSE FLOOR E77 = 969,826 B measured at G77.0 (I566: 7,400,000 - 6,430,174 fresh dist re-measured EXACT; headroom >= 102,400 B floor -> cut ladder C1..C2 NOT invoked; E77 CLOSED I566); prior CLOSE FLOOR E76 = 969,828 B measured at I563");

// 2. epics.md - E77 CLOSED I566 (header + status + ST-532 DONE)
repOnce("production/epics.md",
  "High-Wave Band Verification - IN PROGRESS (opened I564)",
  "High-Wave Band Verification - CLOSED I566");
repOnce("production/epics.md",
  "- Status: IN PROGRESS (opened I564).",
  "- Status: CLOSED I566 (G77.0 close gate; opened I564).");
repOnce("production/epics.md",
  "ST-532 (I566) G77.0 close gate [5 fresh harnesses + CLOSE FLOOR E77 re-derived WITH MEASUREMENT + AGENTS.md refresh + push delegate] - PENDING.",
  "ST-532 (I566) G77.0 close gate [5 fresh harnesses + CLOSE FLOOR E77 re-derived WITH MEASUREMENT + AGENTS.md refresh + push delegate] - DONE I566 (CLOSEGATE566 5/5 EXACT no re-pin; CLOSE FLOOR E77 = 969,826 B WITH MEASUREMENT [7,400,000 - 6,430,174]; AGENTS.md item-4 chain refreshed; dist 6,430,174 B / 203 byte-identical; E77 CLOSED I566).");

// 3. stories.md - ST-532 entry after the ST-531 line (unique tail anchor)
repOnce("production/stories.md",
  "hygiene [closegate runner self-kills all servers, port-free per step; zero tabs]]",
  "hygiene [closegate runner self-kills all servers, port-free per step; zero tabs]]\r\n" +
  "- ST-532 E77 G77.0 close gate (I566) - DONE I566: the E77 close gate - CLOSEGATE566 5 fresh harnesses ALL EXACT NO re-pin [causal495 PASS 3 arms (webgl frozen + default EXACT seed-9876; webgpu report-only) + causal483 CAUSAL456 PASS + playframe483/491 A 22/32,717 + 11/180, B 52/73,172 + pwa491 SUMMARY 11/11; all ports free; run_closegate566.cjs self-kills servers]; CLOSE FLOOR E77 = 969,826 B re-derived WITH MEASUREMENT (7,400,000 - 6,430,174 fresh dist re-measured EXACT; headroom >= 102,400 B floor -> cut ladder C1..C2 NOT invoked); dist 6,430,174 B / 203 byte-identical (docs/config-state-only close, zero new code); AGENTS.md item-4 dist chain refreshed (I565 +2 B segment + CLOSE FLOOR E77 line; item 6 verified already current); E77 DoD 3/3 + E77 CLOSED I566; quality bar 6/6 [tests 1,237/1,237 / build 0 / dist 6,430,174 B / 203 / vendor 4/4 EXACT + BOM delta 0 + hygiene (zero servers/tabs)]");

// 4. iterations.md - I566 entry block (CRLF)
const itLines = [
  "## I566 (ST-532, E77): G77.0 close gate - E77 CLOSED - the endless-beatability lever (boss.ringEvery 2.0 -> 2.5) is final: 5 fresh harnesses ALL EXACT NO re-pin + CLOSE FLOOR E77 = 969,826 B re-derived WITH MEASUREMENT + AGENTS.md item-4 refresh; docs/config-state only, zero src/assets/vendor/render/i18n",
  "",
  "- Pre-state: local main == origin/main 71203b6 (I565, pushed - push delegate Dewey 01a20760 confirmed: pushed 56646a0..71203b6, local HEAD == origin/main == 71203b67b6c075c6513d3a6df49b8f489b7c0142).",
  "- Change: docs/config-state only - AGENTS.md item-4 dist chain append (-> 6,430,174 (I565, +2: boss.ringEvery lever [2.0->2.5, esbuild minifies 2.0->2 / 2.5->2.5], 203)) + CLOSE FLOOR E77 line (969,826 B at G77.0; the I563 E76 line demoted to prior per house pattern) + epics.md E77 CLOSED I566 (header + Status + ST-532 DONE) + stories.md ST-532 + iterations/active/timeline/CHANGELOG bookkeeping. Zero src change.",
  "- Close gate: CLOSEGATE566 HARNESS PASS - 5 fresh harnesses ALL EXACT NO re-pin [causal495 PASS 3 arms (webgl frozen classic + default EXACT seed-9876; webgpu report-only) + causal483 CAUSAL456 PASS (score 11334) + playframe483 A 22/32,717 + 11/180, B 52/73,172 + playframe491 A 22/32,717 + 11/180, B 52/73,172 + pwa491 SUMMARY 11/11; all ports free; run_closegate566.cjs self-kills servers, port-free verified per step; .out files in .evidence/I566/]. NO re-pin (as pre-registered: ringEvery never read on any pin - config-only lever, no mesh/geometry change). Label note: the first gate run printed CLOSEGATE565 because the runner label did not contain the I565 substring the header rename targeted - the label was fixed and the full gate re-run; the PASS line above is from the fixed re-run.",
  "- CLOSE FLOOR E77 = 969,826 B re-derived WITH MEASUREMENT (7,400,000 - 6,430,174 fresh dist re-measured EXACT on disk: 6,430,174 B / 203 files; headroom >= 102,400 B floor -> cut ladder C1..C2 NOT invoked). Ceiling 7,400,000 B, tripwire 7,297,600 B not hit.",
  "- E77 DoD 3/3: ST-530 DONE I564 (measured re-audit - the live wall = wave-5/15 Monolith ring-burst window, Branch B MONOLITH-dominant H = 0.600 EXACT, median death wave 5, 1/30 wave-13-14 reach) + ST-531 DONE I565 (lever SHIPped WITH MEASUREMENT: median 5 -> 9.5, 1/30 wave-13 reach, acceptance a/b/c all PASS) + ST-532 DONE I566 (this gate) -> E77 CLOSED I566. Post-lever wall registered for a future epic: wave-10 SPLICER-dominant (9/30), OUT of E77 scope.",
  "- Quality bar 6/6: npm test 1,237/1,237; npm run build 0; dist 6,430,174 B / 203 byte-identical (close gate is docs/config-state only, zero new code); vendor 4/4 EXACT (three.module A65DE049A7F38B40 / three.core 7AB0784CD2532367 / three.webgpu F549248412C62B9A / three.tsl 7FF9ACF50F006017); BOM delta 0 (epics 3 / stories 5 / iterations 5 / timeline 3 / active 0 / AGENTS 1); hygiene (zero servers/tabs - the runner self-kills every server, port-free verified per step).",
  "- Next: I567+ = open the next epic per the cgs workflow (cgs-scope-check docs-first) - natural candidates: the registered post-lever wall (wave-10 Splicer-dominant) or the user standing queue (main-character art remaster / camera framing + cockpit view / new enemies / linear level design + bosses); pick by scope-check, not by overengineering."
];
appendAfterEol("production/iterations.md", "\r\n", itLines.join("\r\n") + "\r\n");

// 5. timeline.md - user-facing line (LF)
appendAfterEol("production/timeline.md", "\n", "I566 (ST-532, E77) done: the difficulty round is officially closed - the wave-5 boss (and every 5th-wave boss) now fires its rock-ring attack about 20% slower, as our playability audit showed that fast ring was the main difficulty wall, and that fix is now final. Every automated play-check was re-run from scratch and matched its pinned numbers exactly - nothing drifted, nothing extra was drawn. The audit that proved the fix stands as closing evidence: the automated pilot's median survival went from wave 5 to wave 9.5, and one of thirty test runs reached wave 13 for the first time this cycle. The bundle is unchanged at 6,430,174 bytes, under the 7.4 MB limit with 969,826 bytes of room to spare. The next known difficulty wall (the wave-10 boss's ring attack) is registered for a future round.\n");

// 6. active.md - inline chain continuation (unique tail anchor)
repOnce("production/session-state/active.md",
  "+ AGENTS.md refresh + push delegate].",
  "+ AGENTS.md refresh + push delegate]. [DONE at I566: CLOSEGATE566 5/5 EXACT no re-pin [causal495 3 arms seed-9876 + causal483 + playframe483/491 A 22/32,717 + 11/180, B 52/73,172 + pwa491 11/11; all ports free; run_closegate566.cjs self-kills servers]; CLOSE FLOOR E77 = 969,826 B WITH MEASUREMENT [7,400,000 - 6,430,174; headroom >= 102,400 B floor -> cut ladder C1..C2 NOT invoked]; AGENTS.md item-4 chain refreshed; E77 CLOSED I566; dist 6,430,174 B / 203 byte-identical; tests 1,237/1,237, vendor 4/4 EXACT, BOM delta 0] - NEXT at I567+ = open the next epic [candidates: the registered post-lever wave-10 Splicer wall, or the user standing queue (main-character art remaster / camera framing + cockpit view / new enemies / linear level design + bosses); cgs-scope-check docs-first]");

// 7. CHANGELOG.md - I566 line above the I565 line (LF)
repOnce("CHANGELOG.md",
  "- I565: The endless-mode wave-5 boss",
  "- I566: No visible changes - the difficulty round is officially closed: the wave-5 boss (and every 5th-wave boss) now fires its rock-ring attack about 20% slower, as our playability audit showed that fast ring was the main difficulty wall, and that fix is now final (the 30-run audit stands as closing evidence: median survival wave 5 -> wave 9.5, and one in thirty test runs reached wave 13 for the first time this cycle). Every automated play-check was re-run from scratch and matched its pinned numbers exactly, and the bundle is unchanged at 6,430,174 bytes, under the 7.4 MB limit.\n- I565: The endless-mode wave-5 boss");

console.log("ALL EDITS DONE");
