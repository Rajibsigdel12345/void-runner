// ST-032: tutorial hints (first wave only). Controls line fades after ~6s.
export function createTutorialHint(root, opts = {}) {
  const touch = opts.touch === true; // I71: touch-aware control hint
  const DUR = 6; // total visible lifetime (s)
  const FADE = 2; // fade-out at the end
  const el = document.createElement('div');
  el.id = 'tutorial-hint';
  el.style.cssText = [
    'position:fixed', 'left:0', 'right:0', 'bottom:9%', 'z-index:9',
    'pointer-events:none', 'text-align:center', 'user-select:none',
    'font-family:"Segoe UI",system-ui,sans-serif', 'font-weight:600',
    'font-size:calc(15px * var(--vr-fs,1))', 'letter-spacing:3px', 'color:#9fd0ff',
    'text-shadow:0 2px 10px rgba(0,0,0,0.9)', 'opacity:0',
  ].join(';');
  el.textContent = touch
    ? 'LEFT: DRAG TO FLY   \u00b7   RIGHT: AIM + FIRE   \u00b7   2-FINGER PAUSE' // ST-268 dual-zone
    : 'WASD / ARROWS MOVE   \u00b7   MOUSE AIM   \u00b7   HOLD LMB FIRE   \u00b7   P PAUSE';
  root.appendChild(el);

  let t = 0;
  let on = false;

  function show() { t = 0; on = true; }
  function hide() { on = false; t = 0; el.style.opacity = '0'; }

  function sync(dt, motionOff) {
    if (!on) return;
    t += dt;
    if (t >= DUR) { on = false; el.style.opacity = '0'; return; }
    let a = 1;
    const remain = DUR - t;
    if (remain < FADE) a = motionOff ? (remain > 0 ? 1 : 0) : remain / FADE;
    el.style.opacity = String(a);
  }

  return { el, show, hide, sync };
}
