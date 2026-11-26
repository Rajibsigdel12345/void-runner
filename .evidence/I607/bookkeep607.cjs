const fs = require('fs');
const P = 'E:/Game/';
function firstByte(p){ return fs.readFileSync(p)[0]; }
function patchReplace(p, anchor, repl, label){
  const before = firstByte(p);
  let s = fs.readFileSync(p, 'utf8');
  const cnt = s.split(anchor).length - 1;
  if (cnt !== 1) throw new Error(label + ' anchor count ' + cnt + ' (expected 1) in ' + p);
  s = s.split(anchor).join(repl);
  fs.writeFileSync(p, s, 'utf8');
  const after = firstByte(p);
  if (before !== after) throw new Error(label + ' BOM delta! ' + before + ' -> ' + after + ' in ' + p);
  console.log('OK ' + label + ' (' + p.split('/').pop() + ')');
}
function appendTail(p, tail, add, label){
  const before = firstByte(p);
  let s = fs.readFileSync(p, 'utf8');
  if (!s.endsWith(tail)) throw new Error(label + ' tail mismatch in ' + p + ' (got ...' + JSON.stringify(s.slice(-60)) + ')');
  s = s + add;
  fs.writeFileSync(p, s, 'utf8');
  const after = firstByte(p);
  if (before !== after) throw new Error(label + ' BOM delta! in ' + p);
  console.log('OK ' + label + ' (append ' + p.split('/').pop() + ')');
}

// ---- AGENTS.md item-4 (1 patch; anchor starts at "I597" - no leading paren on disk) ----
patchReplace(P+'AGENTS.md',
`I597 close re-measure = unchanged 6,851,951 / 203); CLOSE FLOOR E86 = 546,411 B measured at G86.0 (I602: 7,400,000 - 6,853,589 fresh dist re-measured EXACT [byte-identical to I600/I601 - no src change since I600; I601 probe/docs only]; headroom >= 102,400 B floor -> cut ladder NOT invoked; E86 CLOSED I602); prior CLOSE FLOOR E85 =`,
`I597 close re-measure = unchanged 6,851,951 / 203) -> 6,851,917 (I599, -34 B: cockpit thrust-basis == view direction fix, minified L1035 call swap, 203 files; I598 E86 open docs-only = unchanged) -> 6,853,589 (I600, +1,672 B: cockpit interior frame DOM cockpitFrame.js, 204 files; I601 probe/docs-only = unchanged; I602 close re-measure = unchanged) -> 6,854,043 (I604, +454 B: E87 R2 banded radial dolly implementation, 204 files; I603 E87 open probe/docs-only + I605 probe/docs-only = unchanged) -> 6,854,378 (I606, +335 B: E87 G2 damped dolly direction, 204 files); CLOSE FLOOR E87 = 545,622 B measured at G87.0 (I607: 7,400,000 - 6,854,378 fresh dist re-measured EXACT [byte-identical to I606 - zero src change since I606; close gate 5/5 EXACT zero re-pins]; headroom >= 102,400 B floor -> cut ladder NOT invoked; E87 CLOSED I607); prior CLOSE FLOOR E86 = 546,411 B measured at G86.0 (I602: 7,400,000 - 6,853,589 fresh dist re-measured EXACT [byte-identical to I600/I601 - no src change since I600; I601 probe/docs only]; headroom >= 102,400 B floor -> cut ladder NOT invoked; E86 CLOSED I602); prior CLOSE FLOOR E85 =`,
'AGENTS item-4');

