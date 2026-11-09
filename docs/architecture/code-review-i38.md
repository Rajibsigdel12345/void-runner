# Code Review � I38 (ST-038)

- **Date:** 2026-11-09
- **Scope:** full game source � `src/core/*` (14 modules), `src/render/*` (14 modules), `src/main.js`, `index.html`, `tests/*`
- **Inputs:** `AGENTS.md` rules (DOM-free core, tunables in `config.js`, render syncs only, pools), `docs/architecture/README.md`, `design/gdd.md` (authority), iteration history I01�I37
- **Method:** line-by-line read of every module; arithmetic/edge-case probing in node (I37 patterns); browser smoke of the one code change

## Summary

All 28 modules reviewed against the architecture rules. The core/render split is held consistently: no DOM or three.js import in `src/core/*`, no simulation writes from `src/render/*`, all tunables in `CONFIG`, all pools bounded (bullets 64, rocks 24, particles 512, popups 12, drops 4). One in-scope maintainability fix applied (magnet pull acceleration moved to config). **Verdict: APPROVE** � no blockers; two robustness items deferred to I43 (already planned).

## Correctness

Verified clean (evidence in Verification):

- **State machine:** `GameState.to()` gates all transitions; `World.step` early-returns outside PLAYING; Enter side-effects gated to MENU/GAME_OVER (I37 fix held).
- **Determinism:** all randomness flows through seeded `RNG`; session seed in `main.js`; no `Math.random()` in `src/core/*` (only in render-only audio/particles jitter, which is cosmetic and documented).
- **NaN/zero-guard paths:** `v2Norm` (`l || 1`), homing `sp || 1`, ship-aim `atan2` on valid points, collision knock `hypot || 1`, asteroid rim normal `d || 1`.
- **Pools:** ring/compact lifecycles are leak-free � `particles.live` counter increments on park-then-reuse and decrements exactly at park; `weapons.compact`/`field.compact` only remove flagged dead; no mutation of an iterated array (bullet loop flags dead, compacts after; rock spawns land outside the bullet loop).
- **Fixed timestep:** 60 Hz substeps, `frameDt` clamp 0.25 s, backlog dropped at MAX_SUBSTEPS=8 (no spiral of death).
- **Composer stats (I36):** `autoReset=false` + read-in-`syncVisuals` + reset-before-render ordering is correct.
- **Storage:** every access try/caught; values re-validated on both read and write (whitelist, clamped).

Findings:

| # | Sev | Finding | Disposition |
|---|-----|---------|-------------|
| C1 | info | Asteroid/powerup rim bounce divides by `|pos|+radius`, so the "normal" is slightly non-unit. Converges geometrically; rocks rest on a ~0.1 u band at the rim. No escape possible (probed in I37: max r 25.10+0.9 = 26). | Accepted; revisit only if I43 shows drift |
| C2 | info | `shipHitRock` returns the first rock in array order, not the nearest, so knock direction on multi-rock overlap is arbitrary. | Game-feel nit; no fix needed pre-slice |
| C3 | defer | No `visibilitychange` auto-pause (rAF throttle + dt clamp make hidden-tab behavior graceful, but sim time keeps walking). | **I43 edge cases** (planned) |
| C4 | defer | No `webglcontextlost`/restored handling. | **I43 edge cases** (planned) |
| C5 | info | `main.js` assumes `#flash`/`#app` exist. Verified present in `index.html`. | Guard candidate if I43 adds robustness pass |

## Maintainability

Strengths: zero per-frame allocation in hot paths (opts reuse since I36, change-cached DOM text everywhere, hoisted scratch vectors); every render pool sized over its core cap with headroom comments; module JSDoc on all public APIs; comments cite the ST/iteration that introduced behavior.

Findings:

