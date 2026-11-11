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

# Milestone Review - Void Runner E8 (Expansion Milestone, I107-I206)

Skill: cgs-milestone-review | Iteration: I206 (ST-206) | Date: 2026-11-11

## Summary
E8 delivered the planned "visibly deeper game" across six sub-arcs (E8A planning, E8B core
gameplay, E8C content variety, E8D UI/UX + accessibility, E8E music/audio + feel, E8F
replay/recording + robustness), closed with a full QA/release cycle: 630/630 tests, build
green, regression rounds B+C+D clean, playtest v3 + triage (0 BUGs), release checklist
SHIP-READY (code side), gate G8.6 PASS. **Transition verdict: E8 CLOSED; E9 (Blender
asset/art pass) authorized to start.**

## Milestone Goal (from epics.md)
A visibly deeper game - scoring combo + weapon progression, 2 new power-ups (bomb, slow-mo),
3 new enemy behaviors (homing drone, chain-splitter, shielded rock), boss phase 2 + mini-boss
+ asteroid belt, daily seeded runs with shareable results, first-run tutorial + session stats
+ kill feed, colorblind shape cue, procedural music, death slow-mo + feel pass, replay viewer,
300+ tests, and a full QA/release cycle closing at I206.

## Evidence (per sub-arc, gate-verified)
- E8A planning: scope check + epics + 100 stories (ST-107..206) + gate G8.0 (I110).
- E8B core gameplay: combo/multiplier, bomb + slow-mo, homing drone, chain-splitter,
  shielded rock, weapon lvl 1-3, 3 balance passes, determinism re-verify - gate G8.1 (I128).
- E8C content: boss phase 2 + radial pattern + intro banner, mini-boss every 5 waves,
  asteroid belt, daily seeded runs, shareable result codec, boss variant 2 - gate G8.2 (I147)
  + regression round A (I148/149).
- E8D UI/UX + a11y: first-run tutorial, session stats, kill feed, wave banner polish,
  colorblind shape cue, hotkeys, options rows, share screen, HUD rework, a11y pass - gate
  G8.3 (I164) + UX fix round (I165).
- E8E audio + feel: procedural music bed (intensity-ramped, verified 0 -> 0.06 -> 0.12 ->
  0.17 -> 0.90 boss in the I202 playtest), ambience/ducking, death slow-mo warp, feel pass
  (hit-stop, camera punch, FOV kick, shake/flash tables) - gate G8.4 (I182).
- E8F replay + robustness: replay viewer + O-key recording + save-on-game-over (q1000
  fidelity-proven), WebGL context-loss recovery, adaptive quality hardening, security audit
  (I194, 8 totality tests), build-size audit (I197, 449.6 KB gzip in budget) - gate G8.5
  (I198).
- Closeout: playtest v3 (I202), triage v2 (I203), release checklist v3 (I204), regression
  round D (I205), gate G8.6 (I206).
- Tests: 233 at E7 close -> 630 at E8 close (+397 across the milestone; 66 test files).
- Determinism: the demo pilot pin (seed 1909, dies step 2169/2220, t=36.15 s, score 11334,
  57 kills, wave 2, maxCombo 15) verified in-browser on the dev server (I196/I198/I199/I202)
  AND the production dist (I204/I205) - identical outcomes.

## Blocker
None. (No P0/P1 open at close; 0 BUG findings in the I202 playtest.)

## Transition Verdict
**E8 CLOSED. Proceed to E9.** E9 scope per design/art-direction-research.md: the Blender
asset/art pass (user-requested) - GLTF pipeline refresh (ST-207), ship (ST-208), asteroid
L/M/S (ST-209-210), boss (ST-211), skybox/arena ring (ST-212) - with the 8 HUMAN-PENDING
perception items to be confirmed whenever a human playtest happens (they inform, but do not
gate, E9).

