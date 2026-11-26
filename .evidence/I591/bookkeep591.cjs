// I591 (ST-558, E84): bookkeeping patcher - epics + stories + CHANGELOG + active + timeline + iterations (house pattern: unique anchor, count===1, EOL-preserving)
const fs = require('fs');
const P = 'E:/Game/';
function eolOf(s) { return s.indexOf('\r\n') !== -1 ? '\r\n' : '\n'; }
function segReplace(file, from, to, tag) {
  const s = fs.readFileSync(P + file, 'utf8');
  const n = s.split(from).length - 1;
  if (n !== 1) { console.error(tag + ': anchor count ' + n + ' (expected 1) - ABORT'); process.exit(1); }
  fs.writeFileSync(P + file, s.split(from).join(to));
  console.log(tag + ': patched (' + file + ')');
}
function insertBeforeLine(file, prefix, line, tag) {
  const s = fs.readFileSync(P + file, 'utf8');
  const eol = eolOf(s);
  const lines = s.split(eol);
  const cnt = lines.filter(l => l.startsWith(prefix)).length;
  const idx = lines.findIndex(l => l.startsWith(prefix));
  if (cnt !== 1) { console.error(tag + ': anchor line count ' + cnt + ' (expected 1) - ABORT'); process.exit(1); }
  lines.splice(idx, 0, line);
  fs.writeFileSync(P + file, lines.join(eol));
  console.log(tag + ': inserted (' + file + ' before line ' + (idx + 1) + ')');
}
function appendLines(file, arr, tag) {
  const s = fs.readFileSync(P + file, 'utf8');
  const eol = eolOf(s);
  const t = s.endsWith(eol) ? s : s + eol;
  fs.writeFileSync(P + file, t + arr.join(eol) + eol);
  console.log(tag + ': appended (' + file + ', ' + arr.length + ' lines)');
}
// 1) epics.md: ST-558 PENDING -> DONE
segReplace('production/epics.md',
  'ST-558 PENDING I591 (drone v2 + warden v2 to .evidence/I591/ only)',
  'ST-558 DONE I591 (drone v2 2,080 t / warden v3 2,290 t in .evidence/I591/; sil96 + P-gate PASS both; net-zero src)',
  'epics');
// 2) stories.md: ST-558 line PENDING -> DONE with the full record
segReplace('production/stories.md',
  '- ST-558 E84 drone v2 + warden v2 build (I591) - PENDING I591: Blender 5.2.3 headless builds to .evidence/I591/ ONLY (build scripts cloned from the E83 ship-v8 pipeline pattern; EEVEE audit 4 views x clay/tint + sil96 per ship; sil96 continuity gate +/-15% of the ST-557 audit baseline; per-ship caps 2,000/2,500 t + GLB 150,000/200,000 B; NO game files touched).',
  '- ST-558 E84 drone v2 + warden v2 build (I591) - DONE I591: Blender 5.2.3 headless builds in .evidence/I591/ ONLY (no src/, no assets/). warden v3 (build_warden_v3.py): solid turret-bulwark remaster - hex fortress hull (deck hex + raised parapet ring + 12 wall ribs + 12 wall vents + 2 skids + 4 dome struts + turret + dome loft) + 3 armor slabs at 30/150/270deg (per slab: core wall + faceplate raised +0.05 + 2 cap lips + 2 side fins + 4 corner brackets + center boss; 11 boxes pre-bevel); hull bevel tune CAP_FAIL ladder 2698/2166/1846/1782/1790 at minlen_k 5/10/14/18/30, angle-band probe (192 of 212 selected edges at 90deg -> length is the lever) -> minlen_k 57 (0.855) = 132 edges: VR_Warden_Hull 1,438 t (band [1,250,1,550] PASS) + VR_Warden_Armor 852 t ([750,950] PASS) = 2,290 t (ship aim 2,000 / hard 2,500 PASS); GLB 64,448 B (target <= 150,000); extents span 4.79 [4.65,4.95] / len 4.5849 [3.9,4.6] / h 1.97 [1.4,2.0] PASS; bake spreads hull 0.6334 / armor 0.7843 (>= 0.30). drone v2 (build_drone_v2.py boomerang): ARM_ZT nudge round 1 [0.38,0.62,0.34,0.36] -> [0.41,0.65,0.37,0.39] measured sil96 0.0786 < 0.0810 -> round 2 (pre-authorized) -> [0.44,0.68,0.40,0.42]: VR_Drone 2,080 t (AIM 1,900 / HARD 2,400 PASS); GLB 52,284 B; extents 2.0857/1.7/1.1354. Audit gates (audit_i591.py, 3 canonical ortho 96px views, scale-bug-fixed fill = true_area/(M^2*(max(inplane)*1.04)^2)): warden sil96 0.0221 in S2-R2 [0.018,0.026] PASS first build (fills A 0.0177 / B 0.0175 / C 0.0312; no tune round); drone sil96 0.0811 in strict [0.0792,0.1072] PASS after round 2 (fills A 0.0525 / B 0.0875 / C 0.1032). P-gate (audit591.py: EEVEE 960x540 Standard, 3-sun rig, 50mm bbox-sphere framing, 4 views x clay+tint per ship; key PNGs viewed): warden = solid turret bulwark (mounted bracketed slabs - NOT scattered slabs), drone = boomerang - both PASS, the one allowed rework unused (.evidence/I591/p1gate591.md). Gate records: gate_divergence591.md (S2-R2 warden re-baseline [0.018,0.026] = 85-97% of the solid-box ceiling 0.0214-0.0246; S1-R2 [0.024,0.028] PRE-REGISTERED for I592 stinger; armor-origin reconciliation [v3 plates mid-hull z-symmetric, bbox center (0,-0.40,0) same class as v2 (0,-0.49,0)]; 5 plan flaws found + fixed pre-build) + gate_overrides591.json (JSON-validated). net-zero src; next I592 (ST-559) = stinger v2 + flyer v2 to .evidence/I592/ ONLY.',
  'stories');
