// I151: first-run tutorial overlay (dismissible, persisted). A one-time "how to play"
// card shown on the player's first entry to PLAYING while the sim is gated (frozen) so
// the player can read without dying. DOM only; mirrors the panel/line/keycap style of
// screens.js. Session keys (Enter/Space/Esc/p/P) are owned by main.js, which calls
// dismiss(); the overlay owns its button. Reduced-motion is applied via the vr-reduced
// class toggled from syncVisuals.
import { t, kc as kcap, onLocale } from '../core/strings.js'; // I404: ST-374 + I405: ST-375 locale
export function createTutorialOverlay(root, opts = {}) {
  const touch = opts.touch === true; // touch vs keyboard instructions
  const onDismiss = typeof opts.onDismiss === 'function' ? opts.onDismiss : () => {};

  const el = document.createElement('div');
  el.id = 'tutorial-overlay';
  el.style.cssText = [
    'position:fixed', 'inset:0', 'z-index:45', 'display:none',
    'align-items:center', 'justify-content:center', 'padding:24px',
    'box-sizing:border-box', 'pointer-events:auto', 'user-select:none', 'text-align:center',
    'font-family:"Segoe UI",system-ui,sans-serif', 'color:#cfe4ff',
    'background:radial-gradient(60% 55% at 50% 42%, rgba(24,48,110,0.55), rgba(2,4,12,0.86) 78%)',
  ].join(';');

  const style = document.createElement('style');
  style.textContent = [
    '@keyframes vrTutIn{0%{opacity:0;transform:scale(0.96) translateY(6px)}100%{opacity:1;transform:scale(1) translateY(0)}}',
    '.vr-tut-card{animation:vrTutIn 0.4s cubic-bezier(0.22,1,0.36,1) both;}',
    '#tutorial-overlay.vr-reduced .vr-tut-card{animation:none !important;}',
    '@keyframes vrTutPulse{0%,100%{opacity:1}50%{opacity:0.35}}',
    '.vr-tut-go{pointer-events:auto;cursor:pointer;font-family:inherit;font-size:calc(18px * var(--vr-fs,1));font-weight:700;letter-spacing:4px;color:#cfe4ff;background:rgba(10,18,40,0.85);border:1px solid #2b4a8a;border-radius:8px;padding:12px 28px;animation:vrTutPulse 1.6s ease-in-out infinite;transition:background 0.15s,border-color 0.15s;}',
    '.vr-tut-go:hover{background:rgba(30,50,100,0.95);border-color:#4a7fd8;animation:none;}',
    '.vr-tut-go:focus-visible{outline:2px solid #ffe08a;outline-offset:2px;}',
    '#tutorial-overlay.vr-reduced .vr-tut-go{animation:none !important;}',
    '#tutorial-overlay .vr-key{color:#ffe08a;}',
    '@media (max-width:620px){#tutorial-overlay .vr-tut-card{width:100%;max-width:440px;}}',
  ].join('');
  el.appendChild(style);

  function line(text, css) {
    const d = document.createElement('div');
    d.style.cssText = css;
    d.textContent = text;
    return d;
  }

  const card = document.createElement('div');
  card.className = 'vr-tut-card';
  card.style.cssText = [
    'display:flex', 'flex-direction:column', 'align-items:center', 'gap:14px',
    'width:100%', 'max-width:480px', 'padding:28px 30px', 'box-sizing:border-box',
    'border:1px solid rgba(120,170,255,0.28)', 'border-radius:16px',
    'background:rgba(8,14,34,0.92)', 'text-shadow:0 2px 10px rgba(0,0,0,0.9)',
    'box-shadow:0 20px 60px rgba(0,0,0,0.6)',
  ].join(';');

  const tutTitle = line(t('tutorial.title'), 'font-size:calc(28px * var(--vr-fs,1));font-weight:800;letter-spacing:6px;color:#8fd0ff;'); // ST-375: locale re-emit target
  card.appendChild(tutTitle);
  const tutSub = line(t('tutorial.sub'), 'font-size:calc(14px * var(--vr-fs,1));letter-spacing:2px;opacity:0.85;'); // ST-268: both schemes now read the same; ST-375: locale re-emit target
  card.appendChild(tutSub);

  const grid = document.createElement('div');
  grid.style.cssText = 'display:grid;grid-template-columns:auto auto;gap:8px 22px;font-size:calc(14px * var(--vr-fs,1));padding:16px 22px;box-sizing:border-box;border:1px solid rgba(120,170,255,0.18);border-radius:12px;background:rgba(10,20,45,0.35);';
  function rows() { // ST-375: re-resolvable for locale re-emit
    return touch
      ? [[kcap('left_zone'), t('ctrl.drag_fly')], [kcap('right_zone'), t('ctrl.aim_fire')], [kcap('two_fingers'), t('ctrl.pause')]] // ST-268 dual-zone
      : [[kcap('wasd_arrows'), t('ctrl.thrust')], [kcap('mouse'), t('ctrl.aim')], [kcap('click_space'), t('ctrl.fire')], [kcap('p_esc'), t('ctrl.pause')], [kcap('m'), t('ctrl.mute')], [kcap('n'), t('ctrl.music')], [kcap('v'), t('ctrl.camera')]];
  }
  const gridCells = []; // ST-375: [keycap span, value line] pairs for locale re-emit
  for (const [k, v] of rows()) {
    const key = document.createElement('div');
    key.style.cssText = 'text-align:right;';
    const kc = document.createElement('span');
    kc.style.cssText = 'display:inline-block;padding:2px 8px;border:1px solid rgba(255,224,138,0.4);border-radius:5px;background:rgba(255,224,138,0.08);color:#ffe08a;font-weight:700;font-size:calc(12px * var(--vr-fs,1));letter-spacing:1px;';
    kc.textContent = k;
    key.appendChild(kc);
    const val = line(v, 'opacity:0.9;');
    grid.append(key, val);
    gridCells.push([kc, val]); // ST-375
  }
  card.appendChild(grid);

  const bossNote = line(t('tutorial.boss_note'), 'font-size:calc(13px * var(--vr-fs,1));letter-spacing:1px;opacity:0.7;'); // ST-375: locale re-emit target
  card.appendChild(bossNote);

  const go = document.createElement('button');
  go.type = 'button';
  go.className = 'vr-tut-go';
  const goText = document.createTextNode((touch ? t('tutorial.go_tap') : t('tutorial.go_key')) + '  '); // ST-375: locale re-emit target
  go.appendChild(goText);
  let goKey = null; // ST-375
  if (!touch) {
    const ks = document.createElement('span');
    ks.className = 'vr-key';
    ks.textContent = kcap('enter');
    go.appendChild(ks);
    goKey = ks; // ST-375
  }
  go.setAttribute('aria-label', t('tutorial.dismiss_aria'));
  go.addEventListener('click', (e) => { e.stopPropagation(); dismiss(); go.blur(); });
  card.appendChild(go);

  el.appendChild(card);

  let visible = false;
  function show() {
    if (visible) return;
    visible = true;
    el.style.display = 'flex';
    requestAnimationFrame(() => { if (visible) go.focus(); });
  }
  function hide() {
    visible = false;
    el.style.display = 'none';
  }
  function isVisible() { return visible; }
  function sync(motionOff) {
    el.classList.toggle('vr-reduced', !!motionOff);
  }
  function dismiss() {
    if (!visible) return;
    onDismiss(); // caller persists the flag, hides, and clears the sim gate
  }

  // ST-375: live locale switch - re-emit the card's persistent labels.
  onLocale(() => {
    tutTitle.textContent = t('tutorial.title');
    tutSub.textContent = t('tutorial.sub');
    const rows2 = rows();
    for (let gi = 0; gi < gridCells.length; gi++) { gridCells[gi][0].textContent = rows2[gi][0]; gridCells[gi][1].textContent = rows2[gi][1]; }
    bossNote.textContent = t('tutorial.boss_note');
    goText.data = (touch ? t('tutorial.go_tap') : t('tutorial.go_key')) + '  ';
    if (goKey) goKey.textContent = kcap('enter');
    go.setAttribute('aria-label', t('tutorial.dismiss_aria'));
  }); // ST-375

  root.appendChild(el);
  return { el, show, hide, sync, dismiss, isVisible };
}
