# E93 scope check - Blender art remaster round 2: ship v10 + 2 enemy remasters

Opened I633 (ST-592..ST-596 pre-registered). E92 CLOSED at I632 (f247ba8, remote-verified: git ls-remote origin main == f247ba85cfc787ae0b2a5c3d214e224b93bb4b48 == local HEAD). The user standing art ask - "improve the main character... put in more detailing, increase the polygon count and make it a real airship... likewise for the other assets make them more realistic, use the polygons and GPU resources as much as needed" - is the target of E93, scoped to exactly 3 asset remasters (one per landing) that fit the E92-freed envelope: the player ship v10 (v9 "Mk.II" 82,151 t / 1,441,348 B -> 100-110k t, research-guided), the phantom v7 (6,656 t / 239,140 B -> ~9-10k t; the most-visible late-wave enemy by count), and the gunship v3 (2,906 t / 105,444 B -> ~5-6k t; the lightest heavy in the fleet). The other 31 GLBs, rocks, bosses, garnish, and everything non-art are frozen.

## Scope Fit

Measured at I633 (on disk, post-I632):
- dist: 6,638,767 B / 205 files (I632 fresh measure; byte-identical to I631). E93 close target: 7,297,600 B (7,400,000 B ceiling - 102,400 B close-floor) -> envelope 658,833 B (= CLOSE FLOOR E92 measured at G92.0).
- Assets: 34 GLB / 4,182,504 B / 189,495 t (E91 final, unchanged through E92).
- The three art gaps (measured, current pins in parentheses):
  - ship.glb v9 "Mk.II": 1,441,348 B (MAX_FILE_BYTES 1,658,000 - ship-binding; 87.0% of cap) / 82,151 t (BUDGETS.ship pin; v9 measured post-encode ratio 1.249 [raw 1,800,612 -> encoded 1,441,348] = 17.54 B/t post-encode; 6 flat nodes VR_Ship_Hull/Wings/Cockpit/Fin/Engine/Nozzle + 3 materials; COLOR_0 domain [0.30,1.55], k_hull 0.60 / k_wings 0.80, L = (-0.45,-0.55,0.70).normalized(); SHIP_FACET hull {0.4098/0.7606/1.1488} / wings {0.3946/0.9328/1.5402} +/-0.005; span 4.0111 / len 2.7253 hold the I454 windows). The hero asset; the user's most recent explicit ask is aimed at it ("small looking airship").
  - enemy_phantom.glb v6: 239,140 B / 6,656 t (BUDGETS.phantom pin; 4 nodes VR_Hull/PodL/PodR/Nose + ENEMY451_FACET percentile pins [I614]; the most numerous late-wave enemy - highest visibility in endless + campaign).
  - enemy_gunship.glb v2: 105,444 B / 2,906 t (BUDGETS.gunship pin; file cap 106 KB; 3 nodes VR_Gunship_Hull/Nacelle/Bay + 3 materials + ENEMY451_FACET pins [I536/I509]; the lightest "heavy" in the fleet - pre-remaster-wave detail level).
- Feasibility: the envelope (658,833 B) covers the three gaps with margin (worst case below). Per-asset post-encode ceilings are FROZEN in the Budget section; the binding risks are the SHIP ratio variance + MAX_FILE_BYTES (below).
- The mine stays procedural; the other 31 GLBs (rocks v13, boss v3, archon v2, the other 11 enemy ships, garnish v2) stay untouched (deferral queue below) - E93 is exactly 3 asset landings, nothing else.

## Research (FROZEN at open - YouTube MCP pass I633)

