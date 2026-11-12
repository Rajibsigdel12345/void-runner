// Void Runner - DOM input state (ST-006; ST-033 touch; ST-268 dual-zone touch). Render layer only; core stays DOM-free.
import { v2, v2Norm } from '../core/math.js';
import { zoneFor, thrustFromDrag, ZONE } from '../core/touchZones.js';

const TRACKED = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'];

// Touch tuning (ST-033 -> ST-268 dual-zone):
//  - LEFT-zone drag = thrust on a floating stick (origin = down-point): DEADZONE px dead-zone,
//    linear ramp to full thrust at MAX_PX px, auto-centre (zero thrust) on release.
//  - RIGHT-zone touch = aim (touch position) + fire while down; release keeps FIRE_TAIL so a
//    tap still launches >=1 bullet (ST-033 tap guarantee, fire interval ~0.18 s).
//  - Silent move = left-only (no fire).
//  - Two-finger pause: a SECOND finger down in the SAME zone as the existing one (cooldown-gated,
//    + visual-confirmation callback). Cross-zone fingers (left thrust + right fire) are the core
//    dual-zone loop and must NOT pause (ST-268 spec delta vs the ST-033 any-second-finger rule).
//  - Extra (3rd+) fingers ignored; onBlur clears all. Keyboard/mouse paths untouched (BY LAYER).
const DEADZONE = 24;    // px (the ST-033 DRAG_THRESH)
const MAX_PX = 90;      // px of drag for full-thrust magnitude
const FIRE_TAIL = 0.22; // s of firing kept after right-zone release so a tap always launches >=1 bullet (fire interval ~0.18s)
const PAUSE_COOLDOWN = 0.45;

