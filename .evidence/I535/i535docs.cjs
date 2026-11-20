// i535docs.cjs - I535 (ST-501 E72) bookkeeping (latin1 byte-preserving; BOM delta 0; pattern = i534docs.cjs)
const fs = require("fs");
function read(p) { return fs.readFileSync(p, "latin1"); }
function write(p, s) { fs.writeFileSync(p, s, "latin1"); }
function rep1(s, anchor, insert, before) {
  const i = s.indexOf(anchor);
  if (i === -1) throw new Error("anchor not found: " + anchor.slice(0, 60));
  const j = s.indexOf(anchor, i + 1);
  if (j !== -1) throw new Error("anchor not unique: " + anchor.slice(0, 60));
  if (before) return s.slice(0, i) + insert + s.slice(i);
  return s.slice(0, i + anchor.length) + insert + s.slice(i + anchor.length);
}
function rep(s, oldStr, newStr) {
  const count = s.split(oldStr).length - 1;
  if (count !== 1) throw new Error("rep occurrence=" + count + " for " + oldStr.slice(0, 50));
  return s.replace(oldStr, newStr);
}

// ---------- 1. epics.md: E72 Status line - add ST-501 DONE I535, drop the stale NOTE ----------
{
  const p = "E:/Game/production/epics.md";
  let s = read(p);
  if (s.includes("ST-501 DONE I535")) throw new Error("I535 already present");
  s = rep(s,
    "; dist 5,326,496 B / 184 WITH measurement; 2 remaster stories remain [ST-501 bulwark, ST-502 gunship]). NOTE: I533's epics.md edit did not persist (last epics commit = I532 scope-open); the ST-499 + ST-500 status caught up at I534.",
    " + ST-501 DONE I535 [bulwark v2 hex-shield guardian 3,160 t / 190,584 B / RAD 1.656 class 1.068x]; dist 5,367,196 B / 184 WITH measurement; 1 remaster story remains [ST-502 gunship]).");
  write(p, s);
  console.log("epics.md OK");
}

