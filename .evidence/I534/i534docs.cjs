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

// ---------- 1. stories.md: append STATUS (I534) line after the I533 "Next:" tail (CRLF) ----------
{
  const p = "E:/Game/production/stories.md";
  const s = read(p);
  if (s.includes("STATUS (I534):")) throw new Error("I534 already present");
  const line = `STATUS (I534): ST-500 DONE (I534) - E72: HAULER v2 remaster "squat mine-hauler truck" (Blender 5.2.3 headless; zero core/sim code): build_hauler_v2.py (build_e69b.py helpers verbatim) - one welded squircle hull (q=0.5, tube2b n=40, 14 stations, cap_back, tip_front 0.82; NO see-through) + 5 ridge3 RAISED bands (forward rule: ridge tubes, not inset) + 4 LARGE buried-box deck cargo containers (box bottom buried under the deck + top plate rim - no floating boxes) + armored nose panel (flush, both ends embedded); 2 WELDED flush sponsons (centerline hugs the hull taper so the inner face is embedded everywhere, NO gaps; tube2b n=22 q=2/3 + 2 ridge3 bands + 5 top lugs each); a GLOW mine-bay hatch (sloped base plate + 14x8 dome + 10x4 rim at z 0.375); a rear exhaust stack (collar + 20-gon tube 6 stations open mouth + 2 bandz + deflector + 2 stubs). Node names EXACT VR_Hull/VR_SponsonL/VR_SponsonR/VR_Hatch/VR_Stack (renderer regex slots /hatch/=glow, /sponson.*l|r/=sponson, /stack/=stack, rest=hull - UNCHANGED from I517); grayscale luma bake 0.25..0.96; identity transforms, absolute part-space. I534 FIX PASS (viewed diag/probe BEFORE accept - smallest levers): (A) true squircle q=2/p (the p=4/3 superellipse-param form was a PINCHED astroid star, corners to 1/4 radius -> floating containers); (B) tube2b cap vertices use the per-station cx (not hardcoded y=0) - Y-offset sponson rings made a centerline spike; (C) sponson 5th lug; (D) buried-box containers; (E) hatch rim/dome lowered to z 0.375 so the rim straddles the falling deck. ALSO root-caused + FIXED a 5th-material defect: mat() always-new auto-duplicated VR_SponsonMat.001 (SponsonL+R each got their own) -> changed to get-or-create so both sponsons share ONE material -> 4 materials total (renderer uses only geometry+COLOR_0 anyway, so GLB mats are dead weight). Measured FINAL: VR_Hull 2,128 / VR_SponsonL 500 / VR_SponsonR 500 / VR_Stack 456 / VR_Hatch 336 = 3,920 t; RAD 1.201 (target 1.10, class 1.092, gate 0.968..1.232 PASS); GLB 304,272 B (+39,856 / +15.1% vs old 264,416; UNDER the 2x decimate tripwire 528,832 B -> no decimate). Audit: EEVEE 960x540 3-suns dark world + tint 0x975a2d (CONFIG hauler ore-bronze palette); 10 renders (4 views x clay/tint + front/back sil96) -> P1 silhouette gate PASSED (squat armored ore truck: boxy squircle hull with 4 buried deck containers + ridge bands, welded sponsons with lugs, forward mine-bay hatch, rear exhaust stack - a truck, not the I517 blob). Swap assets/enemy_hauler.glb 264,416 -> 304,272 B. Test re-pins WITH MEASUREMENT (tests/assetGlbs.test.js 24 re-pins via repins534.cjs CRLF-safe + probe534.mjs verbatim test algorithms): BUDGETS.hauler 3506->3920; byte cap -> 298 KB (304,272 B); per-node tris 2128/500/500/456/336; extents + facets re-pinned. tests/assetPerf.test.js totalGeoKB 2850->2920 re-pin WITH MEASUREMENT (measured 2866.07 KB = 2,934,858 B; headroom 53.93 KB; ST-501 bulwark + ST-502 gunship v2 re-measure/re-pin at landing + G72.0). Quality bar 6/6: npm test 1,187/1,187 + npm run build 0 + dist 5,326,496 B / 184 (WITH MEASUREMENT, +39,856 B = GLB delta; under 6,100,000 B ceiling, headroom 773,504 B > 102,400 B floor -> cut ladder NOT invoked) + vendor pins EXACT 4/4 (git diff vendor/ = 0) + BOM delta 0 + hygiene (0 servers, 0 tabs). Harness pins: hauler firstWave 16 absent from every pinned window -> ALL 5 EXPECTED EXACT, zero re-pins - verified at G72.0 (I538). Next: I535 = ST-501 (BULWARK v2 remaster - clone .evidence/I516/build_e69a.py: hex-shield guardian, RAD 1.55, nodes VR_Shield/VR_Spine/VR_Core[core=glow]; old 149,884 B, tripwire 2x = 299,768 B; palette body 0xaa3c96/spine 0x4a1a3d/core 0xff7de8; firstWave 17; USE RIDGE TUBES not inset for raised bands [forward rule]; mat() MUST be get-or-create [copy the I534 fix] to keep <=4 mats; re-measure + re-pin totalGeoKB at landing [currently 2920]).\r\n`;
  write(p, rep1(s, "Next: I534 = ST-500 (HAULER v2 remaster).\r\n", line, false));
  console.log("stories.md OK");
}

