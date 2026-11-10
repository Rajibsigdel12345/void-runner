# Feel balance - Void Runner (E8-3 calibration)

Balance-check of the feel/juice tuning, ST-179 (I179). Companion to the juice home
(design/feel.md). The ST-179 move: the 9 scattered inline white-flash bumps in the juice
dispatch are now one data-driven CONFIG.fx.flashTable (via pure core src/core/flashTable.js),
mirroring the ST-175 shakeTable move. This doc is the calibration audit that goes with it.

## Summary

Void Runner expresses "impact" through five decoupled feel channels, all tunable and all
currently table/config-driven:

| Channel  | Config surface                   | Meaning (what it communicates) |
|----------|----------------------------------|--------------------------------|
| shake    | CONFIG.fx.shakeTable (ST-175)    | physical force / blast radius  |
| flash    | CONFIG.fx.flashTable (ST-179)    | personal urgency / spectacle   |
| punch    | inline punch.trigger(...,energy) | weight / mass                  |
| hit-stop | CONFIG.fx.hitStop                | time-frozen impact (big only)  |
| fov      | CONFIG.fx.fovKick                | spatial scale of the impact    |

ST-179 centralizes the flash channel and audits the whole ladder. Verdict: no value
changes - every value is matched to its channel role. Three borderline cases are flagged
as playtest watch-items for I183.

## The feel ladder (per event)

| Event         | shake | flash | punch | hit-stop | fovKick |
|---------------|:-----:|:-----:|:-----:|:--------:|:-------:|
| hit           | 0.5   | 0.5   | -     | -        | -       |
| bomb          | 1.0   | 0.35  | 0.8   | 0.07     | 6       |
| mineExplode   | 0.4   | 0.25  | -     | -        | -       |
| droneExplode  | 0.35  | 0.2   | -     | -        | -       |
| bossSpawn     | 0.7   | 0.4   | -     | -        | -       |
| bossDeath     | 1.0   | 0.5   | 1.0   | 0.09     | 8       |
| wardenSpawn   | 0.5   | 0.25  | -     | -        | -       |
| wardenDeath   | 0.8   | 0.4   | 0.7   | 0.054    | 4.8     |
| overdrive     | -     | 0.15  | -     | -        | -       |
| weaponLevelUp | -     | 0.2*  | 0.45  | -        | -       |

*weaponLevelUp flash is CONFIG.fx.weaponFanfare.flash (0.2), already config-driven -
deliberately NOT in flashTable (a reward is not "alarm"). wardenDeath hit-stop 0.054 =
0.09 x 0.6; fovKick 4.8 = 8 x 0.6 (sub-boss, not boss).

## Balance Lever

The channels are decoupled by meaning, and each value is matched to that meaning:

- shake = physical force / blast radius. bomb (1.0) and bossDeath (1.0) are the biggest
  physical events; hit (0.5) is a personal bump, not world-shaking; pickups and
  weaponLevelUp do not shake (a reward / collectible has no physical force).
- flash = personal urgency / spectacle at the player. hit is TOP (0.5) - "YOU just took
  damage" is the highest-urgency beat (reinforced by the ST-176 damage vignette);
  bossDeath (0.5) is the biggest spectacle; bomb (0.35) is lower because you caused it
  (less alarm); pickups are subtle (overdrive 0.15).
- punch = weight / mass. bossDeath 1.0 > bomb 0.8 > wardenDeath 0.7 (ST-183) > weaponLevelUp 0.45.
  Punch only fires on mass events, never on spawns or pickups.
- hit-stop / fov = impact scale, big beats only. bossDeath > bomb > wardenDeath, all below
  0.1s (a hit-stop longer than that reads as a glitch). Spawns and pickups never freeze
  time or kick the FOV (an arrival is not an impact).

Cross-channel "mismatches" are therefore deliberate, not bugs:
- bomb has top-tier shake (1.0) but mid flash (0.35): the blast is physically huge, but
  you pulled the trigger, so it is not a personal alarm.
- hit has mid shake (0.5) but top flash (0.5): the impact is not world-shaking, but the
  "you got hit" urgency is the loudest.

## Exploit Risk