## Risks (carry to E9)
- Combo-cap flatness (I203 T1): cap reached in ~12 s for an active pilot; a fix would touch
  config.combo + the demo pin (tests/replay.test.js:246) - blast radius documented.
- Wave-5 boss lethality (T2) + pickup rarity (T3): accepted/hold pending human data.
- Kill juice sparsity (T4, P2) + boss music spike mix (T5): E9 feel/mix targets.
- Visuals are placeholder-grade (procedural + 5 low-poly GLBs) until E9 runs.
- Low-end device validation still untested (adaptive quality mitigates).
- First-frame init cost (~90-600 ms) deferred (I95 proposal stands).

## Changed files or proposed files
- production/milestone-review.md (this section), production/gates.md (+G8.6), CHANGELOG.md,
  production/iterations.md, production/session-state/active.md.

## Verification evidence
- npm test 630/630 + node scripts/build.mjs exit 0 (fresh, this iteration).
- Sequence audit: iterations 1..206 complete, no gaps/dups (E8 = 100/100).
- .evidence/I205/matrix.txt (3/3), .evidence/I204/01-dist-gameplay.png, .evidence/I202/ (3
  playtest shots), production/gates.md G8.0-G8.6, production/release-checklist.md v3,
  production/bug-triage.md Triage v2, production/regression-report.md Round D (I205).

## Next owner / decision
- E9 ST-207 (cgs-dev-story / Blender): GLTF pipeline refresh - verify the 5 GLBs load with
  correct scale/origin/facing, poly budgets per design/asset-spec.md (ship <= ~300 tris,
  L <= ~320, M <= ~120, S <= ~80), then begin model work (ship first).
- Human playtest (when available): the 8-item HUMAN-PENDING checklist (production/bug-triage.md
  Triage v2).

## E9 - Blender Graphics & Assets (I207..I216) - G9.0 PASS (I216)

### Summary
E9 delivered the user-requested Blender art pass: 15 low-poly GLBs + an equirect nebula skybox replace/augment the procedural visuals (ship delta w/ canopy gem, vertex-color mottled asteroid L/M/S, jagged-obelisk boss + plate armor shell, 7 powerup emblems, dart drone, arena ring, skybox), plus PBR-lite IBL environment lighting and an emissive engine trail. All within existing budgets: 15 GLBs = 111.3 KB / 1021 tris, dist 1939.2/501.3 KB (<=2048/550), no perf bottleneck (I214), procedural fallback intact, determinism untouched (assets are render-layer only).

### Metrics
- Tests: 630 -> 670 (+40: assetGlbs, skybox/ring audits, engineTrail, assetPerf, e9Batch 18).
- Iterations: I207..I216, 10 logged, sequential (audit I216).
- Assets: 15 GLBs + 1 skybox PNG (16 runtime assets); runtime 280 pooled meshes over 26 unique geometries.
- Gate: G9.0 PASS (I216).

### Concerns
- 8 HUMAN-PENDING perception items from the E8 playtest (2 ART/AUDIO: kill-juice sparsity P2, boss music spike mix) remain the player-experience evidence gap.
- ST-217 (post-processing polish) queued per the 2026-11-10 art research; E9 art direction continues through it, then E9 closeout.
- Low-end physical device / GPU validation untested (adaptive quality I73 mitigates).

### Verdict
**PASS - E9 asset phase (ST-207..216) closed at I216.** Next: I217 ST-217 post-processing polish, then E9 closeout.

## E9 CLOSED - Blender Graphics & Assets, final closeout (I218, G9.1 PASS)

## Summary
Final closeout of the E9 milestone. G9.0 (I216) gate-verified the asset phase (ST-207..216); I217 closed ST-217 (post-processing polish), the last queued art story; G9.1 (I218) closes the milestone.

## Milestone Goal
Replace/refine the procedural look with Blender-authored low-poly assets inside the draw-call/tri budgets (procedural fallback preserved), plus the post-processing polish (half-res bloom, phase-2 hit-stop) - a REFINEMENT of the shipped art direction (same palette, flat-shaded low-poly language), not a restyle (art-direction-research.md verdict).