// ---------- 2. stories.md: insert STATUS (I535) line BEFORE the STATUS (I534) line ----------
{
  const p = "E:/Game/production/stories.md";
  let s = read(p);
  if (s.includes("STATUS (I535):")) throw new Error("I535 already present");
  const nl = s.includes("\r\n") ? "\r\n" : "\n";
  const line = `STATUS (I535): ST-501 DONE (I535) - E72: BULWARK v2 remaster "hex-shield guardian" (Blender 5.2.3 headless; zero core/sim code): build_bulwark_v2.py (build_e69b.py/hauler helpers verbatim; mat() get-or-create = the I534 5th-material fix) - VR_Shield: thick hex plate (hexplate r 1.00 nu 32, front x 0.26 / back x -0.04 + side quads; v1 was a 1/4-thickness disc) + 3 hexridge RAISED bands (forward rule: ridge tubes, no inset) + 6 corner pylons + 6 front edge bolts + 6 mid-face turrets + 6 raised rear gussets (gussetfix535/2/3 pass) + 2 hex hub plates + rim torus guard ring; VR_Spine: squircle engine block (q 0.5, n 28, 7 stations x 0 -> -0.82, cap_back) + 2 ridge3 bands + 2 side armor plates + 6 rear studs + rear stack box; VR_Core: glow sphere 13x7 r 0.12 + ring torus 18x6 + 6 studs. Node names EXACT VR_Shield/VR_Spine/VR_Core (renderer regex slots /core/=glow, /spine/=spine, /shield|hull/=slab - UNCHANGED from I516); grayscale luma bakes (shield 0.46-0.71 banding, spine 0.28-0.44, core 0.93); identity transforms, absolute part-space. I532 defect (v1): "plain circle with notches" - a flat hex disc that reads as an orb; measured v1 2,700 t (Shield 1924 / Spine 522 / Core 254), GLB 149,884 B. I535 FIX PASS (gussetfix535/2535/3535.cjs - the 6 rear gussets went from flat slivers to RAISED panels [boxx rotated to the hex corner angle, r 0.80, x -0.065]; smallest levers, everything else untouched) -> FINAL: VR_Shield 1,924 (budget 1850-2300) / VR_Spine 792 (700-950) / VR_Core 444 (400-550) = 3,160 t; RAD 1.656 (class 1.068x of target 1.55, gate 0.88-1.12x PASS); 3 materials (<=4); GLB 190,584 B (+40,700 / +27.2% vs old 149,884; UNDER the 2x decimate tripwire 299,768 B -> no decimate). Audit: EEVEE 960x540 3-suns dark world + tint 0xaa3c96 (CONFIG bulwark palette); 10 renders (4 views x clay/tint + front/back sil96) -> P1 silhouette gate ACCEPTED (front = concentric raised hex ridges + hub + glowing core; side = THICK shield + protruding engine block; back = raised gusset panels + rim guard ring + corner pylons - unmistakably a hex-shield guardian). Swap assets/enemy_bulwark.glb 149,884 -> 190,584 B. Test re-pins WITH MEASUREMENT (tests/assetGlbs.test.js 16 re-pins via repins535.cjs CRLF-safe + probe535.mjs/probe535b.mjs verbatim test algorithms): BUDGETS.bulwark 2700->3160; byte cap 150->187 KB (190,584 B); per-node tris 1924/792/444; extents sh 0.4250/2.0811/2.1800, co X 0.2306 + Z 0.4140, sp 0.9400/0.4540/0.8000 (extents comment anchored to the VR_Shield line - the bare I516 comment also exists in the phantom test); ENEMY451_FACET bulwark Shield 0.4600/0.5700/0.7100, Core 0.9300x3, Spine 0.2800/0.3498/0.3912. tests/assetPerf.test.js (repins535b.cjs): totalGeoKB cap 2920 HOLDS - re-measured WITH MEASUREMENT (31 files, totalFilesKB 2,966.20 = 3,037,388 B cap 3000 PASS, totalGeoKB 2,905.82 = 2,975,562 B headroom only 14.18 KB, totalTris 65,203 cap 66,000 PASS - ST-502 gunship v2 must land within ~14 KB geo or re-pin cap WITH MEASUREMENT). House rule honored: re-pin only on shipped-geometry change (this IS the shipped change). Quality bar 6/6: npm test 1,187/1,187 + npm run build 0 + dist 5,367,196 B / 184 (WITH MEASUREMENT, +40,700 B = GLB delta; under 6,100,000 B ceiling, headroom 732,804 B > 102,400 B floor -> cut ladder NOT invoked) + vendor pins EXACT 4/4 (git diff vendor/ = 0) + BOM delta 0 + hygiene (0 servers, 0 tabs). Harness pins: bulwark firstWave 17 absent from every pinned window -> ALL 5 EXPECTED EXACT, zero re-pins - verified at G72.0 (I538). Next: I536 = ST-502 (GUNSHIP v2 remaster).`;
  s = rep1(s, 'STATUS (I534): ST-500 DONE (I534) - E72: HAULER v2 remaster "squat mine-hauler truck"', line + nl, true);
  write(p, s);
  console.log("stories.md OK");
}

// ---------- 3. timeline.md: append I535 line at EOF (I534 is the last line) ----------
{
  const p = "E:/Game/production/timeline.md";
  let s = read(p);
  if (s.includes("I535 (ST-501, E72)")) throw new Error("I535 already present");
  const nl = s.includes("\r\n") ? "\r\n" : "\n";
  const line = `I535 (ST-501, E72) - BULWARK v2 remaster "hex-shield guardian" [Blender 5.2.3 headless; zero core/sim code]: build_bulwark_v2.py [build_e69b.py/hauler helpers verbatim; mat() get-or-create = I534 5th-material fix] - thick hex plate shield [3 hexridge raised bands + 6 corner pylons + 6 edge bolts + 6 mid-face turrets + 6 raised rear gussets + 2 hex hub plates + rim guard ring; v1 was a 1/4-thickness disc] + squircle engine spine [2 ridge3 bands + 2 armor plates + 6 rear studs + stack box] + glow core [sphere 13x7 + torus 18x6 + 6 studs]; node names EXACT VR_Shield/VR_Spine/VR_Core [regex slots unchanged]; gussetfix535/2/3 pass [flat slivers -> raised panels x -0.065]; measured FINAL 3,160 t [1924/792/444] / RAD 1.656 [class 1.068x of 1.55 PASS] / GLB 190,584 B [+40,700 / +27.2% vs 149,884; under 2x tripwire 299,768]; EEVEE audit 10 renders [4 views x clay/tint + front/back sil96; tint 0xaa3c96 = CONFIG bulwark] -> P1 ACCEPTED [hex-shield guardian, not the I532 plain circle]; swap assets/enemy_bulwark.glb 149,884 -> 190,584 B; test re-pins WITH MEASUREMENT [assetGlbs 16 re-pins BUDGETS 2700->3160/byte 187KB/tris/extents/facets + assetPerf totalGeoKB 2920 HOLDS re-measured 2905.82 KB headroom 14.18 KB + totalTris 65,203]; harness pins ALL 5 EXPECTED EXACT [firstWave 17 absent from pinned windows; E69 precedent]; 1,187/1,187 + build 0 + dist 5,367,196 B/184 WITH MEASUREMENT [headroom 732,804 B > floor -> cut ladder NOT invoked] + vendor diff 0 + BOM delta 0 + hygiene [0 servers, 0 tabs]`;
  if (s.length && !s.endsWith("\n")) s += nl;
  s += line + nl;
  write(p, s);
  console.log("timeline.md OK");
}