// ---- scope-check-E87.md (3 patches) ----
patchReplace(P+'production/scope-check-E87.md',
`| ST-571  | G87.0 close gate (clone run_closegate602.cjs -> run_closegate607.cjs) + CLOSE FLOOR E87 WITH MEASUREMENT + AGENTS.md item-4 refresh + push delegate | docs + .evidence/I607/ | 0 B |`,
`| ST-571  | DONE I607 - G87.0 close gate: run_closegate607.cjs (clone of the I602 runner, labels CLOSEGATE602 -> CLOSEGATE607, OUTDIR I607, ports self-start/self-kill, all 4 verified free after) 5/5 EXACT zero re-pins (causal495 3-arm seed-9876 / causal483 score 11334 / playframe483 + playframe491 A 22/62,472 + P 11/180, B 52/132,682 / pwa491 SUMMARY 11/11); fresh dist re-measure EXACT 6,854,378 B / 204 (byte-identical to I606, zero src change since I606); vendor 4/4 EXACT; CLOSE FLOOR E87 = 545,622 B WITH MEASUREMENT (7,400,000 - 6,854,378; headroom >= 102,400 B floor -> cut ladder NOT invoked); AGENTS.md item-4 refreshed (E87 clause at head of the close-floor chain + the missing I598-I600/I603-I606 dist steps inserted; E86 demoted to prior) | docs + .evidence/I607/ | 0 B (verified byte-identical 6,854,378 B / 204) |`,
'scope ST-571 row');
patchReplace(P+'production/scope-check-E87.md',
`- (to be filled at ST-571 close: G87.0 CLOSEGATE 5/5 + fresh dist re-measure + CLOSE FLOOR E87 WITH MEASUREMENT + AGENTS.md item-4 refresh).`,
`- ST-571 (I607): run_closegate607.cjs (clone of the I602 runner, labels CLOSEGATE602 -> CLOSEGATE607, OUTDIR I607, ports self-start/self-kill, all 4 verified free after) HARNESS PASS 5/5 EXACT zero re-pins: causal495 [3-arm seed-9876: webgl EXACT + default EXACT + webgpu report-only] / causal483 [score 11334 EXACT] / playframe483 + playframe491 [A L 22/62,472 + P 11/180 EXACT, B 52/132,682 EXACT, console 0/0] / pwa491 [SUMMARY 11/11]. Fresh dist re-measure EXACT 6,854,378 B / 204 (byte-identical to I606 - zero src change since I606); vendor 4/4 EXACT (A65DE049A7F38B40 / 7AB0784CD2532367 / F549248412C62B9A / 7FF9ACF50F006017). CLOSE FLOOR E87 = 545,622 B WITH MEASUREMENT (7,400,000 - 6,854,378; headroom >= 102,400 B floor -> cut ladder NOT invoked). AGENTS.md item-4 refreshed (E87 clause at head of the close-floor chain + the missing I598-I600/I603-I606 dist steps inserted; E86 demoted to prior).`,
'scope verification');
patchReplace(P+'production/scope-check-E87.md',
`Next owner: I607 = ST-571 (G87.0 close gate; ST-572 DONE I606 - G2 shipped: regression 2/2 EXACT zero re-pins, smoke606 maxStepSettled 5.35 deg/frame, dist 6,854,378 B / 204).`,
`Next owner: E87 CLOSED I607 (G87.0; 5/5 stories DONE). I608 = user standing queue first item (E88: richer ship/enemy art via Blender 5.2.3 headless - asset cap renegotiation WITH MEASUREMENT at 99.4% used + GLB contract + dist budget pre-registration; queue behind it: Monolith wave-5 wall / late-wave pacing / 2 E85 luma residuals / WebGPU visuals pass / cockpit ship-portions + cockpit-relative controls).`,
'scope next-owner');

// ---- epics.md (3 patches) ----
patchReplace(P+'production/epics.md',
`## E87 - Far-framing fix (banded radial dolly backDir, endless only) - OPEN I606 (ST-568 DONE; ST-569 DONE; ST-570 DONE; ST-572 DONE; ST-571 PENDING)`,
`## E87 - Far-framing fix (banded radial dolly backDir, endless only) - CLOSED I607 (G87.0; opened I603)`,
'epics header');
patchReplace(P+'production/epics.md',
`ST-571 (I607) G87.0 close gate + CLOSE FLOOR E87 WITH MEASUREMENT + AGENTS.md item-4 refresh + push delegate - PENDING`,
`ST-571 (I607) G87.0 close gate + CLOSE FLOOR E87 WITH MEASUREMENT + AGENTS.md item-4 refresh + push delegate - DONE I607: run_closegate607.cjs 5/5 EXACT zero re-pins (causal495 3-arm / causal483 11334 / playframe483+491 A 22/62,472 + P 11/180, B 52/132,682 / pwa491 11/11) + fresh dist 6,854,378 B / 204 (byte-identical to I606) + CLOSE FLOOR E87 = 545,622 B WITH MEASUREMENT + AGENTS.md item-4 refresh`,
'epics stories');
patchReplace(P+'production/epics.md',
`- Status: OPEN I606 (ST-568 DONE I603 docs-only; ST-569 DONE I604 implementation + 5 unit tests + regression 2/2 EXACT zero re-pins; ST-570 DONE I605 verification probe + (d) re-freeze; ST-572 DONE I606 G2 implementation - regression 2/2 EXACT zero re-pins, smoke maxStepSettled 5.35 deg/frame; ST-571 PENDING).`,
`- Status: CLOSED I607 (G87.0; 5/5 stories DONE). ST-568 I603 (research + probe) / ST-569 I604 (R2 banded radial dolly implementation, +454 B, 1,243/1,243) / ST-570 I605 (farframe604 probe + (d) re-freeze, docs-only) / ST-572 I606 (G2 damped dolly direction, +335 B, 1,246/1,246, regression 2/2 EXACT zero re-pins, smoke maxStepSettled 5.35 deg/frame) / ST-571 I607 (G87.0 close gate, 5/5 EXACT zero re-pins, dist 6,854,378 B / 204, CLOSE FLOOR E87 = 545,622 B, AGENTS.md item-4 refresh).`,
'epics status');

