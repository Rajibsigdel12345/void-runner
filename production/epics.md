# Epics - Void Runner (cgs-create-epics)

## E1 - Foundations (iterations 1-4)
Outcome: repo builds, serves, tests run; three.js scene boots with a starfield.
Gate: `npm test` + `npm run build` green; browser smoke shows starfield.

## E2 - Core Loop (iterations 5-14)
Outcome: full playable MVP loop per GDD (fly/aim/fire/asteroids/waves/score/lives/states/HUD/high score).
Gate: can play a full session to game over and restart; unit tests cover S01-S14 logic.

## E3 - Depth: Power-ups (iterations 15-19)
Outcome: 5 power-ups with drop, pickup, timers, stacking; unit-tested.
Gate: each power-up observable + tested.

## E4 - Presentation & Feel (iterations 20-26)
Outcome: particles, screen shake, hit flash, synthesized SFX + ambience, settings persistence, score pop, wave banners.
Gate: kill feels juicy; settings persist across reload; audio respects mute.

## E5 - Player Systems & Accessibility (iterations 27-33)
Outcome: high-score persistence hardening, stats screen, tutorial hints, reduced-motion + FX quality, touch controls.
Gate: reload keeps best; touch can start a game; reduced motion visible in settings.

## E6 - Polish, QA, Gates (iterations 34-50)
Outcome: balance passes, perf pass, code review, bugfix rounds, playtest report,
regression suite green, vertical-slice gate passed, milestone review + release checklist.
Gate: all tests green, build green, browser regression clean, docs complete.

## Risk Register
- R1 FPS drop from entity churn -> pooling (E6 perf), Low if done in E3/E4.
- R2 Scope creep beyond 5 power-ups -> hard cap in GDD.
- R3 Audio autoplay policy (no user gesture) -> init on first input; tested in smoke.

## E7 - Extended Content, UX, Hardening & Release (iterations 51-100)
Outcome: content depth (wave modifiers, golden rocks, mines, boss monolith, overdrive),
UI/UX polish (menu, top-5 scores, accessibility), robustness (adaptive quality, context loss,
determinism + soak harnesses), feel/audio pass, and a second full QA/release cycle.
Gate: 100+ iterations logged, all tests green, build green, extended regression clean, playtested twice.

### E7A Content (ST-051..064)
- Wave modifiers, golden asteroid, near-miss bonus, mine drones, Monolith boss (every 5 waves) + enemy bullets,
  overdrive power-up, endless difficulty curve, gravity vortex hazard.
- Visual content: starfield twinkle/parallax, rim-lit rocks, bullet trails, shield pulse, engine flame.
- Balance pass 3 (new content vs pacing).

### E7B UI/UX (ST-065..072)
- Menu polish, top-5 score table, options panel polish, pause overlay, game-over celebration,
  colorblind-safe power-up glyphs + a11y, mobile/responsive polish, UI text pass.

### E7C Robustness & Perf (ST-073..080)
- Adaptive quality (auto FX downgrade), pool/memory audit, WebGL context-loss recovery,
  determinism harness (fixed input+seed replay), 10-min headless soak, resume/clock sync,
  storage versioning + corruption guards, debug overlay (pools/drawcalls/fps).

### E7D Feel & Audio (ST-081..088)
- Hit-stop + camera punch, dynamic FOV, audio stingers/jingles, spatial pan + compressor,
  vignette, per-entity particle palettes, sound-level pass, UI motion pass (reduced-motion safe).

### E7E QA & Release (ST-089..100)
- Regression round C, playtest v2, bugfix round C, balance pass 4, UI/UX final pass,
  docs (GDD addendum, architecture, README v2), perf re-verification, 100-iteration gate check,
  milestone review + retrospective v2, release checklist v2, final polish sweep + closing.

### E7 Risks
- R4 Boss scope creep -> single boss type, fixed HP/schedule, unit-tested spawn logic.
- R5 Adaptive quality masking real perf bugs -> log auto-downgrade events, keep debug overlay.