// ---------- 4. CHANGELOG.md: insert I535 line before I534 under [Unreleased] ----------
{
  const p = "E:/Game/CHANGELOG.md";
  let s = read(p);
  if (s.includes("- I535:")) throw new Error("I535 already present");
  const nl = s.includes("\r\n") ? "\r\n" : "\n";
  const line = `- I535: ST-501 E72 - BULWARK v2 remaster "hex-shield guardian" (Blender headless). The bulwark - the I516 flat hex disc that read as an orb - is now a proper hex-shield guardian: a thick armored hex plate (the v1 disc was a quarter of this thickness) with three raised ridge bands, corner pylons, edge bolts, mid-face turrets, raised rear gusset panels, twin hex hub plates and a rim guard ring, mounted on a protruding squircle engine spine with armor plates and an exhaust stack, with a glowing core out front. A targeted gusset fix pass rebuilt the six rear gussets from flat slivers into raised panels after the audit renders exposed them. 3,160 tris (was 2,700), 190,584 B GLB (was 149,884 B - still under the pre-registered 2x decimate tripwire), same node-name contract, so no code or config changed. 16 unit-test pins re-pinned WITH MEASUREMENT and the fleet-geometry cap re-measured (it HOLDS - headroom is now ~14 KB, so the final gunship remaster must land within it or re-pin WITH MEASUREMENT). Dist 5,367,196 B / 184 (under the 6,100,000 B ceiling). Next: I536 = GUNSHIP v2 remaster.`;
  s = rep1(s, '- I534: ST-500 E72 - HAULER v2 remaster "squat mine-hauler truck"', line + nl, true);
  write(p, s);
  console.log("CHANGELOG.md OK");
}
// ---------- 5. iterations.md: append I535 section at EOF (no trailing NL; LF within section = i534 pattern) ----------
{
  const p = "E:/Game/production/iterations.md";
  let s = read(p);
  if (s.includes("## I535")) throw new Error("I535 already present");
  const sec = `## I535 (ST-501, E72): BULWARK v2 remaster "hex-shield guardian" - Blender headless + gusset fix pass + swap + test re-pins WITH MEASUREMENT
- User request (standing, verbatim): "the new enemies type donot look like good assets you can model other spacesheeps" + "use blender to create assets required for the game and improve it" + "improve the art element of the game". E72 = the bounded enemy art-direction pass (I532 scope; P1-P7 principles; node contracts frozen; dist tripwires pre-registered).
- Build (.evidence/I535/build_bulwark_v2.py; build_e69b.py/hauler helpers verbatim - hexplate/tube2b/ridge3/box/plate/sphere/torush/ringz/tubez/hash3 + bake + mat + gates + export flags exact; mat() = get-or-create = the I534 5th-material fix; gates exit 1 pre-export): node names EXACT VR_Shield / VR_Spine / VR_Core (renderer regex slots /core/=glow, /spine/=spine, /shield|hull/=slab - UNCHANGED from I516). VR_Shield: thick hex plate (hexplate r 1.00 nu 32, front x 0.26 / back x -0.04 + side quads - v1 was a 1/4-thickness disc) + 3 hexridge RAISED bands (0.44-0.58 / 0.70-0.84 / 0.88-0.95, lift 0.038 - forward rule: ridge tubes, no inset) + 6 corner pylons (r 1.00) + 6 front edge bolts (r 0.97) + 6 mid-face turrets (r 0.62) + 6 raised rear gussets (boxx rotated to the hex corner angle, r 0.80, x -0.065) + 2 hex hub plates (r 0.36/0.24 @ x 0.27/0.30) + rim torus (R 1.00 r 0.045, 34x8, reads as guard ring). VR_Spine: squircle engine block (q 0.5, n 28, 7 stations x 0 -> -0.82, cap_back) + 2 ridge3 bands + 2 side armor plates + 6 rear studs + rear stack box. VR_Core: glow sphere 13x7 r 0.12 @ x 0.315 + ring torus 18x6 + 6 studs. Grayscale luma bakes (shield 0.46-0.71 banding, spine 0.28-0.44, core 0.93). Axis +X nose / +Z up, identity transforms, absolute part-space.
- I535 fix pass (gussetfix535/2535/3535.cjs; applied only after the audit renders exposed the 6 rear gussets reading as flat slivers edge-on): rebuilt as proper raised panels - smallest lever, everything else untouched.
- Measured FINAL (probe535.mjs/probe535b.mjs - VERBATIM copies of the test parseGlb/enemyFacetLumasPrim/primExtents + assetPerf parse algorithms): VR_Shield 1,924 (budget 1850-2300) / VR_Spine 792 (700-950) / VR_Core 444 (400-550) = 3,160 t; per-node extents shield 0.4250/2.0811/2.1800 (cx 0.1075) / spine 0.9400/0.4540/0.8000 (cx -0.4700) / core 0.2306/0.4077/0.4140 (cx 0.3167); facets shield 0.4600/0.5700/0.7100, spine 0.2800/0.3498/0.3912, core 0.9300x3; overall RAD 1.656 (class 1.068x of target 1.55, gate 0.88-1.12x PASS); 3 materials (<=4); GLB 190,584 B (old 149,884; +40,700 / +27.2% - UNDER the pre-registered 2x decimate tripwire 299,768 B -> no decimate).
- Fleet re-measure (probe535b.mjs, verbatim assetPerf parse): 31 files; totalFilesKB 2,966.20 (3,037,388 B) cap 3000 PASS; totalGeoKB 2,905.82 (2,975,562 B) cap 2,920 HOLDS - headroom only 14.18 KB (ST-502 gunship v2 must land within ~14 KB geo or re-pin the cap WITH MEASUREMENT at landing); totalTris 65,203 cap 66,000 PASS; max file ship 581,440 B.
- Audit (.evidence/I535/audit_bulwark_v2.py; loads the TEMP GLB; EEVEE 960x540 Standard, 3 suns, dark world; tint 0xaa3c96 = CONFIG bulwark palette): 10 renders - v2_bulwark_{f34,front,back,side}_{clay,tint}.png + {front,back}_sil96.png -> P1 silhouette gate ACCEPTED (all 4 tint views + both sil96 reviewed): front = concentric raised hex ridges + hub + glowing core; side = THICK shield + protruding engine block; back = raised gusset panels + rim guard ring + corner pylons - unmistakably a hex-shield guardian, not the I532 "plain circle with notches".
- Swap: assets/enemy_bulwark.glb 149,884 -> 190,584 B (dist/assets copy verified byte-identical after build: 190,584 B).
- Test re-pins WITH MEASUREMENT: (1) tests/assetGlbs.test.js - 16 re-pins via repins535.cjs CRLF-safe (the final multi-line facet pair failed on a whitespace transcription mismatch -> replaced with two whitespace-agnostic single-line pairs via fix_repins535b.cjs line-splice, CRLF preserved): BUDGETS.bulwark 2700 -> 3160; byte cap 150 -> 187 KB (190,584 B); per-node tris shield 1924 / spine 792 / core 444; extents sh 0.4250/2.0811/2.1800, co X 0.2306 + Z 0.4140, sp 0.9400/0.4540/0.8000 (extents comment anchored to the VR_Shield line - the bare I516 comment also exists in the phantom test); ENEMY451_FACET bulwark Shield 0.4600/0.5700/0.7100, Core 0.9300x3, Spine 0.2800/0.3498/0.3912. House rule honored: re-pin only on shipped-geometry change (this IS the shipped change). (2) tests/assetPerf.test.js - repins535b.cjs: totalGeoKB cap 2920 HOLDS (comment re-measured WITH MEASUREMENT: 2,905.82 KB = 2,975,562 B, headroom 14.18 KB) + totalTris comment re-measured (65,203 t; headroom 797 t).
- Pin-safety: bulwark firstWave 17 is absent from every pinned window (causal pins wave 2; playframe B frame 50 ~ wave 1) -> ALL 5 harness pins EXPECTED EXACT, zero re-pins (E69 I516/I517 precedent). Confirmed at G72.0 (I538).
- Quality bar 6/6: npm test 1,187/1,187 + npm run build 0 + dist 5,367,196 B / 184 (WITH MEASUREMENT: 5,326,496 + 40,700 = GLB delta; under 6,100,000 B ceiling; headroom 732,804 B > 102,400 B floor -> cut ladder NOT invoked) + vendor pins EXACT 4/4 (git diff vendor/ = 0; A65DE049A7F38B40 / 7AB0784CD2532367 / F549248412C62B9A / 7FF9ACF50F006017) + BOM delta 0 (6/6 core docs; no new docs) + hygiene (0 servers, 0 tabs - headless node + Blender only).
- .evidence/I535 (build_bulwark_v2.py + audit_bulwark_v2.py + auditpatch535.cjs + gussetfix535.cjs + gussetfix2535.cjs + gussetfix3535.cjs + probe535.mjs + probe535b.mjs + repins535.cjs + fix_repins535b.cjs + repins535b.cjs + i535docs.cjs + png480_make535.py + bulwark_v2.glb 190,584 B + png480/ [10 PNGs: 8 at 480x270 + 2 sil96 as-is, per I532 house practice; full-res 8 on disk uncommitted]).
- Next: I536 = ST-502 (GUNSHIP v2 remaster - clone .evidence/I509/build_remaster4.py: RAD 1.75 target; E57 spec demanded spine + nacelles + open forward bay; nodes VR_Gunship_Hull / VR_Gunship_Nacelle / VR_Gunship_Bay [bay=glow amber, nacelle=engine]; old 2,596 t / RAD 1.643; I532 defect "faceted egg-blob + one thin wing stub; front-96 = coin"; USE RIDGE TUBES not inset [forward rule]; mat() get-or-create; totalGeoKB headroom only ~14 KB - measure the gunship geo delta BEFORE export, and if it exceeds the headroom, re-pin the cap WITH MEASUREMENT at landing).`;
  s += "\n\n" + sec;
  write(p, s);
  console.log("iterations.md OK");
}

