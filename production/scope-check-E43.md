# Scope Check - E43: Enemy Fleet Readability & Coherence Pass (ST-346..350)

## Summary

After E39-E42 the play frame (floor, skybox v6, rocks, field lighting) was re-armed, but the ENEMY FLEET (drone, stinger, flyer, warden, mine, boss/Monolith) body values were tuned against the PRE-E34 frame (I282/ST-267: luma bands vs the old skybox mid-band ~128). E43 re-audits every enemy class against the CURRENT frame and applies a config-only palette/rim/emissive coherence pass where the audit shows a gap. Cut gate: if the audit finds no material gap, E43 closes docs-only (E42 pattern).

## Stage

Post-release polish arc; FEEL FROZEN (no mechanics, no balance, no timing); art/visual only; config-ONLY changes (zero sim src); no new draw calls/materials; no vendor bump (sha 76DEA8151BC9352A stays).

## Scope Fit

- Bounded: 1 surface (enemy fleet readability), 5 stories, all changes verifiable with the existing headless probe toolchain + viewed screenshots.
- No Blender re-bakes PLANNED: the fleet GLBs (E35) are fine-shaped; the gap class is VALUE (luma bands), which is a config palette/rim/emissive problem. A mesh-level change would require a re-bake story and is only added if ST-346 audit proves a shape/silhouette gap (then CUTTABLE per the budget below).
- Distinct from burned work: E23 (ST-267..270) enemy value pass = pre-E34 frame; E29 telegraphs = boss timing/communication, not value; E35 = asset creation. This is the RE-AUDIT against the E34-E42 frame.

## Grounding (bounded YouTube research, this session; 1 search / 3 queries / 24 raw + 2 transcript pulls; STOP on noise per anti-over-engineer)

