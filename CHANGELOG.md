# Changelog - Void Runner

## [Unreleased]
### Added
- I01: project scaffold (Vite + three.js), renderer boot, polar grid arena, resize handling.
- I02: seeded RNG (mulberry32) + math utils (damp, v2 helpers, angle helpers) with unit tests.
- I03: central CONFIG table (arena/ship/weapon/asteroid/wave/combo/powerup/fx/storage) with schema tests.
- I04: procedural two-shell starfield (soft additive glow sprites, seeded) + scene fog + hemisphere lighting.
- Plan extended to 100 iterations (E7: extended content, UI/UX, hardening, second QA/release cycle).
- I05: ship core (inertial movement, arena clamp, damped aim, invuln/knockback) + 7 unit tests.
- I06: procedural ship mesh, mouse raycast aim, follow camera with look-ahead, keyboard/mouse input state.
- I07: weapons core (bullet pool/cap, cadence, spread, culling) + 8 unit tests.
- I08: pooled bullet rendering + Space/click firing wired to aim.
- I09: asteroid field core (rim spawn, bounce, splits, caps, seeded) + 7 unit tests.
- I10: asteroid rendering (noise-baked low-poly variants, pooled, tumble).
- I11: collision helpers (circles, bullet/ship vs rocks) + 6 unit tests.
- I12: World orchestrator (full collision loop, events), fixed-timestep sim, deterministic advance() hook.
- I13: score + combo chain (window/cap/step, damage+timeout reset) wired into World; 7 new unit tests.
- I14: wave director (escalating ramp, trickle spawn, intermission, clear detection) + 7 unit tests.
- I15: lives manager + state machine (MENU/PLAYING/PAUSED/GAME_OVER) + 8 unit tests.
- I16: DOM HUD (score/wave/lives/combo meter, change-cached text).
