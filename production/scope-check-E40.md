# Scope Check E40 - Nebula Skybox Art Pass (Blender equirect v5 -> v6 structure pass)

- Iteration: I362 (arc open)
- Skills: cgs-scope-check + cgs-create-stories (docs-only)
- Inputs: AGENTS.md, production/session-state/active.md, production/scope-check-E39.md (pattern + G39.0 closeout), production/iterations.md (I360 MENU framing + I361 orbit-phase finding), assets/skybox_equirect.jpg (viewed this session: flat amber band + uniform starfield, no structure), src/render/skybox.js + src/main.js L86-96 (read in full: fire-and-forget TextureLoader, in-place scene.background swap, PMREM IBL hook I213 - rock env 0.0 decoupled per I257, ship/belt 0.35 fill, bloom threshold 0.72)

## Summary

E39 closed at I361 with 5/5 (G39.0 PASS R1..R5, 928/928, dist 131/1938450 B, vendor sha 76DEA8151BC9352A unchanged). E40 = the next arc of the user standing 100-iteration directive. The evidence points to ONE remaining unpolished surface: the SKY.

- Since I360 the MENU camera frames the nebula band in the upper third (strip y 180-240 x 420-860) - the skybox is now a MENU hero element, and it also fills the top of the PLAYING frame.
- The current v5 skybox (1024x512 JPEG, 67255 B, Blender node-bake) is a FLAT 1-D amber band: uniform brightness along the band, no bright knots, no dust lanes, no filamentary clouds, plus a uniform uncorrelated dot starfield. It reads as a gradient stripe, not a nebula.
- The fix is to add STRUCTURE to the band - one dominant bright knot + 2-3 secondary knots, dark dust lanes cutting across the band, filamentary cloud structure, star clusters correlated with the knots, faint far companion nebulosity - while KEEPING: equirect geometry (1024x512), the band elevation (so I360 MENU framing still lands), and the warm amber family (R>G>B, the floor palette family).
- Zero sim change. Zero src change: the sky loads fire-and-forget from the same URL (assets/skybox_equirect.jpg) - an in-place asset swap. The only code-adjacent surface is the IBL hook (I213): scene.environment is baked from the skybox; rock env intensity is already 0.0 (I257 decoupled), ship/belt keep a 0.35 fill - the new sky subtly re-tints hull reflections (intended), and hull speculars must stay under the bloom threshold (0.72).
- The standing Blender directive is satisfied inside the arc: ST-332 node-bakes skybox v6 in Blender.

## Evidence (this session, verified)

- Asset viewed: assets/skybox_equirect.jpg = 1024x512 JPEG 67255 B. Structure audit: horizontal amber/orange band at the equator, smooth vertical falloff above/below, uniform dot starfield everywhere. No knots, no dust lanes, no filaments, no clusters. Band centerline at the equirect equator (I360: visible band e +1.5..+10.5 deg).
- Render path read in full: skybox.js = fire-and-forget TextureLoader; on success scene.background = tex (EquirectangularReflectionMapping, SRGBColorSpace) + onReady hook; on failure console.warn + keep flat 0x04060f (no boot gate). main.js L86-96: onReady bakes PMREM env (I213) - scene.environment = pmrem.fromEquirectangular(tex).texture; MeshStandard envMapIntensity = CONFIG.fx.env.intensity; rockRenders.setEnvIntensity(CONFIG.fx.env.rock) = 0.0 (I257: rocks decoupled); ship/belt keep 0.35 fill. Conclusion: in-place swap is safe; the IBL delta is a subtle hull re-tint (verify no bloom leak).
- MENU framing (I360, preserved): camera.menuHero height 0.5 + lookY 0.28 (radius 2.8) -> view center -4.5 deg, frame top +25.5 deg; band e +1.5..+10.5 deg sits in the upper third. Band pin after I361: orbit-phase TOLERANCE (|p50 - 56.25| <= 0.75; p10 >= 45, p90 >= 60, mean >= 50) - the new sky WILL shift these; re-pin with documented delta at ST-333, keep the tolerance form, do NOT re-pin exact.
- Budget: dist 131 files / 1938450 B; headroom 158702 B (>= 102400 B floor); max addable 56302 B; current skybox 67255 B -> NEW SKYBOX HARD CAP 123557 B (~120.6 KB), target 90-115 KB (structure = high-frequency detail = JPEG size pressure; cap enforced at ST-332 + re-verified at ST-335).
- Precedent: E39 (floor art pass) closed 5/5 with the same shape - Blender asset in-arc, in-place apply, evidence re-pin, zero sim, gate at closeout.

