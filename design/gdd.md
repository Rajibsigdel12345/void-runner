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
- Enter: start / restart from menus; resume from pause; quit a finished replay
- P or Esc: pause / resume (also pauses a watched replay)
- R / Q: restart / quit to menu (from pause; Q also exits a replay)
- M: mute audio (session only; F and N persist)
- F: toggle FX quality (high/low; persisted, overrides adaptive downgrade)
- N: toggle the music bed (persisted; default on)
- O: record this run (REC chip; a recorded run saves as a replay at game over)
- 1 / 2 / 3: replay speed x1 / x2 / x4 (REPLAY state only)
- While the first-run tutorial is up only Enter/Space/Esc work (they dismiss it).

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

## The Splicer (ST-143)

- The Splicer is BOSS VARIANT 2, spawned in strict alternation with the Monolith (see Boss Variant Alternation below). Instead of homing, it holds a slow orbit around the arena center at radius 11 (config.splicer.holdRadius) - a "spinning sun" the ship weaves through.
- Entrance (ST-143): it glides from its rim spawn to the hold radius over 1.2 s (config.splicer.enterTime) with NO bolts until the entrance completes (entered >= 1); a purple "THE SPLICER" banner (wave + HP) plays, a "SPLICER INBOUND" toast announces it, and the body tumbles at 0.4 rad/s.
- Spiral attack: every 0.6 s (config.splicer.spiralEvery) it fires one undestroyable bolt per arm (arms 2) at 7 u/s, while the two arms rotate at 1.2 rad/s (config.splicer.armSpin) - a continuous two-arm spiral. I144: the 0.6 s cadence leaves a 7 x 0.6 = 4.2 u gap (~1.9x the ship's 2.24 u effective obstacle) - threadable; the pre-I144 0.26 s cadence was a 1.82 u wall (unthreadable).
- Aimed bolt: it also fires one aimed bolt at the ship every 2.6 s (config.splicer.aimEvery). The Splicer fires NO rock rings and NO radial burst - that is what sets it apart from the Monolith.
- HP: base 30 (Monolith 40). Endless-arc (splicerHpForWave): from wave 15 (config.splicer.hpFirstWave) it gains +8 HP per 5-wave boss, capped at 72 - wave 10 = 30, wave 15 = 30, wave 20 = 38, rising to the 72 cap (steps = floor((wave - 15) / 5)).
- Bullets deal 1 damage each. Radius 2.6 (between the Warden's 1.7 and the Monolith's 3.4). On death it pays +600 (Warden 400 < Splicer 600 < Monolith 1000), feeds the combo, and splits into 2 M asteroids at its position.
- Phase 2 enrage (I133): below 50% HP (config.splicer.phase2.hpFrac) it enrages one-way - orbit 40% faster (0.5 -> 0.7 rad/s), arms 50% faster (1.2 -> 1.8 rad/s), spiral cadence 35% faster (0.6 -> 0.39 s; enrage gap 2.73 u ~ 1.22x the obstacle - tight but fair), aimed cadence 30% faster (2.6 -> 1.82 s), body tumble 1.2 rad/s. A single bossPhase2 event announces the transition; the HP bar keeps showing.
- Orbit direction is seeded at spawn (rng.chance(0.5) - 50/50 clockwise or counter-clockwise).

## Boss Variant Alternation (ST-143)

- spawnBossForWave runs on every 5th wave (5, 10, 15, ...) when no boss is alive. The variant is chosen by boss-spawn count: even (0, 2, ...) = MONOLITH, odd (1, 3, ...) = SPLICER - a strict Monolith -> Splicer -> Monolith -> ... alternation.
- bossSpawnCount increments ONLY on an actual boss spawn. A 5th wave that is skipped because the previous boss is still alive consumes NO variant, so the alternation is preserved across skips (the next boss is still the other variant).
- The boss spawns at the arena rim (a seeded angle) at that variant's radius, re-rolled up to 8 times if it lands within 10 u of the ship.
- A bossSpawn event carries the kind (monolith | splicer) so the render layer picks the right mesh and the entrance banner names the right boss.

## The WARDEN (ST-136)

- Every 5th wave that does NOT spawn a BOSS (a previous Monolith or Splicer is still alive) spawns a WARDEN at the arena rim as the heavyweight for that wave: an armored mini-boss drone. One heavyweight at a time - the boss OR the warden.
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
- SLOWMO (light blue; auto-applied on pickup, ST-115): enemy time scale 0.4 for 5s - rocks, bullets, mines and drones slow down, the ship keeps full speed
Stacks: each has its own timer; grabbing the same type refreshes its timer.
- Drop economy (ST-130): 25% roll on any kill; at most ONE drop at a time (pickup radius 1.6u; the magnet power-up pulls drops in from 7u). Abandoned drops expire after 20s and free the pool; the last 2.5s of life read as a shrink-out so an expiring drop telegraphs itself (presentation only). The drop type is weighted, not uniform - RAPID 20, SPREAD 20, SHIELD 15, MAGNET 15, BOMB 10, OVERDRIVE 10, SLOWMO 10 (sums to 100): utility is common, screen-clearers and multipliers are rare.
- Shield visual (I62, presentation): while SHIELD is live, a cyan ring breathes (subtle scale + opacity) and a second additive ring repeatedly expands outward and fades. An absorbed hit flashes a quick expanding pop. All frozen to a static ring under Reduced Motion. Visual only; no gameplay effect.

## Scoring & Records
- Score = sum(kill base score x current multiplier).
- Kill base scores (multipliers stack on top): asteroid L 25 / M 50 / S 100 (a golden rock pays 5x that rock's base); mine drone 150; seeker drone 200; WARDEN 400; Splicer 600; Monolith 1000.
- Overdrive (ST-057): while OVERDRIVE is active, all points earned are x2 (applied after the combo multiplier).
- Near-miss (ST-053): a rock skimming within 2.6u of the ship (no hit) pays a flat +15 once per approach (swish SFX, small popup, subtle cyan wisp). Fragments/splits get 0.3s immunity so a kill near the ship cannot farm graze points. Graze is not a kill: it never extends the combo chain.
- Best score persisted to localStorage key `voidrunner.best` (int).
- Top-5 high-score board (I66): rows {score, wave, kills} persisted to `voidrunner.scores` (versioned payload; no timestamps, keeps core deterministic). Shown on MENU in a two-column layout (controls | TOP 5). Reads are corruption-safe: bad JSON, non-array payloads, and malformed rows degrade to an empty board (placeholder text). The game-over NEW BEST! flag (stored best raised) is unchanged.
- Game over screen shows: final score, best (NEW BEST! flag), kills, max combo, wave reached, time survived.
- Game over (I69): the stats panel also shows this run's BOARD RANK #N (position on the persistent top-5 board from the I66 high-score storage). A NEW BEST run fires a three-colour confetti burst (gold/cyan/magenta) at the ship and the NEW BEST! line pulses (vrBestPulse); both are pure presentation and freeze to static under Reduced Motion.
- Pause overlay (ST-068): deeper dim (rgba 0.74 + vignette) over the frozen scene with a session snapshot and three actions - RESUME (P/Esc/Enter), RESTART (R), QUIT TO MENU (Q) - each as a clickable button (mouse) with arrow-key focus moves and a gold focus ring; while a button holds focus the game hotkeys are swallowed so the focused action wins. QUIT is a new PAUSED -> MENU transition (abandons the run, full reset).
- Options panel (ST-026, polished ST-067): AUDIO (volume, SFX) and VISUALS (FX quality, reduced motion) groups, keyboard operable (Tab + arrow focus moves; game hotkeys are swallowed while a control holds focus; visible gold focus ring), and a live particle-burst preview when the FX tier changes.

## Daily Seeded Run (ST-140/141)

- One canonical seeded run per calendar day (ST-140): the seed is a pure FNV-1a 32-bit hash of the date, dailySeed = fnv1a('daily:YYYY-MM-DD'), so every player on the same day plays an identical, comparable run (deterministic, no crypto, DOM-free).
- The 'daily' salt (config.daily.salt) namespaces the scheme so the format can evolve without colliding with other seeds; dailyForDate(Date) is the UI path and the deterministic test path passes explicit (year, month, day).
- The MENU has a DAILY RUN button (startDaily); a daily run is badged "DAILY RUN - <date>" on the game-over screen, and today's daily best is shown on the MENU.
- Restart re-seeds to the stored daily seed (ST-141), so restarting a daily run reproduces the identical run instead of rolling a new one.
- Example: 2026-11-10 -> seed 317547475 (I147: two 90 s runs bit-identical - score 27249, wave 5, 120 kills).

## Shareable Result String (ST-142)

- encodeResult({seed, score, wave, kills}) -> vr1.<seed36>.<score36>.<wave36>.<kills36>.<ck>: URL-safe (lowercase base36 + dots), where <ck> is a 2-char integrity checksum = (fnv1a(body) % 1296) in lowercase base36, zero-padded to 2 chars.
- decodeResult validates the whole string: exactly 6 dot-parts, the magic prefix vr1 (config.share.magic), a ^[0-9a-z.]+$ shape (rejects case, symbols, spaces), a matching checksum, and sane ranges (seed 0..0xffffffff, score >= 0, wave >= 1, kills >= 0); anything off returns {ok:false}.
- The seed is INCLUDED in the string, so a shared result is REPRODUCIBLE: reseed the World to the decoded seed to replay the identical run and verify the claimed score (I147: a decoded-seed replay reproduced the claimed score end-to-end).
- Example: vr1.592577.l0x.5.3c.6g decodes to seed 317547475 / score 27249 / wave 5 / 120 kills (the 2026-11-10 daily run's result); re-encoding those values reproduces the exact string.

## Replay & Recording (ST-190/191)

- Recording: O during a run arms a recorder (REC chip + toast); the tape captures the
  exact per-substep player intents at quant 1000 (1/1000 world-unit resolution - the I191
  measurement kept a recorded-run replay outcome-identical, ship distance 0.0007 vs the
  original over the demo run). Tapes are RLE-compressed and hard-capped (700 KB / 72,000
  substeps; a truncated tape flags itself).
- Save: a recorded run saves on game over (newest-first, cap 2 in `voidrunner.replays`);
  the game-over screen shows WATCH THIS RUN only for recorded runs. Each run gets a fresh
  seed, so a saved replay reproduces that exact run (deterministic core + seeded RNG).
- Viewer: REPLAY state with a slim HUD bar (progress + speed + hints); 1/2/3 switch speed
  x1/x2/x4; P pauses; R restarts the replay; Q exits, and Enter at the end exits to MENU.
  A built-in DEMO PILOT (seed 1909, 2,220 substeps) plays from the menu flow; its outcome
  is pinned in the test suite (dies at step 2169, t=36.15 s, score 11334, 57 kills,
  wave 2, max combo x15) and was re-verified in-browser at the G8.5 gate (I198).
- Watched replays never record or save (read-only), and the recorder is one-stop: a
  stopped run cannot re-arm mid-run.

## Game States
MENU (title + "Enter to start" + controls) -> PLAYING -> PAUSED (overlay) ->
GAME_OVER (stats + "Enter to restart") -> PLAYING.
Plus the replay branch (ST-190): MENU -> REPLAY (watch a saved or demo run) ->
GAME_OVER (replay end) -> MENU, and exitReplay -> MENU from REPLAY.
Tab hidden auto-pauses PLAYING to PAUSED via the visibility handler (I189, pure
decision in core/visibilityPause.js); the player resumes manually (P/Esc/Enter).
- Menu presentation (I65): the MENU screen has a gradient, softly glowing "VOID RUNNER" title, a drifting nebula backdrop (the live 3D starfield shows through the semi-transparent panel), the controls in a bordered card, and a credits line. The title glow and backdrop drift are pure presentation and freeze to static under Reduced Motion; no gameplay effect.

## HUD
Top-left: score + best, with the combo multiplier (xN.N) riding inline next to
the score while a chain is active (I160). Top-center: wave. Top-right: lives
(ship icons) + active power-up indicators (shape + color + label with a drain
bar - never color alone, per accessibility). Bottom-center: compact combo heat
bar (small label + drain bar, visible when combo>=2) showing the 4s window
remaining (I160: the big combo text moved onto the score line).
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

## UI & Overlays (E8D, ST-151..168)

All UI is a DOM/CSS overlay (crisp text, keyboard-focusable, easy to
localize); the WebGL canvas is reserved for the arena. Every screen was
screenshot-verified at the G8.3 gate (I164); the intermission countdown,
kill feed, and banner render on the same 0-mutation steady-state HUD path
(production/perf-ui-text.md).

- First-run tutorial overlay (I151): a one-time dismissible "how to play"
  card on the player's first entry to PLAYING, mirroring the menu panel
  style. While visible the sim is gated (world.time frozen at 0) so the
  player can read without dying. Dismiss via the LAUNCH button or
  Enter/Space/Esc; dismissal persists in a dedicated versioned storage key.
  Distinct from the passive 6s tutorialHint that still shows in-run.
- Session stats (I152): game over reports SCORE / BEST / KILLS / WAVE /
  MAX COMBO / TIME plus "ACCURACY % SHOTS h/f" (hits counted at all five
  player-bullet hit sites - rocks, mines, boss, warden, drones - enemy
  bolts excluded; spread fires count n shots at the muzzle).
- Kill feed (I153): compact fading top-right list of the last 5 kills
  (3.0s life, 0.45s fade, slide-in): entity label (S/M/L ROCK, GOLDEN ROCK,
  MINE, SEEKER, WARDEN, boss name) + points + inline combo; gold for
  golden/boss kills, orange for warden; aria-hidden decorative layer.
- Wave banner (I154): three moments - WAVE n (0.4s slide-in + 1.06->1.0
  scale punch), CLEARED (big gold line with "WAVE n" sub), boss inbound
  (per-variant tint + glow: Monolith purple, Splicer cyan; name + HP sub).
  Punch/slide skipped under reduced motion.
- Colorblind cues (I155-156): shapeCues setting (default ON) adds
  silhouette identity that reads without color - a gold wireframe
  icosahedron cage on golden rocks and an 8-spike collar on the WARDEN in
  the exposed state only. Verified empirically under Machado 2009
  deuteranopia/protanopia + tritanopia (palette dE 41-106 across every
  critical pair); the COLORBLIND options row applies a live deuteranopia
  preview filter to the canvas.
- Hotkeys (I157, I171): M mute, P pause, F FX quality, N music bed (F + N
  persisted; user choice overrides adaptive auto-downgrade; keycaps swallow
  M/P/F/N while a settings control is focused).
- Options rows (I158): MUSIC (generative ambient pad + pentatonic pluck
  bed, default on, own bus under master, gesture-gated), COLORBLIND
  (deuteranopia canvas preview), SLOW-MO HINT caption, SHAPE CUES,
  REDUCED MOTION, FONT SCALE - all persisted booleans/enums.
- Share screen (I159): game-over COPY RESULT button copies the reproducible
  result code (seed + score + wave + kills + FNV-1a checksum, core codec in
  share.js) with COPIED! / COPY FAILED flash; focusable, aria-labelled.
- A11y pass (I161): font scale reaches every in-game UI text (banner,
  popups, boss label via calc() on --vr-fs); reduced motion gates every new
  FX (banner punch, kill-feed slide, slow-mo hint fade, HUD multiplier pop);
  one gold focus-visible ring across all controls.
- i18n readiness (I166): player-facing strings inventoried with a key
  convention and expansion/pluralization risks in design/i18n-strings.md
  (plan doc; extraction is a future pass, not implemented).
- UI performance posture (I167): steady-state committed DOM mutations are
  zero - every text writer is change-guarded, all animated props are
  opacity/transform, and the render layer has zero forced-reflow reads.
  production/perf-ui-text.md holds the budgets and the measured tables.

## Non-goals
No multiplayer, no leaderboards, no account/network, no third-party art assets (the five Blender GLBs in assets/ are first-party, with a procedural fallback), no engine framework.