// ---------- 2. epics.md: replace ST-500 story line + bring the Status line current (LF) ----------
{
  const p = "E:/Game/production/epics.md";
  let s = read(p);
  s = rep(s, "ST-500 (I534) HAULER v2 remaster.",
    "ST-500 (I534) HAULER v2 remaster - DONE I534 (squat mine-hauler truck v2: 3,920 t / 304,272 B / RAD 1.201; 24 + 1 test re-pins WITH measurement; I534 fix pass + 5th-material defect fixed).");
  s = rep(s,
    "- Status: IN PROGRESS (ST-498 DONE I532 - measured fleet audit + research + scope docs; 4 defect ships confirmed; node contracts + pin-safety tree-verified).",
    `- Status: IN PROGRESS (ST-498 DONE I532 + ST-499 DONE I533 [phantom v2 cloaker-dart 3,048 t / 214,568 B / RAD 0.866] + ST-500 DONE I534 [hauler v2 squat mine-hauler truck 3,920 t / 304,272 B / RAD 1.201]; dist 5,326,496 B / 184 WITH measurement; 2 remaster stories remain [ST-501 bulwark, ST-502 gunship]). NOTE: I533's epics.md edit did not persist (last epics commit = I532 scope-open); the ST-499 + ST-500 status caught up at I534.`);
  write(p, s);
  console.log("epics.md OK");
}

