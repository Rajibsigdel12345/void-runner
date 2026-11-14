# Scope Check - E42 Play-Frame Coherence Pass (I374)

## Summary
E42 is a PLAY-FRAME ART/COHERENCE pass on the last dominant unpolished surface in the PLAYING frame: the arena FLOOR and field lighting. The floor occupies ~60% of the play frame and, after E40 v6 skybox (I364) + E41 v8 rocks (I370) + I371 comet, reads near-black/muddy and slightly out of key with the richer sky + rocks it now sits under. This pass ADDS STRUCTURE inside the existing dark budget (floor-texture radial re-bake, grid-brightness rest-curve contrast, a bounded floor-only secondary fill / contrast grade) - it does NOT brighten the floor past its FLOOR-50 "dark by design" ceiling and adds NO new draw calls, NO new programs, and NO sim/mechanics changes. In-place asset swap (floor_surface.png) + config-knob tweaks only, zero sim src.

## Grounding
- Surface selection: the floor + field lighting is the last dominant unpolished surface in the PLAYING frame. Sky (E40 v6, frozen), rocks+comet (E41 v8, frozen), ship/hull (prior arcs), HUD (I347 A/B frozen), boss (E36) are all converged. The floor was last tuned in E39 (I359 grid refine) BEFORE the E40 v6 skybox and E41 v8 rocks landed, so it is the one surface with a cross-arc coherence gap: a dark, low-structure floor under a richer sky + craggier rocks.
- FLOOR-50 (ST-177) FROZEN: the floor is dark BY DESIGN. The displayed floor luma stays under a ceiling so rocks/bullets pop against it. E42 works WITHIN that budget - add structure, not brightness.
- Current floor render path (read this session):
  - src/render/floorDisc.js: CircleGeometry + unlit MeshBasicMaterial (toneMapped false), y = -0.02, textured with assets/floor_surface.png (512x512, 8586 B).
  - src/render/arenaFloor.js: static LineSegments grid, rest-curve colored between gridDim and gridBright.
  - src/core/floorGrid.js + src/core/config.js arena block: the floor knobs.
  - Current config (post-I359 ST-328): gridBright 0x483728 (hub luma 57.5; cap <= bomb pickup luma 118.8 - 59 = 59.8), gridDim 0x1a130d (dim edge luma 20.1); ST-293 test: all rendered ring lumas < 50 (FLOOR-50 dim band).
- FLOOR-50 pin frozen: 230/61/169/0/0 (p7a basis). floorab rendered-ring pins (I322b/I359 probe basis): rings 48.47/48.47/39.90/29.41/25.27 + rim 55.47 (calls 31, tris 546). Any floor change forces these re-pins (risk R-E42-1).
- Skybox v6 (E40) FROZEN since I364: assets/skybox_equirect.jpg 42899 B <= 123557 B cap, sha 8BD9E59EC4EA, newBase 60.19 +/-1.5.
- Bounded YouTube grounding (this session; 1 search / 3 queries / 16 raw, STOP on noise per anti-over-engineer): useful = (1) yQMywArQfyY (Single-Minded Ryan, Unity post-processing) - "add a secondary light to light up the dark area... warm color to create contrast" + "Lift/Gamma/Gain... the general rule is to create contrast" -> grounds the ADD direction (structure/contrast in the dark areas, NOT global brightening); (2) DgBBCRcm_EU (low-poly stylized sci-fi rendering) as a lighting/post reference. Remaining 14 = noise (VODs/manhwa/general tutorials); 16 ids recorded as burned.

