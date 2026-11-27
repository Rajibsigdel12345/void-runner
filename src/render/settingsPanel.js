import { FONT_SCALES } from '../core/storage.js'; // I70
import { t, onLocale, LOCALES, LOCALE_NAMES } from '../core/strings.js'; // I404: ST-374 + I405: ST-375 locale selector

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
    return d; // ST-225: callers may append inline state (the FX AUTO marker)
  }
  function styleCtl(c) {
    c.style.cssText = 'background:rgba(10,18,40,0.8);border:1px solid #2b4a8a;border-radius:4px;color:#cfe4ff;font-family:inherit;';
    return c;
  }

  // AUDIO group
  const audioCard = card(t('settings.audio'));
  const volRow = row(t('settings.volume'), audioCard); // ST-375: captured for locale re-emit
  const vol = document.createElement('input');
  vol.type = 'range'; vol.min = '0'; vol.max = '1'; vol.step = '0.05';
  vol.value = String(s0.volume);
  vol.style.width = 'calc(170px * var(--vr-fs,1))';
  vol.setAttribute('aria-label', t('settings.volume_aria'));
  vol.addEventListener('input', () => emit({ volume: Number(vol.value) }));
  audioCard.appendChild(styleCtl(vol));

  const sfxRow = row(t('settings.sfx'), audioCard); // ST-375
  const sfx = document.createElement('input');
  sfx.type = 'checkbox'; sfx.checked = s0.sfx;
  sfx.setAttribute('aria-label', t('settings.sfx_aria'));
  sfx.addEventListener('change', () => emit({ sfx: sfx.checked }));
  audioCard.appendChild(sfx);

  const musicRow = row(t('settings.music'), audioCard); // I158: generative ambient music bed (on by default); ST-375
  const music = document.createElement('input');
  music.type = 'checkbox'; music.checked = s0.music;
  music.setAttribute('aria-label', t('settings.music_aria'));
  music.addEventListener('change', () => emit({ music: music.checked }));
  audioCard.appendChild(music);

  // VISUALS group
  const visCard = card(t('settings.visuals'));
  const fxRow = row(t('settings.fx'), visCard);
  const fxAuto = document.createElement('span'); // ST-225: AUTO tier marker (effective tier chosen by automation)
  fxAuto.textContent = ' ' + t('settings.fx_auto');
  fxAuto.style.cssText = 'margin-left:8px;padding:1px 6px;border-radius:3px;background:rgba(255,224,138,0.15);border:1px solid rgba(255,224,138,0.4);color:#ffe08a;font-size:calc(10px * var(--vr-fs,1));letter-spacing:1px;opacity:0;transition:opacity .2s;';
  fxRow.appendChild(fxAuto);
  function setFxMarker(text) { // ST-225(b): null hides; text shows e.g. 'AUTO: LOW'
    if (text) { fxAuto.textContent = ' ' + text; fxAuto.style.opacity = '1'; } else { fxAuto.style.opacity = '0'; }
  }
  const fxSel = document.createElement('select');
  for (const opt of ['high', 'low', 'off']) { // ST-224: off tier
    const o = document.createElement('option');
    o.value = opt; o.textContent = t('settings.fx.' + opt);
    fxSel.appendChild(o);
  }
  fxSel.value = s0.fx;
  fxSel.setAttribute('aria-label', t('settings.fx_aria'));
  fxSel.addEventListener('change', () => emit({ fx: fxSel.value }, true)); // ST-067: live preview
  visCard.appendChild(styleCtl(fxSel));

  const rmRow = row(t('settings.reduced_motion'), visCard); // ST-375
  const rm = document.createElement('input');
  rm.type = 'checkbox'; rm.checked = s0.reducedMotion;
  rm.setAttribute('aria-label', t('settings.reduced_motion_aria'));
  rm.addEventListener('change', () => emit({ reducedMotion: rm.checked }));
  visCard.appendChild(rm);

  const fontRow = row(t('settings.font_scale'), visCard); // I70: UI text scale (applied as --vr-fs); ST-375
  const fontSel = document.createElement('select');
  for (const sc of FONT_SCALES) {
    const o = document.createElement('option');
    o.value = String(sc);
    o.textContent = t('settings.font_scale.' + (sc === 1 ? 'normal' : sc === 1.25 ? 'large' : 'xl'));
    fontSel.appendChild(o);
  }
  fontSel.value = String(s0.fontScale);
  fontSel.setAttribute('aria-label', t('settings.font_scale_aria'));
  fontSel.addEventListener('change', () => emit({ fontScale: Number(fontSel.value) }));
  visCard.appendChild(styleCtl(fontSel));

  const cuesRow = row(t('settings.shape_cues'), visCard); // I155: colorblind-friendly silhouette markers (on by default); ST-375
  const cues = document.createElement('input');
  cues.type = 'checkbox'; cues.checked = s0.shapeCues;
  cues.setAttribute('aria-label', t('settings.shape_cues_aria'));
  cues.addEventListener('change', () => emit({ shapeCues: cues.checked }));
  visCard.appendChild(cues);

  const cbRow = row(t('settings.colorblind'), visCard); // I158: deuteranopia (Machado 2009) preview on the canvas; ST-375
  const cbPreview = document.createElement('input');
  cbPreview.type = 'checkbox'; cbPreview.checked = s0.colorblindPreview;
  cbPreview.setAttribute('aria-label', t('settings.colorblind_aria'));
  cbPreview.addEventListener('change', () => emit({ colorblindPreview: cbPreview.checked }));
  visCard.appendChild(cbPreview);

  const smRow = row(t('settings.slowmo_hint'), visCard); // I158: short caption when the slow-mo pickup is on screen / active; ST-375
  const smHint = document.createElement('input');
  smHint.type = 'checkbox'; smHint.checked = s0.slowmoHint;
  smHint.setAttribute('aria-label', t('settings.slowmo_hint_aria'));
  smHint.addEventListener('change', () => emit({ slowmoHint: smHint.checked }));
  visCard.appendChild(smHint);

  const camModeRow = row(t('settings.camera_mode'), visCard); // ST-416 (I446): camera mode (V cycles in-game; persisted)
  const camMode = document.createElement('select');
  for (const opt of ['chase', 'overview', 'cockpit']) { const o = document.createElement('option'); o.value = opt; o.textContent = t('settings.camera_mode.' + opt); camMode.appendChild(o); }
  camMode.value = s0.cameraMode || 'chase';
  camMode.setAttribute('aria-label', t('settings.camera_mode_aria'));
  camMode.addEventListener('change', () => emit({ cameraMode: camMode.value }));
  visCard.appendChild(styleCtl(camMode));

  const ctRow = row(t('settings.cockpit_thrust'), visCard); // ST-587 (I627, E91 D3): cockpit thrust basis (nose = stable / view = pointer)
  const ctSel = document.createElement('select');
  for (const b of ['nose', 'view']) { const o = document.createElement('option'); o.value = b; o.textContent = t('settings.cockpit_thrust.' + b); ctSel.appendChild(o); }
  ctSel.value = s0.cockpitThrust || 'nose';
  ctSel.setAttribute('aria-label', t('settings.cockpit_thrust_aria'));
  ctSel.addEventListener('change', () => emit({ cockpitThrust: ctSel.value }));
  visCard.appendChild(styleCtl(ctSel));

  // ST-375: LANGUAGE card (3-way EN/zh/ja; locale content tables land in ST-376 - options keep NATIVE names)
  const langCard = card(t('settings.language'));
  const langSel = document.createElement('select');
  for (const loc of LOCALES) {
    const o = document.createElement('option');
    o.value = loc; o.textContent = LOCALE_NAMES[loc];
    langSel.appendChild(o);
  }
  langSel.value = s0.locale; // s0.locale is always a valid LOCALES entry (storage validates)
  langSel.style.width = 'calc(170px * var(--vr-fs,1))';
  langSel.style.gridColumn = '2';
  langSel.setAttribute('aria-label', t('settings.language_aria'));
  langSel.addEventListener('change', () => emit({ locale: langSel.value })); // ST-375: persist + live switch (re-render via onLocale)
  langCard.appendChild(styleCtl(langSel));

  const groups = document.createElement('div');
  groups.style.cssText = 'display:grid;grid-template-columns:auto auto;gap:14px;align-items:start;';
  groups.className = 'vr-settings-groups'; // ST-279: menu scopes this to a single column
  groups.append(audioCard, visCard, langCard); // ST-375
  wrap.appendChild(groups);

  const hint = document.createElement('div'); // ST-067: key-nav hint
  hint.textContent = t('settings.kbd_hint');
  hint.style.cssText = 'font-size:calc(11px * var(--vr-fs,1));letter-spacing:2px;opacity:0.55;';
  wrap.appendChild(hint);

  const order = [vol, sfx, music, fxSel, rm, fontSel, cues, cbPreview, smHint, camMode, ctSel, langSel]; // I158; ST-375: + language select; ST-416: + camera mode (matches DOM order)

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
      if (t === vol || t === fxSel || t === fontSel || t === camMode || t === langSel) return; // native consumption (ST-416: + camera select)
      e.preventDefault();
      e.stopPropagation();
      moveFocus(t, e.key === 'ArrowDown' ? 1 : -1);
    } else if (e.key === ' ' || e.key === 'Enter' || e.key === 'Escape' || e.key === 'p' || e.key === 'P' || e.key === 'm' || e.key === 'M' || e.key === 'f' || e.key === 'F' || e.key === 'n' || e.key === 'N' || e.key === 'v' || e.key === 'V') { // ST-416: V (camera mode) swallowed too
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
    camMode.value = s.cameraMode || 'chase'; // ST-416
    ctSel.value = s.cockpitThrust || 'nose'; // ST-587 (I627)
    langSel.value = s.locale; // ST-375
  }

  // ST-375: live locale switch - re-emit every persistent label this panel owns.
  // The language select's options keep their NATIVE names (never re-emitted).
  onLocale(() => {
    audioCard.firstChild.textContent = t('settings.audio');
    visCard.firstChild.textContent = t('settings.visuals');
    langCard.firstChild.textContent = t('settings.language');
    volRow.textContent = t('settings.volume'); vol.setAttribute('aria-label', t('settings.volume_aria'));
    sfxRow.textContent = t('settings.sfx'); sfx.setAttribute('aria-label', t('settings.sfx_aria'));
    musicRow.textContent = t('settings.music'); music.setAttribute('aria-label', t('settings.music_aria'));
    fxRow.firstChild.data = t('settings.fx'); // firstChild = the label text node (the fxAuto marker span is a child)
    for (const opt of fxSel.options) opt.textContent = t('settings.fx.' + opt.value);
    rmRow.textContent = t('settings.reduced_motion'); rm.setAttribute('aria-label', t('settings.reduced_motion_aria'));
    fontRow.textContent = t('settings.font_scale'); fontSel.setAttribute('aria-label', t('settings.font_scale_aria'));
    for (const opt of fontSel.options) opt.textContent = t('settings.font_scale.' + (opt.value === '1' ? 'normal' : opt.value === '1.25' ? 'large' : 'xl'));
    cuesRow.textContent = t('settings.shape_cues'); cues.setAttribute('aria-label', t('settings.shape_cues_aria'));
    cbRow.textContent = t('settings.colorblind'); cbPreview.setAttribute('aria-label', t('settings.colorblind_aria'));
    smRow.textContent = t('settings.slowmo_hint'); smHint.setAttribute('aria-label', t('settings.slowmo_hint_aria'));
    camModeRow.textContent = t('settings.camera_mode'); camMode.setAttribute('aria-label', t('settings.camera_mode_aria')); for (const o of camMode.options) o.textContent = t('settings.camera_mode.' + o.value); // ST-416
    ctRow.textContent = t('settings.cockpit_thrust'); ctSel.setAttribute('aria-label', t('settings.cockpit_thrust_aria')); for (const o of ctSel.options) o.textContent = t('settings.cockpit_thrust.' + o.value); // ST-587 (I627)
    langSel.setAttribute('aria-label', t('settings.language_aria'));
    hint.textContent = t('settings.kbd_hint');
  }); // ST-375

  return { el: wrap, sync, setFxMarker };
}