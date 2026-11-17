# E64 Research - Linear Levels, Move-Through-Space, End-of-Level BOSS (I484, ST-451)

Research-first grounding for E64 (linear levels + level design + end-of-level BOSS). Per user
instruction, findings are grounded in LABELED sources (YouTube MCP + web) so nothing is invented
or overengineered. This is a DOCS-ONLY artifact (I484, zero src).

## Question
Convert the current infinite wave-based arena into a LINEAR campaign: the player flies forward
through space, clearing distinct LEVELS, each ending in a BOSS. How should levels, zones,
progression, and bosses be structured and framed, grounded in how the best linear space games do it?

## Sources (LABELED)
All from the E64 research pass (YouTube MCP: youtube_search + youtube_fetch). Transcript budget kept
low (5 transcript pulls total across E64; frames are cheap and not transcripts).
- [Y1] LDD ep67 "The Illusion of Space" (id GIDTGnp0QxQ)
- [Y2] Steve Lee "8 Common Layout Problems" (id wJEaWQz4180)
- [Y3] Luke McMillan on F-Zero track design (id 1EWJJppFs08)
- [Y4] "15 Shmups" (R-Type) (id 80yTJ8LHwa8)
- [Y5] Phirmth Ikaruga video essay, 101K (id wbfZoDQhK_8)
- [Y6] BLUE+STAR Star Fox 64 Goras boss, frames (id vDLrhwZCQhM)

## Findings

### F1 - Illusion of space in linear corridors (Y1)
In linear corridors, SHOW spaces you cannot enter: windows, side rooms, visible activity. The world
reads as lived-in and much larger than the playable width. Metro: a corridor only about 4-5 m wide
feels grandiose because you can SEE into adjacent spaces. It sells scale and narrative without
exposition and without widening the play field.
-> Implication: the Void Runner flight path is linear but 3D. Along the corridor, place background
   vista silhouettes (derelict hulls, gate frames, drifting station rings, distant activity) that are
   VISIBLE but not enterable. They are cheap (far, low-poly or billboard, unlit) and sell "moving
   through a real place".

### F2 - Linear does not mean identical (Y2, problem 6)
"Too linear" is the trap: never assume every player plays the level identically. Design a
POSSIBILITY SPACE - mistakes, distractions, missed things - so the same corridor plays differently
each run.
-> Implication: even a linear path must offer CHOICES: optional targets, powerup-vs-threat placement,
   avoidable hazards, bonus pods off the main line. The seeded RNG already gives per-run variety;
   layer deliberate choice on top.

### F3 - Every segment distinct; end somewhere different (Y2, problems 5 and 7)
Too empty -> lean RICH/DENSE, not sparse. Too samey -> every segment must be VISUALLY AND
INTERACTIVELY distinct; the level needs a beginning / middle / end and should END somewhere different
from where it started.
-> Implication: each level = a sequence of 3-4 ZONES, each with a distinct palette + hazard + enemy
   mix (a visual AND interactive identity). The level STARTS in one place and ENDS at the boss in a
   visually different one.

### F4 - Five metrics of a flight path (Y3)
F-Zero track quality = race line, clipping points, track width, camber (tilt), height variation.
The race line and clipping points are only discoverable BY DRIVING (not from a map). The course must
complement the vehicle physics. The structure is an arc of empower <-> vulnerability moments.
-> Implication: the flight path is a CURVE (not a straight line) with width, bank/tilt, and elevation
   variation. Skim-points (near-miss hazards) reward skilled line choice. Zone difficulty alternates
   tighten / release (vulnerability / empower).

### F5 - Polished linear shmup: bosses you want to see (Y4)
R-Type is the "platonic ideal" of the linear shmup: polished, detailed backgrounds with little
narrative vignettes, big crunchy explosions, and INTRICATE CREATIVE BOSSES that make you want the next
stage just to see what comes, with a natural difficulty curve (you have learned by the time the hard
waves arrive).
-> Implication: bosses are the reward at the end of each level - make each one visually distinct and
   inventive (different body, different move set, a visible weak point). Difficulty inside a level ramps
   naturally.

### F6 - Ikaruga pacing, per-stage theme, checkpoints (Y5)
A 25-minute run holds a "constant barrage of new situations and patterns" - "a brand new challenge
presenting or iterating upon itself every couple of seconds." Each of the 5 stages has a DISTINCT
MECHANICAL THEME (one stage is precision flying, another tactical forethought, another a harsher
learning curve). Crucially, DETH is a one-to-one counter for mistakes that "never actually sets your
progress back" - you continue from checkpoints, not from the level start. The final stage is a
HYPERCHARGED RECAP of an earlier stage pattern. Clean visual design "directly enhances the appeal of
any high level gameplay".
-> Implication: each LEVEL has a named mechanical theme (what it teaches / stresses). Within a level,
   checkpoints let a death continue from the last checkpoint rather than restarting the whole level
   (arcade-continue semantics, NOT the current wipe-to-menu). The final level recaps and escalates
   earlier mechanics.