## Scope Fit

FIT - bounded, 5 iterations (I362 docs + I363..I367):
- Layer: ONE asset (JPEG replaced in place) + one small render tweak (ST-334 starfield correlation, CUTTABLE). Zero src/core sim/scoring/replay (p1 demo pin causally re-verified at ST-335).
- No new systems, no new enemies, no settings-UI growth, no salt bump, no vendor bump, no loader change.
- Asset budget: new skybox <= 123557 B hard cap (target 90-115 KB); ST-334 ~0-1 KB code if not cut. Headroom stays >= 102400 B with margin.
- Blender requirement met inside the arc (ST-332), not as a separate arc.

## Cut Options

- ST-334 (twinkling starfield correlation) is CUTTABLE: small render change; cut it if it risks the p1 demo pin or the HUD A/B baseline while ST-332/333 still pass the gate (minimum viable E40 = ST-332 + ST-333 + ST-335).
- ST-331 (research) collapses to a docs-only pass (zero YouTube) if no relevant reference is found - E39 precedent: bounded YouTube sweep returned NOISE, stopped per anti-over-engineer, grounded in local evidence + genre principle instead.

## Deferrals

- Full skybox rework (the E39-deferred v8 ambition: new resolution, moved band position, animated sky) - stays deferred; E40 is a structure pass on the EXISTING 1024x512 geometry + band elevation.
- Starfield shader upgrade (per-star color/size variation in a custom shader) - deferred; ST-334 is a config-level correlation only.
- i18n (plan-only); 3-finger gestures / gamepad; dynamic floor FX (per-frame cost).

## Recommendation

PROCEED as scoped. The sky is now the dominant remaining unpolished surface (MENU hero since I360 + top-of-frame PLAYING backdrop), and this is a pure art/asset pass with zero sim risk - the cheapest high-visibility improvement available. Grounded: local asset + code evidence captured this session; research bounded and cuttable.

## Risks

- R-E40-1 skybox byte bloat: a detail-heavy 1024x512 JPEG can exceed the 123557 B cap and break the 102400 B headroom floor -> hard cap enforced at ST-332 (JPEG quality dial) + re-verified at ST-335 (R5).
- R-E40-2 band elevation drift: the new bake shifts the band vertically -> breaks the I360 MENU framing -> the band centerline stays at the same equirect row band (elevation preserved by construction: same node-graph scaffold, same band-center parameter); MENU strip verified before/after at ST-333.
- R-E40-3 band strip re-pin scope: p50/p10/p90/mean shift with the new sky -> documented delta at ST-333, orbit-phase tolerance form kept (do NOT re-pin exact per the I361 finding).
- R-E40-4 IBL hook: scene.environment is baked from the skybox (I213) -> hull (ship/belt 0.35 fill) reflections re-tint with the new sky (intended) but hull speculars must stay under the bloom threshold 0.72 -> check for new bloom leakage at ST-333 (FX A/B high/low/off); rocks already decoupled (env 0.0, I257).
- R-E40-5 HUD A/B baseline (I347): the sky sits behind the HUD and the MENU band strip pins live in the MENU frame -> re-measure HUD A/B at ST-333 + ST-335 to the I347 baseline (must stay EXACT).

## Gate G40.0 (at ST-335)

- R1 p1 demo pin EXACT (causal - asset-only, zero sim): score/kills/weapon/combo/shots/acc/time/replay/Q->MENU.
- R2 rockab radii EXACT 2.2/1.3/0.7.
- R3 skybox art probe: v6 loads + ready + 1024x512 + <= 123557 B; band structure (knots/dust/filaments) present in the strip; band strip re-pins documented (orbit-phase tolerance kept); HUD A/B EXACT I347 baseline; no NaN; console 0/0.
- R4 PWA 11/11 re-run (baseline server, killed + port free).
- R5 928+ tests + build 0 + headroom >= 102400 B + vendor sha 76DEA8151BC9352A unchanged + servers killed + ports free + stray audit clean.

## Files (proposed)