- KotQ48nrteg (Curious Archive, creature design, 11:30): "A strong, readable design should be recognizable just from the outline" -> silhouette recognizability is the first-order read; shape language second.
- _4xEilK2eNA (Dog's Dream, combat design, 11:20-12:50): enemies need CLEAR WINDUPS + "which enemy is currently holding the aggression ticket"; keep enemies in camera; health/stamina reads make the threat tier readable -> our telegraphs (stinger core glow, warden armor ping, boss core pulse) must READ against the current frame value.
- Gwrpw1YtuGo (AdamCYounis, pixel scale class, 16:14/29:24): muddied detail makes a silhouette "not very readable"; separation comes from FEW distinct color zones (body value + identity accent), not mottled mids.
- RJ5goMBD6oc (TF2 art, title-level only, no pull): class color-coding + high-contrast silhouettes.

NEW BURNED IDS: KotQ48nrteg _4xEilK2eNA Gwrpw1YtuGo RJ5goMBD6oc (in addition to the E40 burns HhCRAJIUq6E I-DNl36mNqw ZoL6Em5OZl4 and the E42 burn yQMywArQfyY).

Principles applied: P1 each enemy = ONE body value + ONE identity accent, BOTH outside the environment bands (sky v6 mid-band, floor FLOOR-50 zone, rock ember band); P2 telegraph/identity accent luma separates from the body AND from the background; P3 the WARM family (mine 0xff5a3c, kill flashes) must not collide with the E41 rock ember band (spot t0.95 p90 112.43 zone) - cool/warm assignment re-validated per class.

## Audit plan (ST-346, BEFORE)

Headless probe (.evidence/I381/; dev server 5173, killed + port free after): deterministic seed; spawn ONE of each class (drone, stinger, flyer, warden, mine, boss) at fixed 15u engagement range in front of the ship (sky backdrop) + one low-altitude position (floor backdrop); freeze the frame; sample per class: body p50/p90 (enemy box), identity-accent p90 (rim/telegraph/emissive), background p50/p90 in the same box; compute separation deltas (accent-bg, body-bg, body-vs-rock-ember-band). Two passes: fx=high (real bloom/grade) + fx=off (no-bloom floor). Closeup screenshots per class VIEWED for silhouette (P1) + accent read (P2). Output .evidence/I381/enemy_audit_i381.json + closeup PNGs.
Known config-era pins (pre-render hex luma, I282/ST-267): drone 0x6f8796 (~131, "above the skybox mid-band ~128"), stinger 0x5a4f73 (~84, "BELOW the skybox mid-band"), flyer 0x7d6878 (~110); warden/boss/mine values from mesh materials + config palettes. The frame since then: sky v6 (sky 70.14), floor dark (FLOOR-50, floor p50 32.2), rocks warm ember (spot t0.95 112.43 / t0.985 54.26), rim 52.76.

## Cut Option

If the ST-346 audit finds NO material gap (every class separates from the current frame at both engagement backdrops + telegraphs read), CLOSE E43 early as docs-only with the audit evidence + reason (no forced re-tune). ST-346 is the cut gate; ST-347 is the second cut point (direction may also no-op).

## Deferral

- E39/E40/E41/E42 deferrals untouched (full skybox rework, animated sky, starfield shader upgrade, normal-map/PBR floor, animated floor deformation, i18n, gamepad).
- Carried tooling gotcha: scripts/serve.mjs lacks the .webmanifest MIME -> PWA probes keep using the canonical .evidence/I348/serve.mjs (fix = future tooling story).

## Recommendation

Proceed with audit-first: ST-346 audit + BEFORE -> ST-347 grounded direction (only if the audit justifies) -> ST-348 config-only implementation -> ST-349 A/B + art QA -> ST-350 gate + close.

## Budget

- dist at open 131 files / 1918676 B; headroom 178476 B (>= 102400 B floor); target asset delta = 0 B (config-only); 5/6 iterations (open + 5 stories).

## Risks

- R-E43-1 palette/rim changes shift tests/paletteHarmony.test.js band pins -> re-pin with documented deltas, never widen a band silently.
- R-E43-2 p1 pin safety by causality: render-only config, zero sim src since the I366 pin (last src commit); I381+ changes must keep zero src; cite the battery (11334/57/W2/combo 15/shots 198/acc 0.2878787878787879/36.14999999999923 s/replay 2169-2220/speed 4 seed 9876).
- R-E43-3 A/B method: CORRECTED method only (standalone enemy closeups + real PLAYING screenshots + authoritative pins), never bare post-FX readPixels.
- R-E43-4 host stall: 2-phase evaluate + same-evaluate canvas (I368 pattern); flat chrome CPU = wedged.
- R-E43-5 no new draw calls / materials: palette + rim/emissive uniform changes only (pins stay 21/366 overhead + 50/1222 PLAYING).

## Files

- src/core/config.js (enemy palette blocks + rim blocks), src/render/{droneMesh,stingerMesh,flyerMesh,wardenMesh,mineMesh,bossMesh}.js ONLY IF the audit demands a knob that does not exist (then it is render-only, no sim), tests/paletteHarmony.test.js (re-pin).
- production/scope-check-E43.md (this file), production/stories.md (ST-346..350), production/epics.md (E43 block), CHANGELOG.md, production/session-state/active.md, production/iterations.md, .evidence/I38x/*.

## Gate G43.0 (at ST-350)

- R1 p1 demo pin EXACT (causal - config/render only, sim untouched) / R2 rockab radii EXACT 2.2/1.3/0.7 (fresh, reseed 30201) / R3 enemy readability probe fresh (per-class separation deltas within the ST-347 budget, telegraphs read at both backdrops, FLOOR-50 + floorab pins UNCHANGED, no new draw calls, no NaN, console 0 real errors) / R4 PWA 11/11 (fresh, I348 canonical server on 5199, killed + port free) / R5 929+ tests + build 0 + headroom >= 102400 B + vendor sha 76DEA8151BC9352A unchanged + servers killed + ports free + stray audit.

## Next owner

- I381 = ST-346 audit + BEFORE baseline (cgs-asset-audit).

## Audit result (I381) - ST-346 BEFORE baseline (cgs-asset-audit)

Method (headless, .evidence/I381/): dev server 5173 (killed + port verified free after); 2 pages - H = fx-high (vr.bloom.render() composer path, bloom.enabled true verified = game-loop-accurate) / O = fx-off (bare render); seed 71381, state MENU (never begin); environment kept (skybox, stars, arenaFloor, arenaRing), all live pools + telegraphs hidden; per class one at a time driven by its REAL sync() at deterministic t=0, centered (0, y, -10) (boss -14); cameras sky (0,2.0,2) / floor (0,7.5,-2), fov 60, near 0.05 - engagement ~12-16 m (real combat distances); per state: body box p50/p90 (+/-1.15 Rpx), accent box p90 (drone/mine/warden = whole-body emissive; stinger/flyer/boss = 0.4 Rpx box at the projected core/dome mesh world pos), bg annulus 1.3-2.2 Rpx (24x4 pts) p50/p90, refPatch (sky top strip / floor bottom strip); separations sepB = body.p50 - bg.p50, sepA = accent.p90 - bg.p90. Clean in-page-cropped closeups x16 (canvas drawImage crop -> toDataURL, zero DOM contamination) + precise stinger core 5x5 max-luma pixel read. Full data: enemy_audit_i381.json + cu_high_*.png.

Backdrop refs (fx=high annulus p50/p90): sky 14.36/16.29; floor 10.63/16.41. (fx=off: sky 20.29/21.29; floor 16.56/21.41.)

BEFORE (fx=high; body p50/p90 | accent p90 | bg p50/p90 | sepB | sepA):
- drone|sky: 72.99/200.98 | 200.98 | 29.12/84.33 | +43.87 | +116.65
- drone|floor: 15.27/200.77 | 200.77 | - | +3.71 | +171.65
- mine|sky: 29.12/93.91 | 93.91 | 29.12/83.9 | 0.00 | +10.01
- mine|floor: 16.41/94.63 | 94.63 | - | +5.78 | +65.51
- stinger_idle|sky: 30.36/80.55 | 72.34 | 36.9/84.62 | -6.54 | -12.28
- stinger_idle|floor: - | - | - | - | +24.87 (box stats identical to charge)
- stinger_charge: IDENTICAL box stats to idle; core 5x5 max luma 71.1 (sky) / 47.8 (floor) = IDENTICAL to idle (emissive 80ecff@0.5 -> ffffff@2.9 NOT visible in pixels)
- flyer|sky: 29.12/81.7 | 197.74 | 29.12/83.83 | 0.00 | +113.91
- flyer|floor: - | ~200 | - | - | +168.62
- warden_armored|sky: 62.72/130.85 | 130.85 | 34.62/79.27 | +28.10 | +51.58
- warden_armored|floor: - | - | - | - | +44.8
- warden_exposed|sky: 60.29/147.01 | 147.01 | - / 79.27 | +25.67 | +67.74
- warden_exposed|floor: - | - | - | - | +61.89
- boss_p1|sky: 72.82/108.73 | 182.49 | 41.11/81.12 | +31.71 | +101.37
- boss_p1|floor: 76.89/95.78 | 179.92 | 64.97/86.84 | +11.92 | +93.08

(dash = not transcribed; full per-box values in enemy_audit_i381.json). fx=off page: same ordering, separations similar (drone sky sepA +121.29 / mine +8.53 / stinger -15.08 idle==charge / flyer +117.88 / warden 52.75/66.27 / boss 102.92/97.12) - findings are NOT a bloom artifact. Console 0/0 both pages; NaN 0.

Closeups VIEWED (all 16 cu_high_*.png):
- drone: bright cyan wide-dart, whole-body glow dominates both backdrops - STRONG (P1 + P2 pass).
- mine: red spike cluster, readable; glow acc90 ~94 sits INSIDE the rock ember band 54.26-112.43 (P3 collision) + weakest sky sepA +10.01 (P2 marginal).
- stinger_idle: dark violet dart, body below bg on sky (sepB -6.54), near-invisible on the dark deck - darkest body in the fleet.
- stinger_charge: PIXEL-IDENTICAL to idle (MD5 both backrops: sky BFAE958C / floor BA3D29B7) - the white-hot core telegraph is sub-pixel at 12 m = the aggression ticket does not read (P2 FAIL).
- flyer: flat hex hull + bright pink dome - dome accent strong at both backdrops (STRONG).
- warden_armored: teal plate + ring segments - distinct silhouette, strong (STRONG).
- warden_exposed: orange spiked rock - silhouette danger read; acc90 147.0-148.7 = +34.6 ABOVE the ember peak 112.43 (P3 OK, distinguishable).
- boss_p1: purple monolith + crown; core seam reads on BOTH backrops (the v1-probe 28 m floor core inversion does not reproduce at engagement distance) (STRONG).

Per-class verdicts: drone KEEP / mine GAP / stinger GAP / flyer KEEP / warden KEEP / boss KEEP.

VERDICT: MATERIAL GAPS -> E43 does NOT close at the ST-346 cut gate; proceed to ST-347 (I382). Gap list: G1 stinger charge telegraph unreadable at engagement distance (core sub-pixel at 12 m - needs a larger/brighter core read) / G2 stinger body 0x5a4f73 is the lowest value in the fleet (negative sky sepB, near-invisible on deck - silhouette IS distinct from the drone in closeups: slim dart vs wide diamond, so the fix is value, not shape) / G3 mine glow acc90 93.91 inside the ember band 54.26-112.43 + weakest sky sepA (shift out of band or strengthen).