const fs = require('fs');
const G = (p) => fs.readFileSync('E:/Game/' + p);
function rep1(p, anchor, repl, label) {
  const b = G(p);
  const t = b.toString('latin1');
  const n = t.split(anchor).length - 1;
  if (n !== 1) throw new Error(label + ': anchor count ' + n + ' != 1: ' + anchor.slice(0, 70));
  const out = t.replace(anchor, repl);
  fs.writeFileSync(p, Buffer.from(out, 'latin1'));
  console.log(label + ' OK ' + b.length + ' -> ' + Buffer.byteLength(out, 'latin1'));
}
// 1. epics.md (3 single-anchor replaces)
rep1('production/epics.md',
  'ST-490 R1 fix WITH MEASUREMENT (baseline re-confirm -> Option B -> re-measure R1/R2/R5 -> decision rule ship / fallback Option A / accept-with-documentation -> spec Appendix B BEFORE/AFTER).',
  'ST-490 (I524) R1 fix WITH MEASUREMENT - DONE I524 (Option B SHIPPED: baseline re-confirm 1.4667 s -> kiter median 4.05 s in [2.0,12.0], expiry 0, hit 0; R2 HOLDS 100% bothKilled 5.05->6.075 s; R5 HOLDS aggro 2.15; decision rule step 3 -> SHIP, residual R1 CLOSED; spec Appendix B BEFORE/AFTER).',
  'epics.STORIES');
rep1('production/epics.md',
  'ST-489 DONE I523 (research + scope + this open, docs-only zero src - dist byte-identical 5,254,934 B/184, vendor UNCHANGED, pins EXPECTED EXACT through the epic; Splicer/Warden alternation finding: wave-10 heavyweight = Splicer 30 hp or Warden, NOT the Monolith - ST-491 attributes before lever choice).',
  'ST-489 DONE I523 (research + scope + this open, docs-only zero src - dist byte-identical 5,254,934 B/184, vendor UNCHANGED, pins EXPECTED EXACT through the epic; Splicer/Warden alternation finding: wave-10 heavyweight = Splicer 30 hp or Warden, NOT the Monolith - ST-491 attributes before lever choice). ST-490 DONE I524 (R1 fixed WITH MEASUREMENT - Option B enterDur 1.2->2.0 SHIPPED config-only; kiter 1.4667->4.05 s in [2.0,12.0] expiry 0 hit 0; R2/R5 HOLD; residual R1 CLOSED; spec Appendix B).',
  'epics.STATUS');
rep1('production/epics.md',
  'Next: I524 = ST-490 (R1 WITH MEASUREMENT; Option B enterDur 1.2->2.0 primary, Option A hp 2->3 fallback).',
  'Next: I525 = ST-491 (R7 diagnosis harness - ship-hit source payload tag, payload-only no logic/RNG change; 10 seeds 52700+i, full wave-1 director, cap 36000 ticks; branches B/A/C).',
  'epics.NEXT');
// 2. stories.md (insert STATUS (I524) before STATUS (I523), CRLF)
rep1('production/stories.md',
  'STATUS (I523):',
  'STATUS (I524): ST-490 DONE (I524) - E70 IN PROGRESS: R1 phantom TTK fix WITH MEASUREMENT (config-only: phantom.enterDur 1.2 -> 2.0 + 2 comments): baseline re-confirm 1.4667 s [integrity gate PASS, 62100+i x100] -> Option B -> kiter median 4.05 s (p90 6.0667) in [2.0,12.0], expired 0, hitRuns 0; R2 HOLDS (bothKilled 100%, median 5.05 -> 6.075 s <= 20 s); R5 HOLDS (aggro 2.15 <= kiter 4.05 + 1.0); decision rule step 3 -> SHIP Option B, residual R1 CLOSED, Option A not needed; deviation documented (predicted +0.8 s vs measured +2.58 s - spec Appendix B.4); spec Appendix B (E70) written (design/e69-enemy-spec.md 22,659 -> 26,738 B, pure ASCII LF); pins ALL EXACT (causal495 3-arm / causal483 / playframe483 / playframe491 / pwa491 11/11); 1,187/1,187 + build 0 + dist 5,254,932 B/184 (-2 B) + vendor UNCHANGED + BOM delta 0.\r\nSTATUS (I523):',
  'stories.STATUS');
