# Scope Check - E41 Asteroid + Comet Surface Relief Pass (I368)

## Summary
E41 deepens the rock L/M/S + comet surface relief so the rocks read MORE as cratered asteroids: deeper crater bowls, more prominent raised rims, stronger convex bumps, sharper per-vertex value contrast. ALL of it is static displacement baked into the mesh at bake time (same vertex count, near-same tris, no new shaders, no new draw calls, no per-frame deformation) = the GPU-compute-cheap form of the user request. Radii re-normalized EXACT 2.2/1.3/0.7 after bake; tri caps held (500/140/140, all-asset 1800); facet-luma re-pins documented. In-place GLB swap (same URLs), zero src.

## Grounding
- User standing request (repeated across arcs, incl. explicit side-info): rocks should be asteroid/comet-like with bumps + craters, "only if its gpu and compute heavy" constraint interpreted as: static displacement OK, animated/per-frame deformation NOT OK.
- Current state: rocks already carry baked relief (I209 initial crater pass, I307 bump deepening, E36 I342-I344 art pass). This pass deepens further: deeper bowls, more prominent rims, stronger convex bumps, sharper value ladder.
- BEFORE baseline captured this session (.evidence/I368; dev server 5173 killed + port free after each run; console 0/0):
  - before_i368.json (PR 1.0, 1280x720 buffer, fx off, audit light boost x2.2, reseed 41414, pool slots 0..3 = L/M/comet/S staged at x -7.5/-2.5/2.5/7.5 y2.5 z2, all other scene objects hidden): radii EXACT 2.2/1.3/1.003 (comet tail)/0.7; tris 490/134/180/134; all COLOR_0; luma boxes (p50/p90/max): L 68.79/72.85/132.65 (mean 68.18), M 71.28/73.28/121.65 (mean 71.54), comet 66.65/75.28/125.15 (mean 67.19), S 66.30/68.58/70.72 (mean 66.31); skyP50 44.18; WxH 1280x720; fov 60.
  - before_rock_closeup.png = exact readPixels output (Y-flip, canvas converted IN THE SAME evaluate) - the staged row over the v6 skybox, 436648 B.
  - diag_i368.json (PR 1.25, 1600x900 reference run, same staging): slot p50 86.58/69/58.66/65.09 - REFERENCE ONLY (different PR; NOT the A/B basis).
  - AUTHORITATIVE before facet-luma pins: tests/assetGlbs.test.js (per-tri mean facet luma p10/p50/p90: L 0.1934/0.4603/0.8239, M 0.2980/0.6182/0.9314, S 0.4354/0.7386/0.9649; ladder L<M<S; warm R>=G>=B; band [0.10,1.20]; spread floor 0.50; COLOR_0 FLOAT VEC3 5126).
- Art bible (design/art-bible): rocks are irregular, asymmetric, pitted - no symmetry, no smoothness.
- Research conclusion (bounded, prior arcs): juice/boss/skybox arcs all complete; no new mechanics; this is an ART pass. Feel is FROZEN (design/feel.md, E8).
- Headless capture gotchas documented this session (see iterations I368): (1) page.screenshot returns the last-COMPOSITED frame (unstaged menu), not the staged renderer.render() output -> required path = gl.readPixels raw buffer; (2) passing the readPixels ArrayBuffer across a second page.evaluate silently yields a BLANK PNG (I282 raw PNGs 31418 B = same latent bug) -> the canvas conversion MUST run in the same evaluate as readPixels; (3) a single giant evaluate stalls under host load (flat chrome CPU) -> split spawn/settle from stage/render into two evaluates (the working diag pattern).

## Scope IN
- Deeper crater bowls (bowl depth + rim height relative to the I307 baseline).
- More prominent raised rims around craters.
- Stronger convex bumps between craters.
- Sharper per-vertex value contrast (value ladder L<M<S kept; band [0.10,1.20]; spread floor 0.50 - re-pins with documented deltas).
- Comet: lumpy nucleus + brighter ion-tail COLOR_0 (same budget; render-only S variant 2 hook unchanged).
- Apply (in-place GLB swap, same URLs) + A/B closeup (IDENTICAL raw-readPixels pipeline) + facet-luma re-pin (tests + docs).
- G41.0 gate + closeout.

## Scope OUT
- No shader changes (I257 warm rim onBeforeCompile untouched), no rim-light change.
- Zero sim changes (movement, collisions, spawning untouched - assets only).
- No new sizes/variants (comet stays render-only S variant 2).
- NO animated deformation (per-frame displacement / vertex animation - user GPU constraint).
- No boss/enemy/skybox/floor changes.
- No radius/collision change (radii EXACT 2.2/1.3/0.7 re-normalized after bake).

