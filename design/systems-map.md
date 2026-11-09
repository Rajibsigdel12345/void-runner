# Systems Map - Void Runner (cgs-map-systems)

Dependency order (top = foundational). Priority: P1 = MVP, P2 = slice gate, P3 = stretch.

| ID | System | Depends on | Tier | Validation need |
|----|--------|-----------|------|-----------------|
| S01 | Seeded RNG + math utils | - | P1 | unit: determinism, bounds |
| S02 | Tuning config (balance table) | S01 | P1 | unit: schema sanity |
| S03 | Arena world (bounds, wrap/clamp) | S01 | P1 | unit: bound rules |
| S04 | Player ship model (inertia, aim) | S01,S03 | P1 | unit: integration step |
| S05 | Input mapping (keys->vectors) | S04 | P1 | manual smoke |
| S06 | Weapon: bullets + fire cadence | S04 | P1 | unit: cadence, pool size |
| S07 | Asteroid field: spawn/drift/split | S01,S03 | P1 | unit: split rules, counts |
| S08 | Collision (bullet/asteroid/player) | S04,S06,S07 | P1 | unit: hit/miss cases |
| S09 | Scoring + combo window | S08 | P1 | unit: combo math |
| S10 | Waves + difficulty ramp | S07,S09 | P1 | unit: ramp table |
| S11 | Lives + damage + invuln | S08 | P1 | unit: state transitions |
| S12 | Game state machine | S04..S11 | P1 | unit: transitions |
| S13 | HUD (DOM overlay) | S09,S10,S11,S12 | P1 | manual smoke |
| S14 | High score persistence | S09 | P1 | unit (mock storage) |
| S15 | Renderer: scene/camera/starfield | - | P1 | browser smoke |
| S16 | Renderer: ship/asteroid/bullet meshes | S15 | P1 | browser smoke |
| S17 | Power-ups (5 types, drop, pickup) | S07,S08 | P2 | unit: drop + effects |
| S18 | Particles + screen shake (juice) | S08 | P2 | browser smoke |
| S19 | Audio synth SFX + ambience, mute | S08,S12 | P2 | manual smoke |
| S20 | Settings (volume/SFX/FX) persist | S19 | P2 | unit (mock storage) |
| S21 | Bloom post FX | S15 | P3 | browser smoke |
| S22 | Touch controls | S05 | P3 | manual smoke |
| S23 | Stats + wave banners + hints | S12,S13 | P3 | manual smoke |
| S24 | Perf pass (pooling, draw calls) | S15-S18 | P3 | browser perf check |

## Build Order (iteration backbone)
Phase A (iterations 1-4):  scaffold, config, RNG/math, test harness, renderer boot
Phase B (iterations 5-14): core loop P1 systems S03-S14, HUD, states
Phase C (iterations 15-24): P2 power-ups, juice, audio, settings
Phase D (iterations 25-40): P3 polish, touch, bloom, stats, perf, balance passes
Phase E (iterations 41-50): QA, playtest, regression, gates, release checklist
