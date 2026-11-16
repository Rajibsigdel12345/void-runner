# Art Task List - Void Runner (E59, I459)

Budgeted, ranked execution list from design/art-direction-research-E59.md.
Every P0/P1 row carries a numeric budget + verifiable acceptance line + gate.
P0 envelope: <= 100 KB dist + <= 1,000 tris + zero core (causal stays EXACT).

Budget context: dist headroom 126,662 B (ceiling 3,000,000; floor keeps
>= 102,400), GLB tri headroom 1,221 (cap 30,000), 26 GLBs / 1,016.33 KB.
Frozen (do NOT touch): bloom 0.6/0.35/0.72, I334 grade, vendor r160 pin,
WebGL2, core logic, enemy E57 luma ladder.

## P0 (execute in I460 = ST-429)

### A1 - Player L3 bullet: restore cool-vs-warm separation
- Goal: player bullets never share the threat family; level 3 reads as
  "stronger player", not "warmer threat".
- Approach: change config fx.palette.bulletLevel[2] from 0xffd27a (amber)
  to a saturated cool value outside the threat hue band; keep L1/L2
  (cyan/green). Candidate: electric blue 0x6fa8ff or ice-white 0xd6f6ff
  (decide from busy-moment A/B screenshot in I460). Render-only: bulletPool
  already recolors from config (ST-123).
- Budget: 0 KB dist (config constant swap, no new code) + 0 tris.
- Acceptance: hue separation L3 vs enemy 0xff4a2a >= 90 deg; busy-moment
  screenshot (boss ring + barrage) shows zero L3/enemy-bolt confusion at a
  glance; causal EXACT.
- Gate: causal EXACT required; playframe pins unchanged (render-only).
- Deps: none.
- Deferral: none - this is the top readability lever.

### A2 - Enemy silhouette rim (shared fresnel injection)
- Goal: solid-black-test silhouettes hold at distance; light rim on dark
  background (research: rim beats outline in space).
- Approach: one shared onBeforeCompile fresnel-rim injection (same pattern
  as the asteroid rim I257), applied to the 7 enemy mesh modules via a
  small shared helper in src/render/. Rim color = per-role identity accent
  (hunter threat-red, stinger cyan, gunship amber-bay, warden steel, drone
  steel-cyan, flyer magenta, mine rust), intensity low (<= 0.35 base) so it
  never re-tunes the bloom threshold.
- Budget: <= 8 KB dist (one helper + 7 call sites) + 0 tris.
- Acceptance: grayscale-screenshot audit of each role at 12u distance passes
  silhouette-first test; worst busy-moment frame delta <= 2 ms (measured,
  desktop probe); RM-gated (off under reduced motion if it reads as
  motion-clutter); causal EXACT.
- Gate: causal EXACT + perf probe at busiest moment; playframe may re-pin
  with decomposition (tri counts unchanged, material shader change does not
  change tri/draw counts - verify draw calls unchanged in probe).
- Deps: none (A1 independent; A2 can land in the same iteration).
- Deferral note: if the 7-module injection lands > 8 KB or > 2 ms, defer to
  the top-3 roles only (hunter/gunship/warden) and note in the task list.

### A3 - Shader-stable ship damage flash
- Goal: "I got hit" reads instantly without per-hit lights (shader-stable
  pattern from research; avoids shader recompilation at contact).
- Approach: pre-created transparent overlay shell around the ship
  (MeshBasicMaterial, additive, unlit, one extra draw call), opacity
  animated from the existing damage event; <= 120 ms envelope. Reuses the
  existing hit event already driving haptics/audio.
- Budget: <= 4 KB dist + 0 tris (low-poly shell reuse of ship bounding
  geometry, ~200 tris max - within tri headroom 1,221).
- Acceptance: hit -> flash visible < 2 frames; worst busy-moment frame
  delta <= 1 ms; no draw-call increase at idle (visible=false when out of
  envelope); RM-gated; causal EXACT.
- Gate: causal EXACT + perf probe; playframe re-pin allowed (draw call
  appears only during flash - MENU probe unaffected).
- Deps: none.
- Deferral: none.

P0 total: <= 12 KB dist (of 100 KB envelope), <= 200 tris (of 1,000), zero
core. Dist headroom after P0: >= 114,662 B.

## P1 (E60 candidates, ordered)

### B1 - UI/world role-named palette (docs + config refactor)
- Goal: palette lives in one role-named section (bodyPrimary/hazard/reward/
  shield/emissiveSignal per the threejs-game-studio material kit), values
  unchanged.
- Budget: 0 KB (rename + comments only). Acceptance: every world/UI color
  traceable to one named role; 8-12 values total documented; zero behavior
  change (causal EXACT + byte-identical dist except comments... note: config
  IS shipped, so expect a small KB delta <= 2 KB for comment lines).
- Gate: causal EXACT; dist delta measured.

### B2 - Boss "warning" pre-card before stage-boss intro
- Goal: one beat of dread before the stage boss (research: presentation
  hierarchy; waveBanner already has showBoss).
- Approach: extend waveBanner with a warning state (dimmed red sub-line +
  1.0 s pre-delay) driven from the existing boss events in game.js.
- Budget: <= 3 KB. Acceptance: warning -> intro sequence <= 3.2 s total;
  no new DOM nodes > 1; RM-safe (no pulse, static dim).
- Gate: causal EXACT (presentation-only); playframe EXACT (MENU frame).

### B3 - Starflare layer (brightest stars)
- Goal: 3-layer star pattern (core/glow/flare) for the top ~2% brightest
  stars only; per-star aPhase rotation.
- Budget: <= 6 KB; one extra draw call (flare clone) per shell.
- Acceptance: flares visible at near shell only (far-shell deferral per
  unknowns); <= 1 ms busy-moment delta; RM-gated.
- Gate: causal EXACT + perf probe.

### B4 - Engine afterburner ribbon (sustained high-thrust trail)
- Goal: motion trail behind the ship at sustained thrust (ring-buffer
  Points, pooled, zero GC - the ship already has the layered flame; this
  adds the motion channel, not the flame).
- Budget: <= 8 KB. Acceptance: zero per-frame allocs (probe with
  performance.measure over 10 s); trail clears on death (research pattern);
  RM-gated; <= 1 ms.
- Gate: causal EXACT + perf probe.

## P2 (deferred; note only)

- C1 Bomb pickup hue: 0xff5252 sits in the threat family; move to a
  distinguishable warm (e.g. 0xffa84a) OR keep (box + "B" glyph mitigate).
  Decide after A1 lands (avoid two changes to the same hue-space in one
  playtest). 0 KB.
- C2 Value-band audit: floor vs actors at 3:1 (grayscale screenshots,
  docs-only audit -> feed B1).
- C3 Dynamic background fade/fog for distance depth (advanced; perf risk).
- C4 Nebula shells (3 BackSide icosahedron parallax layers) - stage themes
  already re-tint; measure need before building.

## Execution order (I460 = ST-429)
1. A1 (config swap + A/B screenshot decide), 2. A2 (rim injection),
3. A3 (damage flash). All three in one iteration only if the combined
budget holds (<= 12 KB + 200 tris) AND the perf probe at the busiest
moment passes; otherwise A1+A2 land, A3 defers to I462 (E60).
I461 = ST-430 fresh R1-R5 + G59.0 gate + E59 close (full bar: causal461
EXACT + playframe + cam + ship views + PWA 11/11 + hygiene).