## Scope IN
- Floor-texture radial structure: re-bake assets/floor_surface.png (Blender / numpy-in-Blender, headless, deterministic) so the 512x512 disc reads with more legible concentric + radial structure (ring highlights aligned to the grid rings, a subtle hub glow, a darker falloff toward the rim) - all within the existing per-pixel dark budget (structure only, no new brightness headroom).
- Grid contrast knobs (config-only, if audit-justified): tighten the gridBright/gridDim rest-curve so the hub/mid/outer ring luminance ladder reads with more contrast - staying inside FLOOR-50 (all rendered ring lumas < 50) and the 59.8 hub cap.
- Bounded secondary fill / contrast grade (render-only, if audit-justified): a cheap secondary fill on the floor plane OR a micro grade knob (lift/gamma on the floor disc only) to create local contrast per the YouTube principle - NO global exposure change, NO new full-screen pass.
- Re-pin FLOOR-50 + floorab-dependent pins with documented deltas.

## Scope OUT
- Brightening the floor past the FLOOR-50 ceiling (violates "dark by design").
- Any new draw call / new shader program (keep the floor at its current +0 path budget).
- Skybox re-bake (frozen, E40).
- HUD layout / A/B baseline (I347 frozen).
- Mechanics / sim / replay changes (feel FROZEN).
- Animated / per-frame floor deformation (user GPU constraint).

## Stories
- ST-341 (I375) audit + BEFORE baseline (cgs-asset-audit; CUTTABLE to docs-only closure; 0 KB): headless probe (dev server 5173 killed + port free after), deterministic fresh reseed 71200 (documented), fx=high, all 4 GLBs ready, fixed-camera PLAYING frame; per-region luma boxes (sky band / horizon / floor hub+mid+outer rings / rim strip / rock boxes L/M/S / ship box) + per-region color-cast R/G/B (warm-muddy-cast hypothesis) + console 0/0 + no NaN -> verdict: where exactly is the cross-arc gap.
- ST-342 (I376) direction (cgs-dev-story; docs only): KEEP (FLOOR-50 ceiling + floorab pins + HUD A/B I347 + no new draw calls/programs + no sim/src/replay/vendor changes) / ADD (per audit only: floor structure within the dark budget - grid-brightness knobs, floor-texture radial re-bake, possibly a grade micro-knob / secondary fill intensity) / AVOID (brightening past FLOOR-50, new draw calls, mechanics, skybox re-bake, HUD layout).
- ST-343 (I377) implementation (cgs-dev-story + blender-core/blender-asset-qa if Blender; asset-only + config-only, zero sim src): floor_surface.png re-bake (Blender / numpy-in-Blender headless, deterministic seed) + config knobs only if audit-justified + re-pin FLOOR-50/floorab-dependent pins.
- ST-344 (I378) apply + A/B + art QA (cgs-dev-story): full PLAYING-frame A/B CORRECTED method (before/after same seed/cam/fx screenshots + region luma boxes re-measured + pins green + no NaN + console 0 real errors + renderer.info no new draw calls + p1 EXACT causal).
- ST-345 (I379) E42 regression + G42.0 gate + closeout (cgs-regression-suite + cgs-gate-check + cgs-milestone-review): R1 p1 EXACT causal / R2 rockab FRESH / R3 play-frame art probe FRESH / R4 PWA 11/11 FRESH (I348 canonical server) / R5 quality bar + hygiene -> E42 CLOSED.

## Cut options
- If ST-341 audit finds NO material cross-arc gap (floor already coherent after E40/E41), CLOSE E42 early as docs-only with the audit evidence + reason (no forced re-bake), deferring floor work to a future arc. ST-341 is the cut gate.
- If ST-343 floor re-bake threatens the FLOOR-50 ceiling or the byte budget, cut to config-knobs-only (grid contrast) or docs-only.

## Deferrals
- Animated/per-frame floor deformation (user GPU constraint).
- Normal maps / PBR floor (out of the flat-unlit style).
- E39/E40/E41 deferrals untouched.

## Budget
- dist at open 131 files / 1910880 B; headroom 186272 B (>= 102400 B floor); max addable ~83872 B. floor_surface.png 8586 B -> re-bake hard cap ~25000 B (target keep floor family < 16.5 KB total). Zero sim src. Vendor sha 76DEA8151BC9352A UNCHANGED (no three bump).
- 5/6 iterations (open + 5 stories).

