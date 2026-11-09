# Retrospective - Void Runner M1 (I01-I48)

- Date: 2026-11-13
- Skill: cgs-retrospective
- Scope: I01-I48 (E1-E6)

## Summary
48 iterations, 48/48 holding the quality bar (tests green + build green + logged entry per commit). The determinism-first strategy (seeded RNG + synchronous scripted probes) and the early perf budget are the two biggest drivers of a clean milestone; the main friction was mechanical (file EOL/BOM drift, console-evidence scoping, ad-hoc probe helpers). All friction items have a mitigation landed or scheduled.

## Went Well
1. Per-iteration quality bar held 48/48: every commit is tests-green + build-green with an iteration-log entry; no regression was ever carried across an iteration (suites re-run green at I40/I45/I46).
2. Determinism-first: seeded rng.js + synchronous __vr.advance probes gave a fully reproducible scripted browser regression with zero rAF flakiness; 122 unit tests pin seeds.
3. Early pooling + the I36 perf budget: a draw-call target set once (I36) and re-checked at every gate (I45, I46) - zero perf regressions in 48 iterations.
4. Playtest before the gate (I41) found a real design gap (F1: wave-1 stall) that unit tests could not see; fixed I42 with regression coverage before the gate could have blessed it.
5. Code-review close loop worked: I38 found C1-C5, each got an owner iteration, and C3/C4/C5 were closed with evidence at I43 (no silent drops).
6. CGS artifacts (qa-plan, gates, playtest-report, balance-notes) turned gate decisions into checklists with evidence instead of vibes.

## Did Not Work
1. File EOL/BOM drift (PowerShell CRLF defaults vs LF sources, hud.js BOM) caused patch failures; an anchor prefix-match slip at I42 (bare } anchor matched });) cost a rework.
2. Console "0 errors" evidence was ambiguous for early iterations: session-accumulated warnings from dev-server module-graph reloads (page left open while editing) vs page-scoped counts took a few iterations to standardize.
3. The first I46 perf probe measured an unfair scene (live ship -> hit particles + M->S splits inflated calls/tris); the scene-pinning rule (park ship, hold exactly N rocks) had to be invented mid-probe.
4. Probe helpers (parkWaves, spawnAt, touch synth) were re-derived each iteration with no shared library - duplicated effort and the source of the probe bugs above.
5. Docs drifted behind reality: AGENTS.md still said "Vite" and src/audio/ (project is no-bundler import maps + src/render/audio.js); caught only at the I47 docs pass.

## Root Cause
- EOL drift: no single writer convention across 40+ iterations of PowerShell (CRLF) + hand edits (LF). Mitigation landed: exact-match apply() patch helper with EOL variants + per-file EOL notes in iteration entries.
- Console ambiguity: no rule that "0 errors" is scoped to the current page load (since last navigation). Now documented in iteration entries (I44/I46) and probe-notes.
- Probe bugs: probe code written inline per iteration with unstated assumptions (e.g. parkWaves before start). Now consolidated with known gotchas in production/probe-notes.md.

## Action Item
1. (done, I48) AGENTS.md accuracy fix (no-bundler engine description, command ports, audio path).
2. (done, I48) production/probe-notes.md - reusable probe patterns + gotchas for I89-100 regression reuse.
3. (I49) Release checklist v1 - first dist build measurement (size/load/console-clean); keep as a gate, not a formality.
4. (I90) Human playtest of F2 (invuln fairness in dense waves) + F4 (combo cap reachability). Acceptance: no unexplained deaths in dense waves while chaining; combo cap reachable in a normal run.
5. (I92) Balance pass 4 incorporating I90 results.
6. (E7C, ST-073+) Adaptive quality for low-end devices (R6 mitigation, log auto-downgrade events).

## Blocking issues
None blocking the E7 transition.

## Changed files or proposed files
- production/retrospective.md (NEW: this artifact)
- production/milestone-review.md (NEW: sibling artifact)
- production/probe-notes.md (NEW)
- AGENTS.md (accuracy fix only - no instruction semantics changed)

## Verification evidence
No source changes: Suite A 122/122 + build 0 re-run this iteration; iteration header sequence 1..48 verified after this entry is appended (checked by the I48 log verification step).

## Next owner or decision
ST-049 (I49): cgs-release-checklist v1 - SHIP/NO-SHIP on the slice build.