## Evidence (per story)
- ST-207 (I207): Blender->GLB->GLTFLoader pipeline + procedural fallback proven (5/5 aborted loads -> procedural boot, exactly 5 warns); tests/assetGlbs.test.js.
- ST-208 (I208): ship 40-tri faceted delta + 6-tri recessed canopy gem; exporter axis flip found + compensated.
- ST-209 (I209): rocks L/M/S 320/104/80 tris, seeded caggy displacement + COLOR_0 mottle, 4 inset craters on M.
- ST-210 (I210): boss 96-tri jagged obelisk + COLOR_0 crown; shield 80 de-indexed plates (inward-normals incident fixed + signed-volume audit gate added).
- ST-211 (I211): 7 powerup emblems (16..48 tris, exact extents) + 52-tri drone dart.
- ST-212 (I212): equirect skybox 1024x512 (41.2 KB) + arena ring (24 plates, 48 tris, +Y normals hand-set).
- ST-213 (I213): PMREM IBL (88/88 standard mats @ envMapIntensity 0.55) + emissive engine trail + bloom-safe threshold audit.
- ST-214 (I214): asset perf + memory audit - 15 GLBs = 111.3 KB / 92.9 KB geo / 1021 tris / 17 mats / 0 UV2; 280 pooled meshes over 26 unique geos; ~5.5 MB GPU textures; NO bottleneck; budgets pinned (tests/assetPerf.test.js).
- ST-215 (I215): 18 core tests over the thinnest coverage (652->670).
- ST-216 (I216): G9.0 gate PASS + docs gap closed (E9 was stories.md-only) + log audit 1..216.
- ST-217 (I217): half-res bloom (internal chain 1/4 frame; post chain steady 3.183 -> 2.586 ms avg) + 40 ms phase-2 hit-stop + test-file clobber repaired (8 I133 tests restored, +6 new = 14 in the file).

## Blocker
None. (The 8 HUMAN-PENDING perception items are a non-blocking evidence gap; parked for a human session.)

## Transition Verdict
**CLOSED - E9 complete: 11/11 stories, 12 iterations (I207..I218).** Fresh at close: 676/676 tests, build 0, dist 1940.6/501.9 KB (<=2048/<=550), log audit 1..218 sequential. Proceed to E10 (post-E9 polish; first lever = camera/feel, art-direction-research.md lever 6).

## Risks
- 8 HUMAN-PENDING perception items (2 ART/AUDIO) - E10 must not block on them; human session when available.
- Low-end physical device / GPU validation untested (adaptive quality I73 mitigates).
- dist gzip headroom ~48.1 KB - any E10 asset work needs the same size review as E9 (R-E9-1 pattern).

## Changed files or proposed files
- production/milestone-review.md (this section), production/gates.md (G9.1 block), production/epics.md (E9 header + Result CLOSED), production/timeline.md (+E9 closed line), production/stories.md (E9 CLOSED line), CHANGELOG.md (+I218), production/iterations.md (+I218), production/session-state/active.md.

## Verification evidence
- I218 fresh: npm test 676/676; node scripts/build.mjs exit 0; dist 1940.6/501.9 KB; log audit 217 entries 1..217 no gaps/dups (+I218 = 1..218).

## Next owner / decision
- I219: E10 scope check + stories (cgs-scope-check + cgs-create-stories).

## E10 CLOSED - Post-E9 Polish, final closeout (I222, G10.0 PASS)

## Summary
E10 (Post-E9 Polish) closed: 3/3 stories ST-218..220 complete across 4 iterations (I219..I222) - the Warden (last procedural enemy) is now a Blender GLB, the final art-research lever (camera/feel) landed, and the regression round + gate close the epic with no core changes.

## Milestone Goal
Small polish milestone after E9: finish the last procedural enemy model in Blender (Warden), land the last unowned art-research lever (camera/feel, lever 6), then regression + gate. No new content, no new dependencies, no core determinism changes (camera is render-layer).

