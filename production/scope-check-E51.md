# Scope Check - E51 Multi-Hit Enemy Hit-Flash (cgs-scope-check, I414)

## Summary
E51 = the missing hit-reaction rung on the two multi-hit enemies: the WARDEN (armor + HP) and the BOSS family (Monolith + Splicer, HP). Every non-lethal HP hit spikes a short white emissive flash on the body (peaks pure white, decays over ~0.33 s at 3/s), reusing the exact verified flyer hitFlash pattern - a sim scalar set in hit() and decayed in step(), read by the render layer; NO new sim event, NO main.js/game.js change. This closes the E50 deferral "non-flyer enemy hit-flash" with the surface corrected by evidence: the E50 line said "drone/stinger/warden", but drones and stingers are one-shot (game.js:678/730 "bullets destroy drones/stingers (1 hit)"; drones.js/stinger.js have no hp/armor fields) - their hit IS the kill and the full death juice already plays. The only entities that take non-lethal hits are the warden (armor absorbs N hits, then HP) and the boss (HP). Grounding (fetched in I408, no new pull - documented skip): Design Diary "10 Ways to Improve Game Feel" #8 "enemy hit reactions (flash white)"; grapefrukt "Juice it or lose it" impact/shatter reactions. Render-only + additive + zero feel re-tune + zero sim events, so the frozen playframe pins (L 21/366 + P 10/180 + B 50/1222) and the p1 seed-9876 causal pin stay structurally EXACT.

## Surface & Evidence
- src/core/warden.js:23-29 hit() returns {absorbed, killed} (armor first, then HP); step(dt, shipPos) at :32 - flash scalar + decay slot in. Absorbed (armor) hits keep ONLY the existing cyan ping (wardenArmor event, main.js juice chain). (verified I414)
- src/core/boss.js:86-93 hit() (1 dmg; returns true on kill; phase-2 enrage flip); step(dt, shipPos) at :53; constructor :29-38 (hp/maxHp/radius/alive/ringTimer/rot/phase) - hitFlash: 0 slot in. (verified I414)
- src/core/game.js:478 resolveBulletBoss "if (boss.hit()) this.bossDeath()" and :589 "const r = wd.hit()" - NO signature changes needed; zero game.js edits. (verified I414)
- src/core/game.js:678 "bullets destroy drones (1 hit)" + :730 "bullets destroy stingers (1 hit)"; drones.js/stinger.js have ZERO hp/armor fields (grep) - one-shot kills, full death juice already plays. Corrects the E50 deferral wording "drone/stinger/warden". (verified I414)
- SFX_CUES (src/main.js:284): warden has wardenSpawn/wardenArmor(shieldHit)/wardenDeath; boss has bossSpawn/bossRing/bossDeath/bossFire - NO per-HP-hit cue for either; warden/boss HP hits are silent today. Per-hit impact SFX is an audio-side feature -> DEFERRED (E51 stays zero-SFX per contract). (verified I414)
- The pattern template - flyer: core/flyer.js:60 "hitFlash: 0" (ctor) / :113 "f.hitFlash = 1" (hit) / :74 "f.hitFlash = Math.max(0, f.hitFlash - 3 * dt)" (step); render/flyerMesh.js:74-76 "const k = f.hitFlash; ... mat.emissiveIntensity = 0.7 + 1.9 * k; // hit flash clears the 0.72 bloom threshold". No sim event, no main.js change. (verified I414)
- src/render/wardenMesh.js:82-94 sync(warden, t): hullMat.emissive.copy(c) + intensity (armored 0.26-0.44 / exposed 0.5-0.68 pulse), armorMat 0.12, cyan->orange state color, GLB swap keeps in-code materials - flash = lerp emissive to white by k + intensity += spike*k on hull+armor, after the existing copy(). (verified I414)
- src/render/bossMesh.js:200-263 sync(boss, t, ringT, aimT, burstT): hullMat/crownMat setHex(bodyHex) + bodyPulse (Monolith 0.18-0.36 / phase2 0.30-0.50 / Splicer 0.30-0.60) at :212-215; coreMat carries the ST-290 telegraph pulse/redMix (:242-243) and already crosses bloom (0.85-1.3 phase 1) - flash touches HULL+CROWN only, core seam untouched. (verified I414)
- Splicer: core/splicer.js is a pure HP/cadence scaler; the boss entity + bossMesh handle both kinds (boss.kind "monolith"|"splicer") - one hitFlash covers both variants; the teal identity lerps to white the same way (no new hue). (verified I414)
- Bloom threshold 0.72 (CONFIG.fx.bloom); warden hull/armor + boss hull/crown all sit UNDER it at idle - the flash spike is what carries the read. (verified I414)
- src/core/config.js fx block :483+ (data-driven sub-blocks, commented tunables) = the home for CONFIG.fx.enemyHitFlash = { decay: 3, spike: 1.4 } per the AGENTS.md "all tunables in config.js" convention. tests/config.test.js pins only fx.bloom sanity (:68-69) - a new fx sub-block is safe. (verified I414)

