// ST-025: screen-shake envelope. Pure core (DOM-free, three-free): the render
// layer (main.js) applies the returned offset to the camera each frame.
export function createShake(cfg, rng) {
  let mag = 0; // current shake energy 0..1 (master scale applied at trigger)
  let master = cfg.master;

  function trigger(strength) {
    if (master <= 0) return;
    const s = Math.min(1, strength * master);
    if (s > mag) mag = s; // max-stacking, never additive
  }
  function setMaster(m) { master = m; }
  function step(dt) {
    if (mag <= 0) return;
    mag *= Math.exp(-cfg.decay * dt);
    if (mag < 0.002) mag = 0; // settle
  }
  // Writes jitter into out {x,y,z}; zeros when idle.
  function offset(out) {
    if (mag <= 0) { out.x = 0; out.y = 0; out.z = 0; return out; }
    const a = rng.next() * Math.PI * 2;
    const r = mag * cfg.amplitude * (0.6 + 0.4 * rng.next());
    out.x = Math.cos(a) * r;
    out.z = Math.sin(a) * r;
    out.y = (rng.next() - 0.5) * r * 0.5;
    return out;
  }
  return { trigger, setMaster, step, offset, magnitude: () => mag };
}

// ST-081: camera punch. Pure core (DOM-free, three-free): a brief directed
// camera jolt for high-impact events (boss death, bomb). Unlike shake (random
// jitter that overwrites out), punch ADDS a directed offset so it composes on
// top of shake when both are active.
export function createPunch(cfg) {
  let mag = 0; // current punch energy 0..1
  const dir = { x: 0, y: 0, z: 0 };

  function trigger(direction, strength = 1) {
    if (strength <= 0) return;
    if (direction) { dir.x = direction.x || 0; dir.y = direction.y || 0; dir.z = direction.z || 0; }
    mag = Math.min(1, Math.max(mag, strength)); // max-stacking, never additive
  }
  function step(dt) {
    if (mag <= 0) return;
    mag *= Math.exp(-(cfg.decay || 10) * dt);
    if (mag < 0.002) mag = 0; // settle
  }
  // Adds dir * mag * amplitude to out (composes after shake). No-op when idle.
  function offset(out) {
    if (mag <= 0) return out;
    const s = mag * (cfg.amplitude || 2);
    out.x += dir.x * s;
    out.y += dir.y * s;
    out.z += dir.z * s;
    return out;
  }
  return { trigger, step, offset, magnitude: () => mag };
}

// ST-082: dynamic FOV kick. Pure core (DOM-free, three-free): a brief FOV
// widening (degrees) on high-impact events (bomb, boss death). The render
// layer adds value() to the base FOV and eases camera.fov toward it.
export function createFovKick(cfg) {
  let mag = 0; // current kick (degrees)

  function trigger(deg) {
    if (deg <= 0) return;
    mag = Math.min(cfg.max, Math.max(mag, deg)); // max-stacking, clamped at max
  }
  function step(dt) {
    if (mag <= 0) return;
    mag *= Math.exp(-cfg.decay * dt);
    if (mag < 0.05) mag = 0; // settle (0.05 deg is sub-perceptible)
  }
  return { trigger, step, value: () => mag };
}
