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
  style.textContent = '@keyframes vrPulse{0%,100%{opacity:1}50%{opacity:0.35}}';
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
  const menu = panel('screen-menu', 'rgba(2,4,12,0.72)');
  line(menu, 'VOID RUNNER', 'font-size:46px;font-weight:800;letter-spacing:10px;color:#9fd0ff;');
  line(menu, 'survive the void, outlast the waves', 'font-size:14px;letter-spacing:2px;opacity:0.75;');
  const controls = document.createElement('div');
  controls.style.cssText = 'display:grid;grid-template-columns:auto auto;gap:6px 18px;font-size:14px;margin-top:8px;';
  for (const [k, v] of [
    ['WASD / ARROWS', 'thrust'],
    ['MOUSE', 'aim'],
    ['CLICK / SPACE', 'fire'],
    ['P / ESC', 'pause'],
    ['M', 'mute'],
  ]) {
    const key = document.createElement('div');
    key.style.cssText = 'text-align:right;font-weight:600;letter-spacing:1px;color:#ffe08a;';
    key.textContent = k;
    const val = document.createElement('div');
    val.style.cssText = 'opacity:0.9;';
    val.textContent = v;
    controls.append(key, val);
  }
  menu.appendChild(controls);
  line(menu, 'PRESS ENTER TO START', 'font-size:18px;font-weight:700;letter-spacing:4px;margin-top:14px;animation:vrPulse 1.6s ease-in-out infinite;');
  const menuBest = line(menu, '', 'font-size:13px;opacity:0.7;'); // best score lands in I18
  if (settings.menu) menu.appendChild(settings.menu.el); // ST-026 settings (menu)

  // --- PAUSED ---
  const paused = panel('screen-paused', 'rgba(2,4,12,0.55)');
  line(paused, 'PAUSED', 'font-size:36px;font-weight:800;letter-spacing:8px;');
  line(paused, 'P / ESC — RESUME', 'font-size:15px;letter-spacing:2px;opacity:0.85;');
  const muteLabel = line(paused, 'M — MUTE (OFF)', 'font-size:13px;letter-spacing:2px;opacity:0.7;');
  if (settings.pause) paused.appendChild(settings.pause.el); // ST-026 settings (pause)

  // --- GAME OVER ---
  const gameOver = panel('screen-gameover', 'rgba(8,2,6,0.72)');
  line(gameOver, 'GAME OVER', 'font-size:42px;font-weight:800;letter-spacing:8px;color:#ff6d8a;');
  const finalScore = line(gameOver, 'SCORE 0', 'font-size:26px;font-weight:700;letter-spacing:2px;');
  const overBest = line(gameOver, '', 'font-size:13px;opacity:0.7;');
  const newBestLine = line(gameOver, '', 'font-size:16px;font-weight:800;letter-spacing:3px;color:#ffe08a;');
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
  function update(state, world, opts = { muted: false, best: 0, newBest: false }) {
    showPanel(state);
    if (state === STATE.GAME_OVER) {
      set('finalScore', finalScore, `SCORE ${world.score}`);
      set('overBest', overBest, opts.best > 0 ? `BEST ${opts.best}` : '');
      set('newBest', newBestLine, opts.newBest ? 'NEW BEST!' : '');
    }
    if (state === STATE.MENU) {
      set('menuBest', menuBest, opts.best > 0 ? `BEST ${opts.best}` : '');
    }
    if (state === STATE.PAUSED) {
      set('mute', muteLabel, `M — MUTE (${opts.muted ? 'ON' : 'OFF'})`);
    }
  }

  return { update, overlay };
}