- production/scope-check-E40.md (this file, source of truth)
- production/epics.md (E40 block), production/stories.md (ST-331..335), CHANGELOG.md, production/session-state/active.md, production/iterations.md
- assets/skybox_equirect.jpg (REPLACED at ST-332 - the only asset delta)
- src/core/config.js + src/render/starfield.js (ST-334 ONLY, if not cut - small config-level correlation)
- No src/core/ sim changes. No tests/ changes.

## Verification

- Each story carries its own acceptance criteria + verification (per cgs-create-stories).
- Evidence re-pins are values-only with documented deltas (band strip is the only sky-dependent probe family).
- Gate G40.0 at ST-335 closes the arc.

## Next owner / decision

ST-331 (grounded nebula art direction) at I363 - cgs-dev-story + research; docs-only.

## Art Direction (ST-331, I363 - grounded)

Grounded in real galactic structure (bounded YouTube MCP research: 1 search / 3 queries / 24 raw, 2 transcript pulls; new burned ids HhCRAJIUq6E I-DNl36mNqw ZoL6Em5OZl4): the band is a straight band with HEAVY CENTRAL CONCENTRATION (one dominant off-center knot, not uniform brightness); it is LAYERED (dense thin-disk stripe + puffier faint thick-disk envelope + bulge + halo); dust forms DARK CONSTELLATIONS (Great-Rift-style rifts occluding the core - the center reads as a dark abyss); and gas + dust condense into star formation, so STAR CLUSTERS correlate with the bright knots.

KEEP:
- Equirect 1024x512 JPEG (loader + tests/skyboxTexture.test.js pin unchanged).
- Band elevation: e=0 plane, k=100, boost 0.5 scaffold (I360 MENU framing strip y 180-240 x 420-860 still lands; orbit-phase tolerance kept).
- Warm amber R>G>B band + dark navy field (0x04060f family).
- Band base brightness A/B vs installed v5: p50 family within +/-5 luma (D8).

ADD (v6 structure):
1. Dominant core knot: azimuth ~65% map width (free param, D4), radius 8-10 deg, +35-45 luma over band base, luma < 245, partially veiled: glow x (1 - riftMask*0.7) (D1).
2. 2-3 secondary knots: radius 3-5 deg, +15-25 luma; one may be a slightly cooler warm-white.
3. Layered band: core stripe + wider envelope (2.5x width, ~40% amplitude) + faint far companion (~15% amplitude, 4x width, e +4-6 deg, slightly cooler; D5).
4. Dust: 1 dominant broad rift near the core knot (darkening 0.35-0.55, 25-35% band width, soft noise-displaced edges) + 2-4 minor lanes (0.25-0.45).
5. fBm filaments: 3-4 octaves, domain-warped, anisotropic 3-4x along-band stretch, asymmetric wisps.
6. Sparse correlated stars: density = 0.4*base + 1.2*bandBrightness + 1.6*knotProximity; 1-2 px Gaussian dots; warm-white majority, ~12-15% cool-white; few 2-3 px brights in knots only (D2).

AVOID:
- luma >= 245 (blown-out knots).
- Elevation or band-width change (I360 framing invariant).
- Cool drift in the band (palette is amber-locked, R>G>B).
- High-freq 1 px dust edges; uniform fine noise (bake at 2x, downsample 4x4; D3).

Palette ramp (D6): deep amber (R 120-150, G 70-90, B 40-55) -> bright amber-white (R 235, G 200, B 150) at peaks; field (4-8, 6-10, 15-25); R>G>B everywhere in the band.

Size strategy: bake 2048x1024 linear (bake-target node select must commit tree.update_tag()) -> downsample 1024x512 4x4 (D3) -> JPEG q90 -> if > 115 KB then q85 -> then reduce far-band then filament amplitude (never core structure); hard stop 122880 B (D7: the test cap, tighter than the budget-derived 123557 B); target 90-115 KB.

Decisions:
- D1: core knot veiled by the dominant rift (real look + anti-blowout).
- D2: skybox stars stay sparse; the dense twinkling layer stays in the in-game Points starfield.
- D3: bake at 2x and downsample (anti-aliasing; kills 1 px dust edges).
- D4: knot azimuth is free; band elevation is the invariant.
- D5: far companion band ~15% amplitude at e +4-6 deg.
- D6: palette ramp as above.
- D7: effective hard cap 122880 B (tests/skyboxTexture.test.js; tighter than budget 123557 B).
- D8: band base brightness A/B vs v5, p50 within +/-5 luma.

