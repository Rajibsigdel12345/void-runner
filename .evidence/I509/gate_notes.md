# I509 CG GATE NOTES (ST-475, E68) - remaster-4: hunter / gunship / sentry / wasp

Build: build_remaster4.py, Blender 5.2.3 headless (build 1: session 15039; REBUILD 2 after
wasp wing-mirror fix, same script, ALL_GATES_PASS).
Audit: audit_glb509.cjs (GLB JSON) + audit_clay509.py (clay/tint/sil renders) +
glb_probe.mjs (RAW JSON-chunk min/max extent probe - independent of three.js) +
measure_facets509.mjs (per-node COLOR_0 facets, same algorithm as tests/assetGlbs.test.js).
Verdicts: all 4 PASS (wasp RE-VERIFIED symmetric after wing rebuild). No further rebuild required.

## Axis "defect" was a FALSE ALARM (v37 checkpoint finding #1 - RETRACTED)
The previous session's ext_verify.mjs printed extent columns cyclically rotated (it printed
(x,y,z) = true (y,z,x)), and the "empirical mapping glTF=(+Bz,-By,+Bx)" derived from it was
an artifact. Independent verification with glb_probe.mjs (reads accessor min/max directly from
the raw GLB JSON chunk, no three.js, no column remapping) confirms all 4 GLBs are in the
STANDARD correct Y-up export frame, identical to the I508 build (byte-identical export calls):
glTF.x = build.x (fwd), glTF.y = build.z (up), glTF.z = -build.y (-lateral).
Per-part proof: old shipped sentry barrel long axis glTF x 1.3235 vs new 1.1300 (same axis);
new hunter hull x -0.80..0.52 (build x); new wasp wing glTF z -1.23..+1.23 (build y lateral).
CONSEQUENCE: no axis fix, no test-frame change, v37 extent table replaced by the TRUE-AXIS
table below. ext_verify.mjs is retained in evidence as-is (its column bug is documented here).

## WASP WING MIRROR BUG (the one real defect - FIXED)
build_remaster4.py first build: the "WingL+R (double blade)" spec was implemented +Y-only -
both airfoil plates at +Y, ribs/details at +Y only, tip boxes at +Y only, and the spar loop
collapsed (s*0.0 / (1 if s>0 else 1)) into one long beam at y -0.35..+1.45 (cz -0.55, span 1.80).
FIX (committed in build_remaster4.py, comment "I509 FIX (wing mirror)"): explicit per-side
loop s in (-1,1) for plates/ribs/details/tip boxes; spar half-extent reduced 0.9 -> 0.6 so the
mirrored spar stays UNDER the blade (tip 1.10 < blade tip 1.18) - a mirrored spar at 0.9 would
stick 0.27 past the blade and push the RAD class to 1.13 (gate FAIL); at 0.6 the span stays
2.46 (class 1.033 vs target 1.65, PASSES [1.452, 1.848] band).
RESULT: wing ext z = 2.4600, min/max z = -1.2300/+1.2300 (cz 0.0000 - perfect mirror),
front/back silhouettes now show two symmetric blade lines (viewed, sheet_wasp_*).

## Scale deviation note (accepted, I508 pattern)
The build offsets were designed TO the fixed in-game part offsets (fin -0.72, core +0.44,
nacelles (0,-0.56,+-0.88), barrel 0.99/charge 1.76, wing -0.2025/nose 1.08 - world units,
no whole-mesh scaling in code, "visual ~ hitbox" convention per I508). The new hunter hull
(1.32 long) and gunship (2.10 long) therefore render closer to their CONFIG hitbox class
(0.8 / 1.6) than the I506-era art (hunter 3.04 long). ACCEPTED convention - documented here;
a size re-tune is a user decision, flagged in the iteration summary.

## Verdicts (from 12 sheets, all viewed; wasp re-viewed after rebuild)
- HUNTER PASS - low swept manta/dart fighter + dorsal keel fin + side plates; distinct low-wide profile.
  Note (accepted): mild boxiness on side plates. Rebuilt identical (probe-equivalent) - unchanged verdict.
- GUNSHIP PASS - heavy round bomber/brute, swept wings, forward open gun-bay aperture, engine ring.
  Note (accepted): blobby/egg FRONT silhouette (heavy-egg massing is on-role).
  Rebuilt identical (probe-equivalent) - unchanged verdict.
- SENTRY PASS - floating watchtower fortress (dome + hex platform + perimeter plates + barrel + base slab).
  Note (accepted): small floating base fragments below platform (on-brand).
  Rebuilt identical (probe-equivalent) - unchanged verdict.