// 3. iterations.md (append at EOF; file ends NL; LF style at tail)
{
  const p = 'production/iterations.md';
  const b = G(p);
  const t = b.toString('latin1');
  if (!t.endsWith('\n')) throw new Error('iterations: no trailing NL');
  const entry = '\n## I524 - ST-490: R1 phantom TTK fix WITH MEASUREMENT - Option B SHIPPED (config-only: one value + 2 comments)\n- R1 Baseline re-confirm (integrity gate PASS, .evidence/I524/balance524.mjs node-only 60 Hz, seeds 62100+i/72100+i x100): phantom1-kiter median 1.4667 s (p90 2.8167), killed 100/100, expired 0, hitRuns 0, histogram {88:57, 169:43}; aggro 1.5333 s; phantom2 bothKilled 100%, median 5.05 s (p90 15.4833), hitRuns 2 - reproduces I521/I522 exactly.\n- R2 Option B applied: src/core/config.js ONLY (phantom.enterDur 1.2 -> 2.0 + 2 comment lines; latin1 round-trip + 2 single-anchor asserts + head16 guard, .evidence/I524/optB524.cjs).\n- R3 Option B re-measure -> R1 PASS (kiter median 4.05 s, p90 6.0667, in [2.0,12.0]; expired 0; hitRuns 0; histogram {243:57, 364:43} - same seeds, same clusters, +155/+195 ticks, no re-classification); R2 HOLDS (bothKilled 100% unchanged, median 5.05 -> 6.075 s, p90 24.5667, hitRuns 2 -> 7 recorded for transparency); R5 HOLDS (aggro 2.15 <= kiter 4.05 + 1.0). Decision rule step 3 -> SHIP Option B. Residual R1 CLOSED. Option A (hp 2 -> 3) not needed.\n- R4 Deviation documented: predicted +0.8 s vs measured +2.58 s - pilot weave sin(t/90) is a function of absolute tick (+48 ticks at orbit start) + the phantom parks invisible on the ring ~0.75 s before the 2.0 s gate (spec Appendix B.4).\n- R5 Spec Appendix B (E70) written: design/e69-enemy-spec.md 22,659 -> 26,738 B (head16 232045363920456e6d792053706563 unchanged, pure ASCII, LF, ends NL; .evidence/I524/appendixB524.cjs + appendixB524.txt).\n- R6 Quality bar (measured): 1,187/1,187 + build 0 + dist 5,254,932 B/184 (-2 B) < 6,100,000 B ceiling + git diff vendor/ empty + BOM delta 0; pins ALL EXACT - causal495 3-arm PASS (webgl/default EXACT; webgpu err=0 warn=3 documented I498 baseline), causal483 CAUSAL456 PASS (console 0/0), playframe483/491 PLAYFRAME456 PASS (B 52/55,400 hv=0/gv=0; console 0/0), pwa491 SUMMARY 11/11; 3 hidden servers killed + 5173/4200/5199 ECONNREFUSED, all headless tabs closed.\n- Next: I525 = ST-491 (R7 diagnosis harness - ship-hit source payload tag at src/core/game.js:520, PAYLOAD ONLY no logic/RNG change; 10 seeds 52700+i, full wave-1 director, cap 36000 ticks, kiter; killing-blow source histogram + per-wave deaths + resource state at death; evaluate frozen branches B/A/C - diagnosis-only, NO game change).\n';
  fs.writeFileSync(p, Buffer.concat([b, Buffer.from(entry, 'latin1')]));
  console.log('iterations.APPEND OK ' + b.length + ' -> ' + (b.length + Buffer.byteLength(entry, 'latin1')));
}
// 4. timeline.md (append; ends NL; LF at tail)
{
  const p = 'production/timeline.md';
  const b = G(p);
  const t = b.toString('latin1');
  if (!t.endsWith('\n')) throw new Error('timeline: no trailing NL');
  const line = '- 2026-11-20  I524 (ST-490: R1 phantom TTK fix WITH MEASUREMENT - Option B phantom.enterDur 1.2->2.0 SHIPPED (config-only, 1 value + 2 comments): baseline re-confirm 1.4667 s [integrity gate PASS] -> kiter median 4.05 s (p90 6.0667) in [2.0,12.0], expiry 0, hit 0; R2 HOLDS 100% bothKilled 5.05->6.075 s; R5 HOLDS aggro 2.15; decision rule step 3 -> SHIP, residual R1 CLOSED, Option A not needed; deviation documented (+0.8 s predicted vs +2.58 s measured); spec Appendix B (E70) 22,659->26,738 B; pins ALL EXACT (causal495 3-arm / causal483 / playframe483 / playframe491 / pwa491 11/11); 1,187 tests; dist 5,254,932 B/184 (-2 B); vendor pins EXACT 8/8. Next: I525 = ST-491 (R7 diagnosis harness, payload-only source tag) / standing queue [camera+FPV / PWA+mobile+menu / enemy art pass].)\n';
  fs.writeFileSync(p, Buffer.concat([b, Buffer.from(line, 'latin1')]));
  console.log('timeline.APPEND OK ' + b.length + ' -> ' + (b.length + Buffer.byteLength(line, 'latin1')));
}
// 5. CHANGELOG.md (insert - I524: before - I523:, CRLF; file has no trailing NL, untouched)
rep1('CHANGELOG.md',
  '## [Unreleased]\r\n- I523:',
  '## [Unreleased]\r\n- I524: ST-490 E70 - R1 phantom TTK residual fixed WITH MEASUREMENT (config-only: phantom.enterDur 1.2 -> 2.0 + 2 comments) - baseline re-confirm 1.4667 s [integrity gate PASS, 62100+i x100] -> Option B -> kiter median 4.05 s (p90 6.0667) in [2.0,12.0], expired 0, hit 0; R2 HOLDS (bothKilled 100% unchanged, median 5.05 -> 6.075 s <= 20 s); R5 HOLDS (aggro 2.15 <= kiter 4.05 + 1.0); decision rule step 3 -> SHIP Option B, residual R1 CLOSED, Option A (hp 2 -> 3) not needed; deviation documented (predicted +0.8 s vs measured +2.58 s - pilot weave absolute-tick phase + phantom parked-invisible 0.75 s, spec Appendix B.4); spec Appendix B (E70) written (22,659 -> 26,738 B); pins ALL EXACT (causal495 3-arm / causal483 / playframe483 / playframe491 / pwa491 SUMMARY 11/11); 1,187/1,187 + build 0 + dist 5,254,932 B/184 (-2 B) + vendor UNCHANGED + BOM delta 0\r\n- I523:',
  'changelog.INSERT');
