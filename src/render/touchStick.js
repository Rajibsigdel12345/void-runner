// Void Runner - ST-321 (I351): the on-screen floating thrust-stick visual. Render layer only.
// A low-alpha DOM overlay that mirrors the LEFT-zone finger so the player can see the stick's
// origin and how much thrust is applied (grounding: the engine's own mobile stick is a visible
// low-alpha sprite, "not too invasive", shown only on touch). Driven PURELY from input.leftStick
// each frame - the same rAF that drives everything else - so pointercancel/blur hide it for free
// (input.js clears leftTouch on those). Coarse-gated in main.js (zero DOM on mouse/keyboard).
// The knob is faint inside the dead-zone and brighter beyond; fade-in ~120 ms / fade-out ~200 ms.
// Geometry is 1:1 with viewport px (NOT --vr-fs scaled) so the knob always sits exactly under the
// finger drag, clamped to the full-thrust radius (MAX_PX).
import { knobOffset } from '../core/touchZones.js';
import { DEADZONE, MAX_PX } from './input.js';

const RING_PX = 2 * MAX_PX;   // ring diameter = the full-thrust drag circle (180 px)
const KNOB_PX = 2 * DEADZONE; // knob diameter = the dead-zone circle (48 px)
const FADE_IN = 0.12;         // s
const FADE_OUT = 0.20;        // s
const FAINT = 0.45;           // knob relative alpha inside the dead-zone

export function createTouchStick() {
  const root = document.createElement('div');
  root.id = 'vr-touch-stick';
  root.style.cssText = 'position:fixed;left:0;top:0;width:0;height:0;z-index:29;pointer-events:none;display:none;opacity:0;will-change:transform,opacity;';
  const ring = document.createElement('div');
  ring.style.cssText = 'position:absolute;left:' + (-RING_PX / 2) + 'px;top:' + (-RING_PX / 2) + 'px;width:' + RING_PX + 'px;height:' + RING_PX + 'px;border-radius:50%;border:2px solid rgba(207,228,255,0.35);box-sizing:border-box;';
  const knob = document.createElement('div');
  knob.style.cssText = 'position:absolute;left:' + (-KNOB_PX / 2) + 'px;top:' + (-KNOB_PX / 2) + 'px;width:' + KNOB_PX + 'px;height:' + KNOB_PX + 'px;border-radius:50%;background:rgba(207,228,255,0.55);border:1px solid rgba(207,228,255,0.6);';
  root.appendChild(ring);
  root.appendChild(knob);
  document.body.appendChild(root);

  let fade = 0;      // 0..1 show/hide
  let shown = false; // root currently on screen
  let lastX = 0, lastY = 0; // last active origin (held during fade-out so the stick does not jump)
  let knobX = 0, knobY = 0, bright = 1; // last knob offset + relative alpha (held during fade-out)
  const out = { active: false, x: 0, y: 0, knobX: 0, knobY: 0, bright: 0, fade: 0, shown: false }; // reused readout (no alloc)

  function sync(input, dt, visible) {
    const ls = input.leftStick;
    const isActive = ls.active && visible;
    if (isActive) {
      lastX = ls.sx; lastY = ls.sy;
      const k = knobOffset(ls.dx, ls.dy, DEADZONE, MAX_PX);
      knobX = k.x; knobY = k.y; bright = k.active ? 1 : FAINT;
      fade = Math.min(1, fade + dt / FADE_IN);
      if (!shown) { shown = true; root.style.display = 'block'; }
      root.style.transform = 'translate3d(' + lastX + 'px,' + lastY + 'px,0)';
      knob.style.transform = 'translate3d(' + knobX + 'px,' + knobY + 'px,0)';
      knob.style.opacity = bright;
    } else {
      fade = Math.max(0, fade - dt / FADE_OUT);
      if (fade <= 0 && shown) { shown = false; root.style.display = 'none'; }
    }
    root.style.opacity = fade;
    out.active = isActive; out.x = lastX; out.y = lastY;
    out.knobX = knobX; out.knobY = knobY; out.bright = bright; out.fade = fade; out.shown = shown;
    return out;
  }
  function dispose() { if (root.parentNode) root.parentNode.removeChild(root); }
  return { sync, dispose };
}
