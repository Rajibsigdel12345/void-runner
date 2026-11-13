# Scope Check E35 - ART/Blender Asset Arc (Enemy + Boss + Orbs)

- Iteration: I336 (arc open)
- Skills: cgs-scope-check + cgs-create-stories (docs-only)
- Inputs: AGENTS.md, production/session-state/active.md, production/scope-check-E34.md (deferrals + I332/I334 audit findings), assets/ inventory I336 (19 files; bytes + tris parsed from the GLB JSON chunks), .evidence/I335 pins (dist 123/1894504, vendor sha, invariants), src/render/assetLoader.js (GLTFLoader + procedural fallback), Blender 5.2.3 + skills blender-core / blender-modeling / blender-hardsurface-modeling / blender-export / blender-asset-qa

## Summary

E34 (ART/Blender Asset Arc, Asteroid-First) closed at I335 with 4/4, G34.0 PASS R1..R5, 905/905, dist 123/1894504 B, vendor sha unchanged. E35 continues the same user standing directive (Blender asset creation + art improvement) onto the combat side of the screen: the enemy-class + boss + powerup-orb art passes that E34 deferred by name (E34 deferral list: "enemy-class art pass (drone/flyer/stinger/warden) - E35 candidate; Boss art pass - E35 candidate; Powerup orb pass - E35 candidate"). The I332 ST-306 audit already measured the two known enemy deltas (stinger x-section +41%, flyer X-Y-thin-Z orientation; drone geometry EXACT), and the 7 orbs are one near-spherical silhouette family (7-48 tris each) distinguished mainly by hue - hues that are FROZEN pins (puab 11/11 in-band; gold 0xffc300). This arc fills exactly that: ST-310 audit-first baseline (per-asset byte/tri/silhouette/orientation/hue vs the puab pin, pre-registered rules R310a-g), ST-311 enemy-class GLB remake in Blender (fix the flagged deltas; class-distinct silhouettes per the Kaan Alpar speed+sprite+HP readability lesson; drone/warden no-change unless the audit flags them), ST-312 boss + orb art pass (CUTTABLE to no-change), ST-313 regression + G35.0 gate + closeout. Zero src/core changes by gate rule (R3): all collision is radius-based in core (rocks 2.2/1.3/0.7; enemy radii in config.js), the GLBs are visual only, so the p1 demo pin is structurally safe - G35.0-R4 still requires EXACT.

## Scope Fit

- FITS. The work: up to 4 enemy-class GLB re-bakes (drone, stinger, flyer, warden - same filenames) + 1 boss GLB re-bake + up to 7 powerup orb re-bakes (same filenames), all in Blender 5.2.3 on the I333/I334 pipeline (SubD + Displace for organic surfaces, hard-surface primitives for combat silhouettes, decimate to budget, 15-30 deg auto smooth, vertex-color / flat material - NO baked textures). Zero src/core, zero tests, zero new vendor deps.
- Byte budgets (pre-registered, G35.0-R2): enemy total <= 55 KB (current 39408 B = drone 7252 + stinger 6068 + flyer 6332 + warden 19756; warden alone <= 26 KB); boss <= 12 KB (current 6600 B); orb total <= 40 KB (current 27784 B = rapid 3152 + spread 2772 + shield 5332 + bomb 4952 + magnet 4064 + overdrive 4484 + slowmo 3028).
- Poly targets (pre-registered, G35.0-R2): drone 52 tris (no-change unless flagged), stinger <= 60 (current 40), flyer <= 70 (current 52), warden <= 250 (current 180), boss <= 250 (current 106), orbs <= 80 each (current 7-48, total 201).
- dist headroom at open: 202648 B (~198 KB; 123 files / 1894504 B of 2097152 B). Worst case at caps: (55000+12000+40000) - 73792 = +33208 B -> ~169440 B (~165 KB) headroom at closeout, well above the G35.0-R5 floor of 100 KB.
- GPU/compute check (the user hint condition, carried from E34): re-bakes are static geometry - no new shader nodes, no per-frame cost, no new draw-call path (same-filename swap through the existing assetLoader; pool sizes unchanged).
- Determinism: no sim change -> the p1 demo pin is structurally safe; all bake randomness seed-pinned in the Blender scripts (I316/I333 pattern).

