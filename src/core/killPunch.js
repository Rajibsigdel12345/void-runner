// ST-221 (I224): kill punch (T4) - class-scaled directed camera jolt on kills.
// Pure core (DOM-free, three-free): maps a kill (size + overdrive) to punch
// energy, and the ship->kill delta to a normalized camera-space direction. The
// render layer (src/main.js) feeds the energy to the existing punch
// (src/core/fx.js) which owns the envelope (decay, max-stacking, amplitude).
//
// Juice hierarchy (design/art-direction-research.md lever 4):
//   small pickup < rock kill < drone kill < boss phase < boss death
// Rock kills own the bottom rung: 0.08 (S/mine) / 0.12 (M) / 0.18 (L) energy -
// all far below the drone rung (shake 0.35) and the weapon-fanfare punch
// (0.45). NO flash / hit-stop / fovKick on plain kills (bullet-hell
// readability rule: at kill rate a per-kill flash or sim-freeze is noise;
// the dodge read must stay clean). Overdrive combo-heat scales the punch x1.5
// so kill chains physically heat up (reward the chain, not just the kill).

// Energy for a kill: base per size class, x(1 + overdriveBoost) while the
// combo is hot (overdrive active), hard-capped by max. Unknown sizes (boss,
// warden, specials) map to 0 - their own events carry the bigger punches.
export function killPunchEnergy(size, overdrive, cfg) {
  const c = cfg || {};
  const base = size === 'L' ? c.l : size === 'M' ? c.m : size === 'S' || size === 'mine' ? c.s : size === 'stinger' ? (c.stinger || 0) : size === 'flyer' ? (c.flyer || 0) : size === 'hunter' ? (c.hunter || 0) : size === 'gunship' ? (c.gunship || 0) : size === 'sentry' ? (c.sentry || 0) : size === 'wasp' ? (c.wasp || 0) : size === 'pod' ? (c.pod || 0) : size === 'phantom' ? (c.phantom || 0) : size === 'hauler' ? (c.hauler || 0) : size === 'bulwark' ? (c.bulwark || 0) : 0; // ST-418: hunter + gunship rungs // ST-229/ST-232: charger + flyer own their rungs // ST-484 (E69): cloaker / truck / enforcer rungs
  if (!(base > 0) || !isFinite(base)) return 0;
  const boosted = overdrive ? base * (1 + (c.overdriveBoost || 0)) : base;
  const cap = (c.max != null && isFinite(c.max)) ? c.max : Infinity;
  return Math.max(0, Math.min(cap, boosted));
}

// Camera-space direction from the ship toward the kill point, with a small
// upward lift so the jolt reads as pressing INTO the kill, not a drop. World
// 2D (x, y) maps to camera x/z (the camera sits above the arena looking
// along -z). Near kills (d < 0.5) and non-finite inputs fall back to a
// straight-up default instead of a degenerate / NaN direction. The caller
// passes a scratch object (out) to avoid per-kill allocation.
export function killPunchDir(shipPos, killPos, lift, out) {
  const o = out || {};
  const l = isFinite(lift) ? lift : 0.35;
  const dx = (killPos && isFinite(killPos.x)) ? killPos.x - (shipPos && isFinite(shipPos.x) ? shipPos.x : 0) : NaN;
  const dz = (killPos && isFinite(killPos.y)) ? killPos.y - (shipPos && isFinite(shipPos.y) ? shipPos.y : 0) : NaN;
  if (!isFinite(dx) || !isFinite(dz) || Math.hypot(dx, dz) < 0.5) { o.x = 0; o.y = 1; o.z = 0; return o; }
  const len = Math.hypot(dx, l, dz);
  o.x = dx / len; o.y = l / len; o.z = dz / len;
  return o;
}