// ---- stories.md (1 patch) ----
patchReplace(P+'production/stories.md',
`- ST-571 E87 G87.0 close gate (I607) - PENDING: .evidence/I607/run_closegate607.cjs clone of the I602 runner (5/5: causal495 3-arm seed-9876 / causal483 score 11334 / playframe483+491 A 22/62,472 + P 11/180 B EXACT / pwa491 11/11; pins EXACT or re-pin WITH MEASUREMENT per I570) + fresh dist re-measure (E87 budget <= 6,858,000 B / 204) + CLOSE FLOOR E87 WITH MEASUREMENT + AGENTS.md item-4 refresh + push delegate`,
`- ST-571 E87 G87.0 close gate (I607) - DONE I607: run_closegate607.cjs (clone of the I602 runner, labels CLOSEGATE602 -> CLOSEGATE607, OUTDIR I607, ports self-start/self-kill, all 4 verified free after) HARNESS PASS 5/5 EXACT zero re-pins - causal495 [3-arm seed-9876: webgl EXACT + default EXACT + webgpu report-only] / causal483 [score 11334 EXACT] / playframe483 + playframe491 [A L 22/62,472 + P 11/180 EXACT, B 52/132,682 EXACT, console 0/0] / pwa491 [SUMMARY 11/11: SW active + root scope + controller + offline boot + no NaN + console clean]. Fresh dist re-measure EXACT 6,854,378 B / 204 (byte-identical to I606 - zero src change since I606; within E87 budget <= 6,858,000 B / 204); vendor 4/4 EXACT (A65DE049A7F38B40 / 7AB0784CD2532367 / F549248412C62B9A / 7FF9ACF50F006017). CLOSE FLOOR E87 = 545,622 B WITH MEASUREMENT (7,400,000 - 6,854,378; headroom >= 102,400 B floor -> cut ladder NOT invoked). AGENTS.md item-4 refreshed (E87 clause at head of the close-floor chain + the missing I598-I600/I603-I606 dist steps inserted; E86 demoted to prior). Push: I607 commit push delegated to Wegener 01a215dc-9568-7921-925d-3a64bbd7f9be (landing verified next turn via git ls-remote; the I606 push 9e5911f confirmed on origin main this turn). Hygiene: 0 tabs, all 4 ports free.`,
'stories ST-571');