Blender 5.2 gotchas re-listed for ST-332 (I230-verified): math-only unit direction (VectorMath LENGTH/NORMALIZE broken); Math EXPONENT = 2^x; Noise node has no vector offset (per-channel ADD on U); bake-target node select must commit tree.update_tag(); 8-bit PNG save writes stored bytes as-is (sRGB byte space - the I357 linear-as-bytes bug made it ~6x too dark); 8-bit R<<G green cast on faint wisps (warm R>G>B avoids); dense 1 px stars kill PNG compression (skybox stars stay sparse).

## Bake Result (ST-332, I364 - shipped)

Pipeline: numpy-in-Blender headless bake (make_sky_v6.py, blender -b --factory-startup --python-exit-code 1; SEED 33201 deterministic, ~16-18 s/bake): analytic 2048x1024 field (2x) -> 2x2 downsample -> 1024x512 equirect JPEG q90 ladder (q90 -> q75, HARD_CAP 122880 B). 5 bake iterations: (1) initial luma_max 250.8 FAIL, drift -21 -> (2) star caps (b clip 0.80 -> 0.72; 6 brights 1.0 -> 0.82) + companion amp 0.10 -> 0.05: luma_max 222.2, drift -18 -> (3) companion sigma 16 -> 7.5: drift unchanged (companion not the driver) -> (4) DBG per-term row-mean decomposition: the DUST (dominant rift 0.50 + 3 lanes 0.35/0.30/0.32) darkens core rows ~6-10 luma; companion/nebula/star/base each < 2 luma in-window -> (5) companion -> partial azimuthal arc: final.

Shipped: v6 = 42899 B, hash 8BD9E59EC4EA, replaces v8 = 67255 B, hash 0FC2CE411CCA (backup .evidence/I364/skybox_pre_e40_backup.jpg hash-verified identical pre-swap). Structure: base_band v8-exact exp(-0.5*((lat-4deg)/20deg)^2)*0.55 (elevation invariant preserved by construction; bandC 4 deg) + core knot u0.65 (sz12/slat8 deg amp 0.16, veiled x(1-rift*0.7), D1) + 3 secondary knots (u0.18/u0.42/u0.86, amp 0.07) + dominant rift (ribbon sz 4.5 deg centered bandC+(rn-0.5)*8 deg, core win sz 28 deg azimuth, darkening 0.50) + 3 dust lanes (u0.30/u0.78/u0.12, 0.35/0.30/0.32, dust clip 0-0.60) + fBm filaments ((filam-0.5)*2 x (base_band*0.9) x 0.10) + companion PARTIAL azimuthal arc (knot u0.35, e +5 deg [spec +4-6 deg], sz 35/slat 6 deg, amp 0.08 = 14.5% band amp ~ D5 ~15%, tint (0.48,0.40,0.34) slightly cooler still R>G>B, az-mean ~0.24) + nebula violet (0.40,0.22,0.60)*0.06 + cyan (0.18,0.42,0.52)*0.04 x depth + color ramp (0.62,0.34,0.14)*clip(bandB,0,0.55) + (0.92,0.78,0.59)*clip(bandB-0.55,0) over base navy gradient + correlated stars 1112 (density 0.4 + 1.2*band + 1.6*knot, 13% cool, 6 brights 0.82, clip 0.72).

A/B (final, measured): D8 p50 @ cur center (rows 236-252) cur 72.21 / cand 71.58, delta -0.63 (<= +/-5 PASS); p10 57.95 / p90 79.70 (cur 69.06/80.06); warmfrac 1.000 (R>G>B everywhere in band); luma_max 225.3 (<245 PASS); luma_mean 32.92; stars 1112; q90 42899 B <= 122880 B D7 cap (under the 90-115 KB soft target - smooth gradients compress cheap, the cap is the binding constraint).

Elevation hold - DOCUMENTATION (drift -18 is DUST-driven, not geometry): row-mean argmax cur 244 -> cand 226 (drift -18, ACCEPTED + documented). DBG decomposition (2x rows 424-528 = 1x 212-264): bandcol row-mean 50.40 @ row 226 vs 44.59 @ row 244 - the DUST darkens the dust-occluded core rows ~6-10 luma; companion/nebula/star/base each < 2 luma in-window. This is correct Great-Rift behavior: flanks brighter than the dust-occluded core. Geometry preserved by construction (bandC 4 deg, v8-exact base_band). Spec elevation hold = same band-center parameter (satisfied) + MENU strip verified before/after at ST-333 (I365). The make_sky_v6.py "abs drift <= 6" print is self-imposed, not spec.

