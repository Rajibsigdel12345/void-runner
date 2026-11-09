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