export function createInput(opts = {}) {
  const onPause = typeof opts.onPause === 'function' ? opts.onPause : null;
  const onPauseConfirm = typeof opts.onPauseConfirm === 'function' ? opts.onPauseConfirm : null; // ST-268: visual confirmation of the two-finger pause
  const keys = new Set();
  const pointer = { ndc: v2(0, 0), active: false };
  const state = { thrust: v2(0, 0), firing: false };
  let mouseHeld = false;
  let leftTouch = null;  // { id, x, y, sx, sy } - thrust stick (sx/sy = floating origin at down-point)
  let rightTouch = null; // { id, x, y } - aim + fire
  let rightFiring = false; // true while a right-zone touch is down
  let fireTail = 0;        // seconds of post-release firing (tap guarantee)
  let pauseCd = 0;         // two-finger pause cooldown
  const touches = new Map(); // pointerId -> tracked touch object (leftTouch/rightTouch)

  function leftThrust() {
    if (!leftTouch) return v2(0, 0);
    const t = thrustFromDrag(leftTouch.x - leftTouch.sx, leftTouch.y - leftTouch.sy, DEADZONE, MAX_PX); // screen right/down = sim +x/+y (ST-033 convention)
    return v2(t.x, t.y);
  }

  function leftDragDir() {
    if (!leftTouch) return null;
    const dx = leftTouch.x - leftTouch.sx, dy = leftTouch.y - leftTouch.sy;
    if (Math.hypot(dx, dy) <= DEADZONE) return null;
    return v2Norm(v2(dx, dy));
  }

  function computeThrust() {
    let x = 0, y = 0;
    // screen-up (W) moves toward top of view = -y in sim coords (three +z = sim +y)
    if (keys.has('KeyW') || keys.has('ArrowUp')) y -= 1;
    if (keys.has('KeyS') || keys.has('ArrowDown')) y += 1;
    if (keys.has('KeyA') || keys.has('ArrowLeft')) x -= 1;
    if (keys.has('KeyD') || keys.has('ArrowRight')) x += 1;
    if (x || y) return v2Norm(v2(x, y));
    return leftThrust();
  }

  function computeFiring() {
    return keys.has('Space') || mouseHeld || rightFiring || fireTail > 0;
  }

  function refresh() {
    state.thrust = computeThrust();
    state.firing = computeFiring();
  }

  function aimFromPoint(cx, cy) {
    pointer.ndc.x = (cx / window.innerWidth) * 2 - 1;
    pointer.ndc.y = -(cy / window.innerHeight) * 2 + 1;
    pointer.active = true;
  }

  const onKeyDown = (e) => {
    if (!TRACKED.includes(e.code)) return;
    keys.add(e.code);
    if (e.code === 'Space') e.preventDefault();
    refresh();
  };
  const onKeyUp = (e) => { keys.delete(e.code); refresh(); };
  const onMove = (e) => {
    if (e.pointerType === 'touch') {
      if (leftTouch && e.pointerId === leftTouch.id) {
        leftTouch.x = e.clientX; leftTouch.y = e.clientY;
      } else if (rightTouch && e.pointerId === rightTouch.id) {
        rightTouch.x = e.clientX; rightTouch.y = e.clientY;
        aimFromPoint(e.clientX, e.clientY); // ST-268: the right-zone finger owns the aim (left drags never write pointer.ndc)
      }
      refresh();
      return;
    }
    aimFromPoint(e.clientX, e.clientY);
  };
  const onDown = (e) => {
    if (e.pointerType === 'touch') {
      if (touches.has(e.pointerId)) { refresh(); return; } // duplicate down for an already-tracked finger: no-op
      const zone = zoneFor(e.clientX, window.innerWidth);
      if (touches.size === 1) {
        // second finger in the SAME zone as the existing one = pause (ST-033 gesture, cooldown-gated,
        // + visual confirmation). Cross-zone fingers = thrust + fire = the dual-zone loop (no pause).
        const first = touches.values().next().value;
        if (zoneFor(first.x, window.innerWidth) === zone) {
          if (pauseCd <= 0) {
            if (onPause) onPause();
            pauseCd = PAUSE_COOLDOWN;
            if (onPauseConfirm) onPauseConfirm();
          }
          return; // the pause finger is never tracked (extra fingers ignored)
        }
      }
      if (zone === ZONE.LEFT && !leftTouch) {
        leftTouch = { id: e.pointerId, x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY };
        touches.set(e.pointerId, leftTouch);
      } else if (zone === ZONE.RIGHT && !rightTouch) {
        rightTouch = { id: e.pointerId, x: e.clientX, y: e.clientY };
        touches.set(e.pointerId, rightTouch);
        rightFiring = true;
        aimFromPoint(e.clientX, e.clientY);
      }
      // else: that zone already has a tracked finger -> the extra finger is ignored
      refresh();
      return;
    }
    if (e.button === 0) { mouseHeld = true; refresh(); }
  };
  function touchRelease(id) {
    if (!touches.delete(id)) return;
    if (leftTouch && leftTouch.id === id) leftTouch = null; // auto-centre: thrust returns to zero on release
    if (rightTouch && rightTouch.id === id) {
      rightTouch = null;
      rightFiring = false;
      fireTail = FIRE_TAIL; // a right-zone tap still launches at least one bullet
      pointer.active = false; // the touch no longer owns the aim (a mouse move re-sets it)
    }
    refresh();
  }
  const onUp = (e) => {
    if (e.pointerType === 'touch') { touchRelease(e.pointerId); return; }
    if (e.button === 0) { mouseHeld = false; refresh(); }
  };
  const onCancel = (e) => { if (e.pointerType === 'touch') touchRelease(e.pointerId); };
  const onBlur = () => {
    keys.clear(); mouseHeld = false;
    leftTouch = null; rightTouch = null; touches.clear();
    rightFiring = false; fireTail = 0; pointer.active = false;
    refresh();
  };

  // Per-frame timer decay (called by main each sim substep).
  function tick(dt) {
    if (pauseCd > 0) pauseCd = Math.max(0, pauseCd - dt);
    if (fireTail > 0) {
      fireTail = Math.max(0, fireTail - dt);
      if (!computeFiring()) state.firing = false;
    }
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerdown', onDown);
  window.addEventListener('pointerup', onUp);
  window.addEventListener('pointercancel', onCancel);
  window.addEventListener('blur', onBlur);

  return {
    state,
    pointer,
    get touchDrag() { return leftDragDir(); },          // ST-268: left-zone drag direction (null inside the dead-zone)
    get rightAimActive() { return rightTouch !== null; }, // ST-268: the right-zone finger owns the aim + fire
    tick,
    dispose() {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onCancel);
      window.removeEventListener('blur', onBlur);
    },
  };
}
