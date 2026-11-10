# Game Design Document - Void Runner

## Pitch
Void Runner is a 3D arcade survival shooter. Pilot a salvage frigate through an
escalating asteroid storm, break rocks into fragments, chain kills for combo
multipliers, and grab power-ups. Survive as long as you can.

## Core Loop (per second of play)
1. Fly with inertia; aim with mouse; fire.
2. Bullets shatter asteroids; big rocks split into 2-3 faster, smaller fragments.
3. Every kill = score x combo multiplier (combo decays after 4s of no kills).
4. Shattered rocks sometimes drop a power-up; flying over it applies it.
5. Hitting a rock costs a life + brief invulnerability. 0 lives = game over.
6. Waves escalate: each wave adds density + base speed; short "WAVE N" banner.

## Controls
- WASD / Arrow keys: thrust (inertial)
- Mouse: aim (ship + nose point at cursor on arena plane); Click or Space: fire
- P or Esc: pause / resume
- M: mute audio
- Enter: start / restart from menus

## Arena
- Horizontal plane, radius R = 26 units, centered origin, y = 0.
- Entities clamp to arena bounds (no wraparound) - walls are soft: velocity damped
  at the rim so the player can never leave.
- Camera: third-person, positioned above/behind ship, lerped follow, subtle look-ahead.
- Starfield (I60, presentation): procedural two-depth star backdrop. Per-star twinkle (0.72-1.0 brightness, 0.5-2.2 rad/s, seeded phase/speed/size) plus two-depth parallax (near 0.25x / far 0.6x camera offset) sell the sense of flying. Both freeze under Reduced Motion. Zero gameplay effect.

## Player Ship
- Speed model: acceleration A, max speed Vmax, damping D per second (inertial).
- Aim: ship Y-rotation eases toward the aim point; firing direction = aim direction.
- Fire: base cadence 5.5 shots/s; bullet speed 34 u/s; bullet lifetime 1.1s.
- Bullet trails (I61, presentation): each shot carries a short additive comet streak (1.15u, head-bright -> tail-fade) laid flat in the arena along the shot's velocity. Visual feedback only; no gameplay effect.
- Engine flame (I63, presentation): a rear additive plume (orange + hot core) that appears and scales with thrust magnitude and flickers over sim time; hidden when coasting; steady (no flicker) under Reduced Motion. Visual feedback only; no gameplay effect.
- Lives: 3. On hit: -1 life, 1.8s invulnerability (blink), knockback, screen shake. (I92: 1.6->1.8 for more reposition headroom after a hit)
- Game over at 0 lives.