## Metrics
- Tests: 677/677 (net +0 this milestone: asset audits extended 15->16 assets; camera lever render-only)
- Build: exit 0; dist 1954.9 KB raw / 506.2 KB gzip (budget <=2048/<=550, ~43.8 KB headroom; was 1940.6/501.9 at E9 close - the delta is warden.glb 11.5 KB + test code)
- Assets: 16 GLBs + skybox (was 15 + skybox); warden.glb 11,772 B / 180 tris / 2 materials
- Iterations: 4 (I219 scope open, I220 ST-218, I221 ST-219, I222 ST-220 + gate + closeout)
- Performance: frame probe delta ~0 (I221 16.57 ms avg -> I222 16.93 ms avg, 60 fps locked both)

## Evidence (per story)
- ST-218 (I220): Warden Blender GLB - assets/warden.glb 180 tris / 11.5 KB / 2 materials (VR_Warden_Hull 60 tris jittered dodecahedron + 4 capped spikes; VR_Warden_Armor 120 tris = 6 trapezoid plates + hex rim band); separate armor node so the wardenMesh.js armor-state animation carries over unchanged; procedural fallback preserved; 16th asset in assetLoader; assetGlbs + assetPerf audits extended (677/677); smoke: GLB swap proven (124/240 GLB verts vs 108/56 procedural), armored + spent screenshots, kill +400/+1/hidden, pilot finite, console 0/0.
- ST-219 (I221): camera/feel (art research lever 6) - 2-5% aim-lead on the LOOK target only (min(ship->aim * 0.03, 1.2 u); camera position stays = dodge-read rule), boss-approach +2.5 deg FOV zoom-out (dist < 14, eased 3/s), MENU orbit drift 0.06 rad/s (motion-gated, phase 0 = legacy view); view FIXED during normal play; 6 new camera tunables in config. Smoke: orbit A/B + lead in/cap/out exact (+0.223/+0.334, cap EXACTLY 1.2) + boss zoom 60 -> 62.134 -> 60.01 + pilot 18 s / 14 kills finite + frames 16.57 ms avg (delta ~0) + console 0/0.
- ST-220 (I222): regression round + G10.0 gate + closeout - node matrix 3/3 677/677; build 0; dist 1954.9/506.2; state machine 6/6; persistence intact; demo pin EXACT via real UI path (idx 2169/2220, score 11334, t=36.15); Warden same-frame A/B (.evidence/I222/02 vs 03); fresh pilot 1080 ticks PLAYING t=31.47 s / 7449 pts / 35 kills all finite; frames 16.93 ms avg (60 fps locked); console 0/0; log audit 1..222 sequential.

## Blocker
None.

## Transition Verdict
**CLOSED - E10 complete: 3/3 stories, 4 iterations (I219..I222).** No core changes this milestone (camera is render-layer); the demo pin (seed 1909) is structurally untouched and re-verified exact in-browser at I222.

## Risks
- Carried (8 HUMAN-PENDING): perception items in production/bug-triage.md (2 ART/AUDIO) - non-blocking, need a human session.
- Carried: low-end physical device / GPU validation (adaptive quality I73 mitigates).
- New: none opened this milestone; R-E10-1..3 all CLOSED at G10.0.

## Changed files
- production/gates.md (+G10.0 block), production/milestone-review.md (this section), production/epics.md (E10 header + Result CLOSED), production/timeline.md (+E10 closed line), production/stories.md (ST-218..220 DONE + E10 CLOSED line), CHANGELOG.md (+I222), production/iterations.md (+I222), production/session-state/active.md. No src changes (closeout iteration).

