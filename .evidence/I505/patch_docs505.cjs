const fs = require("fs");
let fail = 0;
const rd = (f) => fs.readFileSync(f, "utf8");
const wr = (f, s) => fs.writeFileSync(f, s, "utf8");
const rep1 = (s, a, b, tag) => { const n = s.split(a).length - 1; if (n !== 1) { console.log("FAIL anchor " + tag + " count=" + n); fail++; return s; } return s.replace(a, b); };
if (fail === 0) {
  // 1) AGENTS.md: dist-bytes / close-floor line (CRLF file)
  { const f = "AGENTS.md"; let s = rd(f);
    const a = "3,746,563 B / 175 files (I503; boss swap -11,780 B); close floor 88,341 -> 91,657 -> 103,437 B";
    s = rep1(s, a, "3,747,372 B / 175 files (I505 close; I504 cockpit rework +809 B over I503); close floor 88,341 -> 91,657 -> 103,437 -> 102,628 B", "agents-dist");
    wr(f, s); console.log("ok AGENTS.md"); }
  // 2) iterations.md: append I505 block (CRLF)
  { const f = "production/iterations.md"; let s = rd(f);
    if (!s.endsWith("\r\n")) { s += "\r\n"; }
    const block = ["## I505",
      "- Goal: ST-471 (E67) - G67.0 close gate: causal495 3-arm fresh + playframe fresh + pwa491 + quality bar + AGENTS.md refresh (ship v6 tris/bytes, ceiling, pins) + E67 CLOSED 7/7. Probe-only, zero src.",
      "- S1 quality bar re-run on the I505 tree: npm test 1145/1145 (7.8 s) + build exit 0 + dist 3,747,372 B / 175 (byte-identical to I504 - probe-only) + vendor 4-pin EXACT (A65DE049A7F38B40 / 7AB0784CD2532367 / F549248412C62B9A / 7FF9ACF50F006017).",
      "- S2 fresh regressions (.evidence/I505/, all logs committed): causal483 CAUSAL456 PASS (dev :5173) + causal495 PASS 3-arm (dist :4200 - webgl EXACT + default EXACT seed-9876 pin set + webgpu report-only) + playframe483 PLAYFRAME456 PASS (A 22/25,781 + B 52/55,400) + playframe491 PLAYFRAME456 PASS (same numbers) + pwa491 11/11 (dist :5199 - sw active + claimed, manifest standalone + 512 maskable, offline boot, console 0/0).",
      "- S3 AGENTS.md refresh: dist-bytes line 3,746,563 -> 3,747,372 B/175 (I505 close; I504 +809 B cockpit rework) + close floor 103,437 -> 102,628 B (measured headroom). Ship v6 25,563 t / boss v2 398 t / ceiling 3,850,000 / 4-pin lines already current (I501/I503).",
      "- Epic DoD check (scope-check-E67.md): ship v6 in the scene (real-airship read, LOOK 8-view PASS I501) + one secondary asset remastered (boss v2, LOOK ACCEPTED I503) + camera/views verified-or-fixed (I504: far-view MEASURE-ONLY 8.6% at rest + cockpit rework) + all re-pins landed WITH MEASUREMENT + quality bar 6/6 + AGENTS.md current + hygiene clean + Pages deploy re-triggered by the final push (billing lock - logged I504, user decision pending).",
      "- Quality bar 6/6: 1145/1145 + build 0 + dist 3,747,372 B/175 + 4-pin EXACT + causal483 + causal495 (3-arm) + playframe483/491 PASS + pwa491 11/11 + hygiene (all 3 servers killed, single-tab Playwright closed).",
      "- E67 CLOSED 7/7 (ST-465 I499 / ST-466 I500 / ST-467 I501 / ST-468 I501 folded / ST-469 I503 / ST-470 I504 / ST-471 I505).",
      "- Next: v20 section 8 user pass (standing queue: enemy remaster + more enemies/campaign extend; PWA installable + mobile landscape D-pad + menu reorg; WebGPU visuals if justified; character/enemy model choices with reference research)."].join("\r\n");
    s += "\r\n" + block; wr(f, s); console.log("ok iterations.md"); }
  // 3) stories.md: ST-471 line + STATUS line (LF)
  { const f = "production/stories.md"; let s = rd(f);
    const a = "STATUS (I499): E67 OPEN (ship v6 real-airship remaster + secondary asset realism + camera/view pass; opened I499 per the user improvement queue 2026-11-18; staged ST-465..ST-471 in production/scope-check-E67.md; ship-first order per the user; enemies/content enrichment beyond E63 + E59 art-task-list backlog carry to E68 if E67 closes early).";
    s = rep1(s, a, "STATUS (I505): E67 CLOSED 7/7 (I505 - G67.0 close gate: fresh causal495 3-arm + causal483 + playframe483/491 + pwa491 11/11 + quality bar 6/6 + AGENTS.md refresh; ship v6 25,563 t + boss v2 398 t + camera/view pass all live; re-pins all WITH MEASUREMENT; Pages deploy blocked on the account Actions billing lock - user decision pending). E66 CLOSED 5/5 (I498). E65 CLOSED (I493). E64 CLOSED 5/5 (I491). E63 CLOSED 5/5 (I483). E62 CLOSED 5/5 (I478). E61 CLOSED 5/5 (I473).", "stories-status");
    if (!s.endsWith("\n")) { s += "\n"; }
    const line = "- ST-471 G67.0 close gate (I505) - DONE I505 (probe-only zero src): fresh causal495 PASS 3-arm (dist :4200 - webgl + default EXACT seed-9876, webgpu report-only) + causal483 CAUSAL456 PASS (dev :5173) + playframe483/491 PLAYFRAME456 PASS (A 22/25,781 + B 52/55,400) + pwa491 11/11 (dist :5199) + quality bar 6/6 (1145/1145 + build 0 + dist 3,747,372 B/175 + 4-pin EXACT) + AGENTS.md refresh (dist bytes line + close floor 102,628 B) + epic DoD check - E67 CLOSED 7/7. Logs .evidence/I505/ committed.";
    s += line + "\n"; wr(f, s); console.log("ok stories.md"); }
  // 4) epics.md: header + Status line + notes (LF)
  { const f = "production/epics.md"; let s = rd(f);
    s = rep1(s, "## E67 - Ship v6 real-airship remaster + secondary asset realism + camera/view pass - OPEN (opened I499, target close I505)", "## E67 - Ship v6 real-airship remaster + secondary asset realism + camera/view pass - CLOSED 7/7 (opened I499, closed I505)", "epics-header");
    const a = "ST-470 DONE I504 (camera/view pass: far-view MEASURE-ONLY 8.6% at rest <= 10% pre-registered rule; cockpit rework - lookDrop 1.2 + screen-relative thrust + ship-in-cockpit + center dot; smoke504 18/18).";
    s = rep1(s, a, a + " ST-471 DONE I505 (G67.0 close gate - fresh causal495 3-arm + causal483 + playframe483/491 + pwa491 11/11 + quality bar 6/6 + AGENTS.md refresh + DoD check). E67 CLOSED 7/7 (I505).", "epics-status");
    if (!s.endsWith("\n")) { s += "\n"; }
    const note = "- notes: I505 done (ST-471 E67 - G67.0 close gate, probe-only zero src): fresh causal495 PASS 3-arm (dist :4200 - webgl EXACT + default EXACT seed-9876 pin set + webgpu report-only) + causal483 CAUSAL456 PASS + playframe483/491 PLAYFRAME456 PASS (A 22/25,781 + B 52/55,400) + pwa491 11/11 (dist :5199 - sw active + claimed, manifest standalone + 512 maskable, offline boot, console 0/0) + quality bar 6/6 (1145/1145 + build 0 + dist 3,747,372 B/175 byte-identical to I504 + 4-pin EXACT) + AGENTS.md refresh (dist-bytes line 3,747,372 / close floor 102,628 B; ship v6 25,563 t / boss v2 398 t / ceiling 3,850,000 / 4 pins already current) + DoD check (ship v6 real-airship read LOOK 8-view PASS; boss v2 LOOK ACCEPTED; camera/views verified-or-fixed I504; all re-pins WITH MEASUREMENT; hygiene clean; Pages re-triggered by final push - billing lock logged I504). E67 CLOSED 7/7. Logs: .evidence/I505/ (causal483_i505.log, causal495_i505.log, playframe483_i505.log, playframe491_i505.log, pwa491_i505.log).";
    s += note + "\n"; wr(f, s); console.log("ok epics.md"); }
  // 5) timeline.md (LF)
  { const f = "production/timeline.md"; let s = rd(f);
    if (!s.endsWith("\n")) { s += "\n"; }
    const line = "- 2026-11-19  I505 (ST-471, E67 - G67.0 close gate, probe-only): fresh causal495 PASS 3-arm (webgl + default EXACT seed-9876, webgpu report-only) + causal483 CAUSAL456 PASS + playframe483/491 PLAYFRAME456 PASS (A 22/25,781 + B 52/55,400) + pwa491 11/11 + quality bar 6/6 (1145/1145 + build 0 + dist 3,747,372 B/175 + 4-pin EXACT) + AGENTS.md refresh (close floor 102,628 B) + epic DoD check - E67 CLOSED 7/7.";
    s += line + "\n"; wr(f, s); console.log("ok timeline.md"); }
  // 6) CHANGELOG.md: insert before - I504: (CRLF, no trailing newline)
  { const f = "CHANGELOG.md"; let s = rd(f);
    const idx = s.indexOf("\n- I504:");
    if (idx === -1) { console.log("FAIL changelog anchor"); fail++; }
    else { const line = "- I505: ST-471 E67 stage 7 - G67.0 close gate (probe-only zero src): fresh causal495 PASS 3-arm (dist :4200 - webgl + default EXACT seed-9876, webgpu report-only) + causal483 CAUSAL456 PASS + playframe483/491 PLAYFRAME456 PASS (A 22/25,781 + B 52/55,400) + pwa491 11/11 (dist :5199) + quality bar 6/6 (1145/1145 + build 0 + dist 3,747,372 B/175 + 4-pin EXACT) + AGENTS.md refresh (dist-bytes line + close floor 103,437 -> 102,628 B) + epic DoD check - E67 CLOSED 7/7 (ship v6 25,563 t + boss v2 398 t + camera/view pass all live; Pages still blocked on the account Actions billing lock).";
      s = s.slice(0, idx) + "\r" + line + s.slice(idx); wr(f, s); console.log("ok CHANGELOG.md"); } }
}
console.log(fail === 0 ? "DOCS505_OK" : "DOCS505_FAIL(" + fail + ")");
process.exit(fail === 0 ? 0 : 1);
