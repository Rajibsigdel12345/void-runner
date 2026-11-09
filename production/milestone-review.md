# Milestone Review - Void Runner M1 (E1-E6, I01-I48)

- Date: 2026-11-13
- Skill: cgs-milestone-review
- Scope: E1 Foundations -> E6 Polish/QA/Gates (iterations I01-I48)

## Summary
M1 produced a complete, balanced, presentation-graded vertical slice of the GDD loop: menu -> play -> waves -> power-ups -> combo -> pause -> game over -> restart, with persistence, accessibility (reduced motion, FX quality), touch fallback, synthesized audio, bloom post-fx, and a clean automated regression story (122 unit tests + scripted browser suites). All E6 gate conditions are green; the slice gate passed at I45 and the final regression at I46. Ready to transition to E7 (extended content/UX/hardening, I49+).

## Milestone Goal
Per production/epics.md: build the playable vertical slice of the full GDD loop through E1-E6. E6 gate: all tests green, build green, browser regression clean, docs complete.

## Evidence (per epic)
- E1 Foundations (I01-I04): repo/build/serve/test bootstrap; three.js scene + starfield boots.
- E2 Core loop (I05-I14): ship fly/aim/fire, asteroids + splits + rim reflect, waves, score/combo, lives, state machine, HUD, high score. Full session playable to game over + restart.
- E3 Power-ups (I15-I19): 5 power-ups (rapid, spread, shield, magnet, bomb) with drop/pickup/timers/stacking; each observable + unit-tested.
- E4 Presentation & feel (I20-I26): particles, screen shake, hit flash, WebAudio SFX + ambience, settings persistence, score popups, wave banners.
- E5 Player systems & accessibility (I27-I33): persistence hardening, stats screen, tutorial hint, reduced-motion + FX quality, touch controls.
- E6 Polish, QA, gates (I34-I48):
  - Balance: I34 (pass 1 + spawn safety), I39 (pass 2 late-game speed ramp).
  - Presentation: I35 (bloom, High quality).
  - Perf: I36 pass + fps meter -> baseline 56-60fps / 40 calls / 1638 tris @ wave 4; re-verified I45 (37/1626) and I46 (34/1466) - within 10%, no regressions across 48 iterations.
  - Bugfix: I37 (stray Enter mid-game), I42 (wave stall advance - closes playtest F1).
  - Code review: I38 (C1-C5; C3/C4/C5 closed with evidence at I43).
  - QA: I40 (plan + regression suites), I41 (playtest report F1-F7), I43 (edge cases: visibility, context loss, NaN soak).
  - Gate & closure: I45 vertical slice gate PASS (production/gates.md), I46 final regression (Suites A+B+C), I47 docs, I48 this review + retrospective.

## Blocker
None. No open bugs above minor severity. F2 (invuln fairness in dense waves) and F4 (combo cap reachability) are design watch items, not bugs - scheduled for human playtest I90 and balance pass 4 I92 (E7E) with explicit acceptance criteria.

## Transition Verdict
**PASS - transition to E7.** All E6 gate conditions met (tests 122/122, build 0, regression clean I46, slice gate PASS I45, docs complete I47). I49 (release checklist v1) and I50 (final polish sweep) close out E6's release artifacts; E7A content begins at I51 (ST-051+).

## Risks
- R6 perf headroom: baselines are dev-machine; ~40 calls / ~1.6k tris is bloom-composer-dominated. Mitigation: adaptive quality (E7C, ST-073+).
- R5 input: touch verified synthetically only; physical devices untested (qa-plan known gap).
- F2/F4 carry as named watch items (I90/I92) - do not silently drop.
- E7 scope: boss + hazards + 8 UI/UX + robustness harnesses over 52 iterations; keep one bounded slice per iteration to preserve the per-iteration green bar.

## Changed files or proposed files
- production/milestone-review.md (NEW: this artifact)
- production/retrospective.md (NEW: sibling closure artifact)
- production/probe-notes.md (NEW: consolidated browser probe patterns for I89-100 reuse)
- AGENTS.md (accuracy fix only: no-bundler import-map engine description, command ports, src/audio/ -> src/render/audio.js)

