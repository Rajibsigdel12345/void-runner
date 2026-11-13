# Scope Check E34 - ART/Blender Asset Arc (Asteroid-First)

- Iteration: I331 (arc open)
- Skills: cgs-scope-check + cgs-create-stories (docs-only)
- Inputs: AGENTS.md, production/session-state/active.md, production/scope-check-E33.md (deferrals + E34 candidate + I327 grounding), assets/ inventory I331 (19 files), .evidence/I330 pins (dist 122/1888318, vendor sha, invariants), src/render/assetLoader.js (GLTFLoader + procedural fallback), Blender 5.2.3 + skills blender-core / blender-modeling / blender-hardsurface-modeling / blender-export / blender-asset-qa

## Summary

E33 (Adaptive Director Arc) closed at I330 with 3/3, G33.0 PASS R1..R5, 905/905, dist 122/1888318 B, vendor sha unchanged. E34 executes the user standing directive (Blender asset creation + art improvement) carried as the E34 candidate in the epic task lists since the E28 close (grounding captured at I327), asteroid-first. The user hint: the rocks should read as asteroids/comets with bumps and craters, and only if not GPU/compute heavy. This arc satisfies both: craters + bumps are baked into the GLB at build time (static displacement - zero runtime cost beyond triangle count; the I307 crater bake already proved the pattern in Blender 5.2.3), and the optional comet variant reuses the existing pooled trail system (cap 64, I309 verified - no new draw-call path). Shape: ST-306 audit-first baseline (per-rock surface detail, byte + poly budgets, silhouette distinctness, 7-layer polish checklist against the actual render code), ST-307 cratered asteroid L/M/S remake (procedural craters per CGMatter negative-scale displacement with rocky rim + rocky surface per DeWeese SubD + Displace; decimate to budget per the Imphenzia stylized pipeline; distinct silhouettes per size class; no baked textures - keep the GLBs small), ST-308 ship art pass + render-layer polish micro-pass (CUTTABLE to no-change), ST-309 regression + G34.0 gate + closeout. Zero src/core changes by gate rule (R3): collision radii are fixed in core (L 2.2 / M 1.3 / S 0.7), the GLBs are visual only, so the p1 demo pin is structurally safe - G34.0-R4 still requires EXACT.

## Scope Fit

