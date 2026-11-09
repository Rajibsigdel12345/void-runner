// Void Runner - DOM input state (ST-006; ST-033 touch). Render layer only; core stays DOM-free.
import { v2, v2Norm } from '../core/math.js';

const TRACKED = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'];

// Touch tuning (ST-033): drag = thrust + fire forward, tap = fire toward tap,
// two-finger tap = pause. Thresholds chosen for finger-sized targets.
const DRAG_THRESH = 24;   // px of travel before a touch counts as a drag
const FIRE_TAIL = 0.22;   // s of firing kept after release so a tap always launches >=1 bullet (fire interval ~0.18s)
const PAUSE_COOLDOWN = 0.45;

export function createInput(opts = {}) {
  const onPause = typeof opts.onPause === 'function' ? opts.onPause : null;
  const keys = new Set();
  const pointer = { ndc: v2(0, 0), active: false };
  const state = { thrust: v2(0, 0), firing: false };
  let mouseHeld = false;
  let touchDrag = null;    // normalized drag direction while a touch is dragging (else null)
  let touchFiring = false; // true while any touch is down
  let fireTail = 0;        // seconds of post-release firing (tap guarantee)
  let pauseCd = 0;         // two-finger pause cooldown
  const touches = new Map(); // pointerId -> { x, y, sx, sy, t0 }

  function primaryTouch() {
    let best = null;
    for (const t of touches.values()) if (!best || t.t0 < best.t0) best = t;
    return best;
  }

  function computeThrust() {
    let x = 0, y = 0;
    // screen-up (W) moves toward top of view = -y in sim coords (three +z = sim +y)
    if (keys.has('KeyW') || keys.has('ArrowUp')) y -= 1;
    if (keys.has('KeyS') || keys.has('ArrowDown')) y += 1;
    if (keys.has('KeyA') || keys.has('ArrowLeft')) x -= 1;
    if (keys.has('KeyD') || keys.has('ArrowRight')) x += 1;
    if (x || y) return v2Norm(v2(x, y));
    const t = primaryTouch();
    if (t) {
      const dx = t.x - t.sx, dy = t.y - t.sy; // screen right/down = sim +x/+y
      if (Math.hypot(dx, dy) > DRAG_THRESH) return v2Norm(v2(dx, dy));
    }
    return v2(0, 0);
  }

  function computeFiring() {
    return keys.has('Space') || mouseHeld || touchFiring || fireTail > 0;
  }

  function refresh() {
    state.thrust = computeThrust();
    state.firing = computeFiring();
    const t = primaryTouch();
    const dx = t ? t.x - t.sx : 0;
    const dy = t ? t.y - t.sy : 0;
    touchDrag = t && Math.hypot(dx, dy) > DRAG_THRESH ? v2Norm(v2(dx, dy)) : null;
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
      const t = touches.get(e.pointerId);
      if (t) { t.x = e.clientX; t.y = e.clientY; }
      const p = primaryTouch();
      if (p) aimFromPoint(p.x, p.y);
      refresh();
      return;
    }
    aimFromPoint(e.clientX, e.clientY);
  };
  const onDown = (e) => {
    if (e.pointerType === 'touch') {
      if (touches.size >= 1) {
        // second finger down = pause (story ST-033), cooldown-gated
        if (pauseCd <= 0 && onPause) { onPause(); pauseCd = PAUSE_COOLDOWN; }
        return; // extra fingers are ignored while held
      }
      touches.set(e.pointerId, { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, t0: (performance.now() || 0) / 1000 });
      touchFiring = true;
      aimFromPoint(e.clientX, e.clientY);
      refresh();
      return;
    }
    if (e.button === 0) { mouseHeld = true; refresh(); }
  };
  function touchRelease(id) {
    if (!touches.delete(id)) return;
    if (touches.size === 0) {
      touchFiring = false;
      fireTail = FIRE_TAIL; // a tap (short hold) still launches at least one bullet
      pointer.active = false;
    }
    refresh();
  }
  const onUp = (e) => {
    if (e.pointerType === 'touch') { touchRelease(e.pointerId); return; }
    if (e.button === 0) { mouseHeld = false; refresh(); }
  };
  const onCancel = (e) => { if (e.pointerType === 'touch') touchRelease(e.pointerId); };
  const onBlur = () => {
    keys.clear(); mouseHeld = false; touches.clear();
    touchFiring = false; fireTail = 0; pointer.active = false;
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
    get touchDrag() { return touchDrag; },
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
