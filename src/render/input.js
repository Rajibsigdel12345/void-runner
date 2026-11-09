// Void Runner - DOM input state (ST-006). Render layer only; core stays DOM-free.
import { v2, v2Norm } from '../core/math.js';

const TRACKED = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'];

export function createInput() {
  const keys = new Set();
  const pointer = { ndc: v2(0, 0), active: false };
  const state = { thrust: v2(0, 0), firing: false };
  let mouseHeld = false;

  function refresh() {
    let x = 0, y = 0;
    // screen-up (W) moves toward top of view = -y in sim coords (three +z = sim +y)
    if (keys.has('KeyW') || keys.has('ArrowUp')) y -= 1;
    if (keys.has('KeyS') || keys.has('ArrowDown')) y += 1;
    if (keys.has('KeyA') || keys.has('ArrowLeft')) x -= 1;
    if (keys.has('KeyD') || keys.has('ArrowRight')) x += 1;
    state.thrust = (x || y) ? v2Norm(v2(x, y)) : v2(0, 0);
    state.firing = keys.has('Space') || mouseHeld;
  }

  const onKeyDown = (e) => {
    if (!TRACKED.includes(e.code)) return;
    keys.add(e.code);
    if (e.code === 'Space') e.preventDefault();
    refresh();
  };
  const onKeyUp = (e) => { keys.delete(e.code); refresh(); };
  const onMove = (e) => {
    pointer.ndc.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.ndc.y = -(e.clientY / window.innerHeight) * 2 + 1;
    pointer.active = true;
  };
  const onDown = (e) => { if (e.button === 0) { mouseHeld = true; refresh(); } };
  const onUp = (e) => { if (e.button === 0) { mouseHeld = false; refresh(); } };
  const onBlur = () => { keys.clear(); mouseHeld = false; refresh(); };

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerdown', onDown);
  window.addEventListener('pointerup', onUp);
  window.addEventListener('blur', onBlur);

  return {
    state,
    pointer,
    dispose() {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('blur', onBlur);
    },
  };
}
