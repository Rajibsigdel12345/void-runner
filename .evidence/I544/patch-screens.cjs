// I544 (ST-510, E74): patch 2 of 2 - src/render/screens.js D1 menu reorg (5 ops, unique-anchor guards).
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const p = path.join(ROOT, 'src/render/screens.js');
let s = fs.readFileSync(p, 'latin1');
function rep(str, anchor, replacement, label) {
  const n = str.split(anchor).length - 1;
  if (n !== 1) throw new Error(label + ': anchor count ' + n + ' (expected 1)');
  return str.replace(anchor, replacement);
}

// B1: import menuModel
s = rep(s,
  "import { t as tr, kc as kcap, onLocale } from '../core/strings.js'; // I404: ST-374 + I405: ST-375 locale switching\r\n",
  "import { t as tr, kc as kcap, onLocale } from '../core/strings.js'; // I404: ST-374 + I405: ST-375 locale switching\r\nimport { menuModel } from '../core/menuModel.js'; // ST-510 (I544) D1: pure core menu decision model\r\n",
  'B1-import');

// B2: CSS scope fix (controls card becomes a direct child of .vr-settings)
s = rep(s,
  '#screen-menu .vr-settings > div > div{background:rgba(6,12,30,0.92);}',
  '#screen-menu .vr-settings .vr-settings-groups > div{background:rgba(6,12,30,0.92);}',
  'B2-css');

