// I590 (ST-557, E84): bookkeeping patcher - epics + stories + CHANGELOG (house pattern: unique anchor, count===1, EOL-preserving)
const fs = require('fs');
function patch(file, from, to, tag) {
  const p = 'E:/Game/' + file;
  const s = fs.readFileSync(p, 'utf8');
  const eol = s.indexOf('\r\n') !== -1 ? '\r\n' : '\n';
  const n = s.split(from).length - 1;
  if (n !== 1) { console.error(tag + ': anchor count ' + n + ' (expected 1) - ABORT'); process.exit(1); }
  fs.writeFileSync(p, s.split(from).join(to));
  console.log(tag + ': patched (' + file + ', eol=' + (eol === '\r\n' ? 'CRLF' : 'LF') + ')');
}
// 1) epics.md E84 Stories line: ST-557 PENDING -> DONE
patch('production/epics.md',
  'ST-557 PENDING I590 (fleet silhouette audit + design/e84-enemy-remaster-research.md + per-role design brief; audit bottom-4 vs default set - divergence -> record + register, I570 pattern)',
  'ST-557 DONE I590 (fleet silhouette audit + research doc + per-role briefs FINAL + GATE-OVERRIDE-E84-S1/S2 registered; audit bottom-4 = default set EXACT, DIVERGENCE: NO)',
  'epics');
// 2) stories.md ST-557 line: PENDING -> DONE with the full record
patch('production/stories.md',
  '- ST-557 E84 fleet silhouette audit + research (I590) - PENDING I590: sil96 fill + tris + B/t composite over all 13 fleet ships -> bottom-4 selection vs the default set {drone, stinger, warden, flyer} (divergence -> record + register, I570 pattern) + design/e84-enemy-remaster-research.md + per-role design brief (finalize drone = angular boomerang / pronged swarm unit, stinger = needle / canard dart, warden = squat hex turret-hump, flyer = crescent side-blades).',
  '- ST-557 E84 fleet silhouette audit + research (I590) - DONE I590: fleet silhouette audit (.evidence/I590/audit_i590.py, Blender 5.2.3 headless: 3 canonical ortho views at 96 px, white-emission override, film transparent) over all 13 fleet ships -> composite ranking (.evidence/I590/rank_i590.cjs: (pctAsc(tris) + (100 - pctAsc(B/t)) + pctAsc(sil96)) / 3, bottom-4 = lowest) = {stinger 16.67, flyer 19.44, drone 27.78, warden 38.89} = the pre-registered DEFAULT SET EXACT (nearest non-set ship sweeper 41.67, gap 2.78, no tie-break) -> DIVERGENCE: NO, no set override (I570 pattern not triggered) + design/e84-enemy-remaster-research.md (15,917 B, ASCII: Y-E1..E4 labeled frame-verified sources / audit table 13 ships / composite ranking / findings F1-F8 / per-role briefs FINAL [drone = boomerang, stinger = missile dart, warden = turret bulwark, flyer = crescent; all sharp-apex per the Y-E2 triangle rule] / per-node tri tables [set 8,000 aim / 10,000 hard] / node-contract invariant [bit-identical node names] / contrast matrix [9 occupied + 4 open slots] / gate resolution / budget cross-check [dist target 7,210,354; cap renegotiation 4,688 KiB / 124,158 t at ST-560] / next iterations) + GATE-OVERRIDE-E84-S1/S2 registered (.evidence/I590/gate_overrides.json, I570 record+register: stinger + warden audit baselines ARE the defect [1px line / scattered slabs] -> sil96 continuity bands re-baselined [0.030, 0.040] + [0.045, 0.060]; drone [0.0792, 0.1072] + flyer [0.0351, 0.0475] strict) + docs/.evidence only, net-zero src; next I591 (ST-558) = drone v2 + warden v2 build to .evidence/I591/ only.',
  'stories');
// 3) CHANGELOG.md: insert the I590 line above the I589 anchor
patch('CHANGELOG.md',
  '- I589: No visible change - the paperwork for the next enemy rebuild is opened.',
  '- I590: No visible change - the plan for the enemy rebuild is finished and the four weakest ships are identified by measurement. Every enemy hull was measured at game size (how much of a tiny 96-pixel square its shape fills), plus triangle count and file weight; the four to rebuild came out exactly as planned - the drone, the stinger, the warden and the flyer. Each now has a finished design brief with one unmistakable shape for its job (a boomerang swarm unit, a missile dart, a turret bulwark and a crescent) and exact triangle and file-size budgets. Two of the four (the stinger and the warden) are allowed to become notably more solid on screen, because their old shapes - a one-pixel line and scattered slabs - were the defect itself. The new hulls are built in the next rounds; nothing in the game changes yet. Bundle unchanged at 7,093,058 bytes, under the 7.4 MB limit with 306,942 bytes of room to spare.\r\n- I589: No visible change - the paperwork for the next enemy rebuild is opened.',
  'changelog');
console.log('bookkeep590: all 3 patched');