## Stories
- ST-336 (I369): grounded rock/comet relief direction (cgs-dev-story; DOCS-ONLY, zero src).
- ST-337 (I370): Blender rock L/M/S relief re-bake + blender-asset-qa MANDATORY (ASSETS-ONLY).
- ST-338 (I371): Blender comet re-bake (CUTTABLE - close 4/5 with reason if budget conflict; comet keeps I344 asset).
- ST-339 (I372): apply + art QA + A/B + re-pin (in-place GLB swap same URLs; zero src).
- ST-340 (I373): E41 regression + G41.0 gate + closeout (docs only).

## Cut options
- ST-338 (comet re-bake) CUTTABLE: on byte/tri budget conflict, close the arc 4/5 with the reason; comet keeps the I344 asset.
- Cut value-ladder sharpening (keep bowl/rim/bump geometry, keep current value distribution) if re-pins would exceed band/spread floor.

## Deferrals
- Animated/per-frame surface deformation (user GPU constraint).
- Normal maps (draw cost + asset complexity).
- E39/E40 deferrals untouched (full skybox rework, moved band, animated sky, starfield shader upgrade, i18n, gamepad, dynamic floor FX).

## Budget
- dist at open: 131 files / 1915020 B; headroom 182132 B (>= 102400 B floor).
- Current GLBs: asteroid_L.glb 22696 B / asteroid_M.glb 6588 B / asteroid_S.glb 8388 B / asteroid_comet.glb 7096 B (family 44768 B).
- HARD CAP: new GLB family <= current + 20 KB (<= 64768 B); zero src changes.
- Vendor sha 76DEA8151BC9352A UNCHANGED (no three bump).

## Risks
- R-E41-1 facet-luma re-pin scope: bowl/rim/bump deepening shifts per-tri luma out of band [0.10,1.20] or breaks ladder L<M<S / spread floor 0.50 -> re-tune values in the SAME bake (do NOT silently widen test bands).
- R-E41-2 tri bloat: displacement with subdivision adds tris -> caps 500/140/140 + all-asset 1800 are HARD (displace-only bake at the SAME vertex count).
- R-E41-3 byte bloat: GLB family over +20 KB cap -> reduce float precision / quantize colors to fit.
- R-E41-4 radii drift: displacement pushes maxR off 2.2/1.3/0.7 -> re-normalize EXACT after bake; verify with the rockab probe (reseed 30201).
- R-E41-5 A/B pipeline mismatch: BEFORE = PR 1.0 1280x720 raw readPixels same-evaluate capture (this session); ST-339 AFTER MUST reuse the identical pipeline (same PR, size, staging, light boost x2.2, camera (0,3.1,13) lookAt (0,2.5,2), fx off, reseed 41414) or the A/B is invalid.
- R-E41-6 host stall: headless SwiftShader stalls under host load (observed this session: 2 single-evaluate probe stalls, flat chrome CPU). Playbook: chrome CPU rising = SwiftShader working (wait 5-8 min); flat = wedged -> taskkill chrome + kill probe node + retry; never WMI (tasklist/taskkill only).

## Gate G41.0 (at ST-340)
- R1 p1 demo pin EXACT (causal - assets only, zero src).
- R2 rockab radii EXACT 2.2/1.3/0.7 (fresh headless probe, reseed 30201).
- R3 rock-art probe: rock GLBs + comet load + ready; tris <= 500/140/140 + all-asset cap 1800; radii EXACT; facet-luma re-pins documented (deltas within band + ladder + spread floor); A/B closeup same pipeline; no NaN; console 0/0; no new draw calls/programs.
- R4 PWA 11/11 (fresh run, server killed + port free after).
- R5 929+ tests + build 0 + headroom >= 102400 B + family GLB cap + vendor sha 76DEA8151BC9352A unchanged + servers killed + ports free + stray audit clean.

## Files
- assets/asteroid_L.glb, assets/asteroid_M.glb, assets/asteroid_S.glb, assets/asteroid_comet.glb (replaced in place, same URLs).
- tests/assetGlbs.test.js (facet-luma re-pins only, if deltas warrant).
- Docs: production/scope-check-E41.md, production/stories.md, production/epics.md, CHANGELOG.md, production/session-state/active.md, production/iterations.md.
- .evidence/I369..I373 (untracked + gitignored).

## Verification
- npm test green before each iteration is declared done; npm run build 0; headless smoke where rendering changed (console clean, no NaN).
- blender-asset-qa MANDATORY on ST-337/ST-338 (numeric audit + viewed preview + in-game smoke + test-suite re-audit).

## Next owner
I369 = ST-336 grounded relief direction (docs only, zero src).