## Risks
- R-E42-1 FLOOR-50 / floorab re-pin scope (all rendered ring lumas < 50 + hub <= 59.8 + the I322b/I359 ring/rim spot pins - re-tune in-bake, never widen a test band silently).
- R-E42-2 byte bloat over the floor budget (re-bake is a small PNG; keep under cap; verify dist headroom >= 102400 B after).
- R-E42-3 A/B method: MUST use the CORRECTED method (standalone closeup + real PLAYING screenshot + authoritative pins), NOT readPixels boxes (I370 correction).
- R-E42-4 host stall: 2-phase evaluate + same-evaluate canvas (I368 pattern); flat chrome CPU = wedged.
- R-E42-5 no new draw calls: floor re-bake must not add a material/texture path beyond the existing floor disc.

## Gate G42.0 (at ST-345)
- R1 p1 demo pin EXACT (causal - asset/config only, sim untouched) / R2 rockab radii EXACT 2.2/1.3/0.7 (fresh, reseed 30201) / R3 play-frame art probe (per-region luma boxes re-measured before/after within budget, FLOOR-50 ceiling held, floorab pins re-pinned documented, no NaN, console 0 real errors, no new draw calls) / R4 PWA 11/11 (fresh, I348 canonical server, killed + port free) / R5 929+ tests + build 0 + headroom >= 102400 B + floor budget cap + vendor sha 76DEA8151BC9352A unchanged + servers killed + ports free + stray audit.