None. flashA (the flash accumulator) is a visual-only value, capped at 0.8, and no
gameplay path reads it - it cannot be input-driven or farmed. Centralizing 9 inline
literals into one data-driven table is a refactor, not a balance change (behavior is
preserved exactly; see Verification).

## Pacing

No pacing change (values unchanged). The table now gives I183 (feel tuning 2) a single
data-driven surface to tune from. Three borderline watch-items for playtest:

1. bomb flash (0.35) vs hit flash (0.5). If playtests read the bomb as "flat" relative to
   a hit, nudge bomb flash toward 0.45 - but the bomb already carries its weight via
   shake 1.0 / punch 0.8 / hit-stop / fov, so the subordinated flash is probably correct.
2. wardenDeath punch (0.8) equals bomb punch (0.8). A warden death may read heavier than
   a player bomb; if so, drop wardenDeath punch to 0.7.
3. overdrive/pickup flash (0.15) is the lowest. If pickups "disappear", raise the pickup
   sparkle COUNT (ST-177), not the flash - flash stays subtle for a reward.

## Telemetry Need

To make I183 data-driven rather than guess-tuned: a per-run juice-event counter (how many
of each flash/shake/hit-stop fired per run) plus one of (a) a subjective "did it feel
right?" survey at game-over, or (b) a proxy such as time-to-next-input after a hit.
Neither is built yet; the counter could ride the existing __vr.eventTally.

## Risks

- The "no changes" verdict is a calibration reasoning + grounding call, not a playtest
  measurement. If I183 playtests disagree, the watch-items (not the table structure) are
  what change.
- The risk to protect is the decoupling itself: a future "make it juicier" pass must tune
  per-channel (per the ladder), not scale every channel uniformly.

## Changed files

- src/core/flashTable.js (NEW) - pure flashEnergy(type, table) lookup.
- src/core/config.js - CONFIG.fx.flashTable (9 keys), adjacent to shakeTable.
- src/main.js - import + 9 juice-dispatch call sites + __vr.flashEnergy probe.
- tests/flashTable.test.js (NEW) - 9 tests mirroring tests/shakeTable.test.js.
- design/feel-balance.md (this file, NEW).
- CHANGELOG.md, production/iterations.md, production/session-state/active.md.

## Verification evidence

- Parse node --check clean: flashTable.js, config.js, main.js (via .mjs), test.
- 547/547 unit tests (+9); build 0.
- Value preservation proven by tests/flashTable.test.js (table == the 9 pre-ST-179 inline
  literals exactly).
- Browser smoke ?nocache=179a (real Enter -> PLAYING, ship invulnerable): __vr.flashEnergy
  probe returns all 9 table values exactly (hit 0.5, bossDeath 0.5, bossSpawn 0.4,
  wardenDeath 0.4, bomb 0.35, mineExplode 0.25, wardenSpawn 0.25, droneExplode 0.2,
  overdrive 0.15); unknown + weaponLevelUp return 0 (wiring live, exclusion honored).
  emit hit + advance(0.05) -> shakeMag 0.37040911 = 0.5 x exp(-6 x 0.05) exactly (the hit
  branch, which carries the new flashEnergy line, executes cleanly); eventTally.hit +1.
  2D finite scan (ship x/y + rocks + drops) = 0 bad positions. Console 0 errors / 0
  warnings. Screenshot .evidence/I179/I179_1_flash_table_probe.png (PLAYING).

## Research (Coverage note)

YouTube (metadata/chapters; transcripts rate-limited during I179 - Coverage note):
- GDevelop, "How To Do Game Feel Right" - treats Hitflash and Screen Shake as separate
  juice channels, each added deliberately to a hit.
- Jan Willem Nijman (Vlambeer), "The Art of Screenshake" (INDIGO 2013) - shake
  communicates mass/impact and must decay; constant or over-tuned shake becomes
  meaningless and nauseating (tune the magnitude; do not leave it maxed).
- "Your game works. Why does it feel dead?" - the doctrine this audit follows: match the
  juice to the hit; "turn everything up" is the explicit anti-pattern.
These support the decoupled-channel verdict: tune each channel to the event role rather
than scaling all channels together.

## Next owner or decision