Extracted design rules (video IDs for provenance):
- Spacedock "Design Principles in Sci-Fi Spaceships" (OHYIi-kaP6c): requirements drive the look - fleet commonality via reused components (Gundam "United Maintenance Plan" shared parts), "built for but not with" details (mounts ready to accept equipment not yet installed) add story. Use: ONE shared greeble/part language across the 3 remastered ships.
- Spacedock "Messy Design Styles for Sci-Fi Spaceships" (foq7jEkGMMc): greeble-heavy "semi-organized chaos" works, BUT (a) detail scale must match ship size (the TNG mini Borg cube looks fake at wrong greeble scale; the photo-etched First Contact version reads bigger because detail is smaller-correct); (b) at distance small details merge to white noise - BIG SHAPES define the form -> invest in big shapes + mid-scale greebles, not micro detail; (c) "very easy to over-greeble every single surface" - restraint is a design decision; (d) attack-helicopter cue: weapons on outboard pylons + nose optics/cannon.
- Nico Linde "Quick & Easy Megastructures in Blender" (DX36hit2g0s): two fast detail methods - kid-bashing (pre-made greeble kit: turrets, guns, antennas, "3D printed multiples" dragged onto the mesh) + displacement (subdivide + displace with a generated sci-fi panel map, UV-unwrapped to scale panels, applied only to selected regions); textures carry grunge (roughness variation via color ramp, painted accent panels, emissive strips).
- Supporting refs (metadata level): FutureDragon "BEST Airship Tutorial and Guide" (9-OQB1IAk7E - airship parts taxonomy: balloon/pressure hull, gondola, fins, engines, rigging); Sculpt Labs steampunk airship timelapse (ue6S6sa08U4); SCIENCE INSANITY "artistic principles behind SCI-FI ship design" (77iy2QSN7w0 - shape/color language); Adam Savage spaceship paneling/greebling (2LRvDYmNy5E - practical panel-line technique); Spacedock Nostromo breakdown (J3Ph5gXCf6E).
- Design implication (FROZEN): within a 658,833 B byte envelope, raw tri-count is NOT the lever. The research-aligned approach: moderate poly growth + kid-bash mid-scale greebles (turrets, pylons, antennas, nacelle clusters) + displacement-style panel/panel-line detail applied to the mesh (UV-scaled, selected regions only) + grunge/value variation carried by COLOR_0 value modulation within the contract domain (no textures in the GLB contract) + shared part language across the 3 ships + correct greeble scale + restraint (no micro-detail).

## Fix set (PRE-REGISTERED)

