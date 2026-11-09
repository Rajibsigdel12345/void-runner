// Void Runner - opt-in debug overlay (ST-080). ?dbg=1 shows FPS/frame-ms, GPU draw
// calls + triangles, live entity counts vs pool caps, and the current game state.
// Render-layer (DOM). Text updates are throttled to ~4 Hz to avoid per-frame churn.
export function createDebugOverlay() {
  const el = document.createElement('div');
  el.id = 'dbg-overlay';
  el.setAttribute('aria-hidden', 'true');
  el.style.cssText = 'position:fixed;left:8px;top:8px;z-index:90;font:12px/1.5 ui-monospace,monospace;color:#9fe8a0;background:rgba(4,6,15,0.62);padding:6px 9px;border-radius:4px;pointer-events:none;display:none;white-space:pre;';
  document.body.appendChild(el);
  let frames = 0, acc = 0, last = '';
  const pad = (n) => String(Math.max(0, n | 0)).padStart(3, ' ');
  return {
    element: el,
    show() { el.style.display = 'block'; },
    hide() { el.style.display = 'none'; },
    update(dt, s) {
      if (el.style.display === 'none') return;
      if (dt > 0) { frames += 1; acc += dt; }
      if (acc < 0.25) return; // ~4 Hz refresh
      const fps = frames / acc;
      const ms = (acc / frames * 1000).toFixed(1);
      frames = 0; acc = 0;
      const line =
        'FPS ' + pad(Math.round(fps)) + '  ' + ms + ' ms  ' + s.drawcalls + ' calls  ' + s.tris + ' tris\n' +
        'rocks ' + s.rocks + '/' + s.rockCap + '  bullets ' + s.bullets + '/' + s.bulletCap + '  eb ' + s.eb + '/' + s.ebCap + '\n' +
        'mines ' + s.mines + '/' + s.mineCap + '  drops ' + s.drops + '/' + s.dropCap + '  boss ' + s.boss + '\n' +
        'state ' + s.state;
      if (line !== last) { last = line; el.textContent = line; }
    },
  };
}
