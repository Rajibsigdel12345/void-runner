// ST-026: settings panel (volume / sfx / fx tier / reduced motion).
// DOM only; persists through Storage.setSettings and calls onChange(merged)
// so the boot layer can re-derive runtime fx values (particles, shake, flash).
export function createSettingsPanel(storage, onChange) {
  const wrap = document.createElement('div');
  wrap.id = 'settings-panel';
  wrap.style.cssText = [
    'display:grid', 'grid-template-columns:auto 220px', 'gap:8px 16px',
    'align-items:center', 'justify-content:center', 'font-size:14px',
    'letter-spacing:1px', 'margin-top:18px', 'pointer-events:auto',
  ].join(';');

  const s0 = storage.getSettings();

  function row(label) {
    const d = document.createElement('div');
    d.style.cssText = 'text-align:right;font-weight:600;color:#ffe08a;';
    d.textContent = label;
    wrap.appendChild(d);
    return wrap;
  }
  function styleCtl(c) {
    c.style.cssText = 'background:rgba(10,18,40,0.8);border:1px solid #2b4a8a;border-radius:4px;color:#cfe4ff;font-family:inherit;';
    return c;
  }

  // VOLUME
  row('VOLUME');
  const vol = document.createElement('input');
  vol.type = 'range'; vol.min = '0'; vol.max = '1'; vol.step = '0.05';
  vol.value = String(s0.volume);
  vol.style.width = '220px';
  vol.addEventListener('input', () => emit({ volume: Number(vol.value) }));
  wrap.appendChild(styleCtl(vol));

  // SFX
  row('SFX');
  const sfx = document.createElement('input');
  sfx.type = 'checkbox'; sfx.checked = s0.sfx;
  sfx.addEventListener('change', () => emit({ sfx: sfx.checked }));
  wrap.appendChild(sfx);

  // FX QUALITY
  row('FX QUALITY');
  const fxSel = document.createElement('select');
  for (const opt of ['high', 'low']) {
    const o = document.createElement('option');
    o.value = opt; o.textContent = opt.toUpperCase();
    fxSel.appendChild(o);
  }
  fxSel.value = s0.fx;
  fxSel.addEventListener('change', () => emit({ fx: fxSel.value }));
  wrap.appendChild(styleCtl(fxSel));

  // REDUCED MOTION
  row('REDUCED MOTION');
  const rm = document.createElement('input');
  rm.type = 'checkbox'; rm.checked = s0.reducedMotion;
  rm.addEventListener('change', () => emit({ reducedMotion: rm.checked }));
  wrap.appendChild(rm);

  function emit(partial) {
    const merged = storage.setSettings(partial);
    onChange(merged);
  }

  // Re-read storage so two mounted instances (menu + pause) stay in sync.
  function sync() {
    const s = storage.getSettings();
    vol.value = String(s.volume);
    sfx.checked = s.sfx;
    fxSel.value = s.fx;
    rm.checked = s.reducedMotion;
  }

  return { el: wrap, sync };
}