- FITS. The work: three new Blender GLB bakes (asteroid_L/M/S, same filenames, asset-swap only) + an optional ship GLB re-bake + optional render-layer polish in src/render/*.js + config.js levers only where the audit finds a gap. Zero src/core, zero tests, zero new vendor deps, no baked textures (vertex-color / flat material only - GLBs stay small).
- Byte budget (pre-registered, G34.0-R2): rock total <= 45 KB (current 31060 B = L 16024 + M 7516 + S 7520), L <= 24 KB. Poly targets (pre-registered, G34.0-R2): L ~1500 / M ~1000 / S ~700 tris (current 488/134/134; the I307 caps 500/140/140 + all-asset 1800 are replaced by the ST-307 re-measure, documented at that time).
- dist headroom at open: 208834 B (~204 KB; 122 files / 1888318 B of 2097152 B). Worst case ~+24 KB total (rocks to the 45 KB cap = +14 KB; ship +10 KB) leaves ~180 KB headroom at closeout, well above the G34.0-R5 floor of 100 KB.
- GPU/compute check (the user hint condition): craters + bumps are baked into geometry at build time (I307 pattern: static displacement, no new shader nodes, no per-frame cost); the comet tail (CUTTABLE) reuses the existing pooled engine-trail particle system (cap 64) - no new renderer path. Condition satisfied.
- Determinism: no sim change -> the p1 demo pin is structurally safe; all randomness in the bakes is seed-pinned in the Blender script (I316 pattern).

## YouTube Grounding (FRESH I331 sweep - standing order: no E31/E32/E33 video ID reuse)

Coverage: 1 round x 8 queries (EN) -> 80 raw -> 78 unique; 32 shown (metadata-reviewed); 4 deep reads (transcript); 0 rate-limit skips. Zero overlap with the 11 E31 ids, the 7 E32 ids, and the 4 E33 ids.

| id | video (channel, views, length) | lesson used |
|---|---|---|
| 9mfSaP2WFfE | The Easiest Way to Make Asteroids in Blender (Rod DeWeese, 12:28) | SubD + Displace (clouds/noise) = procedural rocky surface, non-destructive stack; lattice modifier refines silhouette; material noise -> colorramp -> RGB curves + bump node (strength 0.5, distance 1) [0:55][2:08][2:43][5:00] |
| P7OpmpE8xTc | Create Procedural Craters Fast (CGMatter, 267K, 2:03) | crater = grayscale map (mapping node = location/scale, noise = detail, color ramp = falloff) driving a displacement node with mid level 0 + negative scale = depression with rocky rim [0:46][1:20] |
| 885HMJS0IW8 | Stylized Rocks in 10 Minutes ep.151 (Imphenzia, 7.3K, 41:11) | model high -> decimate 0.01-0.02 -> shade auto smooth at 15 deg = the magic number for a stylized look [12:43][13:18]; sculpt-fix at low poly; manual vertex-color 4-step palette, no baked textures needed [17:26][18:00] |
| NrJDBkhRLDs | Your Game Is Not Ugly, It Is Unfinished (RUN.game, 67, 10:40) | 7 polish layers: L1 art direction (palette discipline + shape language) [1:52]; L2 pipeline (ACES tone mapping, pixel-ratio clamp 2, key/fill lighting kills the plastic look) [2:29]; L3 grounding (blob shadows, atmospheric fog, level curves - rocks darker as they get closer) [5:00]; L4 juice (hitstop, camera kick, 3-act propulsion) [5:36]; L5 rhythmic VFX (5-beat layered explosions, not identical blobs) [7:44]; L6 production UI (tabular numerals, edge anchoring, alive gauges) |

Carried from I327 (in the E33 scope doc, cited not re-shown): Imphenzia pHcLe2T_2wI, BiteMe tierlist cn7n1mF6Ejw, Kridaran wpKR-WIPmts. Alternates reviewed, not used: 4EqLyGsu3AA (Voronoi 1-min rock), 0JeXmYGIsj4 (brush sculpt - too heavy for this pipeline), uUdMb8Bb2II (palette theory), tdmcq2wLetQ (low-poly asteroids 2.8).

## Current State (evidence: I331 assets/ inventory + I307/I316/I327 reads)

What exists today: 19 files in assets/ - 18 GLBs + skybox_equirect.jpg (67255 B). Rock GLBs: asteroid_L 16024 B (488 tris) / asteroid_M 7516 B (134 tris) / asteroid_S 7520 B (134 tris) - the I307 crater bake (crater patch + raised rim + convex bump + edge chip), radii EXACT 2.2/1.3/0.7, GLB visual only (core collision is radius-based). ship 14472 B, boss 6600 B. Renderer: assetLoader.js (GLTFLoader + procedural fallback), rockRenders with rim light. What does NOT exist: a crater-rich, silhouette-distinct rock set (current L reads as a bumpy blob; S reads angular but the silhouette family is similar), no comet variant, no audited 7-layer polish baseline. That is the gap E34 fills.

## Stories

- ST-306 (I332) E34 art audit + baseline - cgs-asset-audit + cgs-balance-check, audit-first, 0 KB: headless probe extends rockab with a surface-detail/crater metric (per-rock, deterministic overhead cam, fx-off) + per-rock poly/byte + silhouette stats (box-p50 ladder, over1836, luma dist), ship + enemy-class silhouette distinctness, 7-layer polish checklist against the actual render code (ACES? fog? tone mapping? pixel ratio? key/fill?); pre-registered rules R306a-f: (a) rock surface-detail baseline captured, (b) byte + poly budgets tabled (rock total <= 45 KB, L <= 24 KB, target tris L~1500/M~1000/S~700), (c) ship vs enemy silhouettes no triple collapse, (d) polish-layer gaps enumerated with code evidence, (e) dist headroom >= 100 KB after the swap, (f) perception no new overlaps after the swap (re-run in ST-309). Output: ST-307/308 tuning list or a no-change audit pass.
- ST-307 (I333+) cratered asteroid L/M/S remake in Blender - cgs-dev-story + blender-core / blender-modeling / blender-hardsurface-modeling / blender-export / blender-asset-qa: procedural craters + bumps (DeWeese SubD + Displace rocky surface + CGMatter negative-scale crater maps with rocky rim), decimate to budget, 15-deg auto smooth, distinct silhouettes per size (L broad big craters / M mid / S angular); vertex-color 4-step palette or flat material (NO baked textures - keep the GLBs small); optional comet variant (S rock + additive tail reusing the pooled trail system) CUTTABLE; GLB export gates (clean import, console 0/0, no NaN); swap into assets/ (same filenames); A/B render probe; rockab re-pin with causal proof (I317 worktree pattern: git attribution of the assets/ delta).
- ST-308 ship art pass + render-layer polish micro-pass - cgs-dev-story, CUTTABLE to no-change if the audit says ship fine: ship GLB rework (silhouette + engine detail, <= 2x current tris, same filename) + whichever polish-layer gaps ST-306 found (likely: ACES check, atmospheric fog on rocks, key/fill balance) - render layer only (src/render/*.js + config.js levers), no core changes.
- ST-309 E34 regression + G34.0 gate + closeout - cgs-regression-suite + cgs-gate-check + cgs-milestone-review: full 14-probe battery (rockab re-pinned with causal proof, perception re-run, p1 pin EXACT expected - rocks are visual only, collision radius-based 2.2/1.3/0.7 in core), dist canary re-pin (assets/ copies into dist), vendor sha unchanged.

## Cut Option

1. Comet variant in ST-307 (CUTTABLE): S rock + additive tail reusing the pooled trail system; cut if the trail system cannot host a per-rock tail without a new draw-call path, or if the byte/poly budget is breached.
2. ST-308 -> no-change audit pass if ST-306 finds the ship silhouette + polish layers already pass (I315 precedent).
3. The ship GLB re-bake in ST-308 is optional even when a render-layer polish gap is found (the polish layer is in-code; the GLB re-bake is a separate judgment).

## Deferral

- Enemy-class art pass (drone/flyer/stinger/warden) - E35 candidate
- Boss art pass - E35 candidate
- Powerup orb pass - E35 candidate
- Touch-fallback arc (platform; grounding captured: GDevelop ypu-huHz2P0, griffpatch 9TK8x2nSMPI / cI1mdVVvCWY)
- i18n (plan-only); PWA
- E31 HUD minors (menu footer 7px cross; BEST/WPN 320 px^2)

## Recommendation

APPROVE as scoped: 4 stories, audit-first, asteroid-first, zero-core. The arc directly satisfies the user standing directive (Blender assets + art improvement) and the user hint (asteroid/comet shapes with bumps + craters, only if not GPU/compute heavy - satisfied by build-time baked displacement). No sim number moves without an ST-306 measurement behind it; the p1 demo pin is structurally safe (visual-only assets) but G34.0-R4 still requires EXACT.

## Risks

- R-E34-1 (med): GLB export bloat breaches the byte budget -> decimate + no textures + minimal glTF exporter settings, re-measure per export (budgets tabled in G34.0-R2).
- R-E34-2 (med): rockab pin shift -> pre-registered worktree A/B re-pin protocol (I317 pattern) with git attribution of the assets/ delta.
- R-E34-3 (low): comet over-scopes -> CUTTABLE by designation.
- R-E34-4 (low): perception flags new overlaps (ship change) -> fix in ST-308 or documented minor.
- R-E34-5 (low): Blender 5.2 GLB exporter quirks (axis/normals) -> blender-export skill + import probe before swap.

## Gate G34.0 (pre-registered)

- R1: audit shipped (ST-306 baseline JSON in .evidence/I332 + R306a-f all verdicted).
- R2: asteroid GLBs swapped + gates passed: byte budget (rock total <= 45 KB, L <= 24 KB), poly budget (targets L~1500/M~1000/S~700, caps re-measured + documented), clean GLB import (assetLoader all-ready, console 0/0, NaN 0), silhouette distinctness (ladder preserved with documented re-pin), crater metric improved vs the ST-306 baseline.
- R3: changes confined to assets/*.glb (+ assetLoader.js only if keys change) + optional src/render/*.js + config.js levers; ZERO src/core changes (pure art arc; escalate + re-scope if core is needed).
- R4: full battery - p1 EXACT (causal proof required if it shifts), rockab re-pin documented, perception no new overlaps, all invariants EXACT/in-band, vendor sha unchanged.
- R5: npm test green + npm run build exit 0 + dist headroom >= 100 KB (canary re-pin with causal proof - assets/ copies into dist).

## Verification Evidence (I331 itself)

- docs-only: 0 KB delta (dist canary must stay 122 files / 1888318 B; vendor three.module.js sha 76dea8151bc9352aef3528b4262e249b2604f62543828328db978d060d61a495 unchanged)
- npm test 905/905 (suite unchanged), npm run build exit 0
- sweep coverage line per the table above

## Next owner / decision

ST-306 at I332 (cgs-asset-audit + cgs-balance-check, audit-first). No user decision required - deferrals are recorded, not blocking.