Companion deviation note: full-ring at 15% was incompatible with the D8 window (+14 luma) and the argmax; a one-sided clip ramp was the biggest argmax offender. Final form = partial azimuthal arc (balances the core knot at u0.65) at 14.5% ~ spec ~15%, restoring the D5 amplitude with a small row-mean lift.

Smoke (in-game headless, existing fire-and-forget loader, zero src): SMOKE {"skyboxReady":true,"skyboxUrl":"assets/skybox_equirect.jpg","camPos":[0.433,0.500,2.766],"nanPos":0,"frames":112,"framesDelta":31,"hasCanvas":true}, CONSOLE errors 0 warnings 0; MENU screenshot .evidence/I364/smoke_menu.png (structured band in upper third, I360 framing holds, hull IBL re-tint subtle). asset-qa gate (texture run, no mesh): numeric audit + viewed preview + in-game smoke + test-suite re-audit (928/928) - satisfied.

Gates: 928/928 + build 0 + dist 131/1914094 B (-24356 B; headroom 183058 B >= 102400 B) + vendor sha 76DEA8151BC9352A unchanged (zero src). Next I365 = ST-333 verify + art QA + re-pin.

## Verify + Re-pin (ST-333, I365)

P1 - MENU band strip re-pin (strip y180-240 x420-860, n=26400/phase, fx off, 6 fresh-load phases, waits 3/5/7/9/11/13 s post-skybox-ready; camPos orbits ship at r ~2.84, y=0.5; fully deterministic - identical across 3 probe runs):

| waitS | orbitA | p10 | p50 | p90 | mean |
| 3 | 0.279 | 57.23 | 61.37 | 65.29 | 61.74 |
| 5 | 0.3342 | 57.02 | 60.80 | 65.01 | 61.33 |
| 7 | 0.454 | 56.73 | 60.37 | 64.51 | 60.76 |
| 9 | 0.5739 | 56.23 | 60.01 | 64.22 | 60.84 |
| 11 | 0.6945 | 55.73 | 59.37 | 63.51 | 60.25 |
| 13 | 0.8136 | 55.59 | 58.80 | 62.51 | 59.78 |

- camPos [0.74,0.5,2.7] -> [2.013,0.5,1.946] (menuOrbitRate 0.06 rad/s, ~105 s/rev).
- p50 monotonic 61.37 -> 58.80: camera azimuth crossing the v6 band gradient - structural, not noise.
- newBase 60.19 (median); delta vs I361 base 56.25 = +3.94 (v6 companion-arc knot + less dust darkening in strip).
- Tolerance RE-PINNED 0.75 -> +/-1.5: max observed phase dev 1.39 + 0.1 margin (I361 0.75 pre-dates the v6 arc azimuth spread).
- Floors (I360: p10>=45 / p90>=60 / mean>=50) HOLD per-phase, no re-derive: min p10 55.59, min p90 62.51, min mean 59.78.

P2a - IBL analytic bound (no-bloom-leak): v6 bg (1024x512) lumaMaxSrgb 184.2 -> linear 0.4857 x env.intensity 0.35 = bound 0.17 < bloom threshold 0.72 PASS.

P2b - hull A/B (Box3(shipGroup) projected +/-4px = box (247,157)-(1192,583), n=403942, 25 PBR mats bumped): A (v6) = B (v8) = A2 (restored v6) EXACT - p10 32.2 / p50 32.2 / p90 70.00 / p99 90.86 / max 243.56 / mean 44.11; dmean 0.00, restoreErr 0.00. The v6 vs v8 IBL re-tint is imperceptible in the ship region at envMapIntensity 0.35 (box background-dominated; hull PBR delta below 8-bit quantization).
- three.js r160 root cause (vendor/three.module.js): swapping scene.environment to a different texture does NOT rebind material envMaps - materialProperties.envMap only updates in getProgram() when needsProgramChange fires; a texture swap does not change the program cache key. Fix used: material.version++ on all PBR materials (scene.traverse, MeshStandardMaterial/MeshPhysicalMaterial) after each env change + one settle render.
- One-shot bright-tip settling: the first render after an rAF-freeze (and after any PMREM pass) shifts bright tips (mean -0.12, p99 -1.79, max -4.86, one-shot only); subsequent reads bit-identical (p2b_noise.mjs: 6 reads - R1 high-tips, R2-R6 identical). Probe does settle reads before each measured A/B/A2.

