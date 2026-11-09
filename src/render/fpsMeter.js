// Void Runner - opt-in FPS meter (ST-036). ?fps=1 shows fps + frame time;
// ?fps=2 additionally shows GPU draw calls + triangles from the previous frame.
export function createFpsMeter(renderer = null) {
  const el = document.createElement('div');
  el.id = 'fps-meter';
  el.style.cssText = 'position:fixed;left:8px;bottom:8px;z-index:50;font:12px/1.5 ui-monospace,monospace;color:#7fd4ff;background:rgba(4,6,15,0.55);padding:4px 8px;border-radius:4px;pointer-events:none;display:none;white-space:pre;';
  document.body.appendChild(el);
  let frames = 0;
  let acc = 0;
  let last = '';
  return {
    element: el,
    show() { el.style.display = 'block'; },
    sync(dt) {
      if (el.style.display === 'none' || dt <= 0) return;
      frames += 1;
      acc += dt;
      if (acc < 0.5) return; // 0.5s averaging window
      const fps = Math.round(frames / acc);
      const ms = (acc / frames * 1000).toFixed(1);
      let line = 'FPS ' + String(fps).padStart(3, ' ') + '  ' + ms + ' ms';
      if (renderer) {
        const info = renderer.info.render;
        line += String.fromCharCode(10) + 'calls ' + info.calls + '  tris ' + info.triangles;
      }
      frames = 0;
      acc = 0;
      if (line !== last) { last = line; el.textContent = line; }
    }
  };
}
