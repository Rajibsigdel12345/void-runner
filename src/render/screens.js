// Void Runner - menu / pause / game-over screens (ST-017). DOM only; text change-cached.
import { STATE } from '../core/state.js';
import { encodeResult } from '../core/share.js'; // ST-159: shareable result code
import { t as tr, kc as kcap, onLocale } from '../core/strings.js'; // I404: ST-374 + I405: ST-375 locale switching

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
    '#screen-menu .vr-settings-groups{grid-template-columns:1fr !important;}', // ST-279: menu settings stack (narrow left column),
    '#screen-menu .vr-settings{z-index:2;}',
    '#screen-menu .vr-settings > div > div{background:rgba(6,12,30,0.92);}', // opaque so the corner panel reads over the grid edge,
    '@media (max-width:620px),(max-height:480px){.vr-menu-grid{grid-template-columns:1fr !important;max-width:100% !important;}.vr-credit{display:none !important;}#screen-menu .vr-settings{position:static !important;left:auto !important;bottom:auto !important;margin-top:8px !important;z-index:auto !important;}#screen-menu{justify-content:flex-start !important;overflow-y:auto !important;padding:18px 0 !important;}#screen-paused,#screen-gameover,#screen-replays{justify-content:flex-start !important;overflow-y:auto !important;padding:18px 0 !important;}}',
    '@media (pointer:coarse){.vr-start,.vr-pause-btn{box-sizing:border-box;min-height:44px}#vr-pause-btn{width:44px !important;height:44px !important}.vr-settings input[type=checkbox]{-webkit-appearance:none;appearance:none;box-sizing:border-box;width:44px;height:44px;margin:0;padding:0;border:1px solid #2b4a8a;border-radius:4px;background:rgba(10,18,40,0.8) center/20px 20px no-repeat;cursor:pointer}.vr-settings input[type=checkbox]:checked{background-color:#2b4a8a;background-image:url("data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20viewBox=%220%200%2024%2024%22%3E%3Cpath%20fill=%22none%22%20stroke=%22%23ffe08a%22%20stroke-width=%223.4%22%20stroke-linecap=%22round%22%20stroke-linejoin=%22round%22%20d=%22M4%2012.5l5.2%205.2L20%206.5%22/%3E%3C/svg%3E")}.vr-settings input[type=range]{height:44px}.vr-settings select{min-height:44px}}', // ST-324 (I354): 44 px coarse-pointer touch targets (fine/desktop byte-untouched)
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
  // ST-279: three-zone one-job layout - top (title), center band (start prompt, clear of the
  // 3D ship hero), bottom zone (cards + actions). DOM only; en text bytes frozen (.evidence/I297).
  menu.style.justifyContent = 'flex-start';
  menu.style.padding = '24px 0 18px';
  const topWrap = document.createElement('div');
  topWrap.className = 'vr-menu-top';
  topWrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:6px;';
  const centerWrap = document.createElement('div');
  centerWrap.className = 'vr-menu-center';
  centerWrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;justify-content:flex-start;padding-top:14px;';
  const spacer = document.createElement('div'); // flex:1 pushes the bottom zone under the ship hero
  spacer.className = 'vr-menu-spacer';
  spacer.style.cssText = 'flex:1;min-height:0;';
  const bottomWrap = document.createElement('div');
  bottomWrap.className = 'vr-menu-bottom';
  bottomWrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:8px;padding-bottom:30px;width:100%;';
  menu.append(topWrap, centerWrap, spacer, bottomWrap);
  const titleEl = line(topWrap, 'VOID RUNNER', 'font-size:calc(46px * var(--vr-fs,1));font-weight:800;letter-spacing:10px;'); titleEl.classList.add('vr-title'); // I65: gradient + glow
  const menuTagline = line(topWrap, tr('menu.tagline'), 'font-size:calc(14px * var(--vr-fs,1));letter-spacing:2px;opacity:0.85;'); // I44 contrast; ST-375: locale re-emit target
  const controls = document.createElement('div');
  controls.style.cssText = 'display:grid;grid-template-columns:auto auto auto auto;gap:5px 16px;font-size:calc(13px * var(--vr-fs,1));padding:10px 16px;border:1px solid rgba(120,170,255,0.18);border-radius:12px;background:rgba(10,20,45,0.35);'; // I65: controls card; ST-279: two keycap pairs per row
  function controlRows() { // ST-375: re-resolvable for locale re-emit
    return settings.touch // I71: touch vs keyboard instructions
      ? [[kcap('left_zone'), tr('ctrl.drag_fly')], [kcap('right_zone'), tr('ctrl.aim_fire')], [kcap('two_fingers'), tr('ctrl.pause')]] // ST-268 dual-zone
      : [[kcap('wasd_arrows'), tr('ctrl.thrust')], [kcap('mouse'), tr('ctrl.aim')], [kcap('click_space'), tr('ctrl.fire')], [kcap('p_esc'), tr('ctrl.pause')], [kcap('m'), tr('ctrl.mute')], [kcap('f'), tr('ctrl.fx')], [kcap('n'), tr('ctrl.music')], [kcap('v'), tr('ctrl.camera')]];
  }
  const CONTROL_ROWS = controlRows();
  const ctrlCells = []; // ST-375: [keycap span, value line] pairs for locale re-emit
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
    ctrlCells.push([kc, val]); // ST-375
  }
  const top5 = document.createElement('div'); // I66: top-5 card
  top5.style.cssText = 'display:flex;flex-direction:column;gap:4px;font-size:calc(13px * var(--vr-fs,1));padding:10px 18px;min-height:130px;border:1px solid rgba(120,170,255,0.18);border-radius:12px;background:rgba(10,20,45,0.35);'; // ST-279: compact
  const top5Head = document.createElement('div');
  top5Head.textContent = tr('menu.board');
  top5Head.style.cssText = 'font-weight:700;letter-spacing:3px;font-size:calc(12px * var(--vr-fs,1));opacity:0.9;margin-bottom:2px;';
  const top5Body = document.createElement('div');
  top5Body.style.cssText = 'display:flex;flex-direction:column;gap:3px;white-space:pre-line;font-variant-numeric:tabular-nums;';
  top5.append(top5Head, top5Body);
  const menuGrid = document.createElement('div'); // I66: two-column menu
  menuGrid.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:22px;align-items:start;max-width:640px;';
  menuGrid.classList.add('vr-menu-grid'); // I71: collapse to one column on narrow viewports
  menuGrid.append(controls, top5);
  bottomWrap.appendChild(menuGrid);
  const menuStatus = line(bottomWrap, tr('menu.status_line',{mute:tr('state.off'),fx:tr('state.high'),music:tr('state.on'),mode:tr('settings.camera_mode.chase')}), 'font-size:calc(12px * var(--vr-fs,1));letter-spacing:2px;opacity:0.65;'); // I165: live session status on the menu (I164 finding); I171: + N music
  let menuStartBtn = null; let menuStartLine = null; // ST-375: locale re-emit targets (touch btn / keyboard line)
  if (settings.touch && settings.actions && settings.actions.start) { // I71: tappable start on touch
    const startBtn = document.createElement('button');
    startBtn.type = 'button';
    startBtn.className = 'vr-start';
    startBtn.textContent = tr('menu.start_tap');
    startBtn.style.cssText = 'margin-top:14px;';
    startBtn.addEventListener('click', (e) => { e.stopPropagation(); settings.actions.start(); startBtn.blur(); });
    centerWrap.appendChild(startBtn);
    menuStartBtn = startBtn; // ST-375
  } else {
    menuStartLine = line(centerWrap, tr('menu.start_key'), 'font-size:calc(18px * var(--vr-fs,1));font-weight:700;letter-spacing:4px;animation:vrPulse 1.6s ease-in-out infinite;');
  }
  const dailyRow = document.createElement('div'); // ST-279: DAILY + REPLAYS side by side
  dailyRow.style.cssText = 'display:flex;gap:14px;align-items:center;';
  let dailyBtn = null; let replaysBtn = null; // ST-375: locale re-emit targets
  if (settings.actions && typeof settings.actions.startDaily === 'function') { // ST-141: DAILY button (today's seeded board)
    const dailyBtnEl = document.createElement('button');
    dailyBtnEl.type = 'button';
    dailyBtnEl.className = 'vr-pause-btn';
    dailyBtnEl.textContent = tr('menu.daily');
    dailyBtnEl.style.cssText = 'letter-spacing:3px;';
    dailyBtnEl.setAttribute('aria-label', tr('menu.daily_aria'));
    dailyBtnEl.addEventListener('click', (e) => { e.stopPropagation(); settings.actions.startDaily(); dailyBtnEl.blur(); });
    dailyRow.appendChild(dailyBtnEl);
    dailyBtn = dailyBtnEl; // ST-375
  }
  if (settings.actions && typeof settings.actions.showReplays === 'function') { // ST-190: REPLAYS button (demo pilot + saved runs)
    const replaysBtnEl = document.createElement('button');
    replaysBtnEl.type = 'button';
    replaysBtnEl.className = 'vr-pause-btn';
    replaysBtnEl.textContent = tr('menu.replays');
    replaysBtnEl.style.cssText = 'letter-spacing:3px;';
    replaysBtnEl.setAttribute('aria-label', tr('menu.replays_aria'));
    replaysBtnEl.addEventListener('click', (e) => { e.stopPropagation(); settings.actions.showReplays(); replaysBtnEl.blur(); });
    dailyRow.appendChild(replaysBtnEl);
    replaysBtn = replaysBtnEl; // ST-375
  }
  if (dailyRow.children.length) bottomWrap.appendChild(dailyRow);

  const modeRow = document.createElement('div'); // ST-420 (I450): ENDLESS + CAMPAIGN mode entry (Enter still starts endless)
  modeRow.style.cssText = 'display:flex;gap:14px;align-items:center;';
  let endlessBtn = null; let campaignBtn = null; // ST-375: locale re-emit targets
  if (settings.actions && typeof settings.actions.startEndless === 'function') {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'vr-pause-btn';
    b.textContent = tr('menu.mode_endless');
    b.style.cssText = 'letter-spacing:3px;';
    b.setAttribute('aria-label', tr('menu.mode_endless'));
    b.addEventListener('click', (e) => { e.stopPropagation(); settings.actions.startEndless(); b.blur(); });
    modeRow.appendChild(b);
    endlessBtn = b; // ST-375
  }
  if (settings.actions && typeof settings.actions.startCampaign === 'function') {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'vr-pause-btn';
    b.textContent = tr('menu.mode_campaign');
    b.style.cssText = 'letter-spacing:3px;color:#ffe08a;';
    b.setAttribute('aria-label', tr('menu.mode_campaign'));
    b.addEventListener('click', (e) => { e.stopPropagation(); settings.actions.startCampaign(); b.blur(); });
    modeRow.appendChild(b);
    campaignBtn = b; // ST-375
  }
  if (modeRow.children.length) bottomWrap.appendChild(modeRow);
  const bestRow = document.createElement('div'); // ST-279: best + daily lines share a row
  bestRow.style.cssText = 'display:flex;gap:24px;align-items:baseline;';
  const menuBest = line(bestRow, '', 'font-size:calc(13px * var(--vr-fs,1));opacity:0.85;'); // best score lands in I18 (I44 contrast)
  const menuDaily = line(bestRow, '', 'font-size:calc(13px * var(--vr-fs,1));opacity:0.85;letter-spacing:1px;color:#9fd8ff;'); // ST-141: daily board line
  const credit = document.createElement('div'); // I65: credits
  credit.className = 'vr-credit';
  credit.textContent = tr('menu.credit');
  bestRow.append(menuBest, menuDaily);