// 6. active.md (finalize I523 note + append I524 note)
rep1('production/session-state/active.md',
  'Committed (this story) + push pending.',
  'Committed 389f6c2 + PUSHED-OK (671b110..389f6c2).',
  'active.FINALIZE-I523');
{
  const p = 'production/session-state/active.md';
  const b = G(p);
  const t = b.toString('latin1');
  const note = '- notes: I524 done (ST-490 E70 - R1 phantom TTK fix WITH MEASUREMENT, config-only 1 value + 2 comments): baseline re-confirm 1.4667 s [integrity gate PASS, 62100+i x100, .evidence/I524/balance524.mjs node-only] -> Option B phantom.enterDur 1.2->2.0 SHIPPED -> kiter median 4.05 s (p90 6.0667) in [2.0,12.0], expired 0, hitRuns 0; R2 HOLDS (bothKilled 100%, median 5.05->6.075 s); R5 HOLDS (aggro 2.15 <= kiter+1.0); decision rule step 3 -> SHIP Option B, residual R1 CLOSED, Option A not needed; deviation documented (+0.8 s predicted vs +2.58 s measured, mechanism spec Appendix B.4); spec Appendix B (E70) written 22,659->26,738 B; pins ALL EXACT (causal495 3-arm / causal483 / playframe483 / playframe491 / pwa491 11/11) - quality bar: 1,187/1,187 + build 0 + dist 5,254,932 B/184 (-2 B) + vendor UNCHANGED + BOM delta 0 + hygiene (3 hidden servers killed ECONNREFUSED, all headless tabs closed). Committed (this story) + push pending. Next: I525 = ST-491 (R7 diagnosis harness - ship-hit source payload tag, payload-only, no logic/RNG change; 10 seeds 52700+i, full wave-1 director, cap 36000 ticks, kiter; branches B/A/C) / standing queue (camera framing + cockpit FPV / PWA+mobile D-pad+menu reorg / enemy art pass).\n';
  let base = t;
  if (!base.endsWith('\n')) base += '\n';
  fs.writeFileSync(p, Buffer.from(base + note, 'latin1'));
  console.log('active.APPEND-I524 OK ' + b.length + ' -> ' + Buffer.byteLength(base + note, 'latin1'));
}
console.log('BOOKKEEPING I524 DONE');