## Verification evidence
- Suite A green this iteration (no source changes): 122/122 + build 0.
- Milestone evidence cross-checked against production/iterations.md headers I01-I48 (sequence 1..48 verified), production/gates.md (I45 PASS), production/qa-plan.md, production/playtest-report.md, package.json scripts.

## Next owner or decision
ST-049 (I49): cgs-release-checklist v1 - measure the dist build (size, load, console-clean), SHIP/NO-SHIP call on the slice; then I50 final polish sweep + closing commit.

# Milestone Review - Void Runner E7 (Extended Content, UX, Hardening & Release, I49-I100)

- Date: 2026-11-10
- Skill: cgs-milestone-review
- Scope: E7 arc (I49-I96 so far; I97-I100 are this review + wrap)

## Summary
E7 took the M1 slice and extended it into a fuller arcade experience: new content depth (wave modifiers, golden asteroid, near-miss, mine drones, Monolith boss + enemy bullets, overdrive, endless curve, gravity vortex), a presentation/feel pass (bullet trails, shield pulse, engine flame, starfield twinkle, hit-stop, dynamic FOV, vignette, per-entity particle palettes, UI motion), a complete UI/UX + accessibility pass (menu, top-5 scores, options, pause, game-over stats, power-up glyphs, focus ring, font scale, mobile/touch, text pass), an audio pass (ambience + ducking, boss stinger, jingle, master chain, true-peak limiter), robustness hardening (adaptive quality, pool/memory audit, WebGL context-loss recovery, determinism harness, 10-min soak, resume sync, storage versioning, debug overlay), two balance passes, and a second full QA/release cycle (regression round C, playtest v2, bug triage, pre-wrap gate). 4 of the 5 E7 gate criteria are met at this review; the final "100+ iterations" and a closing regression re-run complete at I100. Ready to proceed to the I98-I100 wrap and then the user-requested Blender graphics pass.

## Milestone Goal
Per production/epics.md, E7 outcome: content depth (wave modifiers, golden rocks, mines, boss monolith, overdrive), UI/UX polish (menu, top-5 scores, accessibility), robustness (adaptive quality, context loss, determinism + soak harnesses), feel/audio pass, and a second full QA/release cycle.
E7 gate (epics.md): **100+ iterations logged, all tests green, build green, extended regression clean, playtested twice.**

## Evidence (per E7 theme; 48 iterations I49-I96)
- Content (I49-I59): wave modifiers (I51), golden asteroid (I52), near-miss bonus (I53), mine drones (I54), Monolith boss every 5 waves (I55), enemy bullets (I56), overdrive power-up (I57), endless difficulty curve (I58), gravity vortex hazard (I59). Plus release checklist v1 dist 22.9MB->1.4MB SHIP (I49) and Sprint 1 close v0.2.0 (I50).
- Presentation & feel (I60-I63, I81-I82, I85-I86, I88): starfield twinkle/parallax + rim-lit rocks (I60), bullet trails (I61), shield pulse + ring (I62), engine flame (I63), hit-stop (I81), dynamic FOV (I82), vignette (I85), per-entity particle palettes + burst shapes (I86), UI motion pass (I88).
- UI/UX & accessibility (I65-I72, I93): menu polish (I65), top-5 high-score table + NEW BEST (I66), options panel polish (I67), pause overlay (I68), game-over stats + celebration (I69), power-up letter glyphs + focus ring + font scale (I70), mobile/responsive HUD + touch (I71), UI text pass (I72), UI/UX review + persistent wave-modifier tag (I93).
- Audio (I83-I84, I87): ambience + sidechain duck + boss stinger + jingle + whooshes (I83), master-chain pass (I84), true-peak limiter + tiered cue weights (I87).
- Robustness/hardening (I73-I80): adaptive quality auto-drop <45fps (I73), pool/memory audit no per-frame allocs (I74), WebGL context-loss overlay + restore (I75), determinism harness fixed-seed+replay (I76), 10-min soak no NaN (I77), resume sync fixed-timestep clock (I78), storage versioning + corruption guards (I79), debug overlay ?dbg=1 (I80).
- Balance (I64, I92): pass 3 new-content pacing (I64); pass 4 post-boss breather (F9) + combo cap 15 (F4) + invuln 1.8s (F2) (I92).
- QA / release cycle (I89-I96): regression round C (I89), playtest v2 self-play A/B (I90), bug triage 0 code defects / 1 medium (I91), balance pass 4 (I92), UI/UX review (I93), reverse-document vortex (I94), perf profile (I95), pre-wrap gate PASS (I96).

