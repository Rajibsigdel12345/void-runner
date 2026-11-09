# Balance Notes - Void Runner

Tuning changes that touch `src/core/config.js` (or GDD numbers) must be logged here with rationale. GDD `design/gdd.md` stays the authority.

## I21
- `powerup.types.rapid.rate = 2` — RAPID doubles fire cadence (GDD: "fire rate x2 for 8s"). Discrete-timestep effect: shot cycle 11 -> 6 steps at 60Hz (≈1.83x realized shots/s vs theoretical 2x); acceptable arcade feel. Revisit at I34 if it feels weak against wave-4+ concurrency.
- SPREAD uses existing `count: 3, arc: 0.35` (GDD: "3-way shot"); no new values.
## I22
- SHIELD absorbs exactly 1 hit (GDD line 54). Design decisions made in resolveShipRocks:
  - an absorbed hit does NOT break the combo chain (GDD resets combo on damage; absorption is not damage)
  - an absorbed hit grants NO invuln window — a second overlapping rock on the next frame costs a real life (shield is one-hit by design)
  - rock still shatters on absorption (same field.destroy path as a normal hit)
## I23
- BOMB shatter-all: each on-screen rock scores as a kill, feeding the combo chain (same-frame multi-kill multiplier ramp, e.g. 3 rocks = 1.0x/1.1x/1.2x). No fragments spawn (total shatter via field.shatter). One power-up drop can still roll from the blast (22%/kill, maxActiveDrops=1).
  - Tuning note: a bomb on a full L-heavy field is a big score spike; acceptable per GDD ("counts as kills, feeds combo"). Watch for combo-spam with RAPID at I34.
- MAGNET bullet homing (GDD: "slight bullet homing for 6s"): weapon.homing { turn: 3 rad/s, range: 8 }. A full 180-degree reversal takes ~1.05s, so bullets only gently curve toward nearby rocks - they can be guided but not sharply redirected. Kept "slight" per GDD; revisit at I34 if it feels like a free aim-assist.
## I34
- `combo.window 3.5 -> 4.0`: high waves mean more travel between scattered rocks; 3.5s punished pure positioning (dodge) time. 4.0 keeps chains alive without trivializing. GDD lines 11/48 updated to 4s.
- `powerup.dropChance 0.22 -> 0.25`: power-ups are the main sustain/mitigation lever; a slightly higher drop rate eases the mid-wave sustain gap. GDD line 51 updated to 25%.
- NEW `wave.spawnMinPlayerDist = 8`: rim spawns re-roll their angle (up to 6 attempts) to land at least 8 units from the ship. GDD line 40 says rocks spawn "outside visible area", but a rim spawn could land within ~3 units of a ship hugging the rim (unfair instant hit). Falls back to the first placement if all re-rolls are too close, so the concurrent cap keeps priority over fairness.
- Documented, no change: concurrent cap plateaus at 24 from wave 9, speedMult plateaus at 1.9 from wave 13 � deliberate headroom for I39+ tuning and E7 content.