// B3: big block swap (I66 two-column grid -> D1 hierarchy)
const START = "  const menuGrid = document.createElement('div'); // I66: two-column menu";
const END = "    bottomWrap.appendChild(settings.menu.el);\r\n  }";
const a = s.indexOf(START);
const b = s.indexOf(END);
if (a < 0 || b < 0 || b < a) throw new Error('B3: START/END anchors not ordered');
if (s.indexOf(START, a + 1) !== -1) throw new Error('B3: START not unique');
if (s.indexOf(END, b + 1) !== -1) throw new Error('B3: END not unique');
const BLOCK = [
  '  // ST-510 (I544) D1: standard-game menu hierarchy - the centered hero keeps the start prompt (touch)',
  '  // or the CONTINUE - LV N primary (campaign progress exists, checkpoint continue ST-457); the bottom',
  '  // zone = NEW GAME heading + ENDLESS/CAMPAIGN/DAILY row + SETTINGS/REPLAYS row + TOP 5 + status line +',
  '  // best/daily + credit. The settings panel is a collapsed corner panel (Esc closes it) and now holds',
  '  // the controls help card (the old I66 two-column grid is gone).',
  "  const newGameHead = line(bottomWrap, tr('menu.new_game'), 'font-size:calc(12px * var(--vr-fs,1));font-weight:700;letter-spacing:4px;opacity:0.8;'); // ST-510 (I544): NEW GAME heading",
  "  const menuStatus = line(bottomWrap, tr('menu.status_line',{mute:tr('state.off'),fx:tr('state.high'),music:tr('state.on'),mode:tr('settings.camera_mode.chase')}), 'font-size:calc(12px * var(--vr-fs,1));letter-spacing:2px;opacity:0.65;'); // I165: live session status on the menu (I164 finding); I171: + N music",
  '  let menuStartBtn = null; let menuStartLine = null; // ST-375: locale re-emit targets (touch btn / keyboard line)',
  '  if (settings.touch && settings.actions && settings.actions.start) { // I71: tappable start on touch',
  "    const startBtn = document.createElement('button');",
  "    startBtn.type = 'button';",
  "    startBtn.className = 'vr-start';",
  "    startBtn.textContent = tr('menu.start_tap');",
  "    startBtn.style.cssText = 'margin-top:14px';",
  "    startBtn.addEventListener('click', (e) => { e.stopPropagation(); settings.actions.start(); startBtn.blur(); });",
  '    centerWrap.appendChild(startBtn);',
  '    menuStartBtn = startBtn; // ST-375',
  '  } else {',
  "    menuStartLine = line(centerWrap, tr('menu.start_key'), 'font-size:calc(18px * var(--vr-fs,1));font-weight:700;letter-spacing:4px;animation:vrPulse 1.6s ease-in-out infinite;');",
  '  }',
  '  let continueBtn = null; // ST-510 (I544) D1: CONTINUE - LV N primary (campaign checkpoint continue, ST-457)',
  "  if (settings.actions && typeof settings.actions.startCampaign === 'function') {",
  "    const cb = document.createElement('button');",
  "    cb.type = 'button';",
  "    cb.className = 'vr-start';",
  "    cb.style.cssText = 'margin-top:14px;color:#ffe08a';",
  "    cb.style.display = 'none'; // shown by refreshMenu when progress exists",
  "    cb.addEventListener('click', (e) => { e.stopPropagation(); settings.actions.startCampaign(); cb.blur(); });",
  '    centerWrap.appendChild(cb);',
  '    continueBtn = cb;',
  '  }',
  '  let settingsOpen = false; // ST-510 (I544) D1: settings panel collapsed by default',
  "  const settingsBtn = document.createElement('button'); // ST-510 (I544) D1: SETTINGS toggle",
  "  settingsBtn.type = 'button';",
  "  settingsBtn.className = 'vr-pause-btn';",
  "  settingsBtn.textContent = tr('menu.settings');",
  "  settingsBtn.style.cssText = 'letter-spacing:3px';",
  "  settingsBtn.setAttribute('aria-label', tr('menu.settings_aria'));",
  "  settingsBtn.setAttribute('aria-expanded', 'false');",
  '  function setSettingsOpen(open) { // ST-510 (I544) D1',
  '    settingsOpen = open;',
  '    if (settings.menu) {',
  "      settings.menu.el.style.display = open ? 'flex' : 'none';",
  '      if (open) settings.menu.sync();',
  '    }',
  "    settingsBtn.setAttribute('aria-expanded', open ? 'true' : 'false');",
  '  }',
  "  settingsBtn.addEventListener('click', (e) => { e.stopPropagation(); setSettingsOpen(!settingsOpen); settingsBtn.blur(); });",
  "  const dailyRow = document.createElement('div'); // ST-510 (I544) D1: secondary row - SETTINGS + DAILY + REPLAYS (was ST-279 DAILY+REPLAYS)",
  "  dailyRow.style.cssText = 'display:flex;gap:14px;align-items:center';",
  '  dailyRow.appendChild(settingsBtn);',
  '  let dailyBtn = null; let replaysBtn = null; // ST-375: locale re-emit targets',
  "  if (settings.actions && typeof settings.actions.startDaily === 'function') { // ST-141: DAILY button (today's seeded board)",
  "    const dailyBtnEl = document.createElement('button');",
  "    dailyBtnEl.type = 'button';",
  "    dailyBtnEl.className = 'vr-pause-btn';",
  "    dailyBtnEl.textContent = tr('menu.daily');",
  "    dailyBtnEl.style.cssText = 'letter-spacing:3px';",
  "    dailyBtnEl.setAttribute('aria-label', tr('menu.daily_aria'));",
  "    dailyBtnEl.addEventListener('click', (e) => { e.stopPropagation(); settings.actions.startDaily(); dailyBtnEl.blur(); });",
  '    dailyRow.appendChild(dailyBtnEl);',
  '    dailyBtn = dailyBtnEl; // ST-375',
  '  }',
  "  if (settings.actions && typeof settings.actions.showReplays === 'function') { // ST-190: REPLAYS button (demo pilot + saved runs)",
  "    const replaysBtnEl = document.createElement('button');",
  "    replaysBtnEl.type = 'button';",
  "    replaysBtnEl.className = 'vr-pause-btn';",
  "    replaysBtnEl.textContent = tr('menu.replays');",
  "    replaysBtnEl.style.cssText = 'letter-spacing:3px';",
  "    replaysBtnEl.setAttribute('aria-label', tr('menu.replays_aria'));",
  "    replaysBtnEl.addEventListener('click', (e) => { e.stopPropagation(); settings.actions.showReplays(); replaysBtnEl.blur(); });",
  '    dailyRow.appendChild(replaysBtnEl);',
  '    replaysBtn = replaysBtnEl; // ST-375',
  '  }',
  "  const modeRow = document.createElement('div'); // ST-420 (I450) + ST-510 (I544): NEW GAME row - ENDLESS / CAMPAIGN / DAILY",
  "  modeRow.style.cssText = 'display:flex;gap:14px;align-items:center';",
  '  let endlessBtn = null; let campaignBtn = null; // ST-375: locale re-emit targets',
  "  if (settings.actions && typeof settings.actions.startEndless === 'function') {",
  "    const b = document.createElement('button');",
  "    b.type = 'button';",
  "    b.className = 'vr-pause-btn';",
  "    b.textContent = tr('menu.mode_endless');",
  "    b.style.cssText = 'letter-spacing:3px';",
  "    b.setAttribute('aria-label', tr('menu.mode_endless'));",
  "    b.addEventListener('click', (e) => { e.stopPropagation(); settings.actions.startEndless(); b.blur(); });",
  '    modeRow.appendChild(b);',
  '    endlessBtn = b; // ST-375',
  '  }',
  "  if (settings.actions && typeof settings.actions.startCampaign === 'function') {",
  "    const b = document.createElement('button');",
  "    b.type = 'button';",
  "    b.className = 'vr-pause-btn';",
  "    b.textContent = tr('menu.mode_campaign');",
  "    b.style.cssText = 'letter-spacing:3px;color:#ffe08a';",
  "    b.setAttribute('aria-label', tr('menu.mode_campaign'));",
  "    b.addEventListener('click', (e) => { e.stopPropagation(); settings.actions.startCampaign(); b.blur(); });",
  '    modeRow.appendChild(b);',
  '    campaignBtn = b; // ST-375',
  '  }',
  '  if (dailyBtn) modeRow.appendChild(dailyBtn); // ST-510 (I544): DAILY is a NEW GAME choice (moved from the secondary row)',
  "  if (modeRow.children.length) newGameHead.style.display = 'block'; else newGameHead.style.display = 'none'; // ST-510 (I544)",
  "  const bestRow = document.createElement('div'); // ST-279: best + daily lines share a row",
  "  bestRow.style.cssText = 'display:flex;gap:24px;align-items:baseline';",
  "  const menuBest = line(bestRow, '', 'font-size:calc(13px * var(--vr-fs,1));opacity:0.85;'); // best score lands in I18 (I44 contrast)",
  "  const menuDaily = line(bestRow, '', 'font-size:calc(13px * var(--vr-fs,1));opacity:0.85;letter-spacing:1px;color:#9fd8ff;'); // ST-141: daily board line",
  "  const credit = document.createElement('div'); // I65: credits",
  "  credit.className = 'vr-credit';",
  "  credit.textContent = tr('menu.credit');",
  '  bestRow.append(menuBest, menuDaily);',
  '  bottomWrap.append(newGameHead, modeRow, dailyRow, top5, menuStatus, bestRow, credit); // ST-510 (I544) D1: bottom-zone order (append = move, reorders in place)',
  '  if (settings.menu) {',
  '    // ST-279: demoted to the bottom-left corner (clear of the centered ship hero band).',
  "    settings.menu.el.style.position = 'absolute';",
  "    settings.menu.el.style.left = '16px';",
  "    settings.menu.el.style.bottom = '54px'; // ST-318 (I347): E31 minor (a) - clears the menu-credit 7px cross (I319); >=20px gap bar",
  '    settings.menu.el.appendChild(controls); // ST-510 (I544): the controls help card lives in the settings panel now',
  "    controls.style.background = 'rgba(6,12,30,0.92)'; // opaque over the menu edge",
  '    bottomWrap.appendChild(settings.menu.el);',
  '    setSettingsOpen(false); // ST-510 (I544): collapsed by default',
  '  }'
].join('\r\n');
s = s.slice(0, a) + BLOCK + s.slice(b + END.length);
console.log('B3: block swapped (' + (b + END.length - a) + ' -> ' + BLOCK.length + ' bytes)');