## Verification evidence
- I222 fresh: npm test 677/677 (x2 in-process) + node --test "tests/*.test.js" 677/677 cross-process (.evidence/I222/matrix.txt + run3.txt); node scripts/build.mjs exit 0; dist 1954.9/506.2 KB; log audit 221 entries 1..221 (+I222 = 1..222, sequential, .evidence/I222/log-audit.txt); browser smokes ?nocache=222a (regression), ?nocache=222b (Warden A/B staging), ?nocache=222c (pilot + frames + console).

## Next owner / decision
- I223: open E11 - scope check via cgs-scope-check + cgs-create-stories. Candidate directions: (a) new content arc, (b) HUMAN-PENDING-informed polish (human session), (c) low-end device validation plan, (d) carried deferrals (combo cap balance, 512x256 skybox).

## E11 CLOSED - Combat Juice & Low-End Validation, final closeout (I226, G11.0 PASS)

## Summary
E11 (Combat Juice & Low-End Validation) closed: 3/3 stories ST-221..223 complete across 4 iterations (I223..I226) - rock kills got the missing bottom juice rung (class-scaled directed kill punch + overdrive combo-heat, no flash/hit-stop on plain kills) and the bot-verifiable half of the carried low-end device validation is documented (FX tier matrix, adaptive ladder, DPR cap, rm + FX-low combo).

## Milestone Goal
Close the juice ladder hole (T4: per-hit-class punch at the rock-kill rung, grounded in GMTK / IndividualKex / bullet-hell readability research) and finish the bot-verifiable half of the long-carried low-end device validation (hardware remainder labeled). No new content, no scoring changes (demo pin untouched), no new dependencies.