## Scope Fit
- One bounded surface (2 sim scalars + 2 render hooks + 1 config sub-block + tests), 4-iteration budget (I414..I417), 1 pre-registered cut gate (CG at ST-386).
- Render-only + additive; ZERO sim events (emit calls unchanged); ZERO SFX; ZERO assets (no Blender); +0 draw calls (emissive on existing materials); ZERO feel re-tune (E8 freeze respected: no knockback, no hit-stop, no movement, no new table entries).
- Determinism preserved: hitFlash derives from hit()/step() only (seeded sim path), render-only like the flyer - reseed yields identical flash timelines (unit-tested).
- Dist headroom 133,948 B >= 102,400 B floor: expected +~2-4 KB of code.
- Flyer stays as-is (its hardcoded 3/s decay matches CONFIG.fx.enemyHitFlash.decay = 3 by design - feel-consistent; unifying it to read the constant is a future tidy, deferred).

## NOT taskable (documented rejections)
- Per-hit impact SFX for warden/boss HP hits (verified silent today - an audio-side feature for the deferred audio epic; E51 stays zero-SFX).
- Knockback / hit-stagger on warden or boss (movement = FEEL, E8 freeze).
- Per-hit particle sparks (kill bursts already exist; per-hit sparks = noise per the E50 bounded-juice precedent).
- Drone/stinger flash (one-shot: their hit IS the kill - full death juice plays; nothing to add).
- Flyer change (already has the dome flash; constant unification deferred).
- New palette hue (white is not a hue - the ST-179 flashTable and the flyer dome already use white flashes; precedent).
- Core-seam flash on the boss (the core carries the ST-290 telegraph pulse/redMix; flash touches hull+crown only).

## Pre-registered Cut Option
- CG (ST-386): if the attributed A/B (viewed) shows the flash reads as a SCREEN-WIDE BLOWOUT (frame-mean luma delta beyond the pre-registered band, or flash pixels beyond a pre-registered share of the frame), OR the flash is invisible at the default FX tier (does not clear the 0.72 bloom read), OR the post-decay state color (armored cyan / exposed orange / monolith purple / splicer teal) is NOT restored, OR any frozen pin moves (L/P/B playframe, p1 causal, rockab) -> revert + docs-only no-change. A clean no-change CUT is an acceptable outcome (anti-over-engineer).

## Deferrals
- Per-hit impact SFX (warden/boss HP hits are silent today) -> the audio epic.
- Flyer decay constant unification (hardcoded 3/s -> CONFIG.fx.enemyHitFlash.decay) -> future tidy.
- E49 i18n tail (replayHud.js "REPLAY" + speed hint, recIndicator.js "REC", tutorialHint.js 2 dual-zone hints) + touch fallback (AGENTS.md "later") -> next-epic candidates.

## Stories (budget I414..I417, gate G51.0 at I417)
- ST-384 (I414): open E51 - scope-check + stories, DOCS-only. [this iteration]
- ST-385 (I415): implement (cgs-dev-story): core/warden.js (hitFlash: 0 in ctor; = 1 on HP hits (non-absorbed), killed or not; decay in step()); core/boss.js (hitFlash: 0 in ctor; = 1 on every hit() incl. the killing hit; decay in step()); render/wardenMesh.js sync (hull + armor: emissive lerp toward white by k, intensity += spike*k, after the existing copy()); render/bossMesh.js sync (hull + crown: same, after setHex so no hue bleed; core seam untouched); config.js CONFIG.fx.enemyHitFlash = { decay: 3, spike: 1.4 } (commented, data-driven); tests/warden.test.js + tests/boss.test.js (flash set on HP hit / NOT set on absorbed warden hit; set on boss kill hit; decay monotone to 0; reseed determinism -> identical hitFlash timelines; hp/armor/kill semantics unchanged). Acceptance: 953+N/N + build 0 + dist delta documented + headless smoke (console 0/0, no NaN, flash present on a combat hit frame, pins unchanged).
- ST-386 (I416): A/B + art QA (headless, attributed; I412 harness discipline): per-hit frames with/without flash (2 arms x 3 pages); flash clears the 0.72 bloom read; decay visible over ~2-3 frames; post-decay state colors restored (armored cyan / exposed orange / monolith purple / splicer teal); no new hue (white); L 21/366 + P 10/180 + B 50/1222 EXACT + p1/rockab EXACT; CG gate decision recorded.
- ST-387 (I417): regression + G51.0 + close (cgs-regression-suite + cgs-gate-check + cgs-milestone-review): R1 p1 EXACT causal / R2 rockab EXACT 2.2/1.3/0.7 fresh / R3 playframe EXACT 21/366 + 10/180 + 50/1222 fresh + flash-at-rest probe (hitFlash 0 on all, +0 draw calls) / R4 PWA 11/11 fresh / R5 953+N/N + build 0 + headroom >= 102,400 B + vendor sha256-16 76DEA8151BC9352A + hygiene; regression-report.md Round G51.0; close E51.

