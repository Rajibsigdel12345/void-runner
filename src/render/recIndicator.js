// Void Runner - REC indicator (ST-191 / I191). A small pulsing chip while a live run is being
// recorded. Render layer (DOM), so it lives in src/render. The keyframes (vrPulse) are
// injected globally by screens.js before any PLAYING frame exists.
export function createRecIndicator(root) {
  const chip = document.createElement('div');
  chip.style.cssText = [
    'position:fixed', 'top:14px', 'left:50%', 'transform:translateX(-50%)',
    'display:none', 'align-items:center', 'gap:7px', 'z-index:20', 'pointer-events:none',
    'font-size:calc(12px * var(--vr-fs,1))', 'font-weight:700', 'letter-spacing:3px',
    'color:#ff8a97', 'background:rgba(30,6,12,0.72)',
    'border:1px solid rgba(255,107,122,0.45)', 'border-radius:14px', 'padding:4px 14px',
  ].join(';');
  const dot = document.createElement('span');
  dot.style.cssText = 'width:8px;height:8px;border-radius:50%;background:#ff4757;animation:vrPulse 1.1s ease-in-out infinite;';
  chip.append(dot, document.createTextNode('REC'));
  root.appendChild(chip);
  return {
    show() { chip.style.display = 'flex'; },
    hide() { chip.style.display = 'none'; },
    get visible() { return chip.style.display !== 'none'; },
    el: chip,
  };
}
