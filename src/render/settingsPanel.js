// ST-026 settings panel, polished in ST-067: grouped (AUDIO / VISUALS),
// keyboard-operable (Tab + arrow focus moves on the plain controls, game
// hotkeys swallowed while the panel holds focus), visible focus styles, and
// a live particle-burst preview when the FX tier changes.
// DOM only; persists through Storage.setSettings and calls onChange(merged)
// so the boot layer can re-derive runtime fx values (particles, shake, bloom).

let styleInjected = false;
function ensureStyle() {
  if (styleInjected) return;
  const st = document.createElement('style');
  st.id = 'vr-settings-style';
  st.textContent =
    '.vr-settings :focus-visible { outline: 2px solid #ffe08a; outline-offset: 2px; }' +
    '.vr-settings input[type=checkbox] { width: 18px; height: 18px; accent-color: #ffe08a; cursor: pointer; }';
  document.head.appendChild(st);
  styleInjected = true;
}

export function createSettingsPanel(storage, onChange, onFxPreview) {
  ensureStyle();
  const s0 = storage.getSettings();

  const wrap = document.createElement('div');
  wrap.className = 'vr-settings';
  wrap.style.cssText = [
    'display:flex', 'flex-direction:column', 'gap:10px',
    'align-items:center', 'margin-top:18px', 'pointer-events:auto',
  ].join(';');

  function card(title) {
    const c = document.createElement('div');
    c.style.cssText = 'display:grid;grid-template-columns:auto 170px;gap:8px 14px;align-items:center;justify-items:start;padding:12px 18px;border:1px solid rgba(120,170,255,0.18);border-radius:12px;background:rgba(10,20,45,0.35);min-width:280px;';
    const h = document.createElement('div');
    h.textContent = title;
    h.style.cssText = 'grid-column:1 / -1;font-size:11px;font-weight:700;letter-spacing:3px;color:#ffe08a;opacity:0.9;border-bottom:1px solid rgba(255,224,138,0.15);padding-bottom:6px;margin-bottom:2px;';
    c.appendChild(h);
    return c;
  }
  function row(label, target) {
    const d = document.createElement('div');
    d.style.cssText = 'text-align:right;font-weight:600;color:#ffe08a;font-size:13px;';
    d.textContent = label;
    target.appendChild(d);
  }
  function styleCtl(c) {
    c.style.cssText = 'background:rgba(10,18,40,0.8);border:1px solid #2b4a8a;border-radius:4px;color:#cfe4ff;font-family:inherit;';
    return c;
  }

  // AUDIO group
  const audioCard = card('AUDIO');
  row('VOLUME', audioCard);
  const vol = document.createElement('input');
  vol.type = 'range'; vol.min = '0'; vol.max = '1'; vol.step = '0.05';
  vol.value = String(s0.volume);
  vol.style.width = '170px';
  vol.setAttribute('aria-label', 'Volume');
  vol.addEventListener('input', () => emit({ volume: Number(vol.value) }));
  audioCard.appendChild(styleCtl(vol));

  row('SFX', audioCard);
  const sfx = document.createElement('input');
  sfx.type = 'checkbox'; sfx.checked = s0.sfx;
  sfx.setAttribute('aria-label', 'Sound effects');
  sfx.addEventListener('change', () => emit({ sfx: sfx.checked }));
  audioCard.appendChild(sfx);

  // VISUALS group
  const visCard = card('VISUALS');
  row('FX QUALITY', visCard);
  const fxSel = document.createElement('select');
  for (const opt of ['high', 'low']) {
    const o = document.createElement('option');
    o.value = opt; o.textContent = opt.toUpperCase();
    fxSel.appendChild(o);
  }
  fxSel.value = s0.fx;
  fxSel.setAttribute('aria-label', 'FX quality');
  fxSel.addEventListener('change', () => emit({ fx: fxSel.value }, true)); // ST-067: live preview
  visCard.appendChild(styleCtl(fxSel));

  row('REDUCED MOTION', visCard);
  const rm = document.createElement('input');
  rm.type = 'checkbox'; rm.checked = s0.reducedMotion;
  rm.setAttribute('aria-label', 'Reduced motion');
  rm.addEventListener('change', () => emit({ reducedMotion: rm.checked }));
  visCard.appendChild(rm);

  const groups = document.createElement('div');
  groups.style.cssText = 'display:grid;grid-template-columns:auto auto;gap:14px;align-items:start;';
  groups.append(audioCard, visCard);
  wrap.appendChild(groups);

  const hint = document.createElement('div'); // ST-067: key-nav hint
  hint.textContent = 'TAB NAVIGATES - ARROWS MOVE - SPACE TOGGLES';
  hint.style.cssText = 'font-size:11px;letter-spacing:2px;opacity:0.55;';
  wrap.appendChild(hint);

  const order = [vol, sfx, fxSel, rm];

  function moveFocus(from, dir) {
    const i = order.indexOf(from);
    if (i < 0) return;
    order[(i + dir + order.length) % order.length].focus();
  }

  // ST-067 key nav + hotkey guard: while a panel control holds focus the game
  // must not see Enter (start) / P,Escape (pause) / M (mute) / Space (fire).
  // range + select keep native arrow behavior (value / option change).
  wrap.addEventListener('keydown', (e) => {
    const t = e.target;
    if (order.indexOf(t) < 0) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (t === vol || t === fxSel) return; // native consumption
      e.preventDefault();
      e.stopPropagation();
      moveFocus(t, e.key === 'ArrowDown' ? 1 : -1);
    } else if (e.key === ' ' || e.key === 'Enter' || e.key === 'Escape' || e.key === 'p' || e.key === 'P' || e.key === 'm' || e.key === 'M') {
      e.stopPropagation(); // native checkbox/select behavior still runs (no preventDefault)
    }
  });

  function emit(partial, fxChanged) {
    const merged = storage.setSettings(partial);
    onChange(merged);
    if (fxChanged && typeof onFxPreview === 'function') onFxPreview(merged.fx);
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