// Void Runner - menu / pause / game-over screens (ST-017). DOM only; text change-cached.
import { STATE } from '../core/state.js';
import { encodeResult } from '../core/share.js'; // ST-159: shareable result code

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
    '@keyframes vrPanelIn{0%{opacity:0;transform:scale(0.98)}100%{opacity:1;transform:scale(1)}}', // ST-088: screen entrance settle
    '.vr-panel{animation:vrPanelIn 0.36s cubic-bezier(0.22,1,0.36,1) both;}',
    '.vr-reduced .vr-panel{animation:none !important;}',
    '.vr-credit{position:absolute;bottom:16px;left:0;right:0;font-size:calc(11px * var(--vr-fs,1));letter-spacing:1px;opacity:0.5;}',
    '.vr-pause-btn{pointer-events:auto;cursor:pointer;font-family:inherit;font-size:calc(14px * var(--vr-fs,1));font-weight:700;letter-spacing:2px;color:#cfe4ff;background:rgba(10,18,40,0.85);border:1px solid #2b4a8a;border-radius:8px;padding:10px 18px;transition:background 0.15s,border-color 0.15s;}',
    '.vr-pause-btn:hover{background:rgba(30,50,100,0.95);border-color:#4a7fd8;}',
    '.vr-pause-btn:active{transform:translateY(1px);}',
    '.vr-pause-btn:focus-visible{outline:2px solid #ffe08a;outline-offset:2px;}',
    '#screens :focus-visible{outline:2px solid #ffe08a;outline-offset:2px;border-radius:4px;}', // I70: unified focus ring across the overlay
    '.vr-pause-btn .vr-key{color:#ffe08a;}',
    '.vr-start{pointer-events:auto;cursor:pointer;font-family:inherit;font-size:calc(18px * var(--vr-fs,1));font-weight:700;letter-spacing:4px;color:#cfe4ff;background:rgba(10,18,40,0.85);border:1px solid #2b4a8a;border-radius:8px;padding:12px 26px;animation:vrPulse 1.6s ease-in-out infinite;transition:background 0.15s,border-color 0.15s;}',
    '.vr-start:hover{background:rgba(30,50,100,0.95);border-color:#4a7fd8;animation:none;}',
    '.vr-start:focus-visible{outline:2px solid #ffe08a;outline-offset:2px;}',
    '.vr-reduced .vr-start{animation:none !important;}',
    '@media (max-width:620px){.vr-menu-grid{grid-template-columns:1fr !important;max-width:100% !important;}.vr-credit{display:none !important;}#screen-menu{justify-content:flex-start !important;overflow-y:auto !important;padding:18px 0 !important;}}',
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
    d.classList.add('vr-panel'); // ST-088: entrance settle
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
  const titleEl = line(menu, 'VOID RUNNER', 'font-size:calc(46px * var(--vr-fs,1));font-weight:800;letter-spacing:10px;'); titleEl.classList.add('vr-title'); // I65: gradient + glow
  line(menu, 'survive the void, outlast the waves', 'font-size:calc(14px * var(--vr-fs,1));letter-spacing:2px;opacity:0.85;'); // I44 contrast
  const controls = document.createElement('div');
  controls.style.cssText = 'display:grid;grid-template-columns:auto auto;gap:8px 22px;font-size:calc(14px * var(--vr-fs,1));margin-top:6px;padding:16px 24px;border:1px solid rgba(120,170,255,0.18);border-radius:12px;background:rgba(10,20,45,0.35);'; // I65: controls card
  const CONTROL_ROWS = settings.touch // I71: touch vs keyboard instructions
    ? [['DRAG', 'fly the ship'], ['TOUCH', 'auto-fire'], ['2 FINGERS', 'pause']]
    : [['WASD / ARROWS', 'thrust'], ['MOUSE', 'aim'], ['CLICK / SPACE', 'fire'], ['P / ESC', 'pause'], ['M', 'mute'], ['F', 'fx'], ['N', 'music']];
  for (const [k, v] of CONTROL_ROWS) {
    const key = document.createElement('div');
    key.style.cssText = 'text-align:right;';
    const kc = document.createElement('span'); // I44: keycap styling
    kc.style.cssText = 'display:inline-block;padding:2px 8px;border:1px solid rgba(255,224,138,0.4);border-radius:5px;background:rgba(255,224,138,0.08);color:#ffe08a;font-weight:700;font-size:calc(12px * var(--vr-fs,1));letter-spacing:1px;';
    kc.textContent = k;
    key.appendChild(kc);
    const val = document.createElement('div');
    val.style.cssText = 'opacity:0.9;';
    val.textContent = v;
    controls.append(key, val);
  }
  const top5 = document.createElement('div'); // I66: top-5 card
  top5.style.cssText = 'display:flex;flex-direction:column;gap:4px;font-size:calc(13px * var(--vr-fs,1));padding:14px 22px;min-height:150px;border:1px solid rgba(120,170,255,0.18);border-radius:12px;background:rgba(10,20,45,0.35);';
  const top5Head = document.createElement('div');
  top5Head.textContent = 'TOP 5';
  top5Head.style.cssText = 'font-weight:700;letter-spacing:3px;font-size:calc(12px * var(--vr-fs,1));opacity:0.9;margin-bottom:2px;';
  const top5Body = document.createElement('div');
  top5Body.style.cssText = 'display:flex;flex-direction:column;gap:3px;white-space:pre-line;font-variant-numeric:tabular-nums;';
  top5.append(top5Head, top5Body);
  const menuGrid = document.createElement('div'); // I66: two-column menu
  menuGrid.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:22px;align-items:start;max-width:640px;';
  menuGrid.classList.add('vr-menu-grid'); // I71: collapse to one column on narrow viewports
  menuGrid.append(controls, top5);
  menu.appendChild(menuGrid);
  const menuStatus = line(menu, 'M \u2014 MUTE (OFF)     F \u2014 FX (HIGH)     N \u2014 MUSIC (ON)', 'font-size:calc(12px * var(--vr-fs,1));letter-spacing:2px;opacity:0.65;margin-top:10px;'); // I165: live session status on the menu (I164 finding); I171: + N music
  if (settings.touch && settings.actions && settings.actions.start) { // I71: tappable start on touch
    const startBtn = document.createElement('button');
    startBtn.type = 'button';
    startBtn.className = 'vr-start';
    startBtn.textContent = 'TAP TO START';
    startBtn.style.cssText = 'margin-top:14px;';
    startBtn.addEventListener('click', (e) => { e.stopPropagation(); settings.actions.start(); startBtn.blur(); });
    menu.appendChild(startBtn);
  } else {
    line(menu, 'PRESS ENTER TO START', 'font-size:calc(18px * var(--vr-fs,1));font-weight:700;letter-spacing:4px;margin-top:14px;animation:vrPulse 1.6s ease-in-out infinite;');
  }
  if (settings.actions && typeof settings.actions.startDaily === 'function') { // ST-141: DAILY button (today's seeded board)
    const dailyBtn = document.createElement('button');
    dailyBtn.type = 'button';
    dailyBtn.className = 'vr-pause-btn';
    dailyBtn.textContent = 'DAILY RUN';
    dailyBtn.style.cssText = 'margin-top:10px;letter-spacing:3px;';
    dailyBtn.setAttribute('aria-label', 'Start the daily seeded run');
    dailyBtn.addEventListener('click', (e) => { e.stopPropagation(); settings.actions.startDaily(); dailyBtn.blur(); });
    menu.appendChild(dailyBtn);
  }
  if (settings.actions && typeof settings.actions.showReplays === 'function') { // ST-190: REPLAYS button (demo pilot + saved runs)
    const replaysBtn = document.createElement('button');
    replaysBtn.type = 'button';
    replaysBtn.className = 'vr-pause-btn';
    replaysBtn.textContent = 'REPLAYS';
    replaysBtn.style.cssText = 'margin-top:10px;letter-spacing:3px;';
    replaysBtn.setAttribute('aria-label', 'Watch a saved replay');
    replaysBtn.addEventListener('click', (e) => { e.stopPropagation(); settings.actions.showReplays(); replaysBtn.blur(); });
    menu.appendChild(replaysBtn);
  }
  const menuBest = line(menu, '', 'font-size:calc(13px * var(--vr-fs,1));opacity:0.85;'); // best score lands in I18 (I44 contrast)
  const menuDaily = line(menu, '', 'font-size:calc(13px * var(--vr-fs,1));opacity:0.85;letter-spacing:1px;color:#9fd8ff;'); // ST-141: daily board line
  const credit = document.createElement('div'); // I65: credits
  credit.className = 'vr-credit';
  credit.textContent = 'a three.js arcade shooter \u25c6 Blender-modeled low-poly assets \u25c6 built with the Codex Game Studio pipeline';
  menu.appendChild(credit);
  if (settings.menu) menu.appendChild(settings.menu.el); // ST-026 settings (menu)

  // --- PAUSED (I68: deeper dim + RESUME / RESTART / QUIT actions, mouse + keys) ---
  const paused = panel('screen-paused', 'radial-gradient(60% 55% at 50% 45%, rgba(30,60,140,0.16), transparent 70%), rgba(2,4,12,0.74)');
  line(paused, 'PAUSED', 'font-size:calc(36px * var(--vr-fs,1));font-weight:800;letter-spacing:8px;');
  const pauseSnap = line(paused, '', 'font-size:calc(15px * var(--vr-fs,1));font-weight:700;letter-spacing:2px;opacity:0.9;'); // I44: session snapshot
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
      } else if (e.key === ' ' || e.key === 'Enter' || e.key === 'Escape' || e.key === 'p' || e.key === 'P' || e.key === 'm' || e.key === 'M' || e.key === 'r' || e.key === 'R' || e.key === 'q' || e.key === 'Q' || e.key === 'f' || e.key === 'F') {
        e.stopPropagation();
      }
    });
  }
  const muteLabel = line(paused, 'M — MUTE (OFF)', 'font-size:calc(13px * var(--vr-fs,1));letter-spacing:2px;opacity:0.7;');
    const fxLabel = line(paused, 'F \u2014 FX (HIGH)', 'font-size:calc(13px * var(--vr-fs,1));letter-spacing:2px;opacity:0.7;'); // I157
  if (settings.pause) paused.appendChild(settings.pause.el); // ST-026 settings (pause)

  // --- GAME OVER ---
  const gameOver = panel('screen-gameover', 'rgba(8,2,6,0.72)');
  line(gameOver, 'GAME OVER', 'font-size:calc(42px * var(--vr-fs,1));font-weight:800;letter-spacing:8px;color:#ff6d8a;');
  const finalScore = line(gameOver, 'SCORE 0', 'font-size:calc(26px * var(--vr-fs,1));font-weight:700;letter-spacing:2px;');
  const overBest = line(gameOver, '', 'font-size:calc(13px * var(--vr-fs,1));opacity:0.7;');
  const newBestLine = line(gameOver, '', 'font-size:calc(16px * var(--vr-fs,1));font-weight:800;letter-spacing:3px;color:#ffe08a;');
  const statsLine1 = line(gameOver, '', 'font-size:calc(15px * var(--vr-fs,1));font-weight:700;letter-spacing:2px;color:#cfe4ff;margin-top:10px;'); // ST-031
  const statsLine2 = line(gameOver, '', 'font-size:calc(15px * var(--vr-fs,1));font-weight:700;letter-spacing:2px;color:#cfe4ff;'); // ST-031
  const statsLine3 = line(gameOver, '', 'font-size:calc(15px * var(--vr-fs,1));font-weight:700;letter-spacing:2px;color:#9fd8ff;'); // I152
  const rankLine = line(gameOver, '', 'font-size:calc(14px * var(--vr-fs,1));font-weight:700;letter-spacing:2px;color:#ffe08a;opacity:0.95;'); // I69: board rank
  const dailyBadge = document.createElement('div'); // ST-141: DAILY RUN badge (only for daily runs)
  dailyBadge.style.cssText = 'display:none;font-size:calc(12px * var(--vr-fs,1));font-weight:700;letter-spacing:2px;color:#9fd8ff;border:1px solid rgba(159,216,255,0.4);border-radius:20px;padding:4px 14px;background:rgba(60,120,220,0.16);';
  gameOver.appendChild(dailyBadge);
  let goPrompt = null; // ST-190: restart prompt element (keyboard path); its text is set in update()
  if (settings.touch && settings.actions && settings.actions.restart) { // I71: tappable restart on touch
    const reBtn = document.createElement('button');
    reBtn.type = 'button';
    reBtn.className = 'vr-start';
    reBtn.textContent = 'TAP TO RESTART';
    reBtn.style.cssText = 'margin-top:10px;';
    reBtn.addEventListener('click', (e) => { e.stopPropagation(); settings.actions.restart(); reBtn.blur(); });
    gameOver.appendChild(reBtn);
  } else {
    goPrompt = line(gameOver, 'PRESS ENTER TO RESTART', 'font-size:calc(16px * var(--vr-fs,1));font-weight:700;letter-spacing:4px;margin-top:10px;animation:vrPulse 1.6s ease-in-out infinite;'); // ST-190
  }

  // ST-159: shareable result - copy the reproducible result code (ST-142 codec) to the clipboard.
  let goShare = '';
  const shareBtn = document.createElement('button');
  shareBtn.type = 'button';
  shareBtn.className = 'vr-pause-btn';
  shareBtn.id = 'vr-share-btn';
  shareBtn.setAttribute('aria-label', 'Copy result code');
  shareBtn.textContent = 'COPY RESULT';
  shareBtn.style.cssText = 'margin-top:4px;pointer-events:auto;';
  function legacyCopy(text) {
    try {
      const ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;';
      document.body.appendChild(ta); ta.focus(); ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch (e) { return false; }
  }
  function copyShare() {
    const feedback = (ok) => {
      shareBtn.textContent = ok ? 'COPIED!' : 'COPY FAILED';
      shareBtn.disabled = true;
      setTimeout(() => { shareBtn.textContent = 'COPY RESULT'; shareBtn.disabled = false; }, 1400);
    };
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      navigator.clipboard.writeText(goShare).then(() => feedback(true), () => feedback(legacyCopy(goShare)));
    } else feedback(legacyCopy(goShare));
  }
  shareBtn.addEventListener('click', (e) => { e.stopPropagation(); if (goShare) copyShare(); shareBtn.blur(); });
  gameOver.appendChild(shareBtn);
  line(gameOver, 'copies a reproducible result code', 'font-size:calc(11px * var(--vr-fs,1));opacity:0.6;letter-spacing:1px;margin-top:-8px;');
  let watchRunBtn = null; // ST-191: WATCH THIS RUN (only for the just-saved run)
  if (settings.actions && settings.actions.watchRun) {
    watchRunBtn = document.createElement('button');
    watchRunBtn.type = 'button';
    watchRunBtn.className = 'vr-pause-btn';
    watchRunBtn.textContent = 'WATCH THIS RUN';
    watchRunBtn.style.cssText = 'display:none;margin-top:10px;letter-spacing:3px;';
    watchRunBtn.setAttribute('aria-label', 'Watch this run as a replay');
    watchRunBtn.addEventListener('click', (e) => { e.stopPropagation(); settings.actions.watchRun(); watchRunBtn.blur(); });
    gameOver.appendChild(watchRunBtn);
  }
  // --- REPLAYS (ST-190: demo pilot + saved runs; a row starts a watched run) ---
  const replaysPanel = panel('screen-replays', 'radial-gradient(55% 50% at 30% 30%, rgba(60,110,200,0.22), transparent 70%), radial-gradient(50% 55% at 72% 72%, rgba(140,70,180,0.20), transparent 70%), rgba(2,4,12,0.62)');
  line(replaysPanel, 'REPLAYS', 'font-size:calc(30px * var(--vr-fs,1));font-weight:800;letter-spacing:8px;');
  line(replaysPanel, 'watch the demo pilot or a saved run', 'font-size:calc(13px * var(--vr-fs,1));letter-spacing:2px;opacity:0.85;');
  const replaysList = document.createElement('div');
  replaysList.style.cssText = 'display:flex;flex-direction:column;gap:8px;width:min(560px,86vw);max-height:52vh;overflow-y:auto;padding:6px 2px;';
  replaysPanel.appendChild(replaysList);
  const replaysEmpty = document.createElement('div');
  replaysEmpty.style.cssText = 'font-size:calc(13px * var(--vr-fs,1));opacity:0.7;letter-spacing:1px;';
  replaysList.appendChild(replaysEmpty);
  let replaysOpenFlag = false;
  let replaysRows = [];
  function renderReplays() {
    while (replaysList.children.length > 1) replaysList.removeChild(replaysList.lastChild);
    const hasSaved = replaysRows.some((r) => r.isDemo !== true);
    replaysEmpty.style.display = hasSaved ? 'none' : 'block';
    replaysEmpty.textContent = hasSaved ? '' : '\u2014 no saved replays yet \u2014';
    for (const row of replaysRows) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'vr-pause-btn';
      b.style.cssText = 'display:flex;justify-content:space-between;align-items:center;gap:12px;width:100%;letter-spacing:1px;text-align:left;padding:10px 16px;';
      const lbl = document.createElement('span');
      lbl.style.cssText = 'font-weight:700;';
      lbl.textContent = row.label;
      const t = row.time || 0;
      const stat = document.createElement('span');
      stat.style.cssText = 'opacity:0.75;white-space:pre;font-variant-numeric:tabular-nums;';
      stat.textContent = 'SCORE ' + row.score + '    WAVE ' + row.wave + '    ' + row.kills + ' KILLS    ' + Math.floor(t / 60) + ':' + String(Math.floor(t) % 60).padStart(2, '0');
      b.append(lbl, stat);
      b.setAttribute('aria-label', row.label + ', score ' + row.score);
      b.addEventListener('click', (e) => { e.stopPropagation(); if (settings.actions && settings.actions.startReplay) settings.actions.startReplay(row.key); b.blur(); });
      replaysList.appendChild(b);
    }
  }
  if (settings.actions && typeof settings.actions.closeReplays === 'function') {
    const backBtn = document.createElement('button');
    backBtn.type = 'button';
    backBtn.className = 'vr-pause-btn';
    backBtn.textContent = 'BACK';
    backBtn.style.cssText = 'margin-top:10px;letter-spacing:3px;';
    backBtn.setAttribute('aria-label', 'Back to the menu');
    backBtn.addEventListener('click', (e) => { e.stopPropagation(); settings.actions.closeReplays(); backBtn.blur(); });
    replaysPanel.appendChild(backBtn);
  }
  const PANELS = {
    [STATE.MENU]: menu,
    [STATE.PAUSED]: paused,
    [STATE.GAME_OVER]: gameOver,
    [STATE.PLAYING]: null,
    [STATE.REPLAY]: null, // ST-190: no full-screen panel; the in-game HUD + replay bar carry the state
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
  function update(state, world, opts = { muted: false, best: 0, newBest: false, reducedMotion: false, scoresText: '', fx: 'high', music: true }) {
    overlay.classList.toggle('vr-reduced', !!opts.reducedMotion); // I65: gate menu animations
    showPanel(state);
    if (state === STATE.GAME_OVER) {
      set('finalScore', finalScore, `SCORE ${world.score}`);
      if (goPrompt) set('goPrompt', goPrompt, opts.replayMode ? 'PRESS Q TO QUIT TO MENU' : 'PRESS ENTER TO RESTART'); // ST-190: a finished replay quits to the menu
      if (watchRunBtn) watchRunBtn.style.display = opts.watchRun ? 'block' : 'none'; // ST-191: only for the just-saved run
      set('overBest', overBest, opts.best > 0 ? `BEST ${opts.best}` : '');
      set('newBest', newBestLine, opts.newBest ? 'NEW BEST!' : '');
      newBestLine.classList.toggle('vr-newbest', !!opts.newBest); // I69: celebration pulse
      set('overRank', rankLine, opts.scoreRank > 0 ? 'BOARD RANK #' + opts.scoreRank : ''); // I69
      const mm = Math.floor(world.time / 60); // ST-031: session stats
      const ss = String(Math.floor(world.time) % 60).padStart(2, '0');
      set('stats1', statsLine1, "KILLS " + world.scoreKeeper.kills + "    WAVE " + Math.max(1, world.wave));
      set('stats2', statsLine2, "MAX COMBO " + world.scoreKeeper.maxCombo + "    TIME " + mm + ":" + ss);
      const st = world.sessionStats(); set('stats3', statsLine3, "ACCURACY " + Math.round(st.accuracy * 100) + "%    SHOTS " + st.shotsHit + "/" + st.shotsFired); // I152
      goShare = encodeResult({ seed: world.rng.seed, score: world.score, wave: Math.max(1, world.wave), kills: world.scoreKeeper.kills }); // ST-159
      if (opts.dailyMode) { dailyBadge.style.display = 'inline-block'; set('dailyBadge', dailyBadge, 'DAILY RUN' + (opts.dailyKey ? '  \u00b7  ' + opts.dailyKey : '') + (opts.dailyNewBest ? '   NEW DAILY BEST' : '')); } // ST-141
      else dailyBadge.style.display = 'none';
    }
    if (state === STATE.MENU) {
      set('menuStatus', menuStatus, 'M \u2014 MUTE (' + (opts.muted ? 'ON' : 'OFF') + ')     F \u2014 FX (' + (opts.fx === 'low' ? 'LOW' : 'HIGH') + ')     N \u2014 MUSIC (' + (opts.music !== false ? 'ON' : 'OFF') + ')'); // I165: live mute + fx state; I171: + N music
      set('menuBest', menuBest, opts.best > 0 ? `BEST ${opts.best}` : '');
      set('top5', top5Body, opts.scoresText ? opts.scoresText : '\u2014 no scores yet \u2014'); // I66
      set('menuDaily', menuDaily, opts.dailyMenu ? ('DAILY ' + opts.dailyMenu.key + '  \u00b7  ' + (opts.dailyMenu.value > 0 ? 'BEST ' + opts.dailyMenu.value : 'NO BEST YET')) : ''); // ST-141
    }
    if (state === STATE.PAUSED) {
      set('mute', muteLabel, `M — MUTE (${opts.muted ? 'ON' : 'OFF'})`);
      set('fx', fxLabel, 'F \u2014 FX (' + (opts.fx === 'low' ? 'LOW' : 'HIGH') + ')'); // I157
      set('pauseSnap', pauseSnap, `SCORE ${world.score}    WAVE ${Math.max(1, world.wave)}    KILLS ${world.scoreKeeper.kills}`); // I44
    }
    if (state !== STATE.MENU) replaysOpenFlag = false; // ST-190: leaving the menu closes the list
    const rp = state === STATE.MENU && replaysOpenFlag;
    replaysPanel.style.display = rp ? 'flex' : 'none';
    if (state === STATE.MENU) menu.style.display = rp ? 'none' : 'flex';
    if (rp) renderReplays();
  }

  return { update, overlay, lastShare: () => goShare, shareButton: shareBtn,
    openReplays: (rows) => { replaysRows = rows || []; replaysOpenFlag = true; renderReplays(); replaysPanel.style.display = 'flex'; }, // ST-190
    closeReplays: () => { replaysOpenFlag = false; replaysPanel.style.display = 'none'; }, // ST-190
    replaysOpen: () => replaysOpenFlag // ST-190
  }; // ST-159 + ST-190
}