## YouTube Grounding (FRESH I336 sweep - standing order: no burned-id reuse)

Coverage: 1 round x 8 queries (EN) -> 43 raw -> 43 unique; 3 deep reads (transcript); 0 rate-limit skips; 0 reuse of the 41 burned ids. HONEST COVERAGE NOTE (E33/E34 precedent): the design-theory queries in this sweep returned mostly noise; the 3 high-signal deep-reads below plus the already-shipped I332/I334 audit measurements (stinger +41% x-section, flyer X-Y-thin-Z orientation, drone geometry EXACT) carry the grounding.

| id | video (channel, views, length) | lesson used |
|---|---|---|
| QoNukqpolS8 | Space Shooter in Godot 4 (Kaan Alpar, 1:36:00) | enemy SCENE [26:31], "New Enemy Type & Enemy Spawning" [36:04]: enemy variety carried by inherited scene + different speed + different sprite + HP (diver 1 HP vs regular 2 HP) -> our enemy-class variety is carried by SHAPE (the sprite), since speed and HP already differ per class in core; the shape must read the class at a glance |
| iwWoXMWzC_c | Texture Painting (Jamie Dunbar, 5:31) | "do away with UV seams" for simple colors; 1024x1024 is big enough for game models -> VALIDATES the vertex-color / no-baked-texture approach already used for the I333 rocks; keep it for E35 |
| ke5KpqcoiIU | 3D Games in Godot (Brackeys, 49:42) | "3D Assets in 1 min" [17:44]: low-poly models commonly share a few colors / one texture; [30:22] keep meshes lean (scene bloat = load time); [32:57] custom colliders kept separately from the visual mesh (suffix convention) -> keep collision decoupled from the visual mesh: the core radii stay frozen, the GLBs never carry colliders |

The 3 deep-read ids (QoNukqpolS8 iwWoXMWzC_c ke5KpqcoiIU) are now BURNED for future epics.

## Current State (evidence: I336 assets/ inventory + I332/I334 audit findings)

What exists today (bytes/tris parsed from the GLB JSON chunks this iter): enemy-class GLBs drone 7252 B / 52 tris (I332: geometry EXACT), stinger 6068 B / 40 tris (I332: x-section +41% vs the intended dart), flyer 6332 B / 52 tris (I332: X-Y-thin-Z long orientation), warden 19756 B / 180 tris (sub-boss "smaller Monolith", unflagged); boss 6600 B / 106 tris (the Monolith, wave-5+ spectacle on the light side at 106 tris); 7 powerup orbs 27784 B / 201 tris total (rapid 16 / spread 13 / shield 48 / bomb 36 / magnet 36 / overdrive 32 / slowmo 20 tris) - one near-spherical silhouette family, distinguished mainly by hue. What does NOT exist: class-distinct silhouettes for stinger/flyer, boss presence to match its spectacle role, shape-level identity for the orbs (shape currently carries no information - hue does all the work). That is the gap E35 fills.

## Stories