// B4: refreshMenu + Esc listener before showPanel; MENU line rework
const INS4 = [
  '  let shown = null;',
  '  function refreshMenu() { // ST-510 (I544): re-evaluate the menu model (progress changes during play)',
  '    const mm = menuModel(settings.menuProgress ? settings.menuProgress() : 0);',
  '    if (continueBtn) {',
  '      continueBtn.textContent = mm.primary.label;',
  "      if (mm.hasContinue) continueBtn.setAttribute('aria-label', mm.primary.aria);",
  "      continueBtn.style.display = mm.hasContinue ? 'block' : 'none';",
  '    }',
  "    if (menuStartBtn) menuStartBtn.style.display = mm.hasContinue ? 'none' : '';",
  "    if (menuStartLine) menuStartLine.style.display = 'none'; // never set (keyboard path) - kept for symmetry",
  '  }',
  "  document.addEventListener('keydown', (e) => { // ST-510 (I544): Esc collapses the open menu settings panel (capture: before the panel swallows it)",
  "    if (e.key !== 'Escape' || shown !== STATE.MENU || !settingsOpen || replaysOpenFlag) return;",
  '    setSettingsOpen(false);',
  '    e.stopPropagation();',
  '  }, true);',
  '  function showPanel(state) {'
].join('\r\n');
s = rep(s, '  let shown = null;\r\n  function showPanel(state) {', INS4, 'B4-showpanel-pre');
s = rep(s,
  '    if (state === STATE.MENU && settings.menu) settings.menu.sync();\r\n',
  '    if (state === STATE.MENU) { setSettingsOpen(false); refreshMenu(); if (settings.menu) settings.menu.sync(); } // ST-510 (I544): D1 - collapse reset + re-evaluate the continue primary on every menu show\r\n',
  'B4-menu-line');

// B5: onLocale re-emit for the new ST-510 targets
s = rep(s,
  "    if (campaignBtn) { campaignBtn.textContent = tr('menu.mode_campaign'); campaignBtn.setAttribute('aria-label', tr('menu.mode_campaign')); } // ST-420 (I450)\r\n",
  "    if (campaignBtn) { campaignBtn.textContent = tr('menu.mode_campaign'); campaignBtn.setAttribute('aria-label', tr('menu.mode_campaign')); } // ST-420 (I450)\r\n" +
  "    if (continueBtn) { const mm2 = menuModel(settings.menuProgress ? settings.menuProgress() : 0); if (mm2.hasContinue) { continueBtn.textContent = mm2.primary.label; continueBtn.setAttribute('aria-label', mm2.primary.aria); } } // ST-510 (I544): D1 continue label follows the locale\r\n" +
  "    settingsBtn.textContent = tr('menu.settings'); settingsBtn.setAttribute('aria-label', tr('menu.settings_aria')); // ST-510 (I544)\r\n" +
  "    newGameHead.textContent = tr('menu.new_game'); // ST-510 (I544)\r\n",
  'B5-onlocale');

fs.writeFileSync(p, s, 'latin1');
console.log('PATCH2 DONE (screens.js ' + s.length + ' chars)');