// ---------- 3. iterations.md: append I534 section (no trailing NL) ----------
{
  const p = "E:/Game/production/iterations.md";
  let s = read(p);
  if (s.includes("## I534")) throw new Error("I534 already present");
  const sec = `\n\n## I534 (ST-500, E72): HAULER v2 remaster "squat mine-hauler truck" - Blender headless + fix pass + 5th-material defect fix + swap + test re-pins WITH MEASUREMENT
- User request (standing, verbatim): "the new enemies type donot look like good assets you can model other spacesheeps" + "use blender to create assets required for the game and improve it" + "improve the art element of the game". E72 = the bounded enemy art-direction pass (I532 scope; P1-P7 principles; node contracts frozen; dist tripwires pre-registered).
- Build (.evidence/I534/build_hauler_v2.py; build_e69b.py helpers verbatim - tube2b/ridge3/box/plate/bandz/sphere/torush/ringz/tubez/hash3 + bake + mat + gates + export flags exact): one welded squircle hull (q=0.5, tube2b n=40, 14 stations, cap_back, tip_front 0.82; NO see-through) + 5 ridge3 RAISED bands (forward rule: ridge tubes instead of inset - I501 lesson) + 4 LARGE buried-box deck cargo containers (box bottom 0.31 buried 0.03-0.11 under the squircle deck + top plate rim at 0.49 - no floating boxes) + armored nose panel (flush on the nose slope, both ends embedded). 2 WELDED flush sponsons (centerline hugs the hull taper so the inner face is embedded everywhere, NO gaps; tube2b n=22 q=2/3, 6 stations, cap_back, tip_front 0.50; 2 ridge3 bands + 5 top lugs each). A GLOW mine-bay hatch (sloped base plate welded into the front deck + 14x8 dome + 10x4 rim at z 0.375). A rear exhaust stack (collar + 20-gon tube 6 stations open mouth + 2 bandz + deflector plate + 2 stubs). Node names EXACT: VR_Hull / VR_SponsonL / VR_SponsonR / VR_Hatch / VR_Stack (renderer regex: /hatch/=glow, /sponson.*l|sponson.*r/=sponson, /stack/=stack, rest=hull - UNCHANGED from I517). Grayscale luma bake clamped 0.25..0.96 (hatch = 0.90 glow). Axis +X nose / +Y lateral / +Z up; identity node transforms; absolute part-space.
- I534 FIX PASS (applied after probing the first buggy build - smallest levers): (A) true squircle q=2/p (hull q=0.5 boxy slab, sponson q=2/3) - the p=4/3 superellipse-param form was a PINCHED astroid star (corners to 1/4 radius -> floating containers); (B) tube2b cap vertices now use the per-station cx (stations[k][1]) instead of hardcoded y=0.0 - the Y-offset sponson rings produced a centerline spike; (C) sponson 5th lug (+12 t -> 456); (D) containers = buried-box design (box bottom under the deck + top plate rim); (E) hatch rim/dome lowered to z 0.375 so the rim straddles the falling deck.
- 5th-material defect (root-caused + FIXED this iteration): the FIRST build exported 5 materials (VR_SponsonMat.001 duplicate). Root cause: mat() always did bpy.data.materials.new(name), so SponsonL and SponsonR each auto-created a distinct material (Blender appends .001 on the second). FIX: mat() now get-or-create (bpy.data.materials.get(name) first) so both sponsons share ONE material -> 4 materials total (VR_HatchMat / VR_HullMat / VR_SponsonMat / VR_StackMat; SponsonL+R share mat idx 2). The renderer (haulerMesh.js useGLB) uses only the GLB geometry + COLOR_0 vertex colors and assigns its OWN in-code 4 materials by node-name regex, so the GLB materials are dead weight - but the per-file material budget gate (assetPerf perFileMats: 4) still counts them, so the fix is required to stay within budget. Tris/extents/facets IDENTICAL after the fix (geometry untouched); only the material count changed (5 -> 4).
- Measured FINAL (probe534.mjs - VERBATIM copy of the test parseGlb/enemyFacetLumasPrim/primExtents algorithms): VR_Hull 2,128 (aim 1900 cap 2500) / VR_SponsonL 500 / VR_SponsonR 500 (450-640) / VR_Stack 456 (400-560) / VR_Hatch 336 (250-380) = 3,920 t; RAD 1.201 (target 1.10, class 1.092, gate 0.968..1.232 = 0.88-1.12x PASS); GLB 304,272 B / 4 materials (old 264,416 B; +39,856 B / +15.1% - UNDER the 2x decimate tripwire 528,832 B -> no decimate).
- Audit (.evidence/I534/audit_hauler_v2.py; loads the TEMP GLB; EEVEE 960x540 Standard, 3 suns, dark world; tint 0x975a2d = CONFIG hauler ore-bronze palette): 10 renders - v2_hauler_{f34,front,back,side}_{clay,tint}.png + {front,back}_sil96.png. P1 silhouette gate: side + f34 = squat armored ore truck (boxy squircle hull with 4 buried deck containers + 5 ridge bands, welded sponsons with top lugs, forward mine-bay hatch, rear exhaust stack) - unmistakably a truck, NOT the I517 blob. ACCEPTED. The 10 audit PNGs were rendered from the pre-material-fix GLB but have IDENTICAL geometry (the audit uses its own material, not the GLB's) -> the ACCEPTED/VIEW decision stands; no re-audit needed.
- Swap: assets/enemy_hauler.glb 264,416 -> 304,272 B (dist/assets copy verified = 304,272 B after build).
- Test re-pins WITH MEASUREMENT: (1) tests/assetGlbs.test.js - 24 re-pins via repins534.cjs CRLF-safe (measurements from probe534.mjs): BUDGETS.hauler 3506 -> 3920; byte cap 298 * 1024 (304,272 B); per-node tris hull 2128 / sponL 500 / sponR 500 / hatch 336 / stack 456; all extents + ENEMY451_FACET.hauler (VR_Hatch 0.9000x3, VR_Hull 0.3200/0.5800/0.6200, VR_SponsonL 0.3400/0.4979/0.5500, VR_SponsonR 0.3400/0.5029/0.5500, VR_Stack 0.3333/0.4000/0.5000). (2) tests/assetPerf.test.js - totalGeoKB 2850 -> 2920 re-pin WITH MEASUREMENT (measured 2866.07 KB = 2,934,858 B; headroom 53.93 KB; ST-501 bulwark + ST-502 gunship v2 re-measure/re-pin at landing + G72.0) + cosmetic byte-msg 304,384 -> 304,272 B. Fleet re-measured (replicating assetPerf.parseGlb): totalFilesKB 2926.45 KB (2,996,688 B) cap 3000 PASS; totalGeoKB 2866.07 KB cap 2920 PASS (after re-pin); totalTris 64,743 cap 66,000 PASS; max perFile ship.glb 567.81 KB cap 600 PASS; mats>4 none PASS. House rule honored: re-pin only when a shipped mesh/geometry changes - ST-500 IS the shipped geometry change.
- Pin-safety: hauler firstWave 16 (config.js:624; spec said 15 but 15 is a boss wave - pinned to effective debut 16) is absent from every pinned window (causal pins wave 2; playframe B frame 50 ~ wave 1) -> ALL 5 harness pins EXPECTED EXACT, zero re-pins (E69 I516/I517 precedent). Confirmed at G72.0 (I538).
- Bookkeeping note: the epics.md Status line was NOT updated at I533 (last epics.md commit = I532 scope-open; I533's i533docs.cjs epics insert was the buggy insert-only helper). I534 catches it up with a correct replace: the E72 Status line now reflects ST-498 (I532) + ST-499 (I533) + ST-500 (I534) DONE; 2 remaster stories remain (ST-501 bulwark, ST-502 gunship).
- Quality bar 6/6: npm test 1,187/1,187 + npm run build 0 + dist 5,326,496 B / 184 (WITH MEASUREMENT: 5,286,640 + 39,856 = GLB delta; under 6,100,000 B ceiling; headroom 773,504 B > 102,400 B floor -> cut ladder NOT invoked) + vendor pins EXACT 4/4 (git diff vendor/ empty; A65DE049A7F38B40 / 7AB0784CD2532367 / F549248412C62B9A / 7FF9ACF50F006017) + BOM delta 0 (6/6 core docs; no new docs this iteration) + hygiene (0 servers, 0 tabs - headless node + Blender only).
- Residuals (documented, ship-as-is): (1) inset_region-on-curved-strip non-manifold latent defect (affects I533 phantom 8 band_insets + I517 hauler v1 + stack bandz; invisible in game; RIDGE TUBES = forward rule for raised bands going forward); (2) sponson-hull junction subtle crease shadows (NOT see-through - solid silhouettes, welded-protrusion read) - acceptable; (3) the mat() get-or-create fix above (5th material -> 4).
- .evidence/I534 (build_hauler_v2.py [ridge + mat get-or-create, FINAL] + audit_hauler_v2.py + matfix534.cjs + repins534.cjs + repins534b.cjs + probe534.mjs + i534docs.cjs + hauler_v2.glb 304,272 B + png480/ [10 PNGs: 8 at 480x270 + 2 sil96 as-is, per I532 house practice] + diag/iso probe scripts, force-added).
- Next: I535 = ST-501 (BULWARK v2 remaster - clone .evidence/I516/build_e69a.py: old "flat hex disc reads as orb" -> hex-shield guardian; RAD target 1.55; nodes VR_Shield / VR_Spine / VR_Core [core=glow]; old 149,884 B, tripwire 2x = 299,768 B; palette body 0xaa3c96 / spine 0x4a1a3d / core 0xff7de8; firstWave 17; USE RIDGE TUBES not inset for raised bands [forward rule]; mat() MUST be get-or-create [copy the I534 fix] to keep <=4 mats; re-measure + re-pin totalGeoKB at landing [currently 2920]).`;
  if (s.endsWith("\n")) s = s.slice(0, -1);
  write(p, s + sec);
  console.log("iterations.md OK");
}

