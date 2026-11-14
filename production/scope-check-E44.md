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

## ST-351 audit (I387) - BEFORE baseline
Method: .evidence/I387/ownside_probe.mjs (seed 71382), 2 pages (H = fx-high bloom-verified / O = fx-off), state MENU, 16 states x 2 backdrops (sky 0,2,2 / floor 0,7.5,-2), env kept, all live pools hidden via hideAllQuick(), real sync() per element, in-page toDataURL closeups + MD5; 30 closeups captured + VIEWED (15 states x 2 backdrops). JSON: .evidence/I387/ownside_audit_i387.json. Console 0/0 both pages, no NaN, server 5173 killed + port free.
Probe bug found + fixed: hideAllQuick() initially missed shieldRing.ring -> the shield state leaked the ring into reticle/shockwave/powerup/trail states (first run DISCARDED: shockwave sky read 172.94 ~ ring, reticle 50.03); patch added a per-state ring hide; values below are the clean re-run. Lesson: every state-showing element needs a per-state hide.
BEFORE (fx=high; sky then floor; calls = H sky, delta vs env 24):
- env_baseline: 24 calls (fx-off 10)
- ship_idle: body p50 10.63 sky (sepB -17.78 vs bg p50 28.41) / 10.63 floor (sepB 0.00); cockpit accent 58.37 sky (sepA -18.19) / 59.59 floor; 30 calls (+6); fx-off body 16.56, sepB -15.64
- ship_thrust: flame accent 67.79 sky / 97.28 floor; 35 calls (+5)
- player_bullet: head acc90 219.99 both (sepA +190.87 sky / +209.36 floor); 27 calls (+3)
- enemy_bullet: acc90 152.18 both (sepA +77.26 sky / +135.77 floor); 25 calls (+1)
- shield: acc90 78.86 sky (sepA -2.98 vs bg90 81.84) / 16.41 floor (box artifact); 25 calls (+1)
- reticle: acc90 40.11 sky (sepA -32.67) / 16.41 floor (box artifact); 25 calls (+1)
- shockwave: acc90 50.03 sky (sepA -27.74) / 155.06 floor (+126.65) - flat ring collapses to a faint sliver from the low in-game camera; 26 calls (+2)
- powerups acc90 sky/floor: rapid 140.97/149.83, spread 91.85/85.22, shield 200.53/177.07, bomb 89.22/82.22, magnet 161.6/155.75, overdrive 83.35/94.22 (weakest), slowmo 148.54/174.72; 26 calls each (+2); fx-off sky weakest sepA ~ -3.4 (badge carries ID)
- engine_trail: acc90 89.69 sky (inside ember band 54.26-112.43) / 51.43 floor; 24 calls (+0)

GAPS (E44 NOT cut):
- G1 (ship body value, P1/P2): body p50 10.63 = darkest major solid in the frame (enemy drone body p50 = 46.28 under same lighting); sky body p90 29.12 ~ bg p50; cockpit accent 58.37 is INSIDE the env band (floor 32.2 - sky 70.14), sky sepA -18.19. The ship is the most important own-side silhouette. Candidate fix: material value lift (CONFIG.ship.palette.body 0x9a8468 luma 134.6 - palette is authoritative over GLB COLOR_0 multiply, powerup pattern) -> no re-bake needed, but ST-352 decides.
- G4 (shockwave low-angle visibility, P2): sky acc90 50.03 (sepA -27.74) vs floor 155.06 (+126.65) - the in-game low tracking camera (sky-like) is the representative one; kill feedback is a faint sliver there.

Watch items (documented honestly, NOT gaps):
- shield: closeup visible both backdrops; floor measurement = vScale-0.5 box undersampling the near-circular top-down projection; sky 78.86 vs bg p50 29.12 fine.
- reticle: faint but present both; 0.35 opacity by design.
- engine_trail inside ember band: position + motion disambiguate; warm by design.
- powerups: overdrive weakest (83.35); fx-off spread/bomb/overdrive weak (badge carries ID).

P4 PASS: closeup MD5s differ both backdrops - sky player 40f457c2fa9852d88ade49e242edc309 / enemy e63583e3fb292d82c09fa2936ebb85c7; floor player 296bd8c3faa71d9c13a6e1612b36342d / enemy 81ef8ead65880055231349c0a7e530fb; hue pale-cyan 219.99 + ribbon trail vs hot red-orange 152.18 larger bare orb. Player vs enemy bullets distinguishable by hue AND shape.

Risk R-E44-1 (NO-GAP cut likely) was wrong - gaps found (G1 + G4), which is fine/expected (the surface WAS tuned against a stale pre-E34 frame).

VERDICT: GAPS FOUND (G1 + G4) -> E44 NOT cut -> ST-352 next (I388).

- production/scope-check-E44.md = source of truth.

