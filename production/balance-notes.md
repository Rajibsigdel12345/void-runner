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