// ---- appends ----
appendTail(P+'production/iterations.md',
`confirmed on origin main this turn).`,
`\r\n## I607 - ST-571 (E87): G87.0 close gate - E87 CLOSED. run_closegate607.cjs (clone of the I602 runner, labels CLOSEGATE602 -> CLOSEGATE607, OUTDIR I607, ports self-start/self-kill, all 4 verified free after) CLOSEGATE607 HARNESS PASS 5/5 EXACT zero re-pins: causal495 [3-arm seed-9876: webgl EXACT + default EXACT + webgpu report-only] / causal483 [score 11334 EXACT] / playframe483 + playframe491 [A L 22/62,472 + P 11/180 EXACT, B 52/132,682 EXACT, console 0/0] / pwa491 [SUMMARY 11/11: SW active + root scope + controller + offline boot + no NaN + console clean]. Fresh dist re-measure EXACT 6,854,378 B / 204 (byte-identical to I606 - zero src change since I606); vendor 4/4 EXACT (A65DE049A7F38B40 / 7AB0784CD2532367 / F549248412C62B9A / 7FF9ACF50F006017). CLOSE FLOOR E87 = 545,622 B WITH MEASUREMENT (7,400,000 - 6,854,378; headroom >= 102,400 B floor -> cut ladder NOT invoked). NOTE: the active.md NEXT-I607 line pre-registered "expect ~575,622 B" - arithmetic slip, corrected here (the WITH-MEASUREMENT value is 545,622 B). AGENTS.md item-4 refreshed (E87 clause at head of the close-floor chain + the missing I598-I600/I603-I606 dist steps inserted; E86 demoted to prior). E87 CLOSED (5/5 stories: ST-568 I603 research+probe / ST-569 I604 R2 banded radial dolly implementation +454 B / ST-570 I605 farframe604 probe + (d) re-freeze docs-only / ST-572 I606 G2 damped dolly direction +335 B, 1,246/1,246 / ST-571 I607 close gate).`,
'iterations I607');
appendTail(P+'production/iterations.md',
`corrected here (the WITH-MEASUREMENT value is 545,622 B).`,
`\r\n- Push: I607 commit push delegated to Wegener 01a215dc-9568-7921-925d-3a64bbd7f9be (landing verified next turn via git ls-remote; the I606 push 9e5911f confirmed on origin main this turn).`,
'iterations I607 push');

appendTail(P+'production/timeline.md',
`dist 6,854,378 B / 204 (+335 B).`,
`\n\n## I607 - ST-571: G87.0 close gate - E87 CLOSED. The 5/5 close gate (run_closegate607.cjs, a clone of the I602 runner) ran all 5 harnesses EXACT with zero re-pins (causal495 3-arm seed-9876 / causal483 score 11334 / playframe483 + playframe491 A 22/62,472 + P 11/180, B 52/132,682 / pwa491 SUMMARY 11/11), every port self-started and self-killed and verified free after. The fresh dist re-measure is EXACT 6,854,378 B / 204 - byte-identical to I606 because the close gate is docs + .evidence only (zero src change since I606). CLOSE FLOOR E87 = 545,622 B (7,400,000 - 6,854,378; headroom well above the 102,400 B close-floor floor, so the cut ladder was not invoked). The far-framing fix is complete: R2 banded radial dolly (I604) + G2 damped dolly direction (I606) mean the chase camera now keeps the whole arena in view from every rim while preserving the I445 invariance in the inner arena. E87 CLOSED. Next: I608 opens E88 (the user standing Blender art ask).`,
'timeline I607');

appendTail(P+'production/session-state/active.md',
`cockpit ship-portions + cockpit-relative controls).`,
`\r\n- NEXT at I608 = open E88 (Blender art epic) - user standing queue first item: richer ship/enemy art via Blender 5.2.3 headless (the standing art ask: "real airship", more detail/polygon count, model other spaceships for the new enemies). Open E88 with a scope-check that pre-registers (a) asset cap renegotiation WITH MEASUREMENT (cap 3,940 KB / 91,050 t at 99.4% used: 3,915 KB / 90,977 t measured at I561/ST-527) and (b) a new-epic dist budget WITH MEASUREMENT (CLOSE FLOOR E87 = 545,622 B headroom, ceiling 7,400,000 B, close-floor floor 102,400 B) + (c) the GLB contract pattern (size/tris/COLOR_0/flat node set, per I552 D3 / I561 D5) + (d) Blender at D:/Blender/blender.exe headless. Then the first Blender asset pass. Queue behind it (I598 candidate list): Monolith wave-5 wall / late-wave pacing (user: wave 8/9 blue unbreakable rocks -> wave clearance feels like waiting forever) / 2 E85 luma residuals (warden sky p50 +20.12 / drone +10.41) / WebGPU visuals pass / cockpit ship-portions + cockpit-relative controls (src/render/cockpitFrame.js exists from I600).`,
'active I608');

console.log('ALL BOOKKEEP607 PATCHES APPLIED');