- ST-310 (I337) E35 art audit + baseline - cgs-asset-audit + cgs-balance-check, audit-first, 0 KB: headless probe (rockab-style, deterministic overhead cam, fx-off) extended to the enemy GLBs (drone/stinger/flyer/warden) + boss GLB + 7 powerup orbs: per-asset byte/tri + silhouette stats (box-p50, over1836, luma dist, axis aspect ratio), per-class silhouette distinctness (no triple collapse, Hamming distance, I332 method), orientation checks (stinger x-section delta, flyer thin-axis vs flight-axis), orb shape-family check (how many distinct silhouettes do the 7 orbs actually have?) + orb hue bands vs the puab pin (must stay in-band); pre-registered rules R310a-g: (a) byte + tri budgets tabled with verdicts, (b) class silhouettes no triple collapse, (c) stinger x-section + flyer orientation measured with pass/fail criteria, (d) orb hue bands in-band (puab-compatible) + orb shape distinctness scored, (e) boss presence baseline (tri count vs spectacle role), (f) dist headroom >= 100 KB after the worst-case swap, (g) perception no new overlaps after the swap (re-run in ST-313). Output: ST-311/312 tuning list or a no-change audit pass (I315 precedent).
- ST-311 (I338+) enemy-class GLB remake in Blender - cgs-dev-story + blender-core / blender-modeling / blender-hardsurface-modeling / blender-export / blender-asset-qa; ASSETS-ONLY, zero src/core: re-bake the flagged enemy GLBs (expected: stinger x-section fix, flyer orientation fix; drone + warden no-change UNLESS ST-310 flags them) - same filenames, class-distinct silhouettes readable at a glance (Kaan: shape carries the class; speed/HP already differ in core), distinct from rocks/ship/boss/each other; vertex-color or flat material, NO baked textures; within the byte/tri budgets; GLB export gates (clean import via assetLoader all-ready, console 0/0, NaN 0); same-filename swap into assets/; A/B render probe + rockab-style re-pin with causal proof (I317 worktree pattern: git attribution of the assets/ delta); per-class scale/anchor preserved (core radii untouched).
- ST-312 (I339+) boss GLB art pass + powerup orb pass - cgs-dev-story; CUTTABLE to no-change if ST-310 finds them clean: boss (Monolith) presence re-bake (<= 250 tris, <= 12 KB, same filename, anchor/scale preserved for the core radius) + 7 orb re-bakes with per-type distinct low-poly silhouettes that match the pickup meaning (<= 80 tris each, orb total <= 40 KB, base colors EXACT to the current GLB hexes so the puab hue pins stay in-band; re-pin with causal proof only if a drift is measured).
- ST-313 (I340) E35 regression + G35.0 gate + closeout - cgs-regression-suite + cgs-gate-check + cgs-milestone-review: full 13-probe battery (p1 demo pin EXACT expected - enemies/orbs/boss are visual only, collision radius-based in core; causal proof required if it shifts / p2 / p3 / p4 / p5 / p6 / p7a / p7b / p8 + rockab + puab (re-pinned with causal proof if an orb hue drifts) + floorab + perception re-run), all frozen invariants (905 tests, FLOOR-50 B 230/61/169/0/0, MENU 21/366 @60/60, radii 2.2/1.3/0.7, puab 11/11, floor rings 48.47/48.47/39.90/29.41 + rim 55.47), dist canary (re-pinned with causal proof; headroom >= 100 KB), vendor sha unchanged; gate G35.0 R1..R5 per production/scope-check-E35.md; milestone review R-E35-1..5.

## Cut Option

1. ST-312 as a whole (CUTTABLE): boss + orb re-bakes cut to no-change if the ST-310 audit finds the boss presence acceptable and/or the orb hue-only distinction acceptable (I315 precedent).
2. Warden re-bake in ST-311 (CUTTABLE): no-change unless ST-310 flags the warden silhouette/orientation.
3. Drone re-bake in ST-311: pre-registered no-change (I332: geometry EXACT) unless ST-310 re-measures a delta.

## Deferral

- Comet variant (S rock + pooled-trail additive tail - CUT from ST-307 for needing a new draw-call path; still deferred, needs an explicit draw-call budget decision)
- E31 HUD minors (menu footer 7 px cross area 2380; BEST x WPN 320 px^2)
- Touch-fallback arc (platform; grounding captured: GDevelop ypu-huHz2P0, griffpatch 9TK8x2nSMPI / cI1mdVVvCWY)
- i18n (plan-only); PWA

## Recommendation

APPROVE as scoped: 4 stories, audit-first, enemy-first, zero-core. The arc is the direct continuation of the user standing directive (Blender assets + art improvement) onto the combat side - the enemies the player fights and the pickups the player chases - after E34 finished the background/rock side. No sim number moves without an ST-310 measurement behind it; the p1 demo pin is structurally safe (visual-only assets, radius-based collision in core) but G35.0-R4 still requires EXACT. Deliberately NOT in scope: shield.glb + arena_ring.glb (unflagged, not on the E34 deferral list), touch/i18n/PWA.

## Risks