## Relief Direction (ST-336, I369)

Grounding: BEFORE baseline (.evidence/I368, PR 1.0 raw readPixels, reseed 41414) + authoritative facet-luma pins (tests/assetGlbs.test.js: per-tri mean facet luma p10/p50/p90 = L 0.1934/0.4603/0.8239 [spread 0.6305], M 0.2980/0.6182/0.9314 [spread 0.6334], S 0.4354/0.7386/0.9649 [spread 0.5295]; ladder L<M<S; warm R>=G>=B; band [0.10,1.20]; spread floor 0.50; COLOR_0 FLOAT VEC3 5126) + art bible (irregular, asymmetric, pitted; no symmetry, no smoothness) + I307 baseline (current crater-patch + raised-rim + convex-bump relief = the relief this pass deepens) + user GPU-cheap constraint (static displacement only, no per-frame deformation).

KEEP (invariant across the re-bake):
- Radii EXACT 2.2/1.3/0.7 (re-normalized after bake; rockab verify) + comet tail maxR ~1.003 structure unchanged.
- Tri counts held: L 488 (cap 500) / M 134 (cap 140) / S 134 (cap 140) / comet 180; all-asset 1800. Displace-only at the SAME vertex count (no subdivision).
- COLOR_0 FLOAT VEC3 (componentType 5126) via export_vertex_color=MATERIAL (NEVER NAME).
- Warm palette R>=G>=B per vertex; ladder L<M<S on p50; band [0.10,1.20]; spread floor 0.50 (test values re-pinned in ST-339 with documented deltas; bands NEVER widened).
- No new shaders / draw calls / programs; material code untouched (asteroidRenderer.js 0x8a7f72 flatShading vertexColors + I257 warm rim onBeforeCompile).
- In-place GLB swap, same URLs (assetLoader.js keys rockL/rockM/rockS/rockComet), zero src.

ADD (the deepening; all static displacement along existing vertex normals):
- L (r 2.2): craters 6 (5-7) bowl radius 0.30-0.50, bowl depth 0.22-0.34 (40-60% deeper than I307 bowls); raised rim ring around EVERY crater, rim height 0.5-0.7 x bowl depth, ring half-width 0.35-0.55 x bowl radius; convex bumps 4 (3-5) radius 0.25-0.45 amplitude 0.14-0.24.
- M (r 1.3): craters 4-5 radius 0.17-0.28 depth 0.11-0.17; rims same ratios (0.5-0.7 x depth, 0.35-0.55 x radius); bumps 3-4 radius 0.15-0.26 amplitude 0.08-0.13.
- S (r 0.7): craters 3-4 radius 0.09-0.15 depth 0.06-0.10; rims same ratios; bumps 3-4 radius 0.08-0.14 amplitude 0.05-0.09.
- Sharper per-vertex value contrast: bowl bottoms = local value floor (0.10-0.18), rim crests + bump tops = local value ceiling (1.10-1.18), mid-slopes in between; displacement AND COLOR_0 re-baked together so the value map tracks the new relief.
- Per-size value ladder targets (per-tri mean facet luma, after bake): L p50 0.42-0.50 + spread p90-p10 >= 0.60; M p50 0.58-0.66 + spread >= 0.55; S p50 0.70-0.78 + spread >= 0.55; ladder strict L<M<S; all values in [0.10,1.20].
- Comet (asteroid_comet.glb, 180 tris, same vertex count): lumpy nucleus (bumps 4-6 radius 0.06-0.12 amplitude 0.05-0.10 + shallow craters 2-3 depth 0.04-0.08) + brighter ion-tail COLOR_0 gradient (tail base ~0.7 -> tip 0.95-1.15, warm); nucleus p50 0.55-0.68.

AVOID:
- Subdivision / new verts or tris over caps; byte bloat over family cap 64768 B (44768 before).
- Smoothness or symmetry: crater/bump placement jittered + asymmetric (art bible); no mirrored layouts, no perfect rings.
- Value band violations (no facet value < 0.10 or > 1.20); ladder violation (L must stay darkest); spread under floor.
- Animated/per-frame surface deformation, normal maps, new draw calls.
- Radius drift (re-normalize EXACT after bake); URL or loader changes; scene material/lighting changes.

Budget (re-stated): family GLBs 44768 B -> <= 64768 B; dist headroom 182132 B >= 102400 B floor (zero src, dist unchanged); vendor sha 76DEA8151BC9352A unchanged.

Acceptance (ST-336): this direction section present in scope-check-E41.md (DONE); 6 docs committed; p1 demo pin EXACT + rockab EXACT 2.2/1.3/0.7 causal (cite - zero src this iteration).