### F7 - Boss readability: bar, weak point, phases, posture (Y6 frames)
Star Fox 64 Goras boss: a VERTICAL BOSS HEALTH BAR on the left; a glowing WEAK-POINT CORE you must
expose and shoot; MULTIPLE ATTACK PHASES (first dodge orbiting satellite mines, then the core opens);
the boss CHANGES POSTURE as the fight progresses (crouch -> upright -> defeated); environmental
hazards (spore towers) share the screen; the whole zone has a distinct orange bioluminescent identity;
a radar shows the formation.
-> Implication: every Void Runner boss gets (a) a vertical health bar (HUD, left), (b) a single glowing
   weak point vulnerable only in specific phases, (c) 2-3 telegraphed attack phases with a visible
   posture/scale change between them, (d) move sets built from the arena existing enemy projectiles so
   the language is learnable.

## Concrete implications for Void Runner (mapping to the existing build)
Current state: infinite wave-based arena; wave N every N seconds; a boss every 5 waves (5/10/15).
Seeded pinned runs: causal seed 9876 lands on W2 / 36.15 s; playframe B about 52 s. The E64 work must
NOT silently break these until it lands, and when the level logic does land the re-pins are measured +
documented (the I482 pattern).

1. LEVEL STATE MACHINE (on top of / replacing the wave driver): MENU -> LEVEL INTRO -> (ZONE 1 ->
   ZONE 2 -> ... -> ZONE n) -> BOSS -> LEVEL CLEAR -> next level (or GAME OVER / WIN after the last
   level). Per-level intro/clear transitions are short (no loading - the arena is one scene).
2. ZONE MODEL (data-driven, src/core/config.js): each level = an ordered array of zones; each zone =
   { id, name, length (forward distance), paletteId, hazardProfile, enemyMix, optionalTargets,
   checkpointAt }. The forward flight position (distance along the path) drives zone transitions.
3. CHECKPOINT / PROGRESSION (Ikaruga, F6): a death inside a level respawns at the last checkpoint (or
   the zone start), keeping score/progress - NOT a wipe to the menu. This is the key UX change from the
   current arcade wipe.
4. FLIGHT PATH (F4): a curved, banking, elevation-varying path through the arena (the race line); the
   camera frames the path ahead. The E62 chase invariant (uniform-scale dolly) already guarantees a
   constant view angle wherever the ship is, so no camera rebuild is needed - only the path.
5. ZONE IDENTITY + ILLUSION OF SPACE (F1/F3): per-zone palette + hazard + enemy mix; background vista
   silhouettes along the corridor (visible, not enterable); the level starts in one visual identity and
   ends (at the boss) in another.
6. END-OF-LEVEL BOSS (F5/F7): one boss per level; vertical health bar; a glowing weak point; 2-3
   telegraphed phases with a posture change; move sets built from the arena existing enemy projectiles.
   Bosses can derive from the existing boss.glb (a retint + scale variant) to protect the 28-GLB / tri
   budget (0 new tris by default).
7. DIFFICULTY CURVE (F5/F6): each level ramps naturally; the final level recaps and escalates earlier
   mechanics (Ikaruga F6).
8. HUD: level number + zone name; vertical boss bar; a checkpoint indicator.
9. PERSISTENCE: localStorage stores the highest level reached (continue); the existing scoreboard is
   untouched.

## What this does NOT do (scope guard)
- No new renderer / WebGPU (that is E65).
- No rebuild of the camera rig (the E62 invariant already holds; we only add the path + framing).
- No change to the frozen FX identity (bloom 0.6/0.35/0.72, I334 grade).
- Reuses existing enemy + projectile systems; bosses are compositions, not new physics.
- Vistas are cheap (far, low-poly / billboard); no extra sim cost.

## Source list (LABELED)
- Y1 LDD ep67 "The Illusion of Space" (GIDTGnp0QxQ) - linear-corridor vistas sell scale.
- Y2 Steve Lee "8 Common Layout Problems" (wJEaWQz4180) - density / distinctness / end-different-from-start.
- Y3 Luke McMillan on F-Zero (1EWJJppFs08) - 5 track metrics + empower/vulnerability arc.
- Y4 "15 Shmups" (80yTJ8LHwa8) - R-Type as the linear-shmup ideal; creative bosses; natural difficulty.
- Y5 Phirmth Ikaruga essay (wbfZoDQhK_8, 101K) - per-stage mechanical theme; checkpoints; final-stage
  recap; clean visuals enhance high-level play.
- Y6 BLUE+STAR Star Fox 64 Goras boss (vDLrhwZCQhM) - boss bar / weak point / phases / posture (frames).
