// Void Runner - ST-511 (I545, E74 D2): DOM-only, NON-BLOCKING "rotate to landscape" hint.
// Render layer only. Shown ONLY when the pointer is coarse (touch) AND the layout is portrait;
// auto-hides in landscape. No forced JS orientation lock - the PWA manifest already declares
// orientation:landscape for installs (D2). Coarse-gated in main.js (createRotateHint is only
// called for touch) so the desktop DOM is byte-untouched (K3 desktop pixel-stable).
// The label is i18n-driven: main.js calls setLabel() on boot and on the onLocale re-emit
// (en/zh/ja via the ui.rotate_hint key). Pure DOM + matchMedia/resize; zero 3D surface.
export function createRotateHint(host) {
  const root = document.createElement('div');
  root.id = 'vr-rotate-hint';
  root.style.cssText = 'position:fixed;inset:0;z-index:50;display:none;align-items:center;justify-content:center;flex-direction:column;gap:14px;background:rgba(2,4,12,0.72);pointer-events:none;font-family:"Segoe UI",system-ui,sans-serif;color:#cfe4ff;text-align:center;';
  const glyph = document.createElement('div');
  glyph.style.cssText = 'font-size:40px;line-height:1;animation:vrRotateHint 1.6s ease-in-out infinite;';
  glyph.textContent = '\u21bb'; // clockwise open circle arrow (U+21BB)
  const label = document.createElement('div');
  label.style.cssText = 'font-size:15px;font-weight:700;letter-spacing:3px;text-transform:uppercase;';
  root.appendChild(glyph);
  root.appendChild(label);
  host.appendChild(root);

  const mqCoarse = (typeof matchMedia === 'function') ? matchMedia('(pointer:coarse)') : null;
  const mqPortrait = (typeof matchMedia === 'function') ? matchMedia('(orientation:portrait)') : null;

  // Coarse mirrors main.js touch detection (matchMedia OR ontouchstart) so the hint is always
  // consistent with the touch-stick gate. Portrait trusts the CSS media query when present and
  // falls back to the viewport dimensions (robust under emulation / mid-rotation).
  function isCoarse() {
    if (mqCoarse && mqCoarse.matches) return true;
    return (typeof window !== 'undefined') && ('ontouchstart' in window);
  }
  function isPortrait() {
    if (mqPortrait && mqPortrait.matches) return true;
    return (typeof window !== 'undefined') && window.innerHeight > window.innerWidth;
  }
  function refresh() {
    root.style.display = (isCoarse() && isPortrait()) ? 'flex' : 'none';
  }
  function onChange() { refresh(); }
  if (mqCoarse) mqCoarse.addEventListener('change', onChange);
  if (mqPortrait) mqPortrait.addEventListener('change', onChange);
  if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    window.addEventListener('resize', onChange);
  }
  refresh(); // initial (portrait + touch -> visible; landscape / desktop -> hidden)

  return {
    el: root,
    labelEl: label,
    setLabel(text) { label.textContent = text; },
    get visible() { return root.style.display === 'flex'; },
    dispose() {
      if (mqCoarse) mqCoarse.removeEventListener('change', onChange);
      if (mqPortrait) mqPortrait.removeEventListener('change', onChange);
      if (typeof window !== 'undefined' && typeof window.removeEventListener === 'function') window.removeEventListener('resize', onChange);
      if (root.parentNode) root.parentNode.removeChild(root);
    },
  };
}
