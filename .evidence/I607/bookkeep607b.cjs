const fs = require('fs');
const P = 'E:/Game/';
function firstByte(p){ return fs.readFileSync(p)[0]; }
function appendTail(p, tail, add, label){
  const before = firstByte(p);
  let s = fs.readFileSync(p, 'utf8');
  if (!s.endsWith(tail)) throw new Error(label + ' tail mismatch in ' + p + ' (got ...' + JSON.stringify(s.slice(-70)) + ')');
  s = s + add;
  fs.writeFileSync(p, s, 'utf8');
  const after = firstByte(p);
  if (before !== after) throw new Error(label + ' BOM delta! in ' + p);
  console.log('OK ' + label + ' (append ' + p.split('/').pop() + ')');
}
appendTail(P+'production/iterations.md',
`ST-571 I607 close gate).`,
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
console.log('REMAINING 3 APPENDS APPLIED');