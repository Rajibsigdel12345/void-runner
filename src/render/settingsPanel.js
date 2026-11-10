import { FONT_SCALES } from '../core/storage.js'; // I70

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
    c.style.cssText = 'display:grid;grid-template-columns:auto calc(170px * var(--vr-fs,1));gap:8px 14px;align-items:center;justify-items:start;padding:12px 18px;border:1px solid rgba(120,170,255,0.18);border-radius:12px;background:rgba(10,20,45,0.35);min-width:calc(280px * var(--vr-fs,1));';
    const h = document.createElement('div');
    h.textContent = title;
    h.style.cssText = 'grid-column:1 / -1;font-size:calc(11px * var(--vr-fs,1));font-weight:700;letter-spacing:3px;color:#ffe08a;opacity:0.9;border-bottom:1px solid rgba(255,224,138,0.15);padding-bottom:6px;margin-bottom:2px;';
    c.appendChild(h);
    return c;
  }
  function row(label, target) {
    const d = document.createElement('div');
    d.style.cssText = 'text-align:right;font-weight:600;color:#ffe08a;font-size:calc(13px * var(--vr-fs,1));';
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
  vol.style.width = 'calc(170px * var(--vr-fs,1))';
  vol.setAttribute('aria-label', 'Volume');
  vol.addEventListener('input', () => emit({ volume: Number(vol.value) }));
  audioCard.appendChild(styleCtl(vol));

  row('SFX', audioCard);
  const sfx = document.createElement('input');
  sfx.type = 'checkbox'; sfx.checked = s0.sfx;
  sfx.setAttribute('aria-label', 'Sound effects');
  sfx.addEventListener('change', () => emit({ sfx: sfx.checked }));
  audioCard.appendChild(sfx);

  row('MUSIC', audioCard); // I158: generative ambient music bed (on by default)
  const music = document.createElement('input');
  music.type = 'checkbox'; music.checked = s0.music;
  music.setAttribute('aria-label', 'Music');
  music.addEventListener('change', () => emit({ music: music.checked }));
  audioCard.appendChild(music);

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

  row('FONT SCALE', visCard); // I70: UI text scale (applied as --vr-fs)
  const fontSel = document.createElement('select');
  for (const sc of FONT_SCALES) {
    const o = document.createElement('option');
    o.value = String(sc);
    o.textContent = sc === 1 ? 'NORMAL' : sc === 1.25 ? 'LARGE' : 'XL';
    fontSel.appendChild(o);
  }
  fontSel.value = String(s0.fontScale);
  fontSel.setAttribute('aria-label', 'Font scale');
  fontSel.addEventListener('change', () => emit({ fontScale: Number(fontSel.value) }));
  visCard.appendChild(styleCtl(fontSel));

  row('SHAPE CUES', visCard); // I155: colorblind-friendly silhouette markers (on by default)
  const cues = document.createElement('input');
  cues.type = 'checkbox'; cues.checked = s0.shapeCues;
  cues.setAttribute('aria-label', 'Shape cues');
  cues.addEventListener('change', () => emit({ shapeCues: cues.checked }));
  visCard.appendChild(cues);

  row('COLORBLIND', visCard); // I158: deuteranopia (Machado 2009) preview on the canvas
  const cbPreview = document.createElement('input');
  cbPreview.type = 'checkbox'; cbPreview.checked = s0.colorblindPreview;
  cbPreview.setAttribute('aria-label', 'Colorblind preview');
  cbPreview.addEventListener('change', () => emit({ colorblindPreview: cbPreview.checked }));
  visCard.appendChild(cbPreview);

  row('SLOW-MO HINT', visCard); // I158: short caption when the slow-mo pickup is on screen / active
  const smHint = document.createElement('input');
  smHint.type = 'checkbox'; smHint.checked = s0.slowmoHint;
  smHint.setAttribute('aria-label', 'Slow-mo hint');
  smHint.addEventListener('change', () => emit({ slowmoHint: smHint.checked }));
  visCard.appendChild(smHint);

  const groups = document.createElement('div');
  groups.style.cssText = 'display:grid;grid-template-columns:auto auto;gap:14px;align-items:start;';
  groups.append(audioCard, visCard);
  wrap.appendChild(groups);

  const hint = document.createElement('div'); // ST-067: key-nav hint
  hint.textContent = 'TAB NAVIGATES - ARROWS MOVE - SPACE TOGGLES';
  hint.style.cssText = 'font-size:calc(11px * var(--vr-fs,1));letter-spacing:2px;opacity:0.55;';
  wrap.appendChild(hint);

  const order = [vol, sfx, music, fxSel, rm, fontSel, cues, cbPreview, smHint]; // I158

  function moveFocus(from, dir) {
    const i = order.indexOf(from);
    if (i < 0) return;
    order[(i + dir + order.length) % order.length].focus();
  }

  // ST-067 key nav + hotkey guard: while a panel control holds focus the game
  // must not see Enter (start) / P,Escape (pause) / M (mute) / F,N (fx/music) / Space (fire).
  // range + select keep native arrow behavior (value / option change).
  wrap.addEventListener('keydown', (e) => {
    const t = e.target;
    if (order.indexOf(t) < 0) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (t === vol || t === fxSel || t === fontSel) return; // native consumption
      e.preventDefault();
      e.stopPropagation();
      moveFocus(t, e.key === 'ArrowDown' ? 1 : -1);
    } else if (e.key === ' ' || e.key === 'Enter' || e.key === 'Escape' || e.key === 'p' || e.key === 'P' || e.key === 'm' || e.key === 'M' || e.key === 'f' || e.key === 'F' || e.key === 'n' || e.key === 'N') {
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
    fontSel.value = String(s.fontScale); // I70
    cues.checked = s.shapeCues; // I155
    music.checked = s.music; // I158
    cbPreview.checked = s.colorblindPreview; // I158
    smHint.checked = s.slowmoHint; // I158
  }

  return { el: wrap, sync };
}