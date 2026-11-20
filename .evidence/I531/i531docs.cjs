const fs = require("fs");
function assert1(hay, needle, tag) { const n = hay.split(needle).length - 1; if (n !== 1) { console.error("ANCHOR FAIL " + tag + " count=" + n); process.exit(1); } }
function edit(file, fn) { const raw = fs.readFileSync(file, "latin1"); const out = fn(raw); fs.writeFileSync(file, out, "latin1"); console.log("OK " + file); }

// 1. iterations.md (LF, no trailing NL) - append I531 entry
edit("production/iterations.md", (s) => {
  if (!s.endsWith("closes 4/4).")) { console.error("TAIL FAIL iterations.md"); process.exit(1); }
  const entry = [
    "## I531 (ST-497, E71): G71.0 close gate WITH MEASUREMENT - E71 CLOSED 4/4",
    "- Goal: close E71 the way the quality bar requires - fresh 5-harness re-runs ALL EXPECTED EXACT (no re-pins: E71 shipped one render-only surface (cockpit crosshair, zero pin surface) + one document-only verify) + CLOSE FLOOR E71 re-derived WITH MEASUREMENT + AGENTS.md refresh.",
    "- Harnesses (fresh; stdout in .evidence/I531/*.out): causal495 (dist :4200) CAUSAL495 PASS [3-arm: webgl + default EXACT on the seed-9876 pin set; webgpu report-only err=0 warn=3 = I498 baseline] / causal483 (dev :5173) CAUSAL456 PASS / playframe483 (dev :5173) PLAYFRAME456 PASS [A 22/25,781 + 11/180; B 52/55,400 hv=0/gv=0] / playframe491 (dev :5173) PLAYFRAME456 PASS [same pins EXACT] / pwa491 (dist :5199) SUMMARY 11/11 [SW + manifest + offline boot] - servers killed after; 4200/5173/5199/4173 ECONNREFUSED verified.",
    "- CLOSE FLOOR E71 = 844,204 B re-derived WITH MEASUREMENT: 6,100,000 - 5,255,796 (measured dist); headroom >= 102,400 B floor -> cut ladder C1..C2 NOT invoked; prior CLOSE FLOOR E70 = 844,742 B.",
    "- Residual accounting (E71 sec.3 pre-registrations): R-CAM-1 DONE I529 (cockpit crosshair shipped - dot + 4 CSS ticks) / R-CAM-2 CLOSED I530 MEASURE-ONLY (position-invariant framing verified in BOTH modes; no measured gap -> no lever; structural: campaign rim dolly never engages, max excursion 12.50 u < startFrac 0.55) - both residuals ship documented, none open.",
    "- AGENTS.md refreshed (quality bar #4: dist chain -> 5,255,796 (I529, +538 B cockpit crosshair DOM/CSS); CLOSE FLOOR E71 = 844,204 B; prior line preserved).",
    "- Measured quality bar 6/6: npm test 1,187/1,187 + npm run build 0 + dist 5,255,796 B / 184 (byte-identical, zero src) + vendor pins EXACT 4/4 dist-min [A65DE049A7F38B40 / 7AB0784CD2532367 / F549248412C62B9A / 7FF9ACF50F006017; git diff vendor/ = 0] + BOM delta 0 [CHANGELOG 7 / stories 5 / epics 3 / iterations 5 / timeline 3 / AGENTS 1 / e71-research 0 / scope-check-E71 0] + hygiene [0 servers, 0 tabs].",
    "- .evidence/I531 (5 harness .out + servers531.pid, force-added).",
    "- Next: standing queue -> enemy art-direction pass (Blender; user emphasis: model other spaceships, more realistic) via fresh cgs-scope-check; then PWA installable + mobile landscape D-pad + menu reorg."
  ].join("\n");
  return s + "\n\n" + entry;
});

// 2. stories.md (CRLF) - insert ST-497 line after ST-496 line tail
edit("production/stories.md", (s) => {
  const anchor = "Next: I531 = ST-497 (G71.0 close gate).\r\nSTATUS (I526):";
  assert1(s, anchor, "stories");
  const line = "ST-497 DONE (I531) - G71.0 close gate WITH MEASUREMENT: 5 fresh harness re-runs ALL GREEN, ALL EXPECTED EXACT, zero re-pins [causal495 CAUSAL495 PASS 3-arm [webgl+default EXACT seed-9876; webgpu report-only err=0 warn=3 = I498 baseline] / causal483 CAUSAL456 PASS / playframe483 + playframe491 PLAYFRAME456 PASS [A 22/25,781 + 11/180; B 52/55,400 hv=0/gv=0] / pwa491 SUMMARY 11/11; servers killed, 4200/5173/5199/4173 ECONNREFUSED, stdout .evidence/I531/*.out]; CLOSE FLOOR E71 = 844,204 B re-derived [6,100,000 - 5,255,796; headroom >= 102,400 B floor -> cut ladder C1..C2 NOT invoked; prior E70 844,742]; residual accounting: R-CAM-1 DONE I529 / R-CAM-2 CLOSED MEASURE-ONLY I530 [no open residuals]; AGENTS.md refreshed [quality bar #4: -> 5,255,796 + CLOSE FLOOR E71]; quality bar 6/6: 1,187/1,187 + build 0 + dist 5,255,796 B/184 byte-identical + vendor pins EXACT 4/4 [git diff vendor/ = 0] + BOM delta 0 [8/8] + hygiene [0 servers, 0 tabs]. Next: standing queue -> enemy art-direction pass [Blender] via fresh cgs-scope-check.";
  return s.replace(anchor, "Next: I531 = ST-497 (G71.0 close gate).\r\n" + line + "\r\nSTATUS (I526):");
});

