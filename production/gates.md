# Gates - Void Runner

## I45 - Vertical Slice Gate (ST-045)

- Date: 2026-11-13
- Skill: cgs-gate-check (advisory slice gate)

### Summary
Advisory gate on the I01-I45 vertical slice: is the full loop (menu -> play -> waves -> power-ups -> combo -> pause -> game over -> restart) present at representative quality? Entry criteria from production/qa-plan.md; QA Suite C (extended) executed in-browser this iteration.

### Gate Criteria (entry, from qa-plan.md)
1. Suite A green (node tests + build + 0 console errors) - 122/122 + build 0 + 0 errors (I44 run, re-verified this session).
2. Suite B green (8-step critical path) - green at I40; critical path re-exercised during this session's browser run (start / pause / resume / game over / restart / HUD / screens).
3. I41 playtest report filed - production/playtest-report.md (findings F1-F7, ordered recommendations).
4. No open bugs above minor severity - F1 fixed in I42; F2/F4 are design watch items (human playtest I90, balance I92), not bugs.
5. Perf within baseline - measured in the Suite C perf item below.

### Evidence (QA Suite C, executed this iteration)
- Storage round-trip: menu panel set to volume=1 / sfx=off / fx=low / reducedMotion=on -> full page reload -> stored == panel == live settings (all three layers agree).
- Resize mid-game: 800x600 -> 1600x800 while PLAYING -> 0 console errors/warnings; canvas CSS and drawing buffer both 1600x800 (composer resize path clean).
- Touch synth: single-finger tap -> 2 bullets live (FIRE_TAIL >=1-bullet guarantee); 70px drag -> thrust (1,0), ship vel +10.5 in drag direction, position advancing; two fingers -> PAUSED (0.45s cooldown gate intact).
- I43 robustness re-verification: visibilitychange hidden -> PAUSED (stays paused on visible; manual resume to PLAYING); WEBGL_lose_context while PLAYING -> PAUSED, restoreContext -> healthy render, same renderer/context alive, 0 errors.
- Perf @ wave 4 (?fps=2, 20 rocks + sustained mouse fire + bloom High): 60 fps / 16.6 ms / 37 calls / 1626 tris - within the I36 baseline (56-60 fps / 40 calls / 1638 tris).

### Concerns
- Perf headroom is machine-dependent: this gate ran on the dev machine; the low-end mitigation (adaptive quality, E7) stays on the plan.
- The perf scene reached GAME_OVER at the tail of the measurement window (ship struck by a test rock - the qa-plan probe rule to zero ship velocity was not applied for this run); the 0.5s meter window still reflects the full scene (21-22 rocks, live bullets).
- Touch automation is synthetic PointerEvents; real-device touch remains untested (acceptable at slice stage; flagged in qa-plan known gaps).

### Verdict
**PASS** - slice-gate entry criteria all met. Exit criteria (I46 regression green after I44, I49 release checklist clean) are scheduled at their own iterations.

### Risks
- R6 perf: ~40 calls / ~1638 tris is bloom-composer-dominated; adaptive quality (E7) is the standing mitigation.
- R5 input: synthetic touch verified; physical devices untested.
- F2 invuln fairness at high density: human playtest I90, possible balance fix I92.

### Changed files or proposed files
- production/gates.md (NEW: this artifact).
- No source changes this iteration (gate is evidence, not code - same pattern as I41).

### Verification evidence
- Suite A: 122/122 + build 0 (this session).
- Suite C browser run: 0 console errors on clean load; only info-level context lost/restored entries during the loss test; 0 errors/warnings after restore.
- Prior-iteration screenshots on record: .evidence/i44-menu.png, i44-hud-powerups.png, i44-paused.png (HUD/screens state at gate time); Suite C evidence is the behavioral transcript above.

### Next owner or decision
I46 (ST-046) final regression: full node suite + browser regression (Suites A+B+C re-run) + build; then I47 docs.
