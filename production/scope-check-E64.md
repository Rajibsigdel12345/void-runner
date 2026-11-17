# Scope check - E64: Linear Levels, Level Design, End-of-Level BOSS (I484, ST-451)

## Summary
E64 converts the infinite wave arena into a LINEAR 3-level campaign: fly forward through distinct
zones, clear each level, fight an end-of-level BOSS. Grounded in design/e64-linear-levels-research.md
(F1-F7, LABELED sources). This iteration (I484) is DOCS-ONLY (research + scope + epic + stories); zero src.

## Scope fit
- Directly answers the user request: make it a linear game, move through the space and clearing levels,
  with a boss at the end of each level.
- Builds ON closed work: E63 enemy roster (sentry/wasp/pod/hunter/gunship/flyer/stinger/drone/warden),
  existing BOSS wave infra + boss.glb, E62 camera invariant (constant view angle wherever the ship is),
  E61 ship v5, 28-GLB asset pipeline.
- Bounded: 3 levels (data-driven, extensible to 5 later), 3-4 zones each, 1 boss each. Reuses existing
  enemy/projectile/arena systems; adds a level state machine, a flight path, zone identity, a boss, HUD,
  persistence.

## Stories (ST-451..458)
- ST-451 (I484, this, docs-only): research + scope + epic + stories.
- ST-452 Level model + data: NEW src/core/level.js (pure - level/zone sequence, forward distance ->
  current zone, checkpoint list, clear/win logic) + LEVELS array in src/core/config.js (3 levels x 3-4
  zones: name, length, paletteId, hazardProfile, enemyMix, optionalTargets, checkpointAt) + i18n en/zh/ja.
  Zero sim change (model only). Tests for the pure model.
- ST-453 Level state machine in game.js: drive zone transitions by forward distance; checkpoint /
  continue-on-death (Ikaruga F6) instead of wipe-to-menu; wire LEVELS into the spawn driver. THE big one -
  seeded pinned runs WILL drift here; re-pin causal + playframe WITH measurement + document (I482 pattern).
- ST-454 Linear flight path + camera framing: a curved, banking, elevation path (the race line) through
  the arena; camera frames the path ahead (E62 invariant holds - no rig rebuild). Move-through-space feel.
- ST-455 Zone identity + illusion-of-space vistas: per-zone palette/hazard/enemy mix; background vista
  silhouettes (far, low-poly / billboard, visible not enterable); level starts in one identity and ends
  different (F1/F3). Blender vista props ONLY if the tri budget allows (else procedural, the default).
- ST-456 End-of-level BOSS: one boss per level; vertical health bar; a glowing weak point; 2-3 telegraphed
  phases with a posture/scale change; move sets from existing enemy projectiles (F5/F7). Boss derives from
  boss.glb (retint + scale variant = 0 new tris) to protect the 28-GLB / tri budget (Blender variant only if
  0-new-tri).
- ST-457 HUD + persistence: level number + zone name; vertical boss bar; checkpoint indicator;
  localStorage highest-level (continue); existing scoreboard untouched.
- ST-458 G64.0 close gate: fresh causal (re-pinned WITH measurement) + playframe (re-pinned) + level-flow
  probe + boss probe + HUD probe + PWA 11/11 + quality bar + AGENTS.md refresh + bookkeeping + commit.
  E64 CLOSED.

## Cut ladder (in order, to hold the dist close floor)
- C1 Drop the 3rd level (ship 2 levels; data-driven so trivial to add later).
- C2 Vistas procedural-only (no new GLB) - already the default.
- C3 Single-phase boss on the 2 secondary levels (level 1 keeps full 3-phase).
- C4 Drop localStorage continue (levels always start at 1; scoreboard keeps best).

## Dist + asset policy (pre-registered)
- dist ceiling 3,250,000 UNCHANGED at open; close floor = 102,400 B headroom (dist <= 3,147,600 at close).
  Current dist 3,140,263 B (headroom 109,737 B).
- PRE-REGISTERED RENEGOTIATION: if the E64 implementation (ST-452..457) pushes close headroom below
  102,400 B AND cut ladder C1+C2 cannot recover it, the ceiling renegotiates 3,250,000 -> 3,350,000
  (close floor 3,247,600), documented at the iteration where it fires (established renegotiation ceiling).
- Asset budget: 28 GLBs / 1,267,388 B / 34,938 tris (cap totalTris 36,000). A boss variant adds <= ~3,000
  tris ONLY if it is a new mesh (would need a measured totalTris re-pin); the DEFAULT is a 0-new-tri
  retint+scale variant of boss.glb so the asset contract stays FROZEN. Vistas procedural (0 new tris).
  MAX_FILE_BYTES 393,216 UNCHANGED.

## Re-pin expectations (pre-registered, measured at execution)
- causal456 (seed 9876) WILL drift when ST-453 lands (the wave driver becomes the level driver; the pinned
  W2 / 36.15 s run is an arena run, not a level run). Re-pin to the NEW level-1 early-run values WITH
  measurement + document (I482 pattern). playframe A/B re-pin similarly.
- Before ST-453 (ST-452 model-only), causal + playframe must stay EXACT (no sim change). Verify each story.

## Deferrals (out of E64)
WebGPU (E65). Camera-rig rebuild (E62 invariant holds). FX-identity change. Levels 4-5 (data adds later).
3D cockpit interior. Stage-practice QoL (out of genre scope). True open (non-linear) map.

## Risks
- R1 dist overflow (mitigate: cut ladder C1-C4 + renegotiation branch).
- R2 seeded-run drift breaks trust (mitigate: measure + document every re-pin; keep ST-452 model-only EXACT).
- R3 scope creep into a full level editor / non-linear map (mitigate: 3 linear levels, data-driven, no editor UI).
- R4 boss feels unlearnable (mitigate: F7 - move sets from existing projectiles + telegraphed phases + 1 weak point).
- R5 move-through-space reads as a hallway (mitigate: F1 vistas + F3 distinct zones + F4 curved/banking path).

## Changed files (this iteration, docs-only)
design/e64-linear-levels-research.md (NEW) + production/scope-check-E64.md (NEW) + production/epics.md
(E64 section) + production/stories.md (E64 stories + STATUS) + production/iterations.md (I484) +
production/timeline.md (I484) + production/session-state/active.md (I484).

## Verification
1076/1076 + build 0 + dist BYTE-IDENTICAL 3,140,263 B / 159 + vendor 76DEA8151BC9352A PIN_OK +
BOM audit 5/5/3/3/7/0 + hygiene (no servers).

## Next owner
I485 = ST-452 (level model + data + i18n, pure core, zero sim change).
