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
    '@keyframes vrBestPulse{0%,100%{transform:scale(1);filter:drop-shadow(0 0 6px rgba(255,210,122,0.7))}50%{transform:scale(1.12);filter:drop-shadow(0 0 18px rgba(255,210,122,1))}}',
    '.vr-newbest{animation:vrBestPulse 1.2s ease-in-out infinite;}',
    '.vr-reduced .vr-newbest{animation:none !important;}',
    '.vr-credit{position:absolute;bottom:16px;left:0;right:0;font-size:11px;letter-spacing:1px;opacity:0.5;}',
    '.vr-pause-btn{pointer-events:auto;cursor:pointer;font-family:inherit;font-size:14px;font-weight:700;letter-spacing:2px;color:#cfe4ff;background:rgba(10,18,40,0.85);border:1px solid #2b4a8a;border-radius:8px;padding:10px 18px;transition:background 0.15s,border-color 0.15s;}',
    '.vr-pause-btn:hover{background:rgba(30,50,100,0.95);border-color:#4a7fd8;}',
    '.vr-pause-btn:active{transform:translateY(1px);}',
    '.vr-pause-btn:focus-visible{outline:2px solid #ffe08a;outline-offset:2px;}',
    '.vr-pause-btn .vr-key{color:#ffe08a;}',
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
  const top5 = document.createElement('div'); // I66: top-5 card
  top5.style.cssText = 'display:flex;flex-direction:column;gap:4px;font-size:13px;padding:14px 22px;min-height:150px;border:1px solid rgba(120,170,255,0.18);border-radius:12px;background:rgba(10,20,45,0.35);';
  const top5Head = document.createElement('div');
  top5Head.textContent = 'TOP 5';
  top5Head.style.cssText = 'font-weight:700;letter-spacing:3px;font-size:12px;opacity:0.9;margin-bottom:2px;';
  const top5Body = document.createElement('div');
  top5Body.style.cssText = 'display:flex;flex-direction:column;gap:3px;white-space:pre-line;font-variant-numeric:tabular-nums;';
  top5.append(top5Head, top5Body);
  const menuGrid = document.createElement('div'); // I66: two-column menu
  menuGrid.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:22px;align-items:start;max-width:640px;';
  menuGrid.append(controls, top5);
  menu.appendChild(menuGrid);
  line(menu, 'PRESS ENTER TO START', 'font-size:18px;font-weight:700;letter-spacing:4px;margin-top:14px;animation:vrPulse 1.6s ease-in-out infinite;');
  const menuBest = line(menu, '', 'font-size:13px;opacity:0.85;'); // best score lands in I18 (I44 contrast)
  const credit = document.createElement('div'); // I65: credits
  credit.className = 'vr-credit';
  credit.textContent = 'a three.js arcade shooter � 100% procedural, no external assets � built with the Codex Game Studio pipeline';
  menu.appendChild(credit);
  if (settings.menu) menu.appendChild(settings.menu.el); // ST-026 settings (menu)

  // --- PAUSED (I68: deeper dim + RESUME / RESTART / QUIT actions, mouse + keys) ---
  const paused = panel('screen-paused', 'radial-gradient(60% 55% at 50% 45%, rgba(30,60,140,0.16), transparent 70%), rgba(2,4,12,0.74)');
  line(paused, 'PAUSED', 'font-size:36px;font-weight:800;letter-spacing:8px;');
  const pauseSnap = line(paused, '', 'font-size:15px;font-weight:700;letter-spacing:2px;opacity:0.9;'); // I44: session snapshot
  const pauseActions = (settings.actions && typeof settings.actions.resume === 'function') ? settings.actions : null; // I68
  if (pauseActions) {
    const actionsRow = document.createElement('div');
    actionsRow.style.cssText = 'display:flex;gap:14px;margin-top:2px;';
    const actionButtons = [];
    for (const [label, keyHint, fn] of [
      ['RESUME', 'P', pauseActions.resume],
      ['RESTART', 'R', pauseActions.restart],
      ['QUIT TO MENU', 'Q', pauseActions.quit],
    ]) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'vr-pause-btn';
      b.appendChild(document.createTextNode(label + '  '));
      const ks = document.createElement('span');
      ks.className = 'vr-key';
      ks.textContent = keyHint;
      b.appendChild(ks);
      b.addEventListener('click', fn);
      actionsRow.appendChild(b);
      actionButtons.push(b);
    }
    paused.appendChild(actionsRow);
    // I68: arrow-key focus moves within the row; game hotkeys swallowed while a
    // button holds focus (native button click performs the action instead).
    actionsRow.addEventListener('keydown', (e) => {
      const i = actionButtons.indexOf(e.target);
      if (i < 0) return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault(); e.stopPropagation();
        actionButtons[(i + 1) % actionButtons.length].focus();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault(); e.stopPropagation();
        actionButtons[(i - 1 + actionButtons.length) % actionButtons.length].focus();
      } else if (e.key === ' ' || e.key === 'Enter' || e.key === 'Escape' || e.key === 'p' || e.key === 'P' || e.key === 'm' || e.key === 'M' || e.key === 'r' || e.key === 'R' || e.key === 'q' || e.key === 'Q') {
        e.stopPropagation();
      }
    });
  }
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
  const rankLine = line(gameOver, '', 'font-size:14px;font-weight:700;letter-spacing:2px;color:#ffe08a;opacity:0.95;'); // I69: board rank
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
  function update(state, world, opts = { muted: false, best: 0, newBest: false, reducedMotion: false, scoresText: '' }) {
    overlay.classList.toggle('vr-reduced', !!opts.reducedMotion); // I65: gate menu animations
    showPanel(state);
    if (state === STATE.GAME_OVER) {
      set('finalScore', finalScore, `SCORE ${world.score}`);
      set('overBest', overBest, opts.best > 0 ? `BEST ${opts.best}` : '');
      set('newBest', newBestLine, opts.newBest ? 'NEW BEST!' : '');
      newBestLine.classList.toggle('vr-newbest', !!opts.newBest); // I69: celebration pulse
      set('overRank', rankLine, opts.scoreRank > 0 ? 'BOARD RANK #' + opts.scoreRank : ''); // I69
      const mm = Math.floor(world.time / 60); // ST-031: session stats
      const ss = String(Math.floor(world.time) % 60).padStart(2, '0');
      set('stats1', statsLine1, "KILLS " + world.scoreKeeper.kills + "    WAVE " + Math.max(1, world.wave));
      set('stats2', statsLine2, "MAX COMBO x" + world.scoreKeeper.maxCombo + "    TIME " + mm + ":" + ss);
    }
    if (state === STATE.MENU) {
      set('menuBest', menuBest, opts.best > 0 ? `BEST ${opts.best}` : '');
      set('top5', top5Body, opts.scoresText ? opts.scoresText : '\u2014 no scores yet \u2014'); // I66
    }
    if (state === STATE.PAUSED) {
      set('mute', muteLabel, `M — MUTE (${opts.muted ? 'ON' : 'OFF'})`);
      set('pauseSnap', pauseSnap, `SCORE ${world.score}    WAVE ${Math.max(1, world.wave)}    KILLS ${world.scoreKeeper.kills}`); // I44
    }
  }

  return { update, overlay };
}

