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
