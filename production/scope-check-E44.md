# Scope Check - E44 Player-Side & Feedback Coherence Pass

- Date: 2026-11-15
- Skill: cgs-scope-check (+ cgs-create-stories for the story split)
- Status: OPENED at I386 (docs-only 0 KB, zero src)

## Summary
After E43 closed the ENEMY-side readability gaps against the current (post-E42) frame, the natural next surface is the OWN side of the frame: player ship, player bullets, shield, reticle, engine trail, power-ups, and hit/kill feedback. These elements were tuned against the PRE-E34 frame (same audit logic that justified E43 for the fleet); E34-E42 re-armed skybox v6 (sky 70.14), floor v2 (floor 32.2/72.07, FLOOR-50), rocks v8 (ember band 112.43/54.26, rim 52.76) and field lighting, so own-side values must be re-audited against the current frame. This is the last dominant un-audited surface in the PLAYING frame.

## Scope Fit
- Elements (all existing modules, zero new systems): shipMesh.js (ship.glb 14.1 KB), bulletPool.js (player bullets) vs enemyBulletMesh.js (enemy bullets - own/enemy disambiguation), shieldRing.js (shield.glb), reticle.js, engine trail, particles.js + shockwave.js (hit/kill feedback), powerupMesh.js (7 power-up GLBs).
- Same proven method as E43: headless per-element luma probe (body p50/p90 + accent p90 + bg annulus p50/p90, both backdrops, fx=high/off) + in-page-cropped closeups + corrected A/B + gate. Low cost, fully verifiable, zero sim src.
- Bounded: 5 stories, 5/6 iterations, config + render-only (Blender re-bake ONLY if ST-351 proves a bake-level gap, delta cap ~15 KB total with assetGlbs test re-pin).

## Cut Option
ST-351 is cuttable to docs-only: if the per-element audit finds NO material gap (all separations within budget, own/enemy unambiguous, feedback outside the ember band), E44 closes at ST-351/ST-352 with evidence (E43 pattern: 2 cut gates).

## Deferral
E39-E42 deferrals untouched, incl. scripts/serve.mjs .webmanifest MIME (PWA probes keep using the .evidence/I348 canonical server). E43 enemy-fleet results untouched (G43.0 closed I385). Power-up GAMEPLAY balance (values, drop rates) is OUT of scope - E44 is render/readability only, zero sim src.

## Grounding
- Carried from E43 (grounded I380, burned ids KotQ48nrteg _4xEilK2eNA Gwrpw1YtuGo RJ5goMBD6oc): P1 one body value + one identity accent per element, both outside the environment bands (sky 70.14 / floor 32.2 / ember 112.43 / rim 52.76) / P2 telegraph + feedback luma separates from body AND background / P3 warm family must not collide with the rock ember band 54.26-112.43.
- NEW P4 (own/enemy unambiguity): the player's ship, bullets and power-ups must not be readable as any enemy class at engagement distance - especially PLAYER vs ENEMY BULLETS (distinguishable by hue AND shape, closeup MD5 must differ) - since a bullet-identity mistake is a survivability issue, not just aesthetics.
- Bounded grounding at ST-352 only IF the audit finds gaps: max 1 YouTube search, 2-3 queries on own-vs-enemy color coding / player readability in arcade space shooters; max 3 new burned ids; the audit data IS the budget grounding (measured current frame, not invented targets). Anti-over-engineer: no research pass if NO-GAP.

## Constraints (FROZEN)
- FEEL frozen (no timing/speed/size changes; value + emissive + color only, same phase/period wherever a pulse exists).
- Zero sim src (src/core untouched except config.js knobs); p1 demo pin by causality; rockab radii [2.2,1.3,0.7].
- No new draw calls (21/366 overhead fx-off + 50/1222 PLAYING fx-high pins).
- FLOOR-50 frozen (floor dark by design); skybox v6 frozen; rocks static displacement only; floor v2 pins (FLOOR-50 battery 230/72/158/0/0) untouched.
- Vendor sha 76DEA8151BC9352A (no vendor bump); asset delta 0 B unless ST-351 proves a GLB bake gap (then cap ~15 KB total, assetGlbs.test.js re-pin with documented deltas).
- Enemy fleet (E43) results untouched - own-side changes must not shift the enemy hierarchy (drone 200.98 / stinger charge 254 / flyer 197.74 / warden 147.01 / mine 127.0 / boss 182.49 pins re-verified in the gate probe).