| # | Sev | Finding | Disposition |
|---|-----|---------|-------------|
| M1 | fixed | Magic number `acc = 40` in `powerups.js` with a stale "(tune in I34)" comment � violates the tunables-in-config rule. | **Fixed this iteration:** `CONFIG.powerup.magnetAccel = 40`, consumer updated, schema check added to `tests/config.test.js`. Behavior identical (verified numerically). |
| M2 | note | Ship hover height `0.4` duplicated across bulletPool/asteroidRenderer/shieldRing (powerupMesh uses 0.45). | Housekeeping candidate (I76/I79) |
| M3 | note | `audio.js` duplicates arena radius as `ARENA_R = 26` with a keep-in-sync comment (module is deliberately dependency-free). | Accept; flag if it drifts |
| M4 | note | `advance()` references `STEP` before its declaration (works: called only after module evaluation). | Cosmetic; reorder in future housekeeping |

## Security

- No HTML injection surface: all dynamic DOM text goes through `textContent`; all style writes are static strings or finite numbers.
- No `eval`/`Function`/`innerHTML`; no network fetches; no secrets.
- `localStorage` fully guarded (private-browsing degrade path tested by design); payloads re-validated on read **and** write.
- URL params: only `?fps` read (strict `=== '2'` comparison). `?dbg` lands in I80 with its own review.

**Verdict: no findings.**

## Review Verdict

**APPROVE.** One in-scope fix applied (M1). No blockers for the vertical-slice gate track. Correctness is evidence-backed (tests + browser probes), not assumed.

## Risks

- **Low.** Deferred items (C3/C4) are known, planned for I43, and currently graceful (no crash/spiral modes).
- Perf headroom: 40 draw calls / 1638 tris under wave-4 load with bloom on � far from any budget risk at current scope.
- Balance risk unchanged by this review (M1 is a value-preserving move).

## Changed or proposed files

Changed (I38):
- `src/core/config.js` � +`powerup.magnetAccel`
- `src/core/powerups.js` � consumes config value; stale comment fixed
- `tests/config.test.js` � +validity check for `powerup.magnetAccel`

Proposed (deferred, no code this iteration):
- I43: `visibilitychange` auto-pause, WebGL context-loss recovery, `#flash` null guard
- I42 bugfix-B: **no candidates found** � nothing rose to bug severity

## Verification evidence

- `node scripts/run-tests.mjs` ? **117/117 pass, 0 fail**
- `node scripts/build.mjs` ? exit 0 (dist assembled)
- Browser smoke (Playwright, `http://localhost:5173/`): **0 console errors**; session started via Enter; magnet pull path (the changed line) exercised live � drop at dist 5.83 inside the magnet ring accelerated to **20.00 u/s after 0.5 s** (expected `40 � 0.5`) and was pulled 5.83 ? 3.63 from the ship
- Screenshot: `.evidence/i38-review-smoke.png`

## Next owner or decision

? **I39 (ST-039): balance pass 2** (producer/design owns; inputs: this review's no-blocker verdict + I41 playtest data when it lands).

## I43 Closure (2026-11-13)

- **C3 - CLOSED (I43):** `visibilitychange` auto-pause added in `src/main.js` - entering hidden state while PLAYING pauses the game; resume returns to PLAYING. Browser-verified (hidden -> PAUSED -> resume OK).
- **C4 - CLOSED (I43):** `webglcontextlost` -> `preventDefault()` + auto-pause; `webglcontextrestored` -> `renderer.setSize` + bloom resize + `renderer.info.reset()`, forcing render-target re-allocation. Browser-verified via `WEBGL_lose_context` during PLAYING: auto-paused, render is a guarded no-op during loss (three r160 `render()` early-returns while `_isContextLost`), and after restore three r160 `onContextRestore -> initGLContext()` reinitializes all internals (program cache, properties, textures, info) - no vendor patch needed; healthy frame renders post-restore.
- **C5 - CLOSED (I43):** `#flash` DOM writes in `syncVisuals` now guarded with `if (flashEl)`. Verified: removing `#flash` + forcing a hit causes no exception.
- **C1 drift check (related):** the I43 5-min seeded NaN soak (`tests/soak-nan.test.js`, World seed 20260113 / intent RNG 777) shows no rim/position drift and no NaN in any world field over 18,000 substeps.
- **Note (documented, not fixed):** after context restore, three r160 emits ~39 harmless `WebGL: INVALID_OPERATION: delete` warnings from its own stale-context object cleanup during reinit. No action required.