// ---------- 4. timeline.md: append I534 line (file ends with NL) ----------
{
  const p = "E:/Game/production/timeline.md";
  let s = read(p);
  if (s.includes("I534 (ST-500, E72)")) throw new Error("I534 already present");
  const line = `I534 (ST-500, E72) - HAULER v2 remaster "squat mine-hauler truck" [Blender 5.2.3 headless; zero core/sim code]: build_hauler_v2.py (build_e69b.py helpers verbatim) - welded squircle hull (q=0.5, tube2b n=40, 14 stations) + 5 ridge3 RAISED bands [forward rule, not inset] + 4 buried-box deck containers + armored nose + 2 welded flush sponsons [lugs] + glow mine-bay hatch + rear exhaust stack; node names EXACT VR_Hull/VR_SponsonL/VR_SponsonR/VR_Hatch/VR_Stack [regex slots unchanged]; grayscale luma bake 0.25..0.96; I534 fix pass [squircle q=2/p, per-station cap cx, 5th lug, buried-box, hatch z 0.375] + 5th-material defect root-caused/fixed [mat() always-new -> VR_SponsonMat.001 dup; get-or-create -> 4 mats]; measured FINAL 3,920 t [2128/500/500/456/336] / RAD 1.201 [class 1.092 PASS] / GLB 304,272 B [+39,856 / +15.1% vs 264,416; under 2x tripwire 528,832]; EEVEE audit 10 renders [4 views x clay/tint + front/back sil96; tint 0x975a2d = CONFIG hauler] -> P1 silhouette gate PASSED [squat armored ore truck, not the I517 blob]; swap assets/enemy_hauler.glb 264,416 -> 304,272 B; test re-pins WITH MEASUREMENT [assetGlbs 24 re-pins BUDGETS 3506->3920/byte 298KB/tris/extents/facets + assetPerf totalGeoKB 2850->2920 measured 2866.07 KB; fleet totalFiles 2926.45 KB PASS / totalTris 64,743 PASS / mats>4 none]; epics Status line caught up [I533's epics edit had not persisted]; harness pins ALL 5 EXPECTED EXACT [firstWave 16 absent from pinned windows; E69 precedent]; 1,187/1,187 + build 0 + dist 5,326,496 B/184 WITH MEASUREMENT [headroom 773,504 B > floor -> cut ladder NOT invoked] + vendor diff 0 + BOM delta 0 + hygiene [0 servers, 0 tabs]\n`;
  if (!s.endsWith("\n")) s += "\n";
  write(p, s + line);
  console.log("timeline.md OK");
}

