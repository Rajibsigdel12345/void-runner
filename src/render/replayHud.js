// ST-190 / I190: replay HUD - a slim top bar shown while watching a replay (REPLAY state).
// Shows the run title (DEMO PILOT / REPLAY), the run meta (score/wave/kills/time), a progress
// bar over the recorded length, the playback speed, and the key hints. DOM only, change-cached
// (touches the DOM only when a value changes). z-index 15 - above the in-game HUD, below the
// fullscreen screens (z-index 20). Reduced motion is honored via the vr-reduced class.
export function createReplayHud(root) {
  const el = document.createElement('div');
  el.id = 'replay-hud';
  el.setAttribute('aria-hidden', 'true');
  el.style.cssText = [
    'position:fixed', 'top:0', 'left:0', 'right:0', 'z-index:15',
    'display:none', 'align-items:center', 'gap:14px', 'padding:8px 16px 10px',
    'background:linear-gradient(180deg, rgba(6,10,26,0.92), rgba(6,10,26,0.5) 70%, rgba(6,10,26,0));',
    'font-family:"Segoe UI",system-ui,sans-serif', 'color:#cfe4ff',
    'pointer-events:none', 'user-select:none', 'border-bottom:1px solid rgba(120,170,255,0.14)',
  ].join(';');
  const style = document.createElement('style');
  style.textContent = [
    '#replay-hud .vr-rh-title{font-weight:800;letter-spacing:3px;font-size:calc(14px * var(--vr-fs,1));color:#8fd0ff;text-shadow:0 0 12px rgba(90,180,255,0.5);white-space:nowrap;}',
    '#replay-hud .vr-rh-meta{font-size:calc(12px * var(--vr-fs,1));letter-spacing:1px;opacity:0.9;white-space:nowrap;}',
    '#replay-hud .vr-rh-bar{flex:1;height:6px;border-radius:4px;background:rgba(120,170,255,0.16);overflow:hidden;}',
    '#replay-hud .vr-rh-fill{height:100%;width:0;background:linear-gradient(90deg,#4fb0ff,#9be3ff);transition:width 0.12s linear;}',
    '#replay-hud.vr-reduced .vr-rh-fill{transition:none !important;}',
    '#replay-hud .vr-rh-speed{font-weight:800;letter-spacing:2px;font-size:calc(13px * var(--vr-fs,1));color:#9be3ff;min-width:38px;text-align:center;white-space:nowrap;}',
    '#replay-hud .vr-rh-hints{font-size:calc(11px * var(--vr-fs,1));letter-spacing:1px;opacity:0.55;white-space:nowrap;}',
    '@media (max-width:680px){#replay-hud .vr-rh-hints{display:none;}}',
  ].join('');
  el.appendChild(style);

  const title = document.createElement('div'); title.className = 'vr-rh-title'; title.textContent = 'REPLAY';
  const meta = document.createElement('div'); meta.className = 'vr-rh-meta'; meta.textContent = '';
  const bar = document.createElement('div'); bar.className = 'vr-rh-bar';
  const fill = document.createElement('div'); fill.className = 'vr-rh-fill';
  bar.appendChild(fill);
  const speed = document.createElement('div'); speed.className = 'vr-rh-speed'; speed.textContent = '×1';
  const hints = document.createElement('div'); hints.className = 'vr-rh-hints'; hints.textContent = 'P pause · 1/2/3 speed · Q quit';
  el.append(title, meta, bar, speed, hints);
  root.appendChild(el);

  let visible = false;
  let _title = '', _meta = '', _speed = '', _frac = -1;

  function fmtTime(s) {
    const m = Math.floor(s / 60); const sec = Math.floor(s % 60);
    return (m > 0 ? m + ':' : '') + String(sec).padStart(2, '0');
  }

  /** Change-cached update: { visible, meta:{score,wave,kills,time,mode}, idx, length, speed, reducedMotion }. */
  function update(o) {
    if (!o) return;
    const vis = !!o.visible;
    if (vis !== visible) { visible = vis; el.style.display = vis ? 'flex' : 'none'; }
    el.classList.toggle('vr-reduced', o.reducedMotion === true);
    if (!visible) return;
    const t = (o.meta && o.meta.mode === 'demo') ? 'DEMO PILOT' : 'REPLAY';
    if (t !== _title) { _title = t; title.textContent = t; }
    const m = o.meta || {};
    const mtxt = 'score ' + (m.score || 0) + '  ·  wave ' + (m.wave || 0) + '  ·  ' + (m.kills || 0) + ' kills  ·  ' + fmtTime(m.time || 0);
    if (mtxt !== _meta) { _meta = mtxt; meta.textContent = mtxt; }
    const s = '×' + (o.speed || 1);
    if (s !== _speed) { _speed = s; speed.textContent = s; }
    const len = o.length > 0 ? o.length : 1;
    const frac = Math.max(0, Math.min(1, (o.idx || 0) / len));
    if (Math.abs(frac - _frac) > 0.0005) { _frac = frac; fill.style.width = (frac * 100).toFixed(1) + '%'; }
  }

  return { update, el };
}