## Files
- src/render/floorDisc.js, src/render/arenaFloor.js, src/core/floorGrid.js, src/core/config.js (arena block), assets/floor_surface.png, tests/floorGrid.test.js (re-pin), tests/paletteHarmony.test.js (floor bg proxy if hub changes).
- production/scope-check-E42.md (this file), production/stories.md (ST-341..345), production/epics.md (E42 block), CHANGELOG.md, production/session-state/active.md, production/iterations.md, .evidence/I37x/*.

## Verification
- I374 (this open): docs only, zero src. 929/929 (fresh this session) + build 0 + dist 131/1910880 B (headroom 186272 B) + vendor sha 76DEA8151BC9352A unchanged.
- Per-story verification as each story lands (see Stories above).

## Next owner
- I375 = ST-341 audit + BEFORE baseline (cgs-asset-audit). Build the .evidence/I375/ probe, capture the BEFORE baseline (per-region luma boxes + color-cast) + a full PLAYING screenshot (VIEW it), deliver the verdict.

## I375 - ST-341 audit + BEFORE baseline (cgs-asset-audit; headless; zero src; 0 KB)

Probe: .evidence/I375/probe.mjs + probe_a2.mjs (playwright-core chromium headless, 1280x720, CDP cache off, one browser, closed after). Part A: overhead freeze (rAF frozen, fx=off, reseed 71200, pool/ship/particles hidden) -> 10 radial bands p10/p50/p90 + per-band R/G/B cast + 5-ring annulus + spots + structure. Part A2: identical overhead under I322b conditions (no reseed, pool visible) to rule out probe-condition drift. Part B: real PLAYING (fx=high, reseed 71201, world.begin() + advance(2.5) deterministic sim step, freeze + single render) -> region boxes (sky band / horizon / floor region / ship box / rock boxes) + cast + full-frame screenshot. Hygiene: dev server 5173 started + killed after each run, port free verified (connect exit 1), 0 chrome at rest, console 0/0 both parts, NaN 0, camFinite true, state PLAYING (5 rocks at t=2.5 s). Screenshots VIEWED: i375_overhead_fxoff.png (WebGL drawImage read is clean; the compositor screenshot shows the MENU DOM overlay on top) + i375_playing_fxhigh.png (WAVE 1, ship centered, 5 warm rocks, cool rim strip, warm sky - floor dominant).

PIN CORRECTION (documented, values-only): the floorab pin cited at I374 open (rings 48.47/48.47/39.90/29.41 + rim 55.47) was the canonical I317/I322 pin, superseded by the I359 (ST-328) values-only re-pin. I375 Part A + A2 both reproduce .evidence/I359/probe.json ringCheck byte-for-byte: ring annulus p90 49.04/48.32/38.54/24.41 + rim 52.98 (p50 51.12), hub ring p90 57.53, spot t=0.95 p90 111.35. The floor renders with zero drift since I359 (as expected: no floor changes in E40/E41). All E42 work pins to the I359 values from here on.

BEFORE baseline (I375 measurements):
- Overhead 10 bands (fx off): p50 ladder 51.18/45.90/44.76/40.83/40.83/37.62/30.34/24.41/21.05 (t 0.0-0.9) + rim band p50 53.98; per-band spread 10.56/8.42/8.42/15.98/15.98/13.56/9.42/5.29/3.36 (rim 185.95); cast R/G/B hub 60.9/46.4/33.9 (R/B 1.79) -> outer 27.3/20.7/14.0 (R/B 1.95) - warm everywhere, cast strengthens outward.
- Ring annulus p50 32.2/16.56/16.56/16.56 + rim 51.12 (p90 per the pin above); spot t0.05 p50 49.32 rgb 62.8/48.1/35.6; t0.95 p90 111.35 (rim line).
- PLAYING (fx high): horizon row 57/720 (floor = ~92% of frame height); sky band p50 70.14 rgb 99.0/63.6/53.9 (warm); floor region p10 16.56 / p50 32.2 / p90 72.07 rgb 46.1/33.5/27.2 (R/B 1.69); ship box p50 32.2 rgb 51.4/40.2/30.1; rock boxes p50 48.52 rgb 58.8/40.5/27.1 + 21.69 rgb 37.6/24.9/14.7 (warm r>g>b, consistent with E41 v8).

Findings - where the cross-arc gap is:
1. Cast coherence (primary): the floor is warm across all bands (R/B 1.69-1.95, strengthening outward), the same hue family as the skybox v6 warm nebula (sky rgb 99/63.6/53.9). The floor-sky boundary depends solely on the cool-blue rim strip (rim rgb b 85-100) + the arena ring silhouette. The mid/outer floor (p50 16.6-21) is a muddy warm darkness that blends into the sky's warm dark near the horizon = the "muddy" read.
2. Structural flatness of the outer 60%: band spread collapses from 8.4-16 (t<0.6) to 3.36-9.4 (t 0.7-1.0); the only detail in the outer region is the low-contrast blotch noise of floor_surface.png (8586 B). The inner 40% (hub + inner grid rings) reads as structured.
3. Luminance envelope = the constraint: ring 1 p90 49.04 sits at the FLOOR-50 ceiling of 50; hub p90 57.5 sits at the 59.8 cap. No luma headroom on rings/hub -> the only free dimension is texture structure / micro-contrast / cast within the current envelope (a luma-neutral re-bake).

Verdict: KEEP - a material cross-arc gap exists (outer-floor structure + cast separation). NOT CUT. ST-342 direction: luma-neutral re-bake of floor_surface.png - (a) replace blotch noise with intentional deck structure (concentric panel bands aligned to the grid rings + radial sector seams aligned to the 8 sectors), (b) outer micro-contrast (band spread ~3.4 -> 8-12, within the per-band [p10,p90] envelope; peaks at ring radii must not push ring p90 above 50), (c) subtle cool/neutral cast shift in the outer region (R/B ~1.76 -> ~1.3-1.4) to separate from the warm sky + extend the cool family (rim, engine glow, reticle), (d) hub region unchanged; 512x512 kept, hard cap ~25 KB (target floor family < 16.5 KB); +0 draw calls/programs; zero sim src.

Verification + hygiene: 929/929 + build 0 (docs only, zero src touched); dist 131/1910880 B (headroom 186272 B); vendor sha 76DEA8151BC9352A unchanged; servers killed + 5173 free; 0 chrome; console 0/0; NaN 0.

## I376 - ST-342 grounded direction (cgs-dev-story; docs-only; 0 KB)

Story Goal: turn the I375 audit (ST-341, VERDICT KEEP) into an implementation-ready direction for ST-343 (I377) - the exact luma-neutral re-bake spec for assets/floor_surface.png, the envelope guardrails it must satisfy, and the R-E42-1 re-pin plan. Owner: gameplay-programmer (asset + config only, zero sim src). Dependencies: I375 audit + BEFORE baseline (this file, I375 section), the I359 pin set (authoritative after the I375 pin correction), blender-core + blender-asset-qa for I377.

KEEP (frozen):
- FLOOR-50 ceiling: all rendered ring lumas < 50 (ST-293); hub cap <= 59.8.
- floorab pins = the I359 values (authoritative after the I375 pin correction): ring annulus p90 49.04/48.32/38.54/24.41 + rim 52.98 (p50 51.12); hub ring p90 57.53; spot t0.05 p50 49.32 (rgb 62.8/48.1/35.6); spot t0.95 p90 111.35; FLOOR-50 battery 230/72/158/0/0 (post-I359 re-pin; supersedes the 230/61/169/0/0 cited in the I374 section).
- skybox v6 frozen (42899 B sha 8BD9E59EC4EA); HUD A/B I347 frozen; HUD layout frozen; feel frozen.
- No new draw calls/programs; no sim/src/replay/vendor changes (vendor sha 76DEA8151BC9352A).

ADD (only what the I375 audit justified):
- Luma-neutral re-bake of assets/floor_surface.png - spec:
  (a) structure: replace the blotch noise with intentional deck structure - concentric panel bands aligned to the 5 grid rings (config: rings 5, hubRings 0.10/0.18, rimRing 0.92) + radial sector seams aligned to the 8 sectors (divisions 48).
  (b) micro-contrast: outer band spread ~3.4 -> 8-12, strictly within the per-band [p10,p90] envelope measured at I375; peaks at ring radii must not push any ring p90 above 50.
  (c) cast: outer region R/B ~1.76 -> ~1.3-1.4 (subtly cool/neutral) to separate from the warm sky (rgb 99/63.6/53.9) and extend the cool family (rim, engine glow, reticle).
  (d) hub: the t < 0.2 region stays unchanged.
- Constraints: 512x512 kept; PNG hard cap ~25 KB (target floor family < 16.5 KB); deterministic seed documented; +0 draw calls/programs; zero sim src.
- Rejected ADD candidates (documented; revisit only if a future arc re-opens FLOOR-50): grid-brightness rest-curve contrast and the bounded floor-only secondary fill / grade micro-knob - both are luma changes and I375 measured zero luma headroom (ring 1 p90 49.04 at the ceiling 50; hub p90 57.53 at the 59.8 cap).

AVOID:
- Brightening past FLOOR-50 (no luma gain anywhere in the envelope).
- New draw calls / materials / texture paths beyond the existing floorDisc (CircleGeometry + unlit MeshBasic, toneMapped false, y=-0.02).
- Mechanics/feel changes; skybox re-bake; HUD layout; animated or deformable floor geometry; per-frame floor deformation; three/vendor bumps.

R-E42-1 re-pin plan (executed at I378, after the I377 bake):
- Re-run the Part A overhead-freeze probe under the exact I375-A conditions (fx off, reseed 71200, cam (0,48,0.001) up (0,0,-1) fov 60, rAF frozen, pool/ship/particles hidden) + Part B real PLAYING (fx high, reseed 71201, begin + advance(2.5), freeze + single render + read).
- Re-pin ALL floorab ring/rim/spot/hub values with the documented delta vs the I359 pins (values-only re-pin; "re-tune in-bake, never widen a test band silently").
- FLOOR-50 battery must hold all ring lumas < 50 + hub <= 59.8; if a pin moves, the documented delta becomes the new pin (target: near-zero move = the luma-neutral proof).
- ST-343 acceptance: FLOOR-50 ceiling held + p1/rockab EXACT causal (asset-only swap keeps RNG untouched; current battery 11334/57/W2/combo 15/shots 198/acc 0.2878787878787879/36.14999999999923 s/replay 2169-2220/speed 4 seed 9876) + PNG cap + dist headroom >= 102400 B.

Acceptance (ST-342, this iteration): direction section appended (this section); p1 + rockab EXACT causal preserved by construction (zero src touched - no sim-relevant file changed; current pins cited above). No new risks beyond R-E42-1..5.

Verification + hygiene: 929/929 + build 0 (docs only, zero src touched); dist 131/1910880 B (headroom 186272 B); vendor sha 76DEA8151BC9352A unchanged; 0 chrome; no server running (5173 free). Next I377 = ST-343 Blender headless re-bake of assets/floor_surface.png v2 per spec a-d (blender-asset-qa mandatory).

## I377 - ST-343 floor re-bake + audit + blender-asset-qa (cgs-dev-story + blender-core + blender-asset-qa; asset authoring, DOCS-ONLY commit, zero src)

Deliverable: re-baked assets/floor_surface.png v2 (512x512), authored by a deterministic generator (.evidence/I377/gen_floor_v2.cjs, seed 20261115) with a Blender headless authoring bake (provenance) and shipped as a Node-encoded standard-sRGB PNG. Per ST-342 spec a-d: (a) deck structure aligned to the 5 grid rings (t=0.2/0.4/0.6/0.8/1.0, hard-band grooves) + 8 sector seams (theta=k*45deg, aligning exactly to the grid spokes); (b) outer-band micro-contrast raised (spread 8.85/13.41/8.85/12.56/8.85 across the outer bands, within the per-band [p10,p90] envelope; texture-space ring p90 32.2/16.56/16.56/16.56) via brightened panel ellipses (tc=0.5/0.7/0.9); (c) outer cast R/B ladder 1.632 -> 1.209 -> 1.055 (texture-space; rendered ~1.3-1.4); (d) hub t<0.2 = EXACT old-PNG byte copy (8224/8224 px, hub pin 57.53 preserved).
Luma invariant (FLOOR-50 safe BY CONSTRUCTION): new <= old luma at every pixel EXCEPT lift-zone pixels, max +4.85 (41,460 px) -> every ring/ceiling zone can only darken or hold, so rendered ring p90s stay at or below the I359 pins (ring1 49.04 at the ceiling 50). Mottle REMOVED (PNG size + determinism; tested amp 2.0/1.2, dropped). Quantization L->2-step + 4-step byte; 15 unique colors.
Config: gridBright/gridDim rest-curve + floor-only grade micro-knob = N/A (REJECTED in ST-342 - zero luma headroom; the re-bake alone achieves the goal luma-neutrally). No config.js change this iteration.
blender-asset-qa (mandatory, applied): 2D surface -> mesh checks (z-fighting / floating / normals / manifold / n-gons / UV / skinning / ground_z) N/A; texture checks PASS - colorspace sRGB (base color; standard sRGB intent-0 chunk added to match the old-asset + blender-bake marking), 512x512 decodes clean (pngjs + Node inflate), no artifacts/blotches/NaN in the authored texture (VIEWED: 5 rings + 8 seams + outer panel ellipses + exact-copy hub, warm-dark within budget).
ANOMALY RESOLVED (with data): the Blender-authored bake (.evidence/I377/floor_surface_v2_blender.png, 35799 B) differs from the field by 8424 B = 2808 whole pixels (worst +/-20). A decisive 32x32 full-range gradient probe (.evidence/I377/probe.py + pngjs) showed got(x,y)=8x-y+31 = V+(31-2y) = the buffer value at the VERTICALLY-MIRROWED row -> the Blender PNG save is VERTICALLY FLIPPED (Blender buffer origin bottom-left; the documented Y-origin gotcha), NOT gamma / dither / channel-remap (the byte value itself is preserved exactly at the corresponding pixel). Ship candidate = the Node PNG (top-left, three.js-correct), independently pngjs-verified BYTE-IDENTICAL to the field. Blender bake kept for provenance only.
Staged (NOT swapped this iteration - swap is ST-344/I378): .evidence/I377/floor_surface_v2_final.png = 16382 B (old 8586 B; cap ~25000 B; soft target <16500 B), sha256 03355dbce13c9db732d050b08411e2798d619834d45e7a8c24148682c6141ac8. Old PNG backed up + hash-verified (39E469B88E1367DD). audit_v2.json = full band/ring/hub/chunk/verify record.
Acceptance (ST-343, this iteration): re-bake authored + audited + QA PASS + staged; FLOOR-50-safe by construction; p1/rockab EXACT causal preserved by construction (zero sim-relevant file changed - docs + .evidence only, no src touched); asset byte cap PASS (16382 B). swap + A/B + floorab re-pin = ST-344/I378.
Verification + hygiene: 929/929 + build 0 (docs-only commit; assets/ unchanged this iteration); dist 131/1910880 B (headroom 186272 B); vendor sha 76DEA8151BC9352A unchanged; 0 chrome; no server running (5173 free).

## I378 - ST-344 apply + A/B + art QA (cgs-dev-story; ASSET-ONLY in-place floor PNG swap, zero src)

Deliverable: applied the I377-staged luma-neutral floor re-bake by in-place swap of assets/floor_surface.png (old 8586 B sha 39E469B8 -> new 16382 B sha 03355dbc = .evidence/I377/floor_surface_v2_final.png; same URL, no loader change; dist +7796 B) and re-pinned the floorab browser values under the I375 A/B CORRECTED method.
A/B method (corrected, per R-E42-2/I370/I372): re-ran the I375 probe verbatim (.evidence/I378/probe.mjs + probe_a2.mjs) under identical conditions vs the pre-swap I375 baseline - Part A overhead freeze fx=off reseed 71200 (per-band + ring luma), Part A2 I322b conditions (no reseed, pool visible), Part B real PLAYING fx=high reseed 71201 (begin + advance(2.5), hrow 57). Read via in-page drawImage->getImageData on the raw WebGL canvas (NOT post-FX readPixels) + 2 full-frame screenshots.
floorab RE-PIN (documented deltas vs the I359/I375 pins):
- 4 interior ring p90: 49.04 / 48.32 / 38.54 / 24.41 = IDENTICAL (d 0.00). Grid-LINE-driven (floorGrid rest curve), so the texture swap cannot move them; all remain < 50 => FLOOR-50 ceiling HELD.
- rim (rr=26) p90: 52.98 -> 52.76 (d -0.22) - the cool rim strip, exempt from the <50 rule (sole horizon separation).
- hub spot t0.05 p90: 57.53 = the canonical hub pin = gridBright 0x483728 luma 57.5 (<= 59.8 cap). The t0.05 ring is off-center (r=1.3); it now reads the hub-glow peak (was 53.97, d +3.56); the center peak itself is unchanged.
- spot t0.95 p90: 111.35 -> 112.43 (d +1.08); spot t0.985 p90: 54.40 -> 54.26 (d -0.14).
- mid/outer band p50 lifted by the new deck micro-structure: band4 40.83->42.04 / band5 37.62->38.54 / band6 30.34->30.55 / band7 24.41->25.27 / band8 21.05->21.84; bands 0-3 d 0.
- B PLAYING region (floor 32.2/72.07, sky 70.14, hrow 57): d 0.
FLOOR-50 battery 230/72/158/0/0 UNCHANGED (config-driven rest curve; 929/929 green). No test band widened.
LUMA-NEUTRAL PROOF: the asset-only swap moved zero grid-line p90s, zero draw calls/tris (overhead 21/366, PLAYING 50/1222, both d 0), zero visible-rock count (2), and zero B-region lumas - only the texture-structure band p50s + rim/spot moved, exactly as the ST-342 luma-neutral spec predicted.
p1/rockab EXACT causal: zero src-relevant file changed -> RNG untouched. p1 = 11334/57/W2/combo 15/shots 198/acc 0.2878787878787879/36.14999999999923 s/replay 2169-2220/speed 4 seed 9876; rockab radii [2.2,1.3,0.7].
Art QA (2 screenshots VIEWED): overhead fx-off (menu-overlaid; numeric reads from the raw canvas) + real PLAYING fx-high WAVE 1 (deck rings + 8-sector seams + outer panel ellipses clearly visible, floor stays dark so the low-poly rocks + cool rim strip pop, ship/engine/HUD intact, no artifacts/NaN). Console 0/0 x2, camFinite true.
Verification + hygiene: 929/929 + build 0 (ASSET-ONLY swap; zero src touched) + dist 131/1918676 B (headroom 178476 B >= 102400 B; dist floor png sha 03355dbc 16382 B) + vendor sha 76DEA8151BC9352A unchanged + dev server 5173 killed + port free + 0 chrome. Next I379 = ST-345 E42 G42.0 gate + closeout.

## G42.0 gate result (I379) - PASS -> E42 CLOSED 5/5

- R1 p1 demo pin EXACT causal (CITE I370/I371/I378 battery - zero src since the pin): 11334 / 57 / W2 / combo 15 / shots 198 / acc 0.2878787878787879 / 36.14999999999923 s / replay 2169-2220 / speed 4 (seed 9876). Causal: last src-touching commit = b376db3 I366 (starfield, RNG stream isolated so p1 stayed exact); git diff 55cc491..HEAD -- src/ empty -> zero sim/replay delta since the pin; I377/I378 were in-place asset-only floor PNG swaps at the identical URL with unchanged loader key (floorSurface) -> RNG untouched.
- R2 rockab radii EXACT (FRESH headless, .evidence/I379/rockab_run.mjs): reseed 30201, spawn L/M/S at [-3.5,-4]/[0,-4]/[3.5,-4] -> [2.2, 1.3, 0.7] EXACT; state MENU; 4/4 GLB ready; console 0/0; dev server killed + 5173 free.
- R3 play-frame art probe (FRESH headless, .evidence/I379/probe.mjs = I375/I378 probe verbatim): Part A overhead freeze fx=off reseed 71200 (calls 21 / tris 366; ring p90 49.04/48.32/38.54/24.41 all < 50 = FLOOR-50 HELD + rim 52.76; spot t0.95 p90 112.43 / t0.985 54.26; bands b4-8 42.04/38.54/30.55/25.27/21.84) + Part B real PLAYING fx=high reseed 71201 (calls 50 / tris 1222; floor p50/p90 32.2/72.07; sky 70.14; hrow 57; camFinite true; rocks 0->5). floorab pins EXACT-match the I378 applied-state re-pin (luma-neutral asset swap, zero src since) => no regression; no NaN; console 0/0 x2; no new draw calls (21/366 + 50/1222, both delta 0 vs I378); 2 screenshots VIEWED (playing fx-high WAVE 1: deck rings + 8-sector seams + outer panel ellipses visible, floor dark so the low-poly rocks + cool rim strip pop, ship/engine/HUD intact, no artifacts).
- R4 PWA 11/11 (FRESH, .evidence/I348/pwa_probe.mjs on the production build served at 5199 by the CANONICAL .evidence/I348/serve.mjs): sw registration active + scope root + controller claimed on reload; online boots (__vr); manifest 200 + application/manifest+json + standalone + 512 png (any maskable) + start_url/scope "."; offline boots from cache + no NaN; console 0/0. Server killed + 5199 free. GOTCHA (carried): scripts/serve.mjs lacks the .webmanifest MIME -> PWA probes MUST use .evidence/I348/serve.mjs.
- R5: 929/929 + build 0 (fresh) + dist 131/1918676 B (headroom 178476 B >= 102400 B) + floor_surface.png 16382 B (sha 03355dbc) <= ~25 KB cap + vendor sha 76DEA8151BC9352A unchanged + ports 5173/5199 free + 0 chrome + node 13 MCP baseline (no strays).

G42.0: PASS (R1-R5). E42 CLOSED 5/5 (ST-341..345 all done).