## Metrics
- Tests: 677 -> 689 (net +12: killPunch.js + 12 tests; ST-222/223 evidence-only)
- Build: exit 0; dist 1954.9 -> 1958.4 KB raw / 506.2 -> 507.8 KB gzip (budget <=2048/<=550, ~42 KB headroom; delta = killPunch.js + config + tests)
- Assets: unchanged (16 GLBs + skybox)
- Iterations: 4 (I223 scope open, I224 ST-221, I225 ST-222, I226 ST-223 + gate + closeout)
- Performance: frame probe delta ~0 (I222 16.93 ms avg -> I225 16.75/16.85 dense -> I226 16.65 ms avg, 0 drops; 60 fps locked; this session's display is 60 Hz)

## Evidence (per story)
- ST-221 (I224): kill juice (T4) - src/core/killPunch.js pure core (killPunchEnergy/killPunchDir; S 0.08 / M 0.12 / L 0.18, all under the drone rung 0.35 shake + the 0.45 weapon fanfare; overdrive x1.5 capped at 0.3) + CONFIG.fx.killPunch + main.js kill branch (motion-gated; NO flash/hit-stop/fovKick = bullet-hell readability rule) + 12 unit tests. Browser: juiceTally 8 rock kills -> kill:{punch:8} with all other channels 0; live class rungs EXACT (S 0.0655 / M 0.0982 / L 0.1474 = rung x e^-0.2 after the in-tick step; overdrive x1.5 exact, reverts off); decay settles ~0.5 s; rm A/B (tally unchanged + magnitude 0; .evidence/I224/); pilot 1080 ticks finite; frame delta ~0; console 0/0.
- ST-222 (I225): low-end device validation, bot-verifiable half - perf-profile.md '## I225' matrix: dense worst case (24 M rocks + live Monolith hp-protected + sustained fire) p95 16.8 ms at BOTH FX tiers at the 60 Hz vsync floor; sporadic single-frame drops only (1/167 high, 4/170 low, 0/451 in the 8 s follow-up with 19 live enemy bolts); bloom composer = 12-14 draw-call premium (MENU 24 -> 10); adaptive ladder verified end-to-end headlessly (downgrade fires after 2 bad windows + toast + exact console line; 6 s of 120 fps holds low = hysteresis; user lock blocks re-downgrade; reset clean; F path re-applies settings before userSet); DPR cap min(dpr,2) code-verified + runtime honored; rm + FX-low combo playable (2 kills under rm -> zero kill punch = I224 gate re-confirmed in combo); 3 scope-vs-code flags + labeled HARDWARE-pending checklist (low-spec phone, dpr 2-3, thermal, 60 Hz compliance, touch).
- ST-223 (I226): regression round + G11.0 gate - node matrix 3/3 689/689 (in-process x2 + cross-process); build 0; dist 1958.4/507.8 KB (in budget); browser ?nocache=226b/226c (fresh loads, 60 Hz display): assets 16/16 + skybox both; state machine 10/10 (incl. forced death -> GAME_OVER in 1 tick + live restart + replay exit branch); persistence intact; demo pin EXACT via REAL UI path (menu REPLAYS button -> DEMO PILOT button -> key 3: idx 2169/2220, score 11334, t=36.15, 57 kills); fresh scripted pilot 1080 ticks (113.8 ms loop) PLAYING dt=18.0 s / 2690 pts / 15 kills / 3 lives all finite + kill-punch tally EXACT 15/15 (all other channels 0 = I224 gate re-confirmed live); frames 301 f (30 warm-up excluded) avg 16.65 / p50 16.7 / p95 16.8 / max 17.1 ms (0 drops >17.5 ms, 0 doubles >30 ms; 60 fps locked); console 0/0; log audit 1..226 sequential.

## Blocker
None.

## Transition Verdict
**CLOSED - E11 complete: 3/3 stories, 4 iterations (I224..I226).** Demo pin structurally untouched (render-layer + pure-core mapping only), re-verified exact in-browser at I226 via the real UI path.

## Risks
- Carried (8 HUMAN-PENDING): perception items in production/bug-triage.md (2 ART/AUDIO) - non-blocking, need a human session.
- Carried: low-end physical device / GPU validation (HARDWARE-pending checklist in perf-profile.md '## I225').
- Carried: 3 I225 scope-vs-code flags (no FX off tier; no load-reactive DPR 1.5; auto-downgrade does not update the stored settings tier - minor UX, F path correct) - E12 candidates.
- New: none; R-E11-1..3 all CLOSED at G11.0.

## Changed files
- production/gates.md (+G11.0 block), production/milestone-review.md (this section), production/epics.md (E11 Result CLOSED), production/timeline.md (+E11 closed line), production/stories.md (ST-221..223 DONE + E11 CLOSED line), CHANGELOG.md (+I226), production/iterations.md (+I226), production/session-state/active.md. No src changes (closeout iteration).

## Verification evidence
- I226 fresh: npm test 689/689 x2 in-process + node --test over the tests glob 689/689 cross-process; node scripts/build.mjs exit 0; dist 1958.4/507.8 KB; log audit 1..226 sequential (.evidence/I226/); browser smokes ?nocache=226b (demo pin + replay exit), ?nocache=226c (state machine + pilot + frames + console).

## Next owner / decision
- I227: open E12 - scope check via cgs-scope-check + cgs-create-stories. Candidates: the 3 I225 scope-vs-code flags as small stories (FX off tier, load-reactive DPR 1.5, auto-downgrade settings-tier sync), art levers (research-backed), new content. 8 HUMAN-PENDING items parked for a human session.

## E12 CLOSED (I231, ST-227)

## Summary
E12 (Quality Settings Consistency & Skybox Art Pass) complete: 4/4 stories ST-224..227 over 4 iterations (I228..I231), G12.0 gate PASS. Closes the 3 I225 scope-vs-code flags + the carried 512x256 skybox deferral (per the standing user art/Blender directive).

## Milestone Goal
Make the quality settings tell the truth (stored choice vs effective tier), complete the FX tier set (off), make DPR load-reactive (1.5 under auto-downgrade), and land the last Blender art item (skybox) within the dist budget.

## Evidence (per story)
- ST-224 (I228): FX off tier - F cycles high->low->off->high (pure core), panel 3rd option, off zeros FX-tier-gated render effects (kill channel browser-verified exactly 0; trail 0; bloom high-only), user-only tier, 3-tier storage. 691/691.
- ST-225 (I229): load-reactive DPR + effective-tier sync - pure dprForTier + 6 tests; applyFxTier single writer (no-revert family closed); 'AUTO: LOW' chip on both panels while autoLow, stored choice never overwritten; dpr-2 bot path verified 2.0 -> 1.5 -> 2.0. 697/697.
- ST-226 (I230): skybox art pass - Blender 5.2 node-baked equirect v5 (math-only unit direction after the VectorMath LENGTH/NORMALIZE bake corruption was root-caused with constant probes), 1024x512 JPEG 73.2 KB (net +32.0 KB <= 40 KB budget), PMREM IBL unchanged, sky subordinate at every FX tier. 697/697 (1 audit rewritten).
- ST-227 (I231): regression round + G12.0 + closeout - node 3/3 (697/697 x3), build 0, dist 105 files 1994.7/543.4 KB, state machine 10/10, persistence intact, demo pin EXACT via real UI, FX-off zero-leak re-confirm, user-lock semantics, frame probes 0 drops, console 0/0 on 3 tabs, log 1..231 sequential. 1-line gate fix: F-hotkey userSet before applyFxTier (stale AUTO: LOW marker after an auto-downgrade; live repro 231b, post-fix verify 231c + pause-panel screenshot .evidence/I231/03).

## Blocker
None.

## Transition Verdict
**CLOSED - E12 complete: 4/4 stories, 4 iterations (I228..I231).** Demo pin structurally untouched (render/settings/asset layer only), re-verified exact in-browser at I231 via the real UI path.

## Risks
- Carried (8 HUMAN-PENDING): perception items in production/bug-triage.md (2 ART/AUDIO) - non-blocking, need a human session.
- Carried: low-end physical device / GPU validation (HARDWARE-pending checklist in perf-profile.md '## I225').
- New: none; R-E12-1..4 all CLOSED at G12.0 (R-E12-4 realized in-gate as the 1-line F-marker fix, closed at I231).
- WATCH: gzip headroom 6.6 KB after the skybox JPEG - future asset stories need a size review before landing.

## Changed files
- src/main.js (1-line reorder), production/gates.md (+G12.0 block), production/milestone-review.md (this section), production/epics.md (E12 Result CLOSED + risks CLOSED), production/timeline.md (+E12 closed line), production/stories.md (ST-224..227 DONE + E12 CLOSED line), CHANGELOG.md (+I231), production/iterations.md (+I231), production/session-state/active.md.

## Verification evidence
- I231 fresh: npm test 697/697 x2 in-process + node --test over the tests glob 697/697 cross-process; node scripts/build.mjs exit 0; dist 1994.7/543.4 KB (105 files); log audit 1..231 sequential; browser smokes ?nocache=231a (regression + demo pin exact), ?nocache=231b (dpr-2 user-lock + pre-fix repro), ?nocache=231c (post-fix marker path + .evidence/I231/03 screenshot).

## Next owner / decision
- I232: open E13 via cgs-scope-check + cgs-create-stories. Candidates: new content arc, combo cap (demo-pin compatible), music quality (HP #5), hardware remainder, + new feel/art levers. 8 HUMAN-PENDING items parked for a human session.

## E13 CLOSED (I236, ST-231)

## Summary
E13 (Mid-Run Content Arc) complete: 4/4 stories ST-228..231 over 4 iterations (I233..I236), G13.0 gate PASS. Fills the wave 3-9 content valley: the HEAVY ROCKS modifier (the BIG counterweight to SMALL), the STINGER charger enemy (the rammer archetype from the YouTube grounding pass), the 17th Blender asset (the STINGER dart GLB), and the skybox JPEG re-encode that restored the gzip headroom.

## Milestone Goal
Make waves 3-9 carry their own verbs (a tactical counterweight modifier + a dodge-or-die charger) without touching the demo pin, and land the last two asset levers (STINGER GLB + skybox budget) within the dist budget.

## Evidence (per story)
- ST-228 (I233): HEAVY ROCKS modifier - 4th waveMods.list entry 'big' (bigLBias 0.5, the L mirror of smallSBias), deterministic (seed, wave) roll, 'HEAVY ROCKS' banner + violet HUD tag + i18n, W1-2 plain + breather invariants pinned; daily salt bump 'daily' -> 'daily:v2' (ST-140 namespacing) + new canonical 2026-11-10 seed 1312111789 pin; browser 233a seeded live scenario (wave 3 banner + tag, wave 7 re-staged 5L/5M/1S, pickSize probe n=2000 exact). 699/699.
- ST-229 (I234): STINGER charger enemy - cruise 1.8 u/s -> 0.8 s telegraph (FX-tier-independent core glow + rising saw SFX, aim locked at telegraph start) -> charge 7.5 u/s x 1.4 s -> 1.2 s recover, 6-charge lifetime fizzle, wave 7+ 1/wave cap 2, rim 15 u, contact 1 life no score, kill +250 + feed + juice, pool 4 + procedural fallback + GLB hook, 2 SFX cues, toast; browser 234a/234b lifecycle matrix (RM-on offset exactly 0 with the glow kept; FX HIGH 120 / LOW 40 / OFF 0). 710/710 (+11 stinger tests, 2 table pins).
- ST-230 (I235): Blender STINGER model + skybox JPEG re-encode - the 17th asset (VR_Stinger_Body 32-tri diamond-section dart + 4 kite fletching fins, VR_Stinger_Core 8-tri smooth octa; 40 tris, 2 mats, 3.2 KB raw / 1.2 KB gz, POSITION+NORMAL only) swapped through the pre-wired useGLB hook (in-code materials kept); skybox 74915 -> 60905 B (PIL q80 - Blender's image-save quality was not applying; staged q55..q85, A/B visually identical); dist net -12.3 KB, headroom 1.8 -> 13.0 KB; assetPerf 16 -> 17. 710/710.
- ST-231 (I236): regression round + G13.0 + closeout - node 3/3 (710/710 x3), build 0, dist 108 files 2002.7/537.0 KB (headroom 45.3/13.0), state machine 10/10 EXACT from verified MENU (first run's PLAYING start documented as one-off external input on the user-active machine - environmental), persistence intact, FX-off zero-leak + readability floor 8 via the real F-key path, user-lock 165x, fresh 1080-tick pilot all finite, frame probe fast windows (300f avg 16.99 / p50 16.8; env 1-fps throttle + rAF-pause windows documented, p50 holds the 60 fps grid), console 0/0 on 4 tabs, demo pin EXACT via real UI (idx 2169/2220, 11334, 57 kills, wave 2, t 36.15, screenshot .evidence/I236/01-demo-pin.png).

## Blocker
None.

## Transition Verdict
**CLOSED - E13 complete: 4/4 stories, 4 iterations (I233..I236).** Demo-pin-compatible by gating (modifier W3+, stinger W7+ vs the demo's wave 2), re-verified exact in-browser at I236 via the real UI path.

## Risks
- Carried (9 HUMAN-PENDING): perception items in production/bug-triage.md (incl. #9 stinger telegraph/charge feel) - non-blocking, need a human session.
- Carried: low-end physical device / GPU validation (HARDWARE-pending checklist in perf-profile.md '## I225').
- New: none; R-E13-1..5 all CLOSED at G13.0.
- WATCH: none open (gzip headroom back to 13.0 KB after the skybox re-encode).

## Changed files
- production/gates.md (+G13.0 block), production/milestone-review.md (this section), production/epics.md (E13 Result CLOSED + risks CLOSED), production/stories.md (E13 header + CLOSED line), production/timeline.md (+E13 closed line), CHANGELOG.md (+I236), production/iterations.md (+I236), production/session-state/active.md.