Hand to I183 (feel tuning 2, playtest-driven) with the three watch-items above as the
candidate levers. Owner decision for I183: gather the Telemetry Need (juice-event counter
+ a feel signal) first, then tune only what the data flags - otherwise keep the current
values.

## ST-183 - Feel tuning round 2 (I183)

Balance-check of the three ST-179 watch-items, plus the Telemetry Need this doc itself called
for. Contract: cgs-balance-check.

### Summary

I183 did what the ST-179 audit instructed: gather the Telemetry Need (a juice-event counter
+ a feel signal) first, then tune only what the data flags - otherwise keep the current
values. It built the counter (src/core/juiceTally.js + the __vr.juiceTally() probe), collected
a first data sample (a scripted representative run in BOTH motion states), and rendered one
verdict per watch-item. Outcome: ONE value changed (wardenDeath punch 0.8 -> 0.7), two
documented holds (bomb flash 0.35, pickup/overdrive flash 0.15).

### Telemetry (built this iteration)

- src/core/juiceTally.js (NEW, pure, DOM-free): createJuiceTally() with record(type, channels),
  snapshot(), reset(), total(type, channel). Fixed 5-channel schema (flash, shake, punch,
  hitStop, fovKick); unknown keys ignored; an event with no fired channel creates no row;
  snapshot is a deep copy.
- src/main.js: created once, reset in startRun + restartRun (the per-run boundary), probed as
  __vr.juiceTally(). record() is called ONLY inside the branches that actually trigger a
  channel, and only inside the !motionOff gate - the tally records what FIRED, not what was
  eligible. Under reduced motion the tally stays empty by construction (verified in the
  smoke, part 2).
- This is the "per-run juice-event counter" from the Telemetry Need, riding the __vr probe
  infrastructure. The second half (a subjective feel signal) is delegated to the I202 human
  playtest: the counter is now the baseline a playtester's comment can be checked against.

### Data sample (I183, scripted representative run)

?nocache=183a (motion ON, real Enter -> PLAYING, ship protected): the full event ladder fired
one event at a time (hit, bomb, wardenSpawn, wardenDeath, mineExplode, droneExplode,
bossSpawn, bossDeath, powerup(overdrive), powerup(rapid), weaponLevelUp), each with
advance(0.05) and a per-event tally delta. Every event fired exactly the channels the ladder
prescribes; per-run totals flash 10 / shake 8 / punch 4 / hitStop 3 / fovKick 3; the rapid
pickup creates no row (particles are not one of the five channels). ?nocache=183b
(reducedMotion true, same 11 events): eventTally identical (all events fired) while
juiceTally stayed {} and shakeMag 0 - the negative gate holds and the "what actually fired"
semantics are confirmed. Console 0/0 both parts; ship finite; state PLAYING throughout.
Live punch check: bomb 0.8*exp(-12*0.05) = 0.4390493088752211, warden
0.7*exp(-12*0.05) = 0.38416814526581844 - both exact, ratio exactly 0.875 = 0.7/0.8. Before
this change the ratio was 1.0 (the tie the watch-item named).

### Verdicts (per watch-item)

1. bomb flash (0.35) vs hit flash (0.5) - HOLD at 0.35. Flash means personal urgency; the
   bomb is player-caused, so it is deliberately subordinated on that channel. The data sample
   confirms the bomb already tops every impact channel (shake 1.0, hitStop 0.07, fovKick 6 -
   all firing in the live run), so its weight is fully expressed elsewhere. Nudging the flash
   would break the "you got hit > you fired" urgency ordering.
2. wardenDeath punch (0.8) = bomb punch (0.8) - CHANGE to 0.7. The warden is a sub-boss scaled
   0.6x on hitStop/fovKick, and it is already below the bomb on shake (0.8 < 1.0), hitStop
   (0.054 < 0.07) and fovKick (4.8 < 6) - punch was the ONE channel where the intended
   bossDeath > bomb > wardenDeath ordering was violated (the tie). Dropping it to 0.7 (the
   value the watch-item proposed) restores the ordering on all four impact channels while
   keeping the warden's death clearly above the reward punch (weaponLevelUp 0.45). Labeled as
   a calibration/hierarchy-consistency call, not a playtest measurement (the I202 playtest
   re-checks it with the counter).