## Gate Criteria status (E7 gate)
- 100+ iterations logged: **IN PROGRESS** - 97 after this entry (completes at I100).
- All tests green: **MET** - 233/233 (fresh run).
- Build green: **MET** - node scripts/build.mjs exit 0 (fresh run).
- Extended regression clean: **MET at I89** (round C, no NaN, console clean, pools in caps); a closing re-run is scheduled at I99/I100.
- Playtested twice: **MET** - v1 at I41, v2 at I90 (scripted self-play A/B on the boss/mods build).

## Blocker
None. No code defects (triage I91). The two open E7-gate items are completion items, not blockers: the 100th iteration and a final regression re-run, both scheduled at I100. The Blender graphics pass is a user-requested step scheduled AFTER I100 and is tracked as a known-open graphics item (not a code blocker for this milestone's code side).

## Transition Verdict
**ON-TRACK / SUBSTANTIALLY COMPLETE - proceed to the I98-I100 wrap, then the Blender graphics pass.** 4 of 5 E7 gate criteria are met now; the last two (100th iteration logged + final regression re-run) are scheduled to complete at I100 by design. No scope rework is indicated.

## Risks
- R1 (highest): the 4 deferred human-playtest perception items (post-boss breather feel, vortex dodgeability feel, combo/overdrive feel, in-world wave-modifier legibility) are the main unverified-player-experience unknowns; a real human session is the outstanding evidence gap before a true release call.
- R2: the Blender graphics pass is unstarted; the game is fully playable but visually placeholder-grade (procedural geometry + canvas textures) until it runs. Scheduled after I100 by user request.
- R3: perf one-time first-gameplay-frame init cost (~90-600ms) is deferred (offscreen warm-up render proposed, I95); low risk, non-blocking.
- R4: dev-machine perf baselines; low-end is mitigated by adaptive quality (I73), but physical-device/low-end-GPU validation remains untested (carried from M1 R5/R6).

## Changed files or proposed files
- production/milestone-review.md (append: this E7 milestone review).
- No source changes (milestone review is evidence + transition call, not code).

## Verification evidence
- node --test 233/233 green (fresh run this iteration); node scripts/build.mjs exit 0 (fresh run).
- E7 evidence cross-checked against production/iterations.md headers I49-I96 (48 iterations; sequence verified 1..96) and production/epics.md E7 outcome/gate, production/gates.md (I96 PASS), production/qa-plan.md, production/playtest-report.md (v1+v2), production/bug-triage.md, production/balance-notes.md, production/perf-profile.md.

## Next owner or decision
Proceed to I98 (cgs-release-checklist: re-run the SHIP/NO-SHIP checklist on the current build incl. dist size, load, console-clean, plus the two outstanding E7-gate items), then I99/I100 (final extended regression re-run + 100th iteration + closing wrap), then the Blender graphics pass (cgs-art-bible / cgs-asset-spec / cgs-asset-audit) as the final user-requested step.

## E7 Gate CLOSED (I100, ST-100)

The final E7 gate criterion (100+ iterations logged) is met at I100. All 5 criteria are now complete: 100 iterations
(sequence 1..100), 233/233 tests, build 0 (dist 1.44MB self-contained), extended regression clean (round C I89 + round D
I99), playtested twice (I41 + I90). The E7 code side is COMPLETE. Next: the user-requested Blender graphics pass
(cgs-art-bible -> cgs-asset-spec -> cgs-asset-audit); a human playtest is recommended before a final release call.
