// Void Runner - menu / pause / game-over screens (ST-017). DOM only; text change-cached.
import { STATE } from '../core/state.js';

export function createScreens(root, settings = {}) {
  const overlay = document.createElement('div');
  overlay.id = 'screens';
  overlay.style.cssText = [
    'position:fixed', 'inset:0', 'z-index:20', 'pointer-events:none',
    'font-family:"Segoe UI",system-ui,sans-serif', 'color:#cfe4ff', 'user-select:none',
  ].join(';');

  // pulse animation for the "press enter" prompts
  const style = document.createElement('style');
  style.textContent = [
    '@keyframes vrPulse{0%,100%{opacity:1}50%{opacity:0.35}}',
    '@keyframes vrTitleGlow{0%,100%{filter:drop-shadow(0 0 10px rgba(90,180,255,0.55))}50%{filter:drop-shadow(0 0 22px rgba(130,215,255,0.9))}}',
    '@keyframes vrMenuPan{0%{background-position:0% 0%,0% 0%}50%{background-position:100% 100%,100% 100%}100%{background-position:0% 0%,0% 0%}}',
    '.vr-title{background:linear-gradient(180deg,#e6f4ff 0%,#8fd0ff 45%,#3f7fd8 100%);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:transparent;animation:vrTitleGlow 3.4s ease-in-out infinite;}',
    '.vr-menu-anim{animation:vrMenuPan 34s ease-in-out infinite;}',
    '.vr-reduced .vr-title,.vr-reduced .vr-menu-anim{animation:none !important;}',
    '.vr-credit{position:absolute;bottom:16px;left:0;right:0;font-size:11px;letter-spacing:1px;opacity:0.5;}',
  ].join('');
  overlay.appendChild(style);

  function panel(id, bg) {
    const d = document.createElement('div');
    d.id = id;
    d.style.cssText = [
      'position:absolute', 'inset:0', 'display:none', 'flex-direction:column',
      'align-items:center', 'justify-content:center', 'gap:16px', 'text-align:center',
      `background:${bg}`, 'text-shadow:0 2px 10px rgba(0,0,0,0.9)',
    ].join(';');
    overlay.appendChild(d);
    return d;
  }

  function line(parent, text, css) {
    const d = document.createElement('div');
    d.style.cssText = css;
    d.textContent = text;
    parent.appendChild(d);
    return d;
  }

  // --- MENU ---
  const menu = panel('screen-menu', 'radial-gradient(55% 50% at 30% 30%, rgba(60,110,200,0.22), transparent 70%), radial-gradient(50% 55% at 72% 72%, rgba(140,70,180,0.20), transparent 70%), rgba(2,4,12,0.62)');
  menu.classList.add('vr-menu-anim'); // I65: drifting nebula bg (reduced-motion disables via .vr-reduced)
  const titleEl = line(menu, 'VOID RUNNER', 'font-size:46px;font-weight:800;letter-spacing:10px;'); titleEl.classList.add('vr-title'); // I65: gradient + glow
  line(menu, 'survive the void, outlast the waves', 'font-size:14px;letter-spacing:2px;opacity:0.85;'); // I44 contrast
  const controls = document.createElement('div');
  controls.style.cssText = 'display:grid;grid-template-columns:auto auto;gap:8px 22px;font-size:14px;margin-top:6px;padding:16px 24px;border:1px solid rgba(120,170,255,0.18);border-radius:12px;background:rgba(10,20,45,0.35);'; // I65: controls card
  for (const [k, v] of [
    ['WASD / ARROWS', 'thrust'],
    ['MOUSE', 'aim'],
    ['CLICK / SPACE', 'fire'],
    ['P / ESC', 'pause'],
    ['M', 'mute'],
  ]) {
    const key = document.createElement('div');
    key.style.cssText = 'text-align:right;';
    const kc = document.createElement('span'); // I44: keycap styling
    kc.style.cssText = 'display:inline-block;padding:2px 8px;border:1px solid rgba(255,224,138,0.4);border-radius:5px;background:rgba(255,224,138,0.08);color:#ffe08a;font-weight:700;font-size:12px;letter-spacing:1px;';
    kc.textContent = k;
    key.appendChild(kc);
    const val = document.createElement('div');
    val.style.cssText = 'opacity:0.9;';
    val.textContent = v;
    controls.append(key, val);
  }
  menu.appendChild(controls);
  line(menu, 'PRESS ENTER TO START', 'font-size:18px;font-weight:700;letter-spacing:4px;margin-top:14px;animation:vrPulse 1.6s ease-in-out infinite;');
  const menuBest = line(menu, '', 'font-size:13px;opacity:0.85;'); // best score lands in I18 (I44 contrast)
  const credit = document.createElement('div'); // I65: credits
  credit.className = 'vr-credit';
  credit.textContent = 'a three.js arcade shooter � 100% procedural, no external assets � built with the Codex Game Studio pipeline';
  menu.appendChild(credit);
  if (settings.menu) menu.appendChild(settings.menu.el); // ST-026 settings (menu)

  // --- PAUSED ---
  const paused = panel('screen-paused', 'rgba(2,4,12,0.55)');
  line(paused, 'PAUSED', 'font-size:36px;font-weight:800;letter-spacing:8px;');
  line(paused, 'P / ESC — RESUME', 'font-size:15px;letter-spacing:2px;opacity:0.85;');
  const pauseSnap = line(paused, '', 'font-size:15px;font-weight:700;letter-spacing:2px;opacity:0.9;'); // I44: session snapshot
  const muteLabel = line(paused, 'M — MUTE (OFF)', 'font-size:13px;letter-spacing:2px;opacity:0.7;');
  if (settings.pause) paused.appendChild(settings.pause.el); // ST-026 settings (pause)

  // --- GAME OVER ---
  const gameOver = panel('screen-gameover', 'rgba(8,2,6,0.72)');
  line(gameOver, 'GAME OVER', 'font-size:42px;font-weight:800;letter-spacing:8px;color:#ff6d8a;');
  const finalScore = line(gameOver, 'SCORE 0', 'font-size:26px;font-weight:700;letter-spacing:2px;');
  const overBest = line(gameOver, '', 'font-size:13px;opacity:0.7;');
  const newBestLine = line(gameOver, '', 'font-size:16px;font-weight:800;letter-spacing:3px;color:#ffe08a;');
  const statsLine1 = line(gameOver, '', 'font-size:15px;font-weight:700;letter-spacing:2px;color:#cfe4ff;margin-top:10px;'); // ST-031
  const statsLine2 = line(gameOver, '', 'font-size:15px;font-weight:700;letter-spacing:2px;color:#cfe4ff;'); // ST-031
  line(gameOver, 'PRESS ENTER TO RESTART', 'font-size:16px;font-weight:700;letter-spacing:4px;margin-top:10px;animation:vrPulse 1.6s ease-in-out infinite;');

  const PANELS = {
    [STATE.MENU]: menu,
    [STATE.PAUSED]: paused,
    [STATE.GAME_OVER]: gameOver,
    [STATE.PLAYING]: null,
  };

  const cache = {};
  function set(part, node, text) {
    if (cache[part] === text) return;
    cache[part] = text;
    node.textContent = text;
  }

  let shown = null;
  function showPanel(state) {
    if (shown === state) return;
    shown = state;
    for (const p of Object.values(PANELS)) if (p) p.style.display = PANELS[state] === p ? 'flex' : 'none';
    if (state === STATE.MENU && settings.menu) settings.menu.sync();
    if (state === STATE.PAUSED && settings.pause) settings.pause.sync();
  }

  root.appendChild(overlay);

  /** @param {string} state @param {object} world @param {{muted:boolean, best:number, newBest:boolean}} opts */
  function update(state, world, opts = { muted: false, best: 0, newBest: false, reducedMotion: false }) {
    overlay.classList.toggle('vr-reduced', !!opts.reducedMotion); // I65: gate menu animations
    showPanel(state);
    if (state === STATE.GAME_OVER) {
      set('finalScore', finalScore, `SCORE ${world.score}`);
      set('overBest', overBest, opts.best > 0 ? `BEST ${opts.best}` : '');
      set('newBest', newBestLine, opts.newBest ? 'NEW BEST!' : '');
      const mm = Math.floor(world.time / 60); // ST-031: session stats
      const ss = String(Math.floor(world.time) % 60).padStart(2, '0');
      set('stats1', statsLine1, "KILLS " + world.scoreKeeper.kills + "    WAVE " + Math.max(1, world.wave));
      set('stats2', statsLine2, "MAX COMBO x" + world.scoreKeeper.maxCombo + "    TIME " + mm + ":" + ss);
    }
    if (state === STATE.MENU) {
      set('menuBest', menuBest, opts.best > 0 ? `BEST ${opts.best}` : '');
    }
    if (state === STATE.PAUSED) {
      set('mute', muteLabel, `M — MUTE (${opts.muted ? 'ON' : 'OFF'})`);
      set('pauseSnap', pauseSnap, `SCORE ${world.score}    WAVE ${Math.max(1, world.wave)}    KILLS ${world.scoreKeeper.kills}`); // I44
    }
  }

  return { update, overlay };
}

