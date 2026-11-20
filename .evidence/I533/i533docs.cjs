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
// ---------- 1. stories.md: append STATUS (I533) line after the I532 line (CRLF) ----------
{
  const p = "E:/Game/production/stories.md";
  const s = read(p);
  if (s.includes("STATUS (I533):")) throw new Error("I533 already present");
  const line = "STATUS (I533): ST-499 DONE (I533) - E72: PHANTOM v2 remaster \"cloaker dart\" (Blender 5.2.3 headless; zero core/sim code): build_phantom_v2.py (build_e69b.py helpers verbatim) - one slim dart hull (tube2 n=36, 12 stations, tip_front 0.86, cap_back -0.70) + 8 band_inset panels + dorsal fin + 2 FLUSH canopy pods (8x4 plate + 16x7 sphere lens + band + rear plate) + small nose sensor (12x7 sphere + 12x5 torus ring) - node names EXACT VR_Hull/VR_PodL/VR_PodR/VR_Nose (renderer regex slots unchanged), grayscale luma bake 0.22..0.96, identity transforms. Measured v1: 3,228 t (Hull 2116/PodL 396/PodR 396/Nose 320), RAD 0.879 (class 1.098), GLB 221,480 B. P8 fix pass (viewed side_clay + f34_tint BEFORE accept - smallest levers): (a) nose sensor sphere was a lollipop bulb (4x local hull width) -> shrunk 0.11/0.085/0.070 -> 0.062/0.050/0.042 + repositioned, torus R 0.075->0.048; (b) rear side winglets read as needle slivers in side view (thin flat plates edge-on) -> removed entirely (dorsal fin keeps vertical identity; cleaner stealth-dart silhouette) -> FINAL: VR_Hull 1,972 / VR_Nose 284 / VR_PodL 396 / VR_PodR 396 = 3,048 t, RAD 0.866 (class 1.083, gate 0.704..0.896 PASS), GLB 214,568 B (+30,844 / +16.8% vs old 183,724; UNDER the 2x decimate tripwire 367,448 B). Audit: EEVEE 960x540 3-suns dark world + green tint 0x40c055 (CONFIG phantom palette); 10 renders (4 views x clay/tint + front/back sil96) -> P1 silhouette gate PASSED (clean slim dart: pointed sensor nose, twin flush canopy pods, dorsal fin, tapered tail; not the old blob). Swap into assets/enemy_phantom.glb (183,724 -> 214,568 B). Test re-pins WITH MEASUREMENT (tests/assetGlbs.test.js, 16 re-pins, probe533.mjs verbatim test algorithms): BUDGETS.phantom 2336->3048; bytes <= 210 KB (214,568 B); per-node tris 1972/284/396/396; extents hull X 1.36->1.56 / Y 0.385->0.4903 / Z 0.48->0.5732, nose X 0.188->0.1209, pod X 0.33->0.36, pod cz +/-0.30 -> +/-0.1275 (mirror guard); ENEMY451_FACET phantom: Hull 0.3600/0.5164/0.6059, Nose 0.9000x3, PodL 0.4790/0.6081/0.6800, PodR 0.4729/0.6134/0.6800. House rule honored: re-pin only on shipped-geometry change (this IS the shipped change). Quality bar 6/6: npm test 1,187/1,187 + npm run build 0 + dist 5,286,640 B / 184 (WITH MEASUREMENT, +30,844 B = GLB delta; under 6,100,000 B ceiling, headroom 813,360 B) + vendor pins EXACT 4/4 (git diff vendor/ = 0) + BOM delta 0 (no new docs) + hygiene (0 servers, 0 tabs). Harness pins: ALL 5 EXPECTED EXACT (phantom firstWave 13 absent from every pinned window; E69 I516/I517 precedent = zero re-pins) - verified at G72.0 (I538). Next: I534 = ST-500 (HAULER v2 remaster).\r\n";
  write(p, rep1(s, "Next: I533 = ST-499 (PHANTOM v2 remaster).\r\n", line, false));
  console.log("stories.md OK");
}
// ---------- 2. epics.md: update E72 story line + status line ----------
{
  const p = "E:/Game/production/epics.md";
  let s = read(p);
  s = rep1(s, "ST-499 (I533) PHANTOM v2 remaster.",
    "ST-499 (I533) PHANTOM v2 remaster - DONE I533 (cloaker-dart v2: 3,048 t / 214,568 B / RAD 0.866; test re-pins WITH measurement; P8 fix pass = nose sensor shrink + winglet removal after side-view audit).");
  s = rep1(s, "- Status: IN PROGRESS (ST-498 DONE I532 - measured fleet audit + research + scope docs; 4 defect ships confirmed; node contracts + pin-safety tree-verified).",
    "- Status: IN PROGRESS (ST-498 DONE I532 + ST-499 DONE I533 - phantom v2 \"cloaker dart\" shipped: 3,048 t / 214,568 B / RAD 0.866, P1 silhouette gate passed, 16 test re-pins WITH measurement, dist 5,286,640 B / 184 WITH measurement; 3 remaster stories remain).");
  console.log("epics.md OK");
}
// ---------- 3. iterations.md: append I533 section (no trailing NL) ----------
{
  const p = "E:/Game/production/iterations.md";
  let s = read(p);
  if (s.includes("## I533")) throw new Error("I533 already present");
  const sec = "\n\n## I533 (ST-499, E72): PHANTOM v2 remaster \"cloaker dart\" - Blender headless + P8 fix pass + swap + test re-pins WITH MEASUREMENT\n- User request (standing, verbatim): \"the new enemies type donot look like good assets you can model other spacesheeps\" + \"use blender to create assets required for the game and improve it\" + \"improve the art element of the game\". E72 = the bounded enemy art-direction pass (I532 scope; P1-P7 principles; node contracts frozen; dist tripwires pre-registered).\n- Build (.evidence/I533/build_phantom_v2.py; build_e69b.py helpers verbatim - tube2/box/plate/band_inset/sphere/torus/hash3 + bake + mat + gates + export flags exact): one slim dart hull (tube2 n=36, 12 stations, tip_front 0.86, cap_back -> -0.70) + 8 band_inset armor panels (P6 inset detail, no floating boxes) + dorsal fin (9x4 both) + 2 FLUSH canopy pods (8x4 plate + 16x7 sphere lens + band + rear plate) + nose sensor (12x7 sphere + 12x5 torus ring + band). Grayscale luma bake clamped 0.22..0.96. Axis +X nose / +Y lateral / +Z up; identity node transforms; absolute part-space. Node names EXACT: VR_Hull / VR_PodL / VR_PodR / VR_Nose (renderer regex: /nose/=glow, /podl|podr/=pods, rest=hull - UNCHANGED from I516).\n- Measured v1: VR_Hull 2,116 (aim 1800 cap 2400) / VR_PodL 396 / VR_PodR 396 (300-500) / VR_Nose 320 (200-320) = 3,228 t; RAD 0.879 (target 0.80, class 1.098, gate 0.88-1.12x PASS); GLB 221,480 B (old 183,724; +37,756 B / +37.8% - UNDER the 2x decimate tripwire 367,448 B -> no decimate).\n- P8 fix pass (ALL_GATES_PASS re-run after; smallest levers, applied only after viewing side_clay + f34_tint revealed the defects):\n  - (a) nose sensor = lollipop bulb: sphere 0.11/0.085/0.070 at x 0.78 was ~4x the local hull width (hull ry 0.024-0.036 there) -> shrunk to 0.062/0.050/0.042 at x 0.745; torus R 0.075/r 0.022 at x 0.72 -> R 0.048/r 0.014 at x 0.715; nose band_inset window 0.74-0.82 -> 0.70-0.82 (now covers ring + sensor). The nose reads as an instrument node on a sharp tip, not a bulb.\n  - (b) rear side winglets = needle slivers in side view: 0.28-long thin flat plates (t 0.012-0.014) seen edge-on read as spikes; removed entirely (dorsal fin already carries vertical identity; P1 silhouette-first - the clean dart is stronger). VR_Hull 2,116 -> 1,972 t.\n  - FINAL measured: VR_Hull 1,972 / VR_Nose 284 / VR_PodL 396 / VR_PodR 396 = 3,048 t; RAD 0.866 (class 1.083, PASS); GLB 214,568 B (+30,844 B / +16.8% vs old 183,724).\n- Audit (audit_phantom_v2.py; loads the TEMP GLB; EEVEE 960x540 Standard, 3 suns, dark world; green tint 0x40c055 = CONFIG phantom palette): 10 renders - v2_phantom_{f34,front,back,side}_{clay,tint}.png + {front,back}_sil96.png. P1 silhouette gate: side + f34 = clean slim dart (pointed sensor nose, twin flush canopy pods, dorsal fin, tapered tail; unmistakably NOT the I516 blob-with-two-ears); back_sil96 = clean cross-section with fin; front_sil96 = nose-on dart section (acceptable - nose-on view of a dart is inherently round; the definitive side/f34 profile is a strong arrow). ACCEPTED.\n- Swap: assets/enemy_phantom.glb 183,724 -> 214,568 B (dist/assets copy verified byte-identical after build).\n- Test re-pins WITH MEASUREMENT (tests/assetGlbs.test.js; 16 re-pins via repins533.cjs CRLF-safe; measurements from probe533.mjs + probe533b.mjs - VERBATIM copies of the test file's parseGlb/enemyFacetLumasPrim/primExtents algorithms, so pins are exact-to-algorithm): BUDGETS.phantom 2336 -> 3048; byte cap 184 KB -> 210 KB (214,568 B); per-node tris hull 1416->1972 / nose 264->284 / podL 328->396 / podR 328->396; extents hull X 1.36->1.56 / Y 0.385->0.4903 / Z 0.48->0.5732, nose X 0.188->0.1209, podL X 0.33->0.36, pod cz +/-0.30 -> +/-0.1275 (mirror guard); ENEMY451_FACET phantom: VR_Hull p10/p50/p90 0.3400/0.3800/0.6200 -> 0.3600/0.5164/0.6059, VR_Nose 0.9300x3 -> 0.9000x3, VR_PodL 0.5023/0.6600/0.6600 -> 0.4790/0.6081/0.6800, VR_PodR 0.5037/0.6600/0.6600 -> 0.4729/0.6134/0.6800. House rule honored: re-pin only when a shipped mesh/geometry changes - ST-499 IS the shipped geometry change.\n- Pin-safety: phantom firstWave 13 is absent from every pinned window (causal pins wave 2; playframe B frame 50 ~ wave 1) -> ALL 5 harness pins EXPECTED EXACT, zero re-pins (E69 I516/I517 precedent). Confirmed at G72.0 (I538).\n- Quality bar 6/6: npm test 1,187/1,187 + npm run build 0 + dist 5,286,640 B / 184 (WITH MEASUREMENT: 5,255,796 + 30,844 = GLB delta; under 6,100,000 B ceiling; headroom 813,360 B > 102,400 B floor -> cut ladder NOT invoked) + vendor pins EXACT 4/4 (git diff vendor/ empty; A65DE049A7F38B40 / 7AB0784CD2532367 / F549248412C62B9A / 7FF9ACF50F006017) + BOM delta 0 (6/6 core docs; no new docs this iteration) + hygiene (0 servers, 0 tabs - headless node + Blender only).\n- .evidence/I533 (build_phantom_v2.py + audit_phantom_v2.py + audit_rerun.out + probe533.mjs + probe533b.mjs + p8fix.cjs + p8fix2.cjs + repins533.cjs + i533docs.cjs + phantom_v2.glb 214,568 B + png480/ [10 PNGs: 8 at 480x270 + 2 sil96 as-is, per I532 house practice], force-added).\n- Next: I534 = ST-500 (HAULER v2 remaster - clone build_phantom_v2.py structure: one welded boxy hull NO see-through + 3-4 LARGE inset cargo containers + WELDED flush sponsons + armored pointed nose; RAD 1.10; aim ~3,800 t; old enemy_hauler.glb 264,416 B, tripwire 2x = 528,832 B).";
  if (s.endsWith("\n")) s = s.slice(0, -1);
  write(p, s + sec);
  console.log("iterations.md OK");
}
// ---------- 4. timeline.md: append I533 line (file ends with NL) ----------
{
  const p = "E:/Game/production/timeline.md";
  let s = read(p);
  if (s.includes("I533 (ST-499, E72)")) throw new Error("I533 already present");
  const line = "I533 (ST-499, E72) - PHANTOM v2 remaster \"cloaker dart\" [Blender 5.2.3 headless; zero core/sim code]: build_phantom_v2.py (build_e69b.py helpers verbatim) - slim dart hull tube2 n=36 12-station + 8 band_inset panels + dorsal fin + 2 FLUSH canopy pods + small nose sensor; node names EXACT VR_Hull/VR_PodL/VR_PodR/VR_Nose (regex slots unchanged); grayscale luma bake 0.22..0.96; measured v1 3,228 t / RAD 0.879 / GLB 221,480 B -> P8 fix pass (viewed side_clay + f34_tint BEFORE accept): nose sensor lollipop-bulb shrink [0.11 -> 0.062] + rear winglet needle-slivers REMOVED [dorsal fin keeps vertical identity] -> FINAL 3,048 t [1972/284/396/396] / RAD 0.866 [class 1.083 PASS] / GLB 214,568 B [+30,844 / +16.8% vs 183,724; under 2x tripwire 367,448]; EEVEE audit 10 renders [4 views x clay/tint + front/back sil96; tint 0x40c055 = CONFIG phantom] -> P1 silhouette gate PASSED [clean slim dart, not the old blob]; swap assets/enemy_phantom.glb 183,724 -> 214,568 B; test re-pins WITH MEASUREMENT [16 re-pins; probe533.mjs verbatim test algorithms: BUDGETS 2336->3048, bytes <= 210 KB, tris 1972/284/396/396, extents hull 1.56/0.4903/0.5732 nose X 0.1209 pod cz +/-0.1275, facets Hull 0.3600/0.5164/0.6059 Nose 0.9000 PodL 0.4790/0.6081/0.6800 PodR 0.4729/0.6134/0.6800]; harness pins ALL 5 EXPECTED EXACT [firstWave 13 absent from pinned windows; E69 precedent]; 1,187/1,187 + build 0 + dist 5,286,640 B/184 WITH MEASUREMENT [headroom 813,360 B > floor -> cut ladder NOT invoked] + vendor diff 0 + BOM delta 0 + hygiene [0 servers, 0 tabs]\n";
  if (!s.endsWith("\n")) s += "\n";
  write(p, s + line);
  console.log("timeline.md OK");
}
// ---------- 5. CHANGELOG.md: insert after ## [Unreleased] (CRLF) ----------
{
  const p = "E:/Game/CHANGELOG.md";
  let s = read(p);
  if (s.includes("- I533:")) throw new Error("I533 already present");
  const entry = "- I533: ST-499 E72 - PHANTOM v2 remaster \"cloaker dart\" (Blender headless). The phantom interceptor - the blob-with-two-ears the audit flagged - is now a proper slim dart: one continuous hull spine, 8 inset armor panels, a dorsal fin, twin flush canopy pods, and a small instrument nose (a targeted fix pass shrank an over-large nose sensor and removed needle-thin rear winglets that read as spikes in side view). 3,048 tris (was 2,336), 214,568 B GLB (was 183,724 B - still far under the pre-registered 2x decimate tripwire), and the same node-name contract, so no code or config changed. 16 unit-test pins re-pinned WITH MEASUREMENT (the house rule for shipped geometry changes). Dist 5,286,640 B / 184 (under the 6,100,000 B ceiling). Next: I534 = HAULER v2 remaster.\r\n";
  write(p, rep1(s, "## [Unreleased]\r\n", entry, false));
  console.log("CHANGELOG.md OK");
}
// ---------- 6. active.md: append note line (file ends with single NL) ----------
{
  const p = "E:/Game/production/session-state/active.md";
  let s = read(p);
  if (s.includes("I533 (ST-499, E72) done")) throw new Error("I533 already present");
  const line = "I533 (ST-499, E72) done: PHANTOM v2 remaster \"cloaker dart\" (Blender 5.2.3 headless; zero core/sim code). build_phantom_v2.py (build_e69b.py helpers verbatim): slim dart hull + 8 band_inset panels + dorsal fin + 2 flush canopy pods + small nose sensor; node names EXACT (regex slots unchanged). Measured v1 3,228 t / RAD 0.879 / 221,480 B -> P8 fix pass (nose sensor lollipop-bulb shrink + rear winglet needle-slivers removed, both found by viewing side_clay/f34_tint before accept) -> FINAL 3,048 t / RAD 0.866 (class 1.083) / 214,568 B (+16.8% vs old; under 2x tripwire). EEVEE audit 10 renders -> P1 silhouette gate PASSED (clean slim dart, not the old blob). Swap assets/enemy_phantom.glb 183,724 -> 214,568 B. 16 test re-pins WITH MEASUREMENT (probe533.mjs verbatim algorithms). Harness pins ALL 5 EXPECTED EXACT (firstWave 13 absent from pinned windows; E69 precedent; verified at G72.0/I538). Quality bar 6/6 (1,187/1,187 + build 0 + dist 5,286,640 B/184 WITH MEASUREMENT + vendor EXACT 4/4 + BOM delta 0 + hygiene 0 servers/0 tabs). .evidence/I533 force-added (scripts + probe + phantom_v2.glb + png480/ 10 PNGs). Next: I534 = ST-500 HAULER v2 remaster (welded boxy hull + inset cargo + welded sponsons + armored nose; RAD 1.10; aim ~3,800 t; old 264,416 B, tripwire 528,832 B).\n";
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