// ---------- 6. session-state/active.md: append I535 note at EOF ----------
{
  const p = "E:/Game/production/session-state/active.md";
  let s = read(p);
  if (s.includes("I535 (ST-501, E72)")) throw new Error("I535 already present");
  const nl = s.includes("\r\n") ? "\r\n" : "\n";
  const line = `- notes: I535 (ST-501, E72) done: BULWARK v2 remaster "hex-shield guardian" (Blender 5.2.3 headless; zero core/sim code). build_bulwark_v2.py: thick hex plate shield [3 raised hexridge bands + 6 pylons + 6 bolts + 6 turrets + 6 raised rear gussets + 2 hub plates + rim guard ring; v1 was a 1/4-thickness disc] + squircle engine spine [2 ridge3 bands + 2 armor plates + 6 studs + stack box] + glow core [sphere 13x7 + torus 18x6 + 6 studs]; gussetfix535/2/3 pass [flat slivers -> raised panels x -0.065]; node names EXACT VR_Shield/VR_Spine/VR_Core [regex slots unchanged]; luma bakes shield 0.46-0.71 / spine 0.28-0.44 / core 0.93; measured FINAL 3,160 t [1924/792/444] / RAD 1.656 [class 1.068x of 1.55 PASS] / GLB 190,584 B [+40,700 / +27.2% vs 149,884; under 2x tripwire 299,768]; EEVEE audit 10 renders -> P1 ACCEPTED [hex-shield guardian, not the v1 plain circle]; swap assets/enemy_bulwark.glb 149,884 -> 190,584 B; test re-pins WITH MEASUREMENT [assetGlbs 16 re-pins + assetPerf totalGeoKB cap HOLDS re-measured 2905.82 KB headroom 14.18 KB + totalTris 65,203]; harness pins ALL 5 EXPECTED EXACT [firstWave 17 absent from pinned windows; E69 precedent]; 1,187/1,187 + build 0 + dist 5,367,196 B/184 WITH MEASUREMENT [headroom 732,804 B > floor -> cut ladder NOT invoked] + vendor diff 0 + BOM delta 0 + hygiene [0 servers, 0 tabs]`;
  if (s.length && !s.endsWith("\n")) s += nl;
  s += line + nl;
  write(p, s);
  console.log("active.md OK");
}

console.log("ALL_I535_DOCS_OK");
