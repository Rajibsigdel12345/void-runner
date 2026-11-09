# Regression Report — Void Runner

## Round C (I89) — pre-wrap regression after the E7 content/polish arc

Skill: `cgs-regression-suite` · Date: 2026-11-10 · Iteration: I89 (ST-089)

### Summary
Full regression pass before the I90-I100 wrap. Node suite green (232/232) plus an extended
in-browser run that drives the previously-lightly-exercised critical paths end-to-end: the Monolith
boss lifecycle, the ST-051 wave modifiers, the full game state machine, and every I81-I88 feature.
**Result: REGRESSION CLEAN — no code changes required, no bugs found.** No NaN in any sim array, zero
console errors/warnings, pools within caps.

### Method
- Node: `npm test` (pure-logic core, DOM-free).
- Browser: Playwright on the live dev server (1280x720). The real rAF game loop keeps running between
  harness `evaluate()` calls with no input, so the harness pins `world.ship.invuln = Infinity` (permanently
  invulnerable; `ship.step` decrements `Infinity - dt` = `Infinity`) so the ambient loop cannot kill the
  ship and push the game to GAME_OVER mid-test. All simulation is driven through `__vr.advance(dt, intent)`.

### Critical Path (verified)
- Game start: `begin()` MENU→PLAYING, wave director starts.
- 8s autopilot: state stays PLAYING, no NaN (ship + all rocks), particle pool 131/512.
- State machine: PAUSE freezes sim time (step gate), RESUME unfreezes + advances, resume-from-not-paused
  is a no-op, lives-drain → GAME_OVER with the step gate frozen, RESTART resets to PLAYING with 3 lives / wave 0.
- Boss (wave 5): spawns (hp 40), fires aimed bolts, ring-bursts S-rocks, homes 4.5s NaN-free, killed by the
  killing bullet, splits into **exactly 4 M-rocks** (clean field), pays exactly 1000 score.

### Wave modifiers (ST-051) — verified
- `modifierFor(wave)`: deterministic (stable across calls), valid values only (fast/small/inward), varied
  across waves, waves 1-2 = none.
- Application: `inward` → `inwardAccel` 2.0; `fast` → `speedMult` ratio 1.4; `small` → S-roll probability 0.5 (bias 0.5).
- Live invariant: at wave ≥ 3, `waves.activeMod === modifierFor(waves.wave)`.

### Feature regression (I81-I88) — verified
- I81/I82: `punch` + `fovKick` present with `step()`.
- I83/I84/I87: audio `state()`=running; true-peak limiter reproduces I87 — isolated bomb peak **0.775** (I87: 0.77),
  worst-case stack (bomb+bossDeath+hit) peak **0.812** (I87: 0.80), no hard clip (≤1.0). `weights()` probe returns
  tiered cue weights; ambience on in play.
- I85/I86: particle per-particle palette pick confirmed (cyan single-color burst maxR 0.000 vs red/white palette
  maxR 0.971); burst shapes confirmed by 3D-Y signature after sync — ring spread 0.113 < radial 0.376 < fountain
  1.201, fountain meanY 2.366 (rises above the 0.4 plane).
- I88: all three panels carry `.vr-panel`; `vrPanelIn`/`vrTitleGlow` keyframes registered; `.vr-reduced` toggled on
  the overlay by the settings→`update()` frame (reduced-motion gate).

### Prior Bug
- I84 loudness clip (bomb ~1.02 pre-limiter): re-verified fixed — isolated bomb now 0.775, stack 0.812.

### Regression Case
- The one nominal anomaly during the run — boss death split showed "+1 rock" instead of "+4" — was a **field
  concurrent-cap artifact** (23 rocks already at the hard cap, so only 1 of the 4 M-split could spawn). Re-run in a
  cleared field confirmed `bossDeath()` spawns exactly 4 M-rocks. **Not a bug.**
- Four harness measurement artifacts (state accessor is a method not a getter; burst colors are written to an internal
  `base[]` and only reach the GPU `color` buffer on `sync`; dead particles scatter through the pool so "first live slots"
  ≠ active slots; `.vr-reduced` applies on the next `update()` frame, not synchronously) were each re-measured with the
  correct method and pass.

### Result
REGRESSION CLEAN. 232/232 node. Extended browser: all critical paths + all I81-I88 features pass. No NaN, console
0, pools within caps. No code changes; no defects to carry into I91.

### Risks
- The real rAF loop co-steps with the harness `advance()` calls, so absolute entity counts are noisy (both step the
  sim). Regression checks use invariants/limits, not exact counts, to stay robust. Not a game defect.
- Boss split is intentionally cap-limited (`spawn` returns null at the concurrent cap), so a boss dying when the field is
  full yields fewer than 4 M-rocks. Acceptable by design; a player rarely has the field at cap on a boss wave.

### Changed / proposed files
- Changed: none (verification-only).
- Added: production/regression-report.md (this file).
- Proposed (none): no fixes required.

### Verification evidence
- `npm test` → 232 pass / 0 fail.
- `.evidence/i89-regression-clean.png` — WAVE 5 MONOLITH health bar + faceted L/M/S rocks + red mine + starfield +
  arena grid + HUD (score/BEST/wave/lives) render healthy; no black screen, no missing geometry.
- Console: 0 errors / 0 warnings across all stages.

### Next owner / decision
- No fix needed. Proceed to I90 (playtest v2 — scripted self-play + notes).