## Plan (stories in production/stories.md, epic in production/epics.md)
- ST-351 (I387) audit + BEFORE baseline (cgs-asset-audit; CUTTABLE to docs-only; 0 KB): headless per-element probe (.evidence/I387/; dev server 5173, killed + port free after): deterministic seed; ship at 15u sky + low-altitude floor backdrops (body p50/p90 + accent); player bullet vs enemy bullet side-by-side (hue + shape, closeup MD5 must differ); shield; reticle; engine trail; hit/kill flash (shockwave + particles luma vs ember band); power-ups per type (closeups); fx=high + fx=off; closeup screenshots VIEWED; .evidence/I387/ownside_audit_i387.json + PNGs. Verdict: per-element gap list OR NO-GAP (close E44 docs-only). Zero src.
- ST-352 (I388) grounded own-side direction (cgs-dev-story; DOCS-ONLY; 2nd cut gate): per-element KEEP/ADD/AVOID with explicit AFTER luma budgets (body p50 windows, accent/feedback separation floors, own/enemy bullet disambiguation floor) grounded in P1-P4 + current frame pins; if a bake-level gap is proven (Node-side GLTFLoader.parseAsync measurement, E43 pattern), scope the Blender re-bake here; if NO-GAP: close E44 here docs-only with evidence. Zero src.
- ST-353 (I389) implementation (cgs-dev-story; config + render-only, zero sim src; blender-core + blender-asset-qa only if ST-352 scoped a re-bake): apply the ST-352 direction to own-side knobs (ship/bullet/shield/reticle/trail/power-up/feedback emissive + color + scale knobs); re-pin any palette test with documented deltas; zero new draw calls; 929+ tests.
- ST-354 (I390) A/B + art QA (cgs-dev-story; zero sim src): full own-side A/B CORRECTED method (standalone element closeups + real PLAYING screenshots + authoritative pins, identical conditions before/after); re-pin with documented deltas vs ST-351 BEFORE; FLOOR-50 + floorab pins UNCHANGED; enemy hierarchy pins UNCHANGED (E43); no new draw calls (21/366 + 50/1222); no NaN; console 0; screenshots VIEWED; p1/rockab EXACT causal (zero sim src).
- ST-355 (I391) E44 regression + G44.0 gate + closeout (cgs-regression-suite + cgs-gate-check + cgs-milestone-review): R1 p1 EXACT causal / R2 rockab EXACT 2.2/1.3/0.7 fresh / R3 own-side readability probe fresh (separation deltas within budget, own/enemy bullets disambiguated, FLOOR-50/floorab unchanged, enemy hierarchy unchanged, no new draw calls, no NaN, console 0) / R4 PWA 11/11 fresh (I348 server on 5199, killed + 5199 free) / R5 929+ tests + build 0 + headroom >= 102400 B + vendor sha 76DEA8151BC9352A + ports free + 0 chrome + node 13 baseline; close E44 (5/5 or cut per ST-351/ST-352 outcome).

## Budget
- dist at open 131/1918851 B; headroom 178301 B (>= 102400 B); target asset delta 0 B (config-only; +re-bake only if ST-351 proves a bake gap, cap ~15 KB total); 5/6 iterations.

## Risks
- R-E44-1 own-side audit small (ship + bullets + feedback + power-ups) - NO-GAP cut likely (acceptable: cuttable by design, docs-only close).
- R-E44-2 p1 by causality (zero sim src).
- R-E44-3 corrected A/B method only (E43 I384 lesson: re-run the I387 probe script VERBATIM post-implementation).
- R-E44-4 host stall (I368 pattern).
- R-E44-5 no new draw calls (21/366 + 50/1222 pins).
- R-E44-6 if a Blender re-bake is scoped: asset delta + assetGlbs.test.js re-pin scope + vendor sha unchanged (GLB-only delta).

## Recommendation
Proceed: ST-351 audit next (I387). Low cost, high coherence value (the last un-audited dominant surface), fully verifiable, zero sim src, cuttable at either gate.

- production/scope-check-E44.md = source of truth.