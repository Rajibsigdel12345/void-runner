# Brainstorm - Void Runner (cgs-brainstorm)

## Core Fantasy
You are the last pilot of a deep-space salvage frigate. A wormhole malfunction
dumped you into an asteroid storm. Fly, break rocks, chain kills, and survive
as long as the storm lets you. Every shattered asteroid splits into faster
fragments - momentum and positioning are the game.

## Player Verbs
- Fly (WASD / arrows - inertial thrust with damping, no rotation lock)
- Aim with mouse (ship faces cursor on the arena plane) - Space / click to fire
- Grab power-ups that drop from shattered rocks
- Watch the wave counter and adapt (waves escalate speed + density)
- Chain kills within the combo window for score multipliers

## Pillars
1. **Momentum matters** - inertia-based flight; overshooting is on you.
2. **Every kill counts** - visible score pop, particles, and combo feedback on every destruction.
3. **Escalating tension** - waves get denser and faster; power-ups reward aggression.

## Audience
Casual-to-core arcade players, 3-10 minute sessions, desktop browsers.
Local high score (no account, no network).

## Constraints
- three.js + Vite only; no game framework, no external asset downloads.
- All audio synthesized with WebAudio (no MP3 files).
- Core logic DOM-free and unit-testable (node --test).
- 60fps target on mid-range hardware; object pooling for bullets/particles.

## Scope Tiers
- **T1 - MVP loop (required)**: fly, aim, fire, asteroids spawn/drift/split,
  collision damage, lives, waves, score, game over, menu, pause, high score.
- **T2 - Full slice (required for vertical slice gate)**: 5 power-ups
  (rapid, spread, shield, bomb, magnet), combo multiplier, particles,
  screen shake, synthesized SFX + ambience, settings (volume/SFX/FX quality).
- **T3 - Polish (stretch)**: bloom post FX, touch controls, stats screen,
  wave banners, tutorial hints, reduced-motion option, perf pass.

## Risks
- Scope creep on power-ups -> capped at 5 power-up types.
- three.js scene-graph churn killing FPS -> pooling + shared geometry enforced.
- "Just playable" feel -> dedicated juice iteration (shake, flash, pop) before gate.

## Open Questions
- Mouse-aim plane vs fixed 2.5D plane? -> Decision: arena is a horizontal
  plane at y=0; camera orbits slightly above; aim = raycast to y=0 plane. (accepted)