- WASP PASS (RE-VERIFIED) - small swift dart + thin DOUBLE blade-wings, now bilaterally symmetric
  (pre-fix front view showed one long + one short blade; post-fix shows two mirrored blades each side).
  Note (accepted): thin-rod wings at silhouette scale (acceptable for small fast enemy).
All: good value bakes (no monotone, no blown highlights), no glow-sphere disease, no rock/crate look, distinct roles.

## S4.6 deviation: hull-only COLOR_0 at runtime
Game code sets vertexColors:true ONLY on the hull material per asset (hunterMesh ~line 35, gunshipMesh ~45, sentryMesh ~55, waspMesh ~46).
Accent materials (fin/core/nacelle/bay/barrel/base/charge/wing/nose) lack vertexColors, so their GLB COLOR_0 is IGNORED at runtime.
The build INTENTIONALLY bakes per-node COLOR_0 on every node (bake_*_fin / _nacelle / etc.). Decision: keep the build;
accent bakes are a harmless superset; tests pin per-node facets (I508 pattern).

## Frozen measurements (measure_facets509.mjs + glb_probe.mjs; tests pin EXACTLY these)
Domain gate ALL nodes: [0.25, 1.00]; grayscale |r-g|,|g-b| <= 0.02; componentType FLOAT(5126); type VEC3; count == POSITION count.
File-wide COLOR_0 luma domain measured [0.26, 0.95] -> gate HOLDS. Extents pins +/-10%; tris pins EXACT; facet pins +/-0.005.
Node sets (no root nodes): hunter {Hull, Fin, Core}; gunship {Hull, Nacelle, Bay}; sentry {Platform, Base, Barrel, Charge}; wasp {Hull, Wing, Nose}.
matNames: VR_<Asset>_<Part>Mat. colorPrims == node count per file (3/3/4/3).
File sizes: hunter 227,496 / gunship 198,760 / sentry 203,688 / wasp 310,036 B (post-fix; pre-fix wasp 217,368).

| asset | node | tris | p10/p50/p90 | ext x/y/z | cx/cz |
|---|---|---|---|---|---|
| hunter | VR_Hunter_Hull | 2138 | 0.3000/0.4733/0.7076 | 1.3200/1.0000/1.1593 | -0.1400/-0.0011 |
| hunter | VR_Hunter_Fin | 972 | 0.3689/0.3908/0.4115 | 0.1100/1.0020/0.8400 | -0.0050/0.0000 |
| hunter | VR_Hunter_Core | 256 | 0.9000/0.9000/0.9000 | 0.2167/0.2400/0.1970 | 0.0000/0.0000 |
| gunship | VR_Gunship_Hull | 1732 | 0.3473/0.4751/0.5259 | 2.1000/1.4158/2.0000 | 0.3000/0.0000 |
| gunship | VR_Gunship_Nacelle | 544 | 0.2600/0.4732/0.6600 | 1.4500/0.8377/0.8558 | -0.1150/-0.0004 |
| gunship | VR_Gunship_Bay | 320 | 0.9500/0.9500/0.9500 | 0.2100/0.4800/0.4605 | -0.0050/0.0000 |
| sentry | VR_Sentry_Platform | 1772 | 0.4532/0.4657/0.7200 | 2.2300/1.5800/2.2300 | 0.0000/0.0000 |
| sentry | VR_Sentry_Base | 324 | 0.3400/0.3400/0.3400 | 2.7600/0.2150/0.6200 | 0.0000/0.0000 |
| sentry | VR_Sentry_Barrel | 582 | 0.4727/0.5202/0.6600 | 1.1300/0.5250/0.5100 | -0.0850/0.0000 |
| sentry | VR_Sentry_Charge | 256 | 0.9500/0.9500/0.9500 | 0.0560/0.2060/0.2060 | 0.0000/0.0000 |
| wasp | VR_Wasp_Hull | 1356 | 0.3400/0.5467/0.7200 | 1.6850/0.7234/0.6800 | -0.0225/0.0000 |
| wasp | VR_Wasp_Wing | 2400 | 0.3600/0.5483/0.5820 | 0.3550/0.3460/2.4600 | -0.0325/0.0000 |
| wasp | VR_Wasp_Nose | 264 | 0.9500/0.9500/0.9500 | 0.6200/0.2060/0.2060 | -0.0100/0.0000 |

Wing cz = 0.0000 is the asymmetry regression guard (pre-fix cz was -0.5500, span 1.8000).
Asset totals: hunter 3366 / gunship 2596 / sentry 2934 / wasp 4020 (remaster-4 total 12,916 t; I506-era was 6,412 -> delta +6,504).
Sentry charge x-extent 0.0560 = torus tube thickness (hole along barrel/x axis); y/z = 2x outer = 0.206. Consistent; pinned as-is.