- R-E35-1 (med): GLB export bloat breaches the byte budget -> decimate + no textures + minimal glTF exporter settings, re-measure per export (budgets tabled in G35.0-R2).
- R-E35-2 (med): orb re-bake drifts a puab hue pin -> keep base colors EXACT to the current GLB hexes, in-band gate before swap; re-pin with causal proof only if a drift is measured (I333 precedent).
- R-E35-3 (low): re-bake changes the perceived hitbox (visual-only, but player trust) -> per-class scale/anchor preserved vs the current GLB bbox, documented at ST-310; core radii untouched.
- R-E35-4 (low): scope creep (drone/warden/shield/arena_ring "could also be improved") -> ST-312 CUTTABLE by designation; drone pre-registered no-change; shield + arena_ring explicitly out of scope.
- R-E35-5 (low): Blender exporter quirks (axis/normals/smooth-split) -> blender-export skill + import probe before swap (I333 pattern: 30-deg auto-smooth vertex split + position-dedup gate).

## Gate G35.0 (pre-registered)

- R1: audit shipped (ST-310 baseline JSON in .evidence/I337 + R310a-g all verdicted).
- R2: GLB swaps + gates passed: byte budgets (enemy total <= 55 KB, warden <= 26 KB, boss <= 12 KB, orb total <= 40 KB), poly budgets (stinger <= 60, flyer <= 70, warden <= 250, boss <= 250, orbs <= 80 each), clean GLB import (assetLoader all-ready, console 0/0, NaN 0), class silhouette distinctness (no triple collapse; measured deltas improved vs the ST-310 baseline - stinger x-section, flyer orientation), orb hue bands in-band (puab-compatible).
- R3: changes confined to assets/*.glb (+ assetLoader.js only if keys change) + optional src/render/*.js + config.js levers; ZERO src/core changes (pure art arc; escalate + re-scope if core is needed).
- R4: full battery - p1 EXACT (causal proof required if it shifts), rockab re-pin documented if it shifts, perception no new overlaps, all invariants EXACT/in-band (incl. puab 11/11), vendor sha unchanged.
- R5: npm test green + npm run build exit 0 + dist headroom >= 100 KB (canary re-pin with causal proof - assets/ copies into dist).

## Verification Evidence (I336 itself)

- docs-only: 0 KB delta (dist canary must stay 123 files / 1894504 B; vendor three.module.js sha 76dea8151bc9352aef3528b4262e249b2604f62543828328db978d060d61a495 unchanged)
- npm test 905/905 (suite unchanged), npm run build exit 0
- sweep coverage line per the table above; assets/ bytes + tris parsed this iter (node GLB JSON-chunk reader, companion scripts in .evidence/I336/)

## Next owner / decision

ST-310 at I337 (cgs-asset-audit + cgs-balance-check, audit-first). No user decision required - deferrals are recorded, not blocking.

## Gate G35.0 verdict (I340)

- R1 PASS: ST-310 audit shipped at I337 (.evidence/I337/audit337.mjs + baseline JSON; R310a-g all verdicted).
- R2 PASS: deployed GLBs re-measured at I340 (glbmeasure340.cjs): enemies 39944 B total (drone 7252/52t + stinger 6260/40t + flyer 6676/62t + warden 19756/180t) <= 55 KB [56320 B]; warden 19756 B <= 26 KB; boss 7016 B / 144 tris / 3 meshes <= 12 KB / 250; orbs 37912 B / 262 tris (rapid 6628/48t, spread 6628/48t, shield 3396/20t, bomb 6620/48t, magnet 5256/36t, overdrive 5496/38t, slowmo 3888/24t) <= 40 KB / 80 tris each; class silhouettes distinct (no triple collapse, min Hamming 12 at the I338 A/B; I340 perception probe no new overlaps); orb hues in-band (puab 11/11, max 3.0 deg vs the I322 baseline).
- R3 PASS: git diff ff4863b..HEAD (I335 close -> HEAD) = assets/*.glb (10 files) + 6 docs; ZERO src/ changes (collision radii untouched).
- R4 PASS: 13-probe battery EXACT/in-band (p1 structural EXACT, wall_s wall-clock only; p3-p8 + rockab + perception EXACT; p4 counters adjudicated non-blocking with same-build variance proof + git zero-src; puab 11/11 in-band; floorab EXACT canonical); vendor three.module.js sha 76DEA8151BC9352A... unchanged.
- R5 PASS: npm test 905/905 (re-run I340) + npm run build exit 0 + dist 123 files / 1905584 B -> headroom 191568 B (~187 KB) >= 100 KB floor.
- G35.0: PASS R1..R5. R-E35-1..5 CLOSED (epics.md). E35 CLOSED 4/4 at I340.