- ST-592 (I633) - E93 open: this check FROZEN + 7-file bookkeeping. NO src. dist byte-identical 6,638,767 B / 205.
- ST-593 (I634) - ship v10, ONE atomic commit: (1) Blender 5.2.3 headless build (D:\Blender\blender.exe --background --python ...), extending the .evidence/I612/build_ship_v9.py v9 lineage (ship_v9.blend as the starting source; the build script is the lineage root); target 100-110k t rigid airship warship v2: pressure-hull paneling (displacement-style inset panels, UV-scaled to the hull), gondola + fin detail, nacelle/prop-pod clusters, outboard weapon pylons + nose optics, mid-scale kid-bash greebles (turrets, antennas, hatches, ladders), restraint rule (no micro-detail); COLOR_0 same formula family v = clamp(1.0 + k*dot(n,L), 0.30, 1.55), L = (-0.45,-0.55,0.70).normalized(), per-part k re-tuned; audit set aud_ship_{front,side,back}_{clay,sil96,tint}.png (the I612 audit angles); (2) GLB contract: single GLB, flat named node set VR_Ship_* (the 6-node set MAY grow WITH MEASUREMENT - documented), perFileMats <= 5, no rig/morph, BIN 4-align, span 4.0111 / len 2.7253 hold the I454 windows; (3) I609 encode pattern (.evidence/I609/encode609.cjs: INDICES mode for index views, byteStride on all views, logical main bufferView fields, double-encode byte-compare determinism ABORT-on-diff, orig/ backup + sha256 manifest); (4) swap assets/ship.glb + re-pins WITH MEASUREMENT (BUDGETS.ship + MAX_FILE_BYTES if post-encode > 1,658,000 B [measured + 15%] + assetPerf totals + SHIP_FACET percentiles); (5) harness: playframe491/483 A+B RE-PIN WITH MEASUREMENT (ship tris change in-frustum), causal495/483 EXPECTED EXACT (score pin 11509 - tris do not change the demo-pilot score), pwa491 EXPECTED 11/11. Expected dist delta: +~250-360 KB (measured at landing).
- ST-594 (I635) - enemy remaster A: phantom v7, ONE atomic commit: same protocol; target ~9-10k t (vs 6,656 t); research-aligned: big-shape silhouette refinement + mid-scale greebles in the shared part language at CORRECT greeble scale for its class + restraint; envelope windows + RAD hold the I561 windows (re-pin WITH MEASUREMENT only on documented silhouette change); COLOR_0 domain [0.25,1.00] (I509) + ENEMY451_FACET re-pin WITH MEASUREMENT; BUDGETS.phantom + per-asset file-KB cap re-pinned WITH MEASUREMENT; ceiling 300,000 B post-encode; playframe B-window tris only (52 calls unchanged), causal EXPECTED EXACT, pwa EXPECTED 11/11. Expected dist delta: +~20-60 KB.
- ST-595 (I636) - enemy remaster B: gunship v3, ONE atomic commit: same protocol; target ~5-6k t (vs 2,906 t - the lightest heavy, most room to grow); 3-node set VR_Gunship_Hull/Nacelle/Bay MAY grow WITH MEASUREMENT; file cap 106 KB re-pinned WITH MEASUREMENT; COLOR_0 domain [0.25,1.00] + ENEMY451_FACET re-pin WITH MEASUREMENT; BUDGETS.gunship re-pinned WITH MEASUREMENT; ceiling 180,000 B post-encode; playframe B-window tris only (52 calls unchanged), causal EXPECTED EXACT, pwa EXPECTED 11/11. Expected dist delta: +~30-75 KB.
- ST-596 (I637) - G93.0 close gate: 6/6 harness battery (clone the I632 runner, labels CLOSEGATE637, verify every marker string against the harness's actual console.log output - the I632 marker-case lesson) + GLB fleet smoke (34/34, fleet tris WITH MEASUREMENT, console 0/0) + fresh dist re-measure vs 7,297,600 B + CLOSE FLOOR E93 WITH MEASUREMENT + AGENTS.md refresh (asset line + item-4 chain + one-liner) + scope-check AMENDMENT if any + E93 CLOSED. Expected dist delta: ~0 B (docs-only).

## Frozen bounds

IN (per landing, nothing else): assets/<file>.glb replacement + its .evidence/I63x/ build+audit+encode evidence (build scripts, backups, hash manifest, audit screenshots, encode determinism check), tests/assetGlbs.test.js + tests/assetPerf.test.js cap re-pins WITH MEASUREMENT, bookkeeping (7-file pattern), the close-gate runner clone + evidence.

OUT (frozen): any src/core or gameplay change; camera / render / lighting / post-FX changes; the 5 harness runner SOURCES (clones only, labels changed); the vendor set (4 pins + decoder raw pin stay EXACT); the PWA surface (sw.js / manifest / icons untouched - the runtime cache covers the replaced GLBs); audio; the WebGPU default switch (a future gated epic: causal495 EXACT parity + real-device WebGPU smoke); the other 31 GLBs (rocks v13 / boss v3 / archon v2 / the other 11 enemy ships / garnish v2 untouched); the mine (procedural); the 2 E85 luma residuals (warden +20.12 / drone +10.41 - a separate future pass); the GLB contract shape (single GLB / COLOR_0 on every prim / flat named node set / perFileMats <= 5 / no rig / no morph / BIN 4-align).

## Measurement protocol (FROZEN)

1. Build: Blender 5.2.3 headless (D:\Blender\blender.exe --background --python ...). Ship v10 starts from the .evidence/I612/ lineage (build_ship_v9.py + ship_v9.blend); the enemy builds follow the .evidence/I509/ + I561/ + I516/ build+audit patterns (aud_<name>_{front,side,back}_{clay,sil96,tint}.png + audit_glb*.cjs).
2. GLB contract per landing: single GLB; COLOR_0 (grayscale value bake) on every prim; flat named node set; perFileMats <= 5; no rig/morph/skin; BIN bufferView tail 4-aligned.
3. Encode per the I609 pattern (.evidence/I609/encode609.cjs): INDICES mode only for index views, byteStride on ALL views, logical main bufferView fields, double-encode determinism (byte-compare, ABORT on diff), originals backed up to .evidence/I63x/orig/ + sha256 manifest.
4. Fleet re-run: .evidence/I608/glbtris608.cjs must report the new per-asset pins EXACT + the new fleet total; the house .evidence/I547/glb_tris.cjs agrees.
5. Re-pins WITH MEASUREMENT at each landing (E88 rule: size caps = measured + 15%; tri pins tight-to-measured): assetPerf totalFilesKB / totalGeoKB / perFileKB / totalTris (+ perFileMats only if forced, with a documented reason) + assetGlbs MAX_FILE_BYTES (+ BUDGETS ship/phantom/gunship tri pins + per-asset file-KB caps + SHIP_FACET / ENEMY451_FACET percentile pins where the bake changes + extent windows on documented silhouette change).
6. Quality bar 4/4 per landing: npm test green / npm run build clean / dist measured vs 7,297,600 B close target + the per-asset ceiling / vendor 4/4 EXACT (A65DE049A7F38B40 / 7AB0784CD2532367 / F549248412C62B9A / 7FF9ACF50F006017) + decoder raw D428E73A000057C6.
7. Gate harness per landing: causal495 (3-arm seed-9876; webgpu report-only) + causal483 EXPECTED EXACT (score pin 11509); playframe491/483 RE-PIN WITH MEASUREMENT only where in-frustum geometry changed (the ship landing WILL re-pin A+B; the two enemy landings expect B-window tris growth only, 52 calls unchanged); pwa491 EXPECTED 11/11.
8. ONE atomic commit per landing (asset + encode evidence + test re-pins + bookkeeping together); push delegated to a fresh subagent (push only, NO Pages, no force, verbatim git ls-remote, agent closed), landing verified via git ls-remote.

## Budget (pre-registered)

- Start (I632 measured): dist 6,638,767 B / 205; assets 34 GLB / 4,182,504 B / 189,495 t.
- E93 close target: dist <= 7,297,600 B; envelope = 658,833 B (= CLOSE FLOOR E92).
- Per-asset post-encode ceilings (FROZEN):
  - ship v10 <= 1,800,000 B (vs v9 1,441,348 B: delta <= +358,652 B)
  - phantom v7 <= 300,000 B (vs 239,140 B: delta <= +60,860 B) I635 INVOCATION: YES a surface-res trim was needed to hold the FROZEN 300,000 B ceiling at the final greeble level (body tube 104->99 / pod 28->26 / nose collar (16,5)->(14,4) / +1 nose greeble box; the ~9-10k t target is not FROZEN and yielded to the FROZEN ceiling at the measured ~34.5 B/t smooth-surface encode ratio); landed 8,230 t / 299,136 B encoded (ceiling 99.7%, margin 864 B) - the delta is +59,996 B, inside the +60,860 B pre-registration with 864 B to spare.
  - gunship v3 <= 180,000 B (vs 105,444 B: delta <= +74,556 B)
  - code + docs across the epic <= 40,000 B
  - Worst case: 6,638,767 + 358,652 + 60,860 + 74,556 + 40,000 = 7,172,835 B -> margin 124,765 B to the close target.
- RATIO-VARIANCE DECISION RULE (ship, pre-registered, I581/E89 pattern): the ship measured v9 encode ratio is 1.249 (raw 1,800,612 -> encoded 1,441,348) = 17.54 B/t post-encode. At 100-110k t -> 1,754,000-1,929,400 B post-encode, which may EXCEED the 1,800,000 B ceiling. If the measured ship v10 post-encode EXCEEDS 1,800,000 B: cut ladder C1 (100-110k -> 90-100k t) + re-encode + re-measure; if still over: 80-90k t; if still over: re-open the ship ceiling WITH MEASUREMENT as a scope-check AMENDMENT (documented rule deviation) - never silently. The tri-count target and the ceiling are independent levers: the ship lands at the highest detail that encodes under the ceiling.
- MAX_FILE_BYTES (currently 1,658,000 B, ship-binding at 1,441,348 B = 87.0%): expected to need growth at the ship landing IF the post-encode file exceeds 1,658,000 B (likely at the 100-110k t band) -> renegotiate to measured + 15% WITH MEASUREMENT (e.g. 1,754,000 B measured -> 2,017,100 B cap).
- Triangle growth: fleet 189,495 t -> expected ~211-222k t after all landings (ship +18-28k t net, phantom +2.5-3.5k t net, gunship +2-3k t net); totalTris grows WITH MEASUREMENT at each landing.
- perFileMats 5 (hauler at cap): every E93 asset must stay <= 5 materials or the pin grows with a documented reason.

## Cut ladder (pre-registered)

C1: ship v10 100-110k t -> 90-100k t (the ratio-variance rule IS the first step of C1) I634 INVOCATION: the 100-110k band was unattainable under the 1,800,000 B ceiling at the measured v10 encode ratio (run8/run9 builds: ~17.5 B/t -> 100k t = 1.75M-1.83M encoded, at/over the ceiling); C1 step 1 (90-100k t) invoked -> landed 93,730 t build / 90,321 t GLB / 1,642,960 B encoded (ceiling 91.3%); C2/C3 NOT invoked.. C2: drop the gunship remaster (E93 = ship + phantom only; gunship v3 deferred to a future round). C3: ship 90-100k t -> 80-90k t (last resort). Invoke ONLY if dist at the G93.0 close gate would exceed 7,297,600 B, or a quality-bar failure forces a size cut. Never silent.

## Deferrals (out of E93, queue intact)

WebGPU default switch (gated: causal495 EXACT parity + real-device WebGPU smoke) / Monolith wave-5 wall / 2 E85 luma residuals (warden +20.12 / drone +10.41) / the other 11 enemy-ship remasters + boss v3 / archon v2 refresh (a future art round on a fresh envelope) / rock micro-detail (only if cheap) / cockpit canopy-material pass.

## Risks

1. Ship ratio variance (1.249 measured) may push the post-encode past 1,800,000 B -> pre-registered ratio-variance rule + C1 (Budget).
2. MAX_FILE_BYTES 1,658,000 B binding at 87.0% -> expected growth WITH MEASUREMENT at the ship landing (Budget).
3. perFileMats 5 at cap (hauler) -> every E93 asset must stay <= 5 materials or documented pin growth.
4. COLOR_0 contracts: ship domain [0.30,1.55] with the I612 SHIP_FACET percentile pins +/-0.005 (hull spread 0.7390 / wings spread 1.1456); enemy domain [0.25,1.00] (I509) + ENEMY451_FACET percentile pins - v10/v7/v3 bakes must stay in the same formula family; percentile pins re-pinned WITH MEASUREMENT at each landing.
5. Ship node/material growth: the 6-flat-node / 3-material v9 set MAY grow (documented WITH MEASUREMENT) but perFileMats <= 5 is hard; the runtime loader + shipMesh.js ensureWhiteColors contract assumes COLOR_0 on the Hull/Wings prims - any node-set change must keep those two materials loadable.
6. Blender 5.2.3 headless determinism: the build+audit pattern is proven (I612/I509/I561/I516); any non-deterministic export jitter is caught by the double-encode byte-compare + the audit screenshot set.
7. Playframe A-window re-pin at the ship landing: A 22/84,265 is ship-dominated; the re-pin delta follows the I612 precedent (2 x the in-frustum ship tri delta) - arithmetic documented WITH MEASUREMENT.

## Verification evidence

At open (I633): I632 close gate 6/6 (CLOSEGATE632; fleet step re-run standalone PASS after the runner-clone marker-case fix) + push f247ba8 verified on origin main (git ls-remote == local HEAD); the measured basis above is on disk. Per landing: protocol steps 1-8 produce the evidence trail (.evidence/I63x/ + harness outputs + dist measure). At close: the G93.0 gate set (6/6 harness + GLB fleet smoke + fresh dist + CLOSE FLOOR E93 WITH MEASUREMENT + AGENTS.md refresh).

## DoD

- ST-592..ST-596 all DONE; E93 header CLOSED at the G93.0 gate.
- 34-GLB contract intact: glbtris608.cjs per-asset pins EXACT + fleet total WITH MEASUREMENT; the house glb_tris.cjs agrees.
- dist measured <= 7,297,600 B at the close gate; CLOSE FLOOR E93 WITH MEASUREMENT recorded.
- Vendor 4/4 EXACT + decoder raw pin intact.
- 6/6 harness + GLB fleet smoke at the close gate; causal arms EXACT (webgpu report-only).
- AGENTS.md asset line + item-4 chain + project one-liner refreshed WITH MEASUREMENT.
- ONE atomic commit per landing + the close-gate commit; every commit pushed (delegated fresh subagent) + verified via git ls-remote.
- Hygiene: 0 tabs, all 4 ports free, no terminals left.

## Next owner

I634 = ST-593 ship v10 in Blender (the .evidence/I612/ lineage: build_ship_v9.py + ship_v9.blend are the starting point).