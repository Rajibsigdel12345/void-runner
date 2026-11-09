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
- I17: menu/pause/game-over screens, Enter/P-Esc/M session keys, no auto-start on load.
### Fixed
- I17: World.reset() crash (assignment to gameOver getter) caught by new tests.
- I18: persistent best score + settings (injected store, guarded reads, NEW BEST flag, survives reload).
- I19: power-up field core (drops, drift, magnet pull, timed effects, instant bomb queue) wired into World.
- I20: power-up render meshes (pooled, per-type shape/color, hover + pulse).
- I21: RAPID + SPREAD fire path — power-ups modify cadence (x2 for 8s) and 3-way spread burst.
- I22: SHIELD absorption — cyan ring around ship, absorbs 1 hit with pop flash (GDD-compliant).
- I23: BOMB shatter-all (per-rock kills feed combo) + MAGNET bullet homing (slight, 6s).
- I24: pooled particle bursts on kill/hit/shield-pop/bomb (FX-tier aware, reduced-motion aware).
- I25: screen shake, hit flash and invulnerability blink (FX-tier + reduced-motion aware).
- I26: settings panel (volume, sfx, fx tier, reduced motion) with live persistence.
- I27: synthesized WebAudio SFX for all gameplay events (gesture-init, volume/sfx/mute aware).
- I28: wave banner + intermission countdown.
- I29: audio polish - compressor, stereo pan, pitch jitter, wave-clear and game-over stingers.
- I30: floating score popups (+points) at kill position; big gold for combo-multiplier kills.
- I31: game-over stats (kills, max combo, time survived, wave reached).
- I32: tutorial hint on session start (controls line, fades after 6s, reduced-motion aware).