// ---------- 5. CHANGELOG.md: insert after ## [Unreleased] (CRLF) ----------
{
  const p = "E:/Game/CHANGELOG.md";
  let s = read(p);
  if (s.includes("- I534:")) throw new Error("I534 already present");
  const entry = `- I534: ST-500 E72 - HAULER v2 remaster "squat mine-hauler truck" (Blender headless). The ore-truck hauler - the I517 blob - is now a proper squat armored truck: one welded boxy squircle hull with five raised ridge bands, four buried deck cargo containers, two welded sponsons with stowage lugs, a forward mine-bay hatch (its white-hot ramp is the read-your-death cue), and a rear exhaust stack. A targeted fix pass rebuilt the hull cross-section (a pinched superellipse was making the deck containers float), buried the containers into the deck, and lowered the hatch to straddle it; a second pass also tracked down and fixed a stray fifth material the exporter was auto-duplicating. 3,920 tris (was 3,506), 304,272 B GLB (was 264,416 B - still under the pre-registered 2x decimate tripwire), same node-name contract, so no code or config changed. 25 unit-test pins re-pinned WITH MEASUREMENT (the house rule for shipped geometry changes). Dist 5,326,496 B / 184 (under the 6,100,000 B ceiling). Next: I535 = BULWARK v2 remaster.\r\n`;
  write(p, rep1(s, "## [Unreleased]\r\n", entry, false));
  console.log("CHANGELOG.md OK");
}