## Asteroids
- 3 sizes: L (r=2.2) -> splits into 2-3 M; M (r=1.3) -> splits into 2-3 S; S (r=0.7) -> no split.
- Score: S=100, M=50, L=25 (smaller = more points, reward risk).
- Motion: constant drift (per-size base speed) + slow tumble; no steering.
- Spawn: outside visible area, inside arena; capped concurrent count per wave.
- Golden variant (ST-052): from wave 3 each rim spawn has a 5% chance to be GOLDEN - a glowing gold rock that flies 35% faster and pays 5x its size score on kill (popup flashes gold, bigger burst). Splits are never golden; golden fragments are normal rocks. Rare reward for chasing a fast target.
- Rim light (I60, presentation): the rock material carries a cool fresnel edge (strength 0.5, #5f7fd8) over its standard flat-shaded lighting so silhouettes catch a blue rim. Golden rocks are untouched. Presentation only, zero gameplay effect.

## Mine Drones (ST-054)
- From wave 5, each wave adds one MINE DRONE: a small red spiky mine that slowly homes on the ship (constant 3.2 u/s, turn rate 1.6 rad/s - always slower than the ship, always dodgeable).
- 1 bullet destroys a mine (+150, feeds the combo like any kill; red pop + shake). Touching the ship costs a life like a rock (mine is destroyed, knockback + invuln apply).
- Cap: 10 concurrent mines. They bounce off the arena rim like rocks.

## Seeker Drones (ST-117)
- From wave 8, each wave adds one SEEKER DRONE: a small cyan seeker that homes on the ship (4.4 u/s, 3.2 rad/s turn, plus a wobble waltz - always dodgeable; faster and less predictable than the red mine drones, but rarer).
- Max 6 live at once; one is added per wave from wave 8 up to the cap.
- 1 bullet destroys one (+200, feeds the combo like any kill; cyan burst + seeker-zap SFX). Contact costs a life, same flow as a rock hit (knockback + invuln).
- Seeker battery (I129): each drone runs a 30 s game-time battery (scales with slow-mo). When it empties the drone self-destructs in place - small cyan fizzle, no shake, no score, no drop. This bounds the live pool to the last ~1-2 waves: a drone that outlives its wave expires before it can pile onto later (boss) waves. The fizzle honors the FX tier (no particles with FX off).
- Distinct silhouette from the mine drone (ST-118): cyan, spiky, tumbles while wobbling.

## The Monolith (ST-055)

- Every 5th wave (5, 10, 15, ...) spawns a MONOLITH at the arena rim, in addition to the wave's normal asteroids: a huge, slow-homing boss (base 40 HP, 1.6 u/s - always dodgeable).
- Endless-arc HP (I64): from wave 10 the Monolith gains +12 HP per 5 waves, capped at 88, so it stays a real threat as the rest of the game escalates while the cap keeps every fight beatable; speed is unchanged (dodgeability preserved).
- Bullets deal 1 damage each. On death it pays +1000 (feeds the combo) and splits into 4 M asteroids at its position.
- Every 2s it bursts a ring of 8 S asteroids radially outward from itself (bounded by the field's concurrent cap).
- Contact with the boss costs a life, same flow as a rock hit (knockback + invuln). The boss is not damaged by contact.
- While alive, a MONOLITH HP bar shows at top center. Only one boss at a time.
- Phase 2 enrage (I133): when the Monolith drops below 50% HP it enrages one-way (config.boss.phase2) - homing 45% faster (2.32 u/s, still dodgeable), 40% faster turning, a visible 1.6 rad/s tumble, and both the ring and the aimed-bolt cadences 40% faster (ring 2.0 -> 1.2 s, bolt 2.2 -> 1.32 s). A single bossPhase2 event announces the transition for FX; the HP bar keeps showing.
- Entrance (I135): the Monolith enters over 1.2 s (config.boss.enterTime) with no attacks - a purple "THE MONOLITH" banner (wave + HP) plays while the obelisk scales in (easeOutCubic), and the ring / aimed-bolt / radial-burst timers are held until the entrance completes (a held ring fires immediately afterwards).

## The WARDEN (ST-136)

- Every 5th wave that does NOT spawn a MONOLITH (a previous Monolith is still alive) spawns a WARDEN at the arena rim as the heavyweight for that wave: an armored mini-boss drone. One heavyweight at a time - the boss OR the warden.
- Armor 6 absorbs player hits first (one wardenArmor ping event per absorbed hit); then 12 HP chip away - 18 hits total to kill.
- 1.7 radius, bounded homing 2.4 u/s - faster and smaller than the Monolith. +400 points (between seeker 200 and Monolith 1000). On death it splits into 2 small rocks (wardenDeath event).
- Contact costs 1 ship life and the WARDEN survives the hit (mirrors boss contact).
- Readability (I137): the WARDEN glows cyan while its armor holds and shifts to a hot orange pulse once the armor is spent (the hex armor plate retracts), so armor state reads at a glance; a "WARDEN INBOUND" toast announces the spawn and the death plays a mini-boss burst with the score popup.

## Asteroid Belt (ST-138)

- From wave 8, each wave start adds one DRIFTING belt rock at the arena rim (kept 10 u from the ship), up to 5 concurrent (config.belt): a slow ambient hazard (0.5-1.1 u/s, random heading) that persists for the rest of the run.
- Belt rocks are INDESTRUCTIBLE: bullets spark off them (the bullet is consumed, no score or split - beltHit event), bombs ignore them, and ship contact costs a life but the rock survives (normal shield and invulnerability rules apply).
- Belt rocks sit outside the normal rock cap, so wave rocks keep flowing; they can still award near-miss points like any rock.

## Enemy Bullets (ST-056)

- The MONOLITH fires an aimed bolt at the ship every 2.2s (speed 9 u/s).
- The MONOLITH also fires a radial bolt burst (ST-134): every 4.0 s (2.6 s while enraged) 12 undestroyable bolts at 7 u/s, evenly around the boss and rotated 0.45 rad per volley (spiral drift); shares the 24-bolt pool, so a volley may be trimmed.
- A MINE fires an aimed bolt only while the ship is within 7u of it, on a 3s cadence (speed 8 u/s).
- Bolts share one pool capped at 24 concurrent; a bolt vanishes after 4.0s or once it leaves the arena.
- A bolt touching the ship costs one life (same flow as rock contact; the 1.8s invulnerability applies).
- Bolts never collide with rocks and cannot be shot down.
- Bolts render as red-orange glowing orbs, clearly distinct from the player's cyan bolts.

## Gravity Vortex (ST-059)
- From wave 8, a gravity vortex periodically appears mid-arena: a pulsing disk telegraphs for 1.0s (seeded position, fully inside the arena, center at least 6u from the ship), then pulls everything inside its 11u radius toward its center for 4.5s - rocks at 1.6 u/s^2, the ship at 2.4 u/s^2 (~9% of thrust; always counterable, clamped at maxSpeed).
- It is a pressure hazard, not a damage source: the pull itself costs nothing; rocks funneled into the ship are the danger. Vortices re-roll every 12-20s (seeded) and never overlap. The bomb does not clear a vortex; the shield does not block the pull.

## Waves & Difficulty
- Wave n: startAsteroids = 4 + n, maxConcurrent = 6 + 2n (cap 24), speedMult = 1 + 0.06n (cap 2.1).
- Spawn mix (ST-131): the L/M/S spawn ratio is a data-driven table (config spawnMix, first matching row wins): waves 1-2 L50/M50/S0 (teach: big targets, no S), waves 3-9 L30/M40/S30, waves 10-14 L28/M32/S40, wave 15+ L30/M30/S40. Two invariants: no row may drop L below 28% (lFloor - the "break the big rock" core loop stays present into the endless), and S is capped at 40% (split fragments already supply most on-screen S, so the spawn ramp is a weak lever there - I131 playtest data). The SMALL modifier overrides per wave: 50% S, remainder L:M 50/50.
- Wave advances when all spawned asteroids for that wave are destroyed, or after 45s without a clear (stall advance): the wave increments regardless, undestroyed asteroids carry into the next wave, and the intermission is skipped (I42, closes playtest finding F1 - a camped field can no longer freeze the escalation).
- 2.2s intermission between waves with "WAVE n" banner.
- From wave 3, each wave rolls one modifier deterministically from (world seed, wave number) - stall-vs-clear timing cannot change the pick (ST-051): FAST ROCKS (spawns 40% faster, on top of the ramp), SMALL ROCKS (spawns roll S with 50% probability), INWARD DRIFT (all rocks pulled toward the arena center at 2.0 u/s^2). Waves 1-2 are always plain. The wave immediately after a boss wave (6, 11, 16, ...) is also plain - a modifier-free breather that gives a recovery beat after the boss (ST-092/F9). The active modifier is announced under the WAVE banner.
- Endless (ST-058): from wave 10 the game never ends - wave content caps at 36 rocks, intermissions shrink from 2.2s toward a 1.2s floor (0.08s/wave), and the small-rock share rises from 30% toward 45%; the WAVE banner carries an ENDLESS tag.

## Combo
- Kill within 4s of last kill: combo+1 (cap 15). Multiplier = 1 + 0.1*(combo-1) ... 1.0x..2.4x. (I92: cap 10->15 so the top multiplier needs a real 15-kill chain)
- Combo resets on timer expiry or taking damage.

## Power-ups (T2) - drop chance 25% from any kill, one at a time
- RAPID  (yellow): fire rate x2 for 8s
- SPREAD (orange): 3-way shot for 8s
- SHIELD (cyan): absorbs 1 hit; 12s or until hit
- BOMB   (red): instantly shatters all on-screen asteroids (counts as kills, feeds combo)
- MAGNET (green): attracts power-ups + slight bullet homing for 6s
- OVERDRIVE (magenta): all score x2 for 6s (kills, combo multipliers, near-miss bonuses) - hex prism drop
- SLOWMO (T, ST-115): enemy time scale 0.4 for 5s - rocks, bullets, mines and drones slow down, the ship keeps full speed
Stacks: each has its own timer; grabbing the same type refreshes its timer.
- Drop economy (ST-130): 25% roll on any kill; at most ONE drop at a time (pickup radius 1.6u; the magnet power-up pulls drops in from 7u). Abandoned drops expire after 20s and free the pool; the last 2.5s of life read as a shrink-out so an expiring drop telegraphs itself (presentation only). The drop type is weighted, not uniform - RAPID 20, SPREAD 20, SHIELD 15, MAGNET 15, BOMB 10, OVERDRIVE 10, SLOWMO 10 (sums to 100): utility is common, screen-clearers and multipliers are rare.
- Shield visual (I62, presentation): while SHIELD is live, a cyan ring breathes (subtle scale + opacity) and a second additive ring repeatedly expands outward and fades. An absorbed hit flashes a quick expanding pop. All frozen to a static ring under Reduced Motion. Visual only; no gameplay effect.

## Scoring & Records
- Score = sum(kill base score x current multiplier).
- Overdrive (ST-057): while OVERDRIVE is active, all points earned are x2 (applied after the combo multiplier).
- Near-miss (ST-053): a rock skimming within 2.6u of the ship (no hit) pays a flat +15 once per approach (swish SFX, small popup, subtle cyan wisp). Fragments/splits get 0.3s immunity so a kill near the ship cannot farm graze points. Graze is not a kill: it never extends the combo chain.
- Best score persisted to localStorage key `voidrunner.best` (int).
- Top-5 high-score board (I66): rows {score, wave, kills} persisted to `voidrunner.scores` (versioned payload; no timestamps, keeps core deterministic). Shown on MENU in a two-column layout (controls | TOP 5). Reads are corruption-safe: bad JSON, non-array payloads, and malformed rows degrade to an empty board (placeholder text). The game-over NEW BEST! flag (stored best raised) is unchanged.
- Game over screen shows: final score, best (NEW BEST! flag), kills, max combo, wave reached, time survived.
- Game over (I69): the stats panel also shows this run's BOARD RANK #N (position on the persistent top-5 board from the I66 high-score storage). A NEW BEST run fires a three-colour confetti burst (gold/cyan/magenta) at the ship and the NEW BEST! line pulses (vrBestPulse); both are pure presentation and freeze to static under Reduced Motion.
- Pause overlay (ST-068): deeper dim (rgba 0.74 + vignette) over the frozen scene with a session snapshot and three actions - RESUME (P/Esc/Enter), RESTART (R), QUIT TO MENU (Q) - each as a clickable button (mouse) with arrow-key focus moves and a gold focus ring; while a button holds focus the game hotkeys are swallowed so the focused action wins. QUIT is a new PAUSED -> MENU transition (abandons the run, full reset).
- Options panel (ST-026, polished ST-067): AUDIO (volume, SFX) and VISUALS (FX quality, reduced motion) groups, keyboard operable (Tab + arrow focus moves; game hotkeys are swallowed while a control holds focus; visible gold focus ring), and a live particle-burst preview when the FX tier changes.

## Game States
MENU (title + "Enter to start" + controls) -> PLAYING -> PAUSED (overlay) ->
GAME_OVER (stats + "Enter to restart") -> PLAYING.
- Menu presentation (I65): the MENU screen has a gradient, softly glowing "VOID RUNNER" title, a drifting nebula backdrop (the live 3D starfield shows through the semi-transparent panel), the controls in a bordered card, and a credits line. The title glow and backdrop drift are pure presentation and freeze to static under Reduced Motion; no gameplay effect.

## HUD
Top-left: score + best. Top-center: wave. Top-right: lives (ship icons) + active
power-up indicators (shape + color + label with a drain bar - never color
alone, per accessibility). Bottom-center: combo meter (visible when combo>=2)
with a drain bar showing the 4s window remaining.
All DOM/CSS overlay (crisp text, easy to style), not canvas. A subtle fire-line
reticle extends from the ship nose along the actual fire direction while
playing (teaches lead-aim; playtest rec #3, I44).

## Accessibility
- Settings: volume 0-100, SFX on/off, FX quality (High/Low - Low disables bloom + reduces particles).
- Adaptive quality (ST-073): if the rolling 2.0s FPS average stays below 45 fps for two consecutive windows, FX auto-drops High -> Low (fewer particles, no bloom); the change is console-logged + toasted and does NOT alter saved settings. Choosing FX quality in options overrides (locks) the automation.
- Reduced-motion option cuts screen shake to near-zero.
- Colorblind-friendly power-up icons (shape + color, not color alone).
- Font-scale setting (NORMAL / LARGE / XL) scales all in-game UI text via a CSS variable (--vr-fs); the WebGL canvas is unaffected.
- A single gold focus-visible ring is applied across every menu, pause, and settings control, so keyboard focus is always legible.
- Each power-up also carries a LETTER badge (R/S/H/B/M/O) on both the in-world pickup (billboard sprite) and the HUD chip, reinforcing the colorblind-safe shape + color cue with a shape-independent channel.
- Responsive layout: the UI overlay scales with viewport width (a --vr-fs viewport factor composed with the font-scale setting, floored at 0.6, full at >=820px) so the HUD and menus fit phones; the two-column menu collapses to one column below 620px.
- Touch devices get a tappable TAP TO START / TAP TO RESTART, an on-screen pause button (PLAYING only), and touch instructions in both the menu card and the in-game hint (drag to fly / auto-fire / two-finger pause) replacing the keyboard ones.

## Non-goals
No multiplayer, no leaderboards, no account/network, no external assets, no engine framework.