3. pickup/overdrive flash (0.15) - HOLD. Pickup visibility already rides on the ST-177
   per-type sparkle (max(8, ceil(fxCount*0.5)) = 24 particles at FX high, the event's own
   color) + the collect SFX + the magnet trail; the data sample shows the rapid pickup firing
   that sparkle with no channel flash by design. The ST-179 guidance stands: if pickups ever
   read as invisible, raise the sparkle COUNT, not the flash - a reward stays subtle on the
   alarm channel.

### Balance Lever

One lever moved, per channel (not a uniform scale - the I179 risk this doc warned about):
wardenDeath punch 0.8 -> 0.7 in src/main.js (the wardenDeath juice branch). Nothing else
touched.

### Exploit Risk

None. The punch energy is a fixed render-layer constant; juiceTally is a debug probe (a
read-only snapshot), reset per run, and no gameplay path reads it.

### Pacing

Unchanged. The run's event mix (per the sample: 10 flash / 8 shake / 4 punch / 3 hitStop /
3 fovKick across the full ladder) is identical before and after - only the warden's punch
magnitude is 12.5% lower.

### Telemetry Need

Half 1 (the counter) fulfilled - see Telemetry above. Half 2 (a subjective feel signal) is
explicitly delegated to the I202 human playtest: with __vr.juiceTally() live, a playtester's
"that hit felt flat" comment can now be checked against what actually fired.

### Risks

- The item-2 change is a hierarchy-consistency + grounding call made from the counter data +
  the existing ladder, NOT a human feel measurement. The I202 playtest is the confirmation
  pass; if a playtester reads the warden's death as too light, the lever goes back to 0.8
  with one line (the value is recorded in the ladder table above).
- The scripted sample is a controlled event fire, not emergent play: real runs have
  timing/overlap (max-stacking of shake/punch under firefights). The counter is the tool for
  measuring that; the I184/I185 perf + memory tail and the I202 playtest cover the rest.

### Changed files

- src/core/juiceTally.js (NEW) - pure per-run juice-channel tally.
- src/main.js - import + create + 2 resets + __vr.juiceTally() probe + 10 record() call sites
  (one per channel-firing branch) + wardenDeath punch 0.8 -> 0.7.
- tests/juiceTally.test.js (NEW) - 10 tests (schema, empty, per-call count, accumulation,
  no-row-without-channels, unknown-key ignore, invalid args, reset, total, snapshot deep-copy).
- design/feel-balance.md (this file) - ladder row + lever bullet updated, this section appended.
- CHANGELOG.md, production/iterations.md, production/session-state/active.md.

### Verification evidence

- Parse node --check clean: juiceTally.js, juiceTally.test.js, main.js (via .mjs).
- 575/575 unit tests (+10); build 0.
- Browser smoke part 1 (?nocache=183a, motion ON, real Enter -> PLAYING, ship protected):
  per-event deltas exactly match the ladder for all 11 events; per-run totals flash 10 /
  shake 8 / punch 4 / hitStop 3 / fovKick 3; punch magnitudes 0.4390493088752211 (bomb =
  0.8*exp(-0.6)) and 0.38416814526581844 (warden = 0.7*exp(-0.6)), ratio exactly 0.875.
  Console 0/0; ship finite; state PLAYING.
- Browser smoke part 2 (?nocache=183b, reducedMotion true seeded, real Enter): same 11
  events -> eventTally identical, juiceTally {} (the negative gate), shakeMag 0. Console 0/0.
  Screenshot .evidence/I183/I183_2_rm_negative_gate.png.

### Research (Coverage note)

No new research this iteration: the verdicts ride the ST-179 grounding ("match the juice to
the hit", Vlambeer's per-channel shake doctrine, GDevelop's separate hit-flash / screen-shake
channels). YouTube metadata only; transcripts remain rate-limited - Coverage note.

### Next owner or decision

Next I184 ST-184 perf profile (cgs-perf-profile): update production/perf-profile.md with the
E8E deep profile (I182's in-gate numbers are the reference; multi-scene soak + first-frame
hitch check). The __vr.juiceTally() probe is available as the per-run feel baseline for the
I202 human playtest.