## Verification Plan
- Per iteration: npm test (953/953 baseline; grows from ST-385) + npm run build 0 + dist 135 / 1,963,204 B (or a documented delta) + vendor three r160 sha256-16 76DEA8151BC9352A + hygiene (chrome 0, ports 5173/4173/5199 free).
- G51.0 at I417: R1 p1 EXACT causal (seed 9876) / R2 rockab EXACT 2.2/1.3/0.7 fresh / R3 playframe EXACT 21/366 + 10/180 + 50/1222 fresh + flash-at-rest probe (hitFlash 0, +0 draw calls) / R4 PWA 11/11 fresh / R5 953+N/N + build 0 + dist headroom >= 102,400 B + vendor sha256-16 76DEA8151BC9352A + hygiene.

## Risks
- R-E51-1 flash reads as a screen-wide blowout -> bounded spike (1.4), body materials only (hull/crown, hull/armor), CG pre-registered luma band + viewed A/B.
- R-E51-2 flash masks the armored/exposed + variant identity read (cyan/orange, purple/teal) -> transient (3/s decay); the lerp restores the base color as k -> 0; the A/B post-decay frame verifies the state color.
- R-E51-3 playframe/p1 pin movement -> sim emits unchanged (hitFlash is a render-only scalar, the flyer precedent); R3 re-verifies EXACT.
- R-E51-4 boss telegraph interference (ST-290 corePulse/redMix on coreMat) -> flash touches hull/crown only; coreMat + telestate probe untouched.
- R-E51-5 splicer teal + white flash -> same lerp path; no new hue; the A/B arm includes a splicer frame.

## Recommendation
PROCEED - the gap is verified open (only the flyer flashes on hit; warden + boss take repeated non-lethal hits with no hit reaction and no sound), the technique is grounded (Design Diary #8 "enemy hit reactions (flash white)"; grapefrukt impact reactions), it is the smallest honest closure of the E50 deferral with the surface corrected by evidence, bounded to a 4-iteration budget with 1 pre-registered cut gate, render-only + additive, zero feel re-tune, zero sim events, zero assets, zero SFX, +0 draw calls, and the pins are structurally unchanged.

## Changed files or proposed files
- Changed (I414, DOCS-only): production/scope-check-E51.md (new; source of truth), CHANGELOG.md, production/epics.md, production/stories.md, production/timeline.md, production/session-state/active.md, production/iterations.md.
- Proposed (ST-385..387): src/core/warden.js, src/core/boss.js, src/render/wardenMesh.js, src/render/bossMesh.js, src/core/config.js (CONFIG.fx.enemyHitFlash), tests/warden.test.js, tests/boss.test.js. (No main.js, no game.js, no assets, no SFX.)

## Verification evidence
- I414 (DOCS-only): source inspection this iteration (warden.js:23-29/32-49; boss.js:29-38/53-78/86-93; game.js:478/589/678/730; SFX_CUES main.js:284 - no warden/boss per-HP-hit cue; flyer.js:60/74/113 + flyerMesh.js:74-76; wardenMesh.js:82-94; bossMesh.js:200-263; config.js fx block :483+; config.test.js :68-69 fx.bloom-only; drones.js/stinger.js zero hp/armor fields) + grounding reuse (I408 fetched: Design Diary "enemy hit reactions (flash white)" + grapefrukt impact/shatter - NO new YouTube pull, documented skip) + quality bar npm test 953/953 + build 0 + dist byte-identical 135/1,963,204 B + vendor sha256-16 76DEA8151BC9352A + hygiene (chrome 0, ports free).

## Next owner or decision
- Owner: gameplay-programmer (core scalars + render hooks + tests).
- NEXT I415 = ST-385 implement warden + boss hitFlash (cgs-dev-story).