P3 - HUD A/B EXACT I347 (best seeded 9876): hudA (menu credit rect (0,689,1280,15) vs hint (36.31,651,339.98,15)): inter 0, vgap 23.00; hudB (play scoreBox (18,14,59.34,51) vs WPN (18,88,40,28)): inter 0, vgap 23.00.

P4 - PLAYING top strip (y0-80 x420-860, n=35200): state PLAYING, fx off, camPos ~[0.0,9.0,13.0] finite, nanPos 0, p50 69.00, p90 72.28 (documented, no hard pin).

Art QA (viewed): shot_menu.png - v6 band structure (knots/dust/filaments) visible in the MENU upper third (feeds G40.0 R3); shot_playing.png - warm band gradient + dust visible, arena + ship + HUD intact, no NaN corruption. Console 0 errors / 0 warnings total across all 8 pages.

Gates: probe 15/15 + 928/928 + build 0 (131/1914094 B) + vendor sha 76DEA8151BC9352A unchanged (zero src).

## ST-334 (I366) - Starfield-knot correlation (final design + results)

Design (final, shipped): 3-way mix sampler, count-preserving, fixed 7 RNG calls/star (seed 1337 stream ISOLATED to the starfield -> p1 demo pin stays EXACT; battery 13/13 + MATCH PASS verified):
- Per star: t = rng.next(); t < 0.25 -> core-knot clump; t < 0.30 -> secondary clump; else uniform (pre-I366 byte stream: u = rng.next()*2-1, theta = rng.next()*2*PI).
- Knot draw (Box-Muller, 2 calls): u_tex ~ N(u, sizeUDeg/360), lat ~ N(latDeg*D2R, sizeLatDeg*D2R); u_tex wrapped with floor; az = (ut - 0.5) * 360 deg (equirect convention, +x toward +z); pre-flatten u back-solved: v = sin^2(latC), u = sign(latC)*sqrt(v/(0.49+0.51*v)) (from the rendered y*0.7 flatten: sin(lat) = 0.7u/sqrt(1-0.51u^2)).
- Brightness: core 1.15x, secondary 1.12x (aScale = rng.range(0.7,1.4)*bright).
- config.js starfield: knot {u 0.65, latDeg 4, sizeUDeg 24, sizeLatDeg 16, p 0.25, bright 1.15}; secondary {u 0.18, latDeg 4, sizeUDeg 10, sizeLatDeg 7, p 0.05, bright 1.12}; test enforces knot.p + secondary.p <= 1.

DEVIATION (documented): the handoff plan was rejection sampling (per-star accept = base + boost*w, count-preserving). Pre-sim proved it invisible: the 12x8 deg core knot is ~0.46% of the sphere; with 800 stars the bias adds only ~2 stars inside the knot (core/antipode 1.0, bright stars 0 vs expected 1.3-1.8) - the acceptance "correlation visible in screenshots" would fail. The mix sampler allocates 25%/5% of stars directly to the clumps (same count, same RNG budget) -> measured core 128/61 (2.10) + 11/5 (2.20).

Results (probe 22/22):
- P1 MENU band strip: newBase 60.19, deltaVsI365 0.00 - NO re-pin (tolerance +/-1.5 holds, max phase dev 1.05); floors hold (min p10 55.59 / p90 62.51 / mean 59.85); p50s 61.51/61.09/60.37/60.01/59.37/58.80 (I365: 61.37/60.80/60.37/60.01/59.37/58.80); orbitA 0.2818 -> 0.8231.
- P2 in-page density (800 positions + aScale from vr.stars geometry): EXACT vs pre-sim (determinism x2 runs): core 1s 128/61 (2.10), core 11/5 (2.20), sec 1s 31/28 (1.11), sec 2/2 (1.00), bright (aScale>1.4) 68, brightIn1.5sFrac 0.824.
- P3 screenshots viewed: core knot centered (orbitA 3.7752, viewAz 53.69 - dense bright clump visible), secondary (orbitA 0.3324, viewAz 250.96 - soft clump ~6.2 deg left of center), PLAYING (sec clump left; core knot structurally invisible under the fixed chase cam); no NaN, no artifacts.
- P4 PLAYING top strip: p50 69.08 (+0.08 vs I365 69.00, phase noise), p90 72.28 EXACT, nanPos 0, camPos finite.
- P5 HUD A/B EXACT I347: hudA (credit/hint) inter 0 vgap 23.00; hudB (scoreBox/WPN) inter 0 vgap 23.00.
- Console 0 errors / 0 warnings across all 10 pages. 929/929. Build 0 (131/1915020 B, +926 B vs I365, headroom 182132 B >= 102400 B). Vendor sha 76DEA8151BC9352A unchanged.
- Changed: src/core/config.js (starfield section), src/render/starfield.js (sampler rewrite; render API behavior-identical), tests/config.test.js (+ST-334 schema test) + 6 docs.

