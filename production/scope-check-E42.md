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