bottomWrap.append(bestRow, credit);
  if (settings.menu) {
    // ST-279: demoted to the bottom-left corner (clear of the centered ship hero band).
    settings.menu.el.style.position = 'absolute';
    settings.menu.el.style.left = '16px';
    settings.menu.el.style.bottom = '54px'; // ST-318 (I347): E31 minor (a) - clears the menu-credit 7px cross (I319); >=20px gap bar
    bottomWrap.appendChild(settings.menu.el);
  }

  // --- PAUSED (I68: deeper dim + RESUME / RESTART / QUIT actions, mouse + keys) ---
  const paused = panel('screen-paused', 'radial-gradient(60% 55% at 50% 45%, rgba(30,60,140,0.16), transparent 70%), rgba(2,4,12,0.74)');
  const pauseTitle = line(paused, tr('pause.title'), 'font-size:calc(36px * var(--vr-fs,1));font-weight:800;letter-spacing:8px;'); // ST-375: locale re-emit target
  const pauseSnap = line(paused, '', 'font-size:calc(15px * var(--vr-fs,1));font-weight:700;letter-spacing:2px;opacity:0.9;'); // I44: session snapshot
  const pauseActions = (settings.actions && typeof settings.actions.resume === 'function') ? settings.actions : null; // I68
  function pauseActionSpecs() { // ST-375: re-resolvable for locale re-emit
    return [
      [tr('pause.resume'), kcap('p'), pauseActions && pauseActions.resume],
      [tr('pause.restart'), kcap('r'), pauseActions && pauseActions.restart],
      [tr('pause.quit'), kcap('q'), pauseActions && pauseActions.quit],
    ];
  }
  const actionLabels = []; // ST-375: [{i, text, key}] for locale re-emit
  if (pauseActions) {
    const actionsRow = document.createElement('div');
    actionsRow.style.cssText = 'display:flex;gap:14px;margin-top:2px;';
    const actionButtons = [];
    const actionSpecs = pauseActionSpecs(); // ST-375
    for (let ai = 0; ai < actionSpecs.length; ai++) {
      const [label, keyHint, fn] = actionSpecs[ai];
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'vr-pause-btn';
      b.appendChild(document.createTextNode(label + '  '));
      const ks = document.createElement('span');
      ks.className = 'vr-key';
      ks.textContent = keyHint;
      b.appendChild(ks);
      actionLabels.push({ i: ai, text: b.childNodes[0], key: ks }); // ST-375: childNodes[0] = the "label + '  '" text node
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
  const muteLabel = line(paused, tr('pause.label_mute',{mute:tr('state.off')}), 'font-size:calc(13px * var(--vr-fs,1));letter-spacing:2px;opacity:0.7;');
    const fxLabel = line(paused, tr('pause.label_fx',{fx:tr('state.high')}), 'font-size:calc(13px * var(--vr-fs,1));letter-spacing:2px;opacity:0.7;'); // I157
  if (settings.pause) paused.appendChild(settings.pause.el); // ST-026 settings (pause)

  // --- GAME OVER ---
  const gameOver = panel('screen-gameover', 'rgba(8,2,6,0.72)');
  const overTitle = line(gameOver, tr('over.title'), 'font-size:calc(42px * var(--vr-fs,1));font-weight:800;letter-spacing:8px;color:#ff6d8a;'); // ST-375: locale re-emit target
  const finalScore = line(gameOver, tr('over.score',{score:0}), 'font-size:calc(26px * var(--vr-fs,1));font-weight:700;letter-spacing:2px;');
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
  let overRestartBtn = null; // ST-375: locale re-emit target (touch restart button)
  if (settings.touch && settings.actions && settings.actions.restart) { // I71: tappable restart on touch
    const reBtn = document.createElement('button');
    reBtn.type = 'button';
    reBtn.className = 'vr-start';
    reBtn.textContent = tr('over.restart_tap');
    reBtn.style.cssText = 'margin-top:10px;';
    reBtn.addEventListener('click', (e) => { e.stopPropagation(); settings.actions.restart(); reBtn.blur(); });
    gameOver.appendChild(reBtn);
    overRestartBtn = reBtn; // ST-375
  } else {
    goPrompt = line(gameOver, tr('over.restart_key'), 'font-size:calc(16px * var(--vr-fs,1));font-weight:700;letter-spacing:4px;margin-top:10px;animation:vrPulse 1.6s ease-in-out infinite;'); // ST-190
  }

  // ST-159: shareable result - copy the reproducible result code (ST-142 codec) to the clipboard.
  let goShare = '';
  const shareBtn = document.createElement('button');
  shareBtn.type = 'button';
  shareBtn.className = 'vr-pause-btn';
  shareBtn.id = 'vr-share-btn';
  shareBtn.setAttribute('aria-label', tr('over.copy_aria'));
  shareBtn.textContent = tr('over.copy');
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
      shareBtn.textContent = ok ? tr('over.copied') : tr('over.copy_failed');
      shareBtn.disabled = true;
      setTimeout(() => { shareBtn.textContent = tr('over.copy'); shareBtn.disabled = false; }, 1400);
    };
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      navigator.clipboard.writeText(goShare).then(() => feedback(true), () => feedback(legacyCopy(goShare)));
    } else feedback(legacyCopy(goShare));
  }
  shareBtn.addEventListener('click', (e) => { e.stopPropagation(); if (goShare) copyShare(); shareBtn.blur(); });
  gameOver.appendChild(shareBtn);
  const copyCaption = line(gameOver, tr('over.copy_caption'), 'font-size:calc(11px * var(--vr-fs,1));opacity:0.6;letter-spacing:1px;margin-top:-8px;'); // ST-375: locale re-emit target
  let watchRunBtn = null; // ST-191: WATCH THIS RUN (only for the just-saved run)
  if (settings.actions && settings.actions.watchRun) {
    watchRunBtn = document.createElement('button');
    watchRunBtn.type = 'button';
    watchRunBtn.className = 'vr-pause-btn';
    watchRunBtn.textContent = tr('over.watch_run');
    watchRunBtn.style.cssText = 'display:none;margin-top:10px;letter-spacing:3px;';
    watchRunBtn.setAttribute('aria-label', tr('over.watch_run_aria'));
    watchRunBtn.addEventListener('click', (e) => { e.stopPropagation(); settings.actions.watchRun(); watchRunBtn.blur(); });
    gameOver.appendChild(watchRunBtn);
  }
  // --- REPLAYS (ST-190: demo pilot + saved runs; a row starts a watched run) ---
  const replaysPanel = panel('screen-replays', 'radial-gradient(55% 50% at 30% 30%, rgba(60,110,200,0.22), transparent 70%), radial-gradient(50% 55% at 72% 72%, rgba(140,70,180,0.20), transparent 70%), rgba(2,4,12,0.62)');
  const replaysTitle = line(replaysPanel, tr('replays.title'), 'font-size:calc(30px * var(--vr-fs,1));font-weight:800;letter-spacing:8px;'); // ST-375: locale re-emit target
  const replaysSub = line(replaysPanel, tr('replays.sub'), 'font-size:calc(13px * var(--vr-fs,1));letter-spacing:2px;opacity:0.85;'); // ST-375: locale re-emit target
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
    replaysEmpty.textContent = hasSaved ? '' : tr('replays.empty');
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
      stat.textContent = tr('replays.row_stat',{score:row.score,wave:row.wave,kills:row.kills,time:Math.floor(t / 60)+':'+String(Math.floor(t) % 60).padStart(2,'0')});
      b.append(lbl, stat);
      b.setAttribute('aria-label', tr('replays.row_aria',{label:row.label,score:row.score}));
      b.addEventListener('click', (e) => { e.stopPropagation(); if (settings.actions && settings.actions.startReplay) settings.actions.startReplay(row.key); b.blur(); });
      replaysList.appendChild(b);
    }
  }
  let replaysBackBtn = null; // ST-375: locale re-emit target
  if (settings.actions && typeof settings.actions.closeReplays === 'function') {
    const backBtnEl = document.createElement('button');
    backBtnEl.type = 'button';
    backBtnEl.className = 'vr-pause-btn';
    backBtnEl.textContent = tr('replays.back');
    backBtnEl.style.cssText = 'margin-top:10px;letter-spacing:3px;';
    backBtnEl.setAttribute('aria-label', tr('replays.back_aria'));
    backBtnEl.addEventListener('click', (e) => { e.stopPropagation(); settings.actions.closeReplays(); backBtnEl.blur(); });
    replaysPanel.appendChild(backBtnEl);
    replaysBackBtn = backBtnEl; // ST-375
  }
  // ST-375: live locale switch - re-emit every persistent label this module owns.
  // Per-frame derived text (menuStatus/pauseSnap/mute/fx/stats/scores/goPrompt) re-resolves
  // in update() and needs no re-emit. Replay rows are NOT re-emitted: they re-resolve on the
  // next openReplays (probe-only staleness, documented in the I405 entry).
  onLocale(() => {
    menuTagline.textContent = tr('menu.tagline');
    const rows2 = controlRows();
    for (let ci = 0; ci < ctrlCells.length; ci++) { ctrlCells[ci][0].textContent = rows2[ci][0]; ctrlCells[ci][1].textContent = rows2[ci][1]; }
    if (menuStartBtn) menuStartBtn.textContent = tr('menu.start_tap');
    if (menuStartLine) menuStartLine.textContent = tr('menu.start_key');
    if (dailyBtn) { dailyBtn.textContent = tr('menu.daily'); dailyBtn.setAttribute('aria-label', tr('menu.daily_aria')); }
    if (replaysBtn) { replaysBtn.textContent = tr('menu.replays'); replaysBtn.setAttribute('aria-label', tr('menu.replays_aria')); }
    if (endlessBtn) { endlessBtn.textContent = tr('menu.mode_endless'); endlessBtn.setAttribute('aria-label', tr('menu.mode_endless')); } // ST-420 (I450)
    if (campaignBtn) { campaignBtn.textContent = tr('menu.mode_campaign'); campaignBtn.setAttribute('aria-label', tr('menu.mode_campaign')); } // ST-420 (I450)
    credit.textContent = tr('menu.credit');
    top5Head.textContent = tr('menu.board');
    pauseTitle.textContent = tr('pause.title');
    if (actionLabels.length) {
      const specs2 = pauseActionSpecs();
      for (const a of actionLabels) { a.text.data = specs2[a.i][0] + '  '; a.key.textContent = specs2[a.i][1]; }
    }
    overTitle.textContent = tr('over.title');
    if (shareBtn && !shareBtn.disabled) { shareBtn.textContent = tr('over.copy'); shareBtn.setAttribute('aria-label', tr('over.copy_aria')); } // never clobber the transient COPIED/FAILED feedback
    copyCaption.textContent = tr('over.copy_caption');
    if (overRestartBtn) overRestartBtn.textContent = tr('over.restart_tap');
    if (watchRunBtn) { watchRunBtn.textContent = tr('over.watch_run'); watchRunBtn.setAttribute('aria-label', tr('over.watch_run_aria')); }
    replaysTitle.textContent = tr('replays.title');
    replaysSub.textContent = tr('replays.sub');
    if (replaysBackBtn) { replaysBackBtn.textContent = tr('replays.back'); replaysBackBtn.setAttribute('aria-label', tr('replays.back_aria')); }
  }); // ST-375

  const PANELS = {
    [STATE.MENU]: menu,
    [STATE.PAUSED]: paused,
    [STATE.GAME_OVER]: gameOver,
    [STATE.PLAYING]: null,
    [STATE.REPLAY]: null, // ST-190: no full-screen panel; the in-game HUD + replay bar carry the state
  };

  let _overTitleVictory = null; // ST-420 (I450): last applied victory styling (change-cached)
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
      if (_overTitleVictory !== !!opts.victory) { _overTitleVictory = !!opts.victory; set('overTitle', overTitle, _overTitleVictory ? tr('over.victory_title') : tr('over.title')); overTitle.style.color = _overTitleVictory ? '#ffe08a' : '#ff6d8a'; } // ST-420 (I450): campaign victory - gold title
      set('finalScore', finalScore, tr('over.score',{score:world.score}));
      if (goPrompt) set('goPrompt', goPrompt, opts.replayMode ? tr('over.restart_replay') : tr('over.restart_key')); // ST-190: a finished replay quits to the menu
      if (watchRunBtn) watchRunBtn.style.display = opts.watchRun ? 'block' : 'none'; // ST-191: only for the just-saved run
      set('overBest', overBest, opts.best > 0 ? tr('over.best',{best:opts.best}) : '');
      set('newBest', newBestLine, opts.newBest ? tr('over.new_best') : '');
      newBestLine.classList.toggle('vr-newbest', !!opts.newBest); // I69: celebration pulse
      set('overRank', rankLine, opts.scoreRank > 0 ? tr('over.rank',{rank:opts.scoreRank}) : ''); // I69
      const mm = Math.floor(world.time / 60); // ST-031: session stats
      const ss = String(Math.floor(world.time) % 60).padStart(2, '0');
      set('stats1', statsLine1, tr('over.stats_kills',{kills:world.scoreKeeper.kills,wave:Math.max(1, world.wave)}));
      set('stats2', statsLine2, tr('over.stats_combo_time',{combo:world.scoreKeeper.maxCombo,time:mm+':'+ss}));
      const st = world.sessionStats(); set('stats3', statsLine3, tr('over.stats_accuracy',{acc:Math.round(st.accuracy * 100),hit:st.shotsHit,fired:st.shotsFired})); // I152
      goShare = encodeResult({ seed: world.rng.seed, score: world.score, wave: Math.max(1, world.wave), kills: world.scoreKeeper.kills }); // ST-159
      if (opts.dailyMode) { dailyBadge.style.display = 'inline-block'; set('dailyBadge', dailyBadge, tr('over.daily_badge',{key_seg:opts.dailyKey ? '  \u00b7  ' + opts.dailyKey : '',new_seg:opts.dailyNewBest ? '   ' + tr('over.new_daily') : ''})); } // ST-141
      else dailyBadge.style.display = 'none';
    }
    if (state === STATE.MENU) {
      set('menuStatus', menuStatus, tr('menu.status_line',{mute:opts.muted?tr('state.on'):tr('state.off'),fx:opts.fx==='low'?tr('state.low'):tr('state.high'),music:opts.music!==false?tr('state.on'):tr('state.off'),mode:tr('settings.camera_mode.'+(opts.camMode==='overview'||opts.camMode==='cockpit'?opts.camMode:'chase'))})); // I165: live mute + fx state; I171: + N music
      set('menuBest', menuBest, opts.best > 0 ? tr('menu.best',{best:opts.best}) : '');
      set('top5', top5Body, opts.scoresText ? opts.scoresText : tr('menu.no_scores')); // I66
      set('menuDaily', menuDaily, opts.dailyMenu ? (tr('menu.daily_line',{key:opts.dailyMenu.key,best:opts.dailyMenu.value>0?tr('menu.best',{best:opts.dailyMenu.value}):tr('menu.no_best')})) : ''); // ST-141
    }
    if (state === STATE.PAUSED) {
      set('mute', muteLabel, tr('pause.label_mute',{mute:opts.muted?tr('state.on'):tr('state.off')}));
      set('fx', fxLabel, tr('pause.label_fx',{fx:opts.fx==='low'?tr('state.low'):tr('state.high')})); // I157
      set('pauseSnap', pauseSnap, tr('pause.snap',{score:world.score,wave:Math.max(1, world.wave),kills:world.scoreKeeper.kills})); // I44
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