// 3) CHANGELOG.md: insert the I591 line above the I590 line
insertBeforeLine('CHANGELOG.md',
  '- I590: ',
  '- I591: No visible change - two of the four enemy rebuilds are finished and measured. The turret ship (the warden) is now a solid hexagonal bulwark: a low fortress hull with a raised parapet, a central turret and dome, and three armor panels each mounted as one piece with corner brackets and a center boss - no more scattered slabs. The swarm drone is a sharper boomerang: a pointed core with two swept-back raised arms. Both passed their silhouette and weight checks (the warden on its first build, the drone after two small arm-lift adjustments). The stinger and the flyer come next, and the finished set is swapped into the game in the round after that. Nothing in the game changes yet. Bundle unchanged at 7,093,058 bytes, under the 7.4 MB limit with 306,942 bytes of room to spare.',
  'changelog');
// 4) session-state/active.md: append NEXT at I592
appendLines('production/session-state/active.md', [
  '- NEXT at I592 = ST-559 (E84): build stinger v2 + flyer v2 in Blender 5.2.3 headless -> .evidence/I592/ ONLY (stinger: VR_Stinger_Body 1,820/2,260 + Core 180/240, S1-R2 [0.024,0.028] applied WITH MEASUREMENT first, character = canard/needle missile dart; flyer: VR_Flyer_Body 1,850/2,310 + Dome 150/190 [dome node must match /dome|core/i], STRICT [0.0351,0.0475], M 2.55, character = crescent side-blades; GLB 150,000/200,000 B; sil96 audit + EEVEE 4 views x (clay + tint); 1 rework max; NO src/ or assets/ touched)'
], 'active');
// 5) timeline.md: append the I591 line
appendLines('production/timeline.md', [
  'I591 (ST-558, E84) done: no visible change - two of the four enemy rebuilds are built and measured. The turret ship (the warden) is now a solid hexagonal bulwark: a low fortress hull with a raised parapet, a central turret and dome, and three armor panels mounted as one piece each (with corner brackets and a center boss) instead of scattered slabs. The swarm drone is a sharper boomerang: a pointed core nose with two swept-back raised arms. Both passed their silhouette and weight checks - the warden on its first build, the drone after two small arm-lift adjustments. The stinger and the flyer come next; nothing in the game changes yet. Bundle unchanged at 7,093,058 bytes.'
], 'timeline');
// 6) iterations.md: append the I591 entry
appendLines('production/iterations.md', [
  '',
  '## I591 (ST-558, E84): drone v2 + warden v3 builds (Blender 5.2.3 headless, .evidence/I591/ only, net-zero src)',
  '',
  '- Pre-state: local == origin aebc980 (I590, push-verified); dist 7,093,058 B / 203 (I590 re-measure, byte-identical since); all 4 ports free; zero tabs/terminals.',
  '- Change: .evidence/I591/ only (no src/, no assets/). warden v3 (build_warden_v3.py, 18,978 B): solid turret-bulwark remaster - hex fortress hull (deck hex r 2.375 + raised parapet ring + 12 wall ribs + 12 wall vents + 2 skids + 4 dome struts + turret base + dome loft) + 3 armor slabs at 30/150/270deg (per slab: core wall + faceplate raised +0.05 + 2 cap lips + 2 side fins + 4 corner brackets + center boss; 11 boxes pre-bevel). Hull bevel tune (CAP_FAIL ladder 2698/2166/1846/1782/1790 at minlen_k 5/10/14/18/30; angle-band probe: 192 of 212 selected edges at 90deg, length bands 80/60/72 at 0.45-0.85/0.85-1.3/1.3+ -> the long-edge band is the lever): minlen_k 57 (0.855) -> 132 edges. VR_Warden_Hull 1,438 t (band [1,250,1,550] PASS) + VR_Warden_Armor 852 t ([750,950] PASS) = 2,290 t (ship aim 2,000 / hard 2,500 PASS); GLB 64,448 B (target <= 150,000 PASS); extents span 4.79 [4.65,4.95] / len 4.5849 [3.9,4.6] / h 1.97 [1.4,2.0] PASS; bake spreads hull 0.6334 / armor 0.7843 (>= 0.30 PASS). drone v2 (build_drone_v2.py boomerang): ARM_ZT nudge round 1 [0.38,0.62,0.34,0.36] -> [0.41,0.65,0.37,0.39] measured sil96 0.0786 < 0.0810 -> round 2 (pre-authorized, arm top 0.68 < core apex 0.7354) -> [0.44,0.68,0.40,0.42]: VR_Drone 2,080 t (AIM 1,900 / HARD 2,400 PASS); GLB 52,284 B; extents 2.0857/1.7/1.1354.',
  '- Audit gates (audit_i591.py): warden sil96 0.0221 in S2-R2 [0.018,0.026] PASS first build (fills A 0.0177 / B 0.0175 / C 0.0312; the one allowed tune round NOT used); drone sil96 0.0811 in strict [0.0792,0.1072] PASS after round 2 (fills A 0.0525 / B 0.0875 / C 0.1032).',
  '- P-gate (audit591.py: EEVEE 960x540 Standard, 3-sun rig, 50mm bbox-sphere framing, 4 views x clay+tint per ship; key PNGs viewed with view_image): warden = solid turret bulwark read (mounted bracketed slabs on the outer walls, fortress hull, turret + dome - NOT scattered slabs); drone = boomerang read (pointed core nose + swept raised arms + 2 pods); both PASS, the one allowed rework unused (.evidence/I591/p1gate591.md 2,556 B; note: tint runs pale per the I586 MixRGB fac-0.5 convention - shape verdict unaffected).',
  '- Gate records: gate_divergence591.md (6,276 B: S2-R2 warden re-baseline [0.018,0.026] = 85-97% of the solid-box ceiling 0.0214-0.0246 [I590 S2 [0.045,0.060] was ~2x above ceiling -> unreachable]; S1-R2 [0.024,0.028] PRE-REGISTERED for I592 stinger [ceiling 0.0281-0.0286 verified by box math]; armor-origin reconciliation: v3 plates mount mid-hull z-symmetric caps +/-0.30, bbox center (0,-0.40,0) same class as v2 (0,-0.49,0), accepted side effect = spent 0.62 state plates embed in hull mass [radial 1.10-1.41 < hex flat 2.0565] so spent read = plates vanish + orange glow + spike collar; 5 plan flaws found + fixed pre-build [wall ribs r 1.98->2.04, wall vents r 2.02->2.05, forward skids zc -0.68->-0.65, 12 deck bolts split r 2.05 vertex angles / r 1.80 flat centers, turret bolts k*60 not k*60+30]) + gate_overrides591.json (JSON-validated).',
  '- Quality bar 6/6 (net-zero): npm test 1,237/1,237; npm run build exit 0; dist re-measured byte-identical 7,093,058 B / 203 (.evidence/I591/measure591.cjs); vendor 4/4 EXACT (three.module A65DE049A7F38B40 / three.core 7AB0784CD2532367 / three.webgpu F549248412C62B9A / three.tsl 7FF9ACF50F006017); BOM delta 0 (AGENTS 1 / epics 3 / stories 5 / iterations 5 / timeline 3 / active 0 / CHANGELOG 7); all 4 ports 5173/4173/4200/5199 free; zero browser tabs; zero terminals left running.',
  '- Next I592 (ST-559): build stinger v2 + flyer v2 in Blender 5.2.3 headless -> .evidence/I592/ ONLY (stinger: VR_Stinger_Body 1,820/2,260 + Core 180/240, S1-R2 [0.024,0.028] applied WITH MEASUREMENT first, character = canard/needle missile dart; flyer: VR_Flyer_Body 1,850/2,310 + Dome 150/190 [dome node must match /dome|core/i], STRICT [0.0351,0.0475], M 2.55, character = crescent side-blades; GLB 150,000/200,000 B; sil96 audit + EEVEE 4 views x (clay + tint); 1 rework max; NO src/ or assets/ touched).'
], 'iterations');
console.log('bookkeep591: all 6 patched');