## ST-352 direction (I388) - grounded own-side direction + AFTER budgets
Method: Node-side GLB COLOR_0 measurement (.evidence/I388/measure_ship.mjs; vendored three + GLTFLoader.parseAsync, no browser) to ground G1 before choosing the lever, per the E43/I382 pattern. Read the loaded geometry color attribute (three maps glTF COLOR_0 -> geometry.color).
G1 root cause (PROVEN material-knob, no re-bake): the ship hull/wing COLOR_0 value bake is neutral-to-BRIGHT, not a darkener - hull min 0.7528 / mean 1.0437 / p50 1.0 / max 1.55 (grayscale); wings min 0.712 / mean 0.9872 / p50 1.0 / max 1.2458. So the rendered body p50 10.63 (I387) is NOT from the bake; it is bodyMat (shipMesh.js:60) with metalness 0.45 + roughness 0.4 + flatShading on a 0x9a8468 (luma 134.6) base: a 45% metallic flat-shaded surface reflects the dark environment instead of catching ambient diffuse -> body p50 10.63 both backdrops, floor sepB 0.00 (the ship disappears on the dark floor). The bake multiplies ON TOP of the palette (the paletteHarmony luma band [120,150] is on the palette, not the bake), so the value fix belongs in the material, not the GLB.
G1 fix (render-only, config-only, 0 B asset delta, 0 test re-pin): primary knob = lower CONFIG.ship.palette.body.metalness 0.45 -> ~0.15 (a matte dielectric catches ambient diffuse; color/wing/cockpit untouched). body.metalness is NOT test-pinned (a free knob). Fallbacks, in order, only if metalness alone misses budget: (a) lift body.color toward the [120,150] luma cap keeping warm R>B (widens the already-passing body-wing>=50 and body-enemyBullet>=20 gaps = test-safe); (b) a faint body emissive. A Blender COLOR_0 re-bake is EXCLUDED unless a bake-level gap is proven (it is not - the bake is the wrong lever here); no asset delta, no assetGlbs re-pin, vendor sha unchanged.
G4 root cause (PROVEN geometry, no color change): the shockwave ring (shockwave.js:17-18) is a flat RingGeometry(0.82,1.0,40) rotated into the arena XZ plane (facing up); from the low in-game tracking camera it presents edge-on as a faint hairline -> acc90 50.03 sky (sepA -27.74) vs 155.06 floor (+126.65). The color (killRing 0xffa44a, luma ~177) is test-pinned amber [150,200] + golden>=killRing+40, so the fix MUST be geometry, not color.
G4 fix (render-only shockwave.js, +0 draw calls, pool unchanged): give the ring vertical extent so it reads from the low camera - replace the flat RingGeometry with TorusGeometry(0.9, 0.10, 8, 40) (default lies in the XY plane = vertical, facing +Z = it presents its full ring face to the low camera that looks +Z at kills ahead of the ship). Keep AdditiveBlending + depthWrite:false + DoubleSide + the same killRing color. Secondary knob only if A/B still short: baseOpacity 0.85 -> 0.95 (no palette change).
AFTER budgets (re-run .evidence/I387/ownside_probe.mjs VERBATIM as the ST-354 AFTER; fx=high, both backdrops):
- G1 ship body: sky body p50 in [34,60] (sepB vs sky bg p50 28.41 = +5.6..+31.6) AND floor body p50 in [22,60] (sepB vs floor bg 10.63 = +11.4..+49.4 - fixes the zero floor separation). Keep body p50 < drone ACCENT 200.98 / boss 182.49 (it will). Watch: the now-brighter warm brass body vs the FROZEN cockpit cyan 0x59d8ff (cool) must keep hue separation in the ST-354 closeup.
- G4 shockwave: sky acc90 >= 110 (sepA vs sky bg p90 77.77 >= +32) AND floor acc90 stays >= 140 (must not regress the already-fine floor read). acc90 < drone 200.98 (it will).
KEEP (documented, no change): player bullet (acc90 219.99, P4 PASS - hue pale-cyan + ribbon trail), enemy bullet (152.18 - hot red-orange bare orb), powerups, engine flame, engine trail (ember band 54.26-112.43; position + motion disambiguate), shield, reticle (0.35 opacity by design; box artifacts documented). P4 PASS (bullets distinguishable by hue AND shape, closeup MD5 differ both backdrops). No new draw calls (a material param + one in-pool geometry swap; 21/366 + 50/1222 pins hold).
AVOID: touching body.color/wing/cockpit unless the metalness fallback chain is exhausted; killRing or any palette color (all test-pinned); new draw calls; sim src; feel; skybox/HUD/FLOOR-50/rocks; vendor bump; any asset delta or Blender re-bake (excluded above).
No new YouTube grounding (E43 already burned the identity/telegraph/zone/class ids; the I387 audit data + the Node GLB measurement are the budget grounding; anti-over-engineer).
2nd cut gate: gaps G1 + G4 are real and grounded -> E44 NOT cut at ST-352 -> proceed to ST-353 (I389) implementation.
## ST-353 implementation (I389)
- Applied (2 src, render-only, zero sim): (G1) CONFIG.ship.palette.body.metalness 0.45 -> 0.15 (src/core/config.js:94; shipMesh.js bodyMat reads palette.body.metalness, no other render change); (G4) src/render/shockwave.js RingGeometry(0.82,1.0,40) + rotateX(-PI/2) -> TorusGeometry(0.9,0.10,8,40) vertical (faces +Z at the low tracking camera; kept AdditiveBlending/depthWrite:false/DoubleSide + killRing color + pool-of-16; header comment updated).
- Fallbacks not needed yet: metalness 0.15 applied as the primary knob; if the I390 A/B misses the G1 window [34,60]/[22,60], the pre-specified chain (body.color toward the luma-150 cap warm R>B, then a faint body emissive) is test-safe; G4 secondary knob baseOpacity 0.85 -> 0.95.
- Verified: 929/929 + build 0 (fresh); headless smoke (server 5173, ONE tab, killed + port free): 10/10 GLB, body 0.15/0.4 live, ring TorusGeometry, full ring face visible from the low cam (smoke_ring_lowcam.png VIEWED), camFinite, no NaN, console 0/0.
- State: ST-353 DONE -> ST-354 (I390) = corrected A/B (re-run .evidence/I387/ownside_probe.mjs VERBATIM as AFTER; both backdrops, fx=high; verify the AFTER budgets + frozen pins + no new draw calls).