// I151: first-run tutorial overlay (dismissible, persisted). A one-time "how to play"
// card shown on the player's first entry to PLAYING while the sim is gated (frozen) so
// the player can read without dying. DOM only; mirrors the panel/line/keycap style of
// screens.js. Session keys (Enter/Space/Esc/p/P) are owned by main.js, which calls
// dismiss(); the overlay owns its button. Reduced-motion is applied via the vr-reduced
// class toggled from syncVisuals.
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

  card.appendChild(line('HOW TO PLAY', 'font-size:calc(28px * var(--vr-fs,1));font-weight:800;letter-spacing:6px;color:#8fd0ff;'));
  card.appendChild(line('fly, aim, fire - and outlast the waves', 'font-size:calc(14px * var(--vr-fs,1));letter-spacing:2px;opacity:0.85;')); // ST-268: both schemes now read the same

  const grid = document.createElement('div');
  grid.style.cssText = 'display:grid;grid-template-columns:auto auto;gap:8px 22px;font-size:calc(14px * var(--vr-fs,1));padding:16px 22px;box-sizing:border-box;border:1px solid rgba(120,170,255,0.18);border-radius:12px;background:rgba(10,20,45,0.35);';
  const ROWS = touch
    ? [['LEFT ZONE', 'drag to fly'], ['RIGHT ZONE', 'aim + fire'], ['2 FINGERS', 'pause']] // ST-268 dual-zone
    : [['WASD / ARROWS', 'thrust'], ['MOUSE', 'aim'], ['CLICK / SPACE', 'fire'], ['P / ESC', 'pause'], ['M', 'mute'], ['N', 'music']];
  for (const [k, v] of ROWS) {
    const key = document.createElement('div');
    key.style.cssText = 'text-align:right;';
    const kc = document.createElement('span');
    kc.style.cssText = 'display:inline-block;padding:2px 8px;border:1px solid rgba(255,224,138,0.4);border-radius:5px;background:rgba(255,224,138,0.08);color:#ffe08a;font-weight:700;font-size:calc(12px * var(--vr-fs,1));letter-spacing:1px;';
    kc.textContent = k;
    key.appendChild(kc);
    grid.append(key, line(v, 'opacity:0.9;'));
  }
  card.appendChild(grid);

  card.appendChild(line('survive the waves - bosses arrive on wave 5 and beyond', 'font-size:calc(13px * var(--vr-fs,1));letter-spacing:1px;opacity:0.7;'));

  const go = document.createElement('button');
  go.type = 'button';
  go.className = 'vr-tut-go';
  go.appendChild(document.createTextNode((touch ? 'TAP TO LAUNCH' : 'LAUNCH') + '  '));
  if (!touch) {
    const ks = document.createElement('span');
    ks.className = 'vr-key';
    ks.textContent = 'ENTER';
    go.appendChild(ks);
  }
  go.setAttribute('aria-label', 'Dismiss the tutorial and start playing');
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

  root.appendChild(el);
  return { el, show, hide, sync, dismiss, isVisible };
}