// 3. epics.md (LF, no trailing NL) - header + status line
edit("production/epics.md", (s) => {
  const h = "WITH MEASUREMENT - OPEN (opened I528)\n- Goal:";
  assert1(s, h, "epics-header");
  let out = s.replace(h, "WITH MEASUREMENT - CLOSED (opened I528, closed I531)\n- Goal:");
  const oldSt = "- Status: OPEN (opened I528) - ST-494 done I528; next ST-495 (I529).";
  assert1(out, oldSt, "epics-status");
  const newSt = "- Status: CLOSED (I531; opened I528). ST-494 DONE I528 (measured audit + scope + pre-registered residuals; docs-only zero src; finding: the user 3 requests were ~95% already shipped). ST-495 DONE I529 (R-CAM-1 cockpit crosshair - bearingStrip.js 5,008 -> 6,456 B, dot + 4 symmetric CSS ticks, smoke504 18/18, dist +538 B, zero pin surface). ST-496 DONE I530 (R-CAM-2 far-view cross-mode verify - MEASURED, document-only, NO LEVER: position-invariant framing verified both modes; campaign rim dolly structurally never engages). ST-497 DONE I531 (G71.0 close gate - 5 fresh harnesses ALL EXPECTED EXACT zero re-pins; CLOSE FLOOR E71 = 844,204 B WITH MEASUREMENT; AGENTS.md refreshed; E71 CLOSED 4/4).";
  out = out.replace(oldSt, newSt);
  if (out.endsWith("\n")) { console.error("epics.md gained trailing NL"); process.exit(1); }
  return out;
});

// 4. timeline.md (LF, ends with NL) - append I531 line
edit("production/timeline.md", (s) => {
  if (!s.endsWith("\n")) { console.error("TAIL FAIL timeline.md"); process.exit(1); }
  const line = "I531 (ST-497, E71) - G71.0 close gate [MEASURED - E71 CLOSED 4/4]: 5 fresh harness re-runs ALL GREEN / ALL EXPECTED EXACT, zero re-pins [causal495 CAUSAL495 PASS 3-arm / causal483 CAUSAL456 PASS / playframe483 + playframe491 PLAYFRAME456 PASS [A 22/25,781 + 11/180; B 52/55,400] / pwa491 SUMMARY 11/11; servers killed, ECONNREFUSED]; CLOSE FLOOR E71 = 844,204 B [6,100,000 - 5,255,796; cut ladder C1..C2 NOT invoked]; residuals R-CAM-1 DONE I529 / R-CAM-2 CLOSED MEASURE-ONLY I530; AGENTS.md refreshed; 1,187/1,187 + build 0 + dist 5,255,796 B/184 + vendor EXACT + BOM delta 0 + hygiene [0 servers, 0 tabs]";
  return s + line + "\n";
});

// 5. CHANGELOG.md (CRLF) - insert I531 entry under [Unreleased]
edit("CHANGELOG.md", (s) => {
  const anchor = "## [Unreleased]\r\n- I530:";
  assert1(s, anchor, "changelog");
  const line = "- I531: ST-497 E71 G71.0 close gate (measured) - 5 fresh harness re-runs all green with every pin expected exact and zero re-pins (causal495 3-arm / causal483 / playframe483 / playframe491 / pwa491 11/11); CLOSE FLOOR E71 = 844,204 B re-derived with measurement (headroom above the 102,400 B floor, no cut ladder); E71 closed 4/4 - the cockpit crosshair shipped at I529 and the far-view position-invariance was verified in both modes at I530 with no measured gap (no lever); AGENTS.md quality bar refreshed";
  return s.replace(anchor, "## [Unreleased]\r\n" + line + "\r\n- I530:");
});

// 6. active.md (LF, ends with single NL) - append note line
edit("production/session-state/active.md", (s) => {
  if (!s.endsWith("E71 closes 4/4).\n")) { console.error("TAIL FAIL active.md"); process.exit(1); }
  const line = "I531 (ST-497, E71) G71.0 close gate WITH MEASUREMENT: E71 CLOSED 4/4 (ST-494 I528 / ST-495 I529 / ST-496 I530 / ST-497 I531). 5 fresh harness re-runs ALL GREEN / ALL EXPECTED EXACT, zero re-pins (causal495 CAUSAL495 PASS 3-arm [webgl+default EXACT seed-9876; webgpu report-only err=0 warn=3] / causal483 CAUSAL456 PASS / playframe483+playframe491 PLAYFRAME456 PASS [A 22/25,781 + 11/180; B 52/55,400] / pwa491 SUMMARY 11/11); servers killed, 4200/5173/5199/4173 ECONNREFUSED; stdout in .evidence/I531/*.out. CLOSE FLOOR E71 = 844,204 B (6,100,000 - 5,255,796; headroom >= 102,400 B floor -> cut ladder C1..C2 NOT invoked; prior E70 844,742). Residuals: R-CAM-1 DONE I529 / R-CAM-2 CLOSED MEASURE-ONLY I530 (none open). AGENTS.md refreshed (quality bar #4). Quality bar 6/6: 1,187/1,187 + build 0 + dist 5,255,796 B/184 + vendor EXACT 4/4 + BOM delta 0 (8/8) + hygiene (0 servers, 0 tabs). .evidence/I531 force-added. Push batched I530+I531 -> origin (delegated worker). Next: enemy art-direction pass (Blender; user emphasis) via fresh cgs-scope-check, then PWA+mobile D-pad+menu reorg.";
  return s + line + "\n";
});
console.log("BOOKKEEPING I531 DONE (6/6 files)");