## G40.0 Result (ST-335, I367) - E40 gate + closeout (cgs-regression-suite + cgs-gate-check + cgs-milestone-review; docs only, zero src)

G40.0 PASS R1..R5. E40 CLOSED 5/5 (ST-331..335 all done).

R1 p1 demo pin EXACT (causal - zero sim, asset-only arc): cite I366 p1 pin battery (.evidence/I361/battery_runner.mjs + match.cjs) 13/13 probes OK + MATCH PASS (all assertions): p1 EXACT 11334 / 57 / W2 / combo 15 / shots 198 / acc 0.2878787878787879 / 36.14999999999923 s / replay 2169-2220 frames / speed 4 (seed 9876); console 0/0 x13. The starfield RNG stream is isolated to the starfield (I366) so the sim/replay RNG is untouched -> the pin is causally unchanged by the E40 asset + starfield-Points arc.

R2 rockab radii EXACT 2.2/1.3/0.7: FRESH headless probe this session (.evidence/I367/rockab_run.mjs, dev server 5173, killed + port free after): reseed 30201, field.rocks cleared, spawn L/M/S at [-3.5,-4]/[0,-4]/[3.5,-4] -> spawned radii [2.2, 1.3, 0.7] EXACT; state MENU; all 3 rock GLBs ready (rockL/rockM/rockS); console 0 errors / 0 warnings.

R3 skybox art probe (CITE - no new sky-dependent probe needed; the v6 asset is byte-identical since I364 and verified at I365 + I366): v6 = assets/skybox_equirect.jpg 42899 B (<= 123557 B cap PASS, sha256-prefix12 8BD9E59EC4EA). Band structure (core knot u0.65 + 3 secondary knots + dominant rift + 3 lanes + fBm filaments + companion arc + correlated stars) present in the MENU strip: I365 P1 newBase 60.19 (tolerance +/-1.5) + P2a IBL bound 0.17 < 0.72 + P3 HUD A/B EXACT I347 + art QA screenshots viewed (console 0/0, no NaN); I366 P1 deltaVsI365 0.00 (starfield-Points arc did not shift the band strip) + I366 P5 HUD A/B EXACT I347 + console 0/0 across 10 pages.

R4 PWA 11/11: FRESH this session (.evidence/I348/pwa_probe.mjs against the production build served on 5199, server killed + port free after): sw registration active + scope root + controller set on the reloaded (claimed) client; online page boots (__vr); manifest GET 200 + manifest+json + display standalone + 512 png icon (any maskable) + start_url/scope "."; offline reload boots from cache (__vr) + no NaN in world/camera; console 0 errors / 0 page errors. 11/11 PASS.

R5: 929/929 tests + build 0 + dist 131 files / 1915020 B (headroom 182132 B >= 102400 B) + skybox 42899 B <= 123557 B + vendor sha 76DEA8151BC9352A unchanged + servers killed + ports free (5173/5199 = 0 listeners) + stray audit clean (0 chrome, node at 13 MCP baseline).

Closeout: E40 (Nebula Skybox Art Pass) CLOSED 5/5 at I367. The skybox v6 (structured nebula band: dominant core knot + secondary knots + Great-Rift-style dust + filaments + correlated stars) shipped as an in-place 1024x512 JPEG (42899 B) with zero sim / zero src (existing fire-and-forget loader + IBL hook I213); the twinkling Points starfield (I366) correlates with the v6 knots while keeping the p1 pin EXACT. No re-resolution, no moved band, no animated sky (E39/E40 deferrals preserved).