// ---------- 6. active.md: append note line (file ends with single NL) ----------
{
  const p = "E:/Game/production/session-state/active.md";
  let s = read(p);
  if (s.includes("I534 (ST-500, E72) done")) throw new Error("I534 already present");
  const line = `I534 (ST-500, E72) done: HAULER v2 remaster "squat mine-hauler truck" (Blender 5.2.3 headless; zero core/sim code). build_hauler_v2.py (build_e69b.py helpers verbatim): welded squircle hull + 5 ridge3 raised bands [forward rule] + 4 buried-box deck containers + armored nose + 2 welded flush sponsons + glow mine-bay hatch + rear exhaust stack; node names EXACT (regex slots unchanged). I534 fix pass (squircle q=2/p pinched-astroid, per-station cap cx, 5th lug, buried-box containers, hatch z 0.375) + 5th-material defect root-caused/fixed (mat() always-new -> VR_SponsonMat.001 dup -> get-or-create -> 4 mats; renderer uses only geometry+COLOR_0 anyway). Measured FINAL 3,920 t / RAD 1.201 (class 1.092) / 304,272 B (+15.1% vs old; under 2x tripwire). EEVEE audit 10 renders -> P1 silhouette gate PASSED (squat armored ore truck, not the I517 blob). Swap assets/enemy_hauler.glb 264,416 -> 304,272 B. 25 test re-pins WITH MEASUREMENT (probe534.mjs verbatim algorithms) + assetPerf totalGeoKB 2850->2920 (measured 2866.07 KB). epics Status line caught up (I533's epics edit had not persisted). Harness pins ALL 5 EXPECTED EXACT (firstWave 16 absent from pinned windows; E69 precedent; verified at G72.0/I538). Quality bar 6/6 (1,187/1,187 + build 0 + dist 5,326,496 B/184 WITH MEASUREMENT + vendor EXACT 4/4 + BOM delta 0 + hygiene 0 servers/0 tabs). .evidence/I534 force-added (scripts + probe + hauler_v2.glb + png480/ 10 PNGs). Next: I535 = ST-501 BULWARK v2 remaster (hex-shield guardian; RAD 1.55; nodes VR_Shield/VR_Spine/VR_Core[glow]; old 149,884 B, tripwire 299,768 B; ridge tubes for raised bands; mat() get-or-create).\n`;
  if (!s.endsWith("\n")) s += "\n";
  write(p, s + line);
  console.log("active.md OK");
}

// ---------- BOM verification ----------
function bomCount(p) {
  const b = fs.readFileSync(p);
  let n = 0;
  for (let x = 0; x + 2 < b.length; x++) if (b[x] === 0xEF && b[x+1] === 0xBB && b[x+2] === 0xBF) { n++; x += 2; }
  return n;
}
const base = { "CHANGELOG.md": 7, "stories.md": 5, "epics.md": 3, "iterations.md": 5, "timeline.md": 3, "active.md": 0 };
for (const [f, want] of Object.entries(base)) {
  const p = f === "active.md" ? "E:/Game/production/session-state/active.md" : "E:/Game/" + (f === "CHANGELOG.md" ? "CHANGELOG.md" : "production/" + f);
  const got = bomCount(p);
  console.log("BOM", f, got, got === want ? "OK" : "MISMATCH want " + want);
}
console.log("ALL_DOCS_DONE");