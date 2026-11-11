// Void Runner - engine flame layering math (ST-256 / I268).
//
// Pure + DOM-free (core convention: no three.js, no DOM) so the per-frame
// flicker/scale decisions are unit-testable. Determinism: the output is a
// pure function of (thrust, t, motionOn) - no per-frame randomness, so a
// frozen frame (tests, replays, ?nocache audits) reproduces identically.
//
// Layering (rendered by src/render/shipMesh.js):
//   core - small hot white-hot cone (the only layer that may cross the
//          183.6 linear bloom threshold = the INTENDED engine accent, like
//          the cockpit; ST-252 bloom-band precedent)
//   mid  - warm orange plume with a soft length falloff (sub-threshold)
//   glow - additive radial sprite at the nozzle root (no new geometry)
import { CONFIG } from './config.js';

const F = CONFIG.ship.flame;

// Two incommensurate sines (ST-063 precedent) - reads as flicker, never as a
// metronome. motionOn=false (reduced motion) -> steady 1.0.
export function flicker(t, motionOn, phase = 0) {
  if (!motionOn) return 1;
  return 1 + F.flicker.amp * Math.sin(F.flicker.speed * t + phase)
             + F.flicker.amp2 * Math.sin(F.flicker.speed2 * t + phase * 1.7);
}

// Steady (motionOff) base scales at full thrust: mid 0.28 radius / 1.25 len
// (was 0.30 / 1.5 - the "oversized" read), core 0.10 / 0.70 (was 0.117 / 0.7
// effective). The core flicker phase is offset so it breathes inside the
// plume without ever crossing its tip (core.len*maxFlicker 0.875 <
// mid.len*minFlicker 0.9375).
export function flameScales(thrust, t, motionOn) {
  const th = Math.max(0, Math.min(1, thrust || 0));
  const w = 0.55 + 0.45 * th;       // thrust width response (ST-063 feel, unchanged)
  const len = Math.max(0.12, th);   // min-length floor (ST-063, unchanged)
  return {
    midLen: len * F.mid.len * flicker(t, motionOn, 0),
    midRadius: F.mid.radius * w,
    coreLen: len * F.core.len * flicker(t, motionOn, 1.3),
    coreRadius: F.core.radius * w * (0.92 + 0.08 * flicker(t, motionOn, 2.1)),
    glowScale: F.glow.size * (0.7 + 0.3 * w) * (motionOn ? 0.9 + 0.1 * Math.sin(33 * t + 0.7) : 1),
    glowOpacity: F.glow.opacity * (0.75 + 0.25 * th),
    swayX: motionOn ? 0.03 * Math.sin(23 * t) : 0,
    swayY: motionOn ? 0.025 * Math.sin(29 * t + 1.1) : 0
  };
}

export default { flameScales, flicker };
