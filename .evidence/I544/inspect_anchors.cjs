const fs = require('fs');
function ctx(file, needle, before, after, label) {
  const s = fs.readFileSync(file, 'latin1');
  const a = s.indexOf(needle);
  const n = s.split(needle).length - 1;
  console.log('=== ' + label + ' [' + file + '] count=' + n);
  if (a < 0) { console.log('NOT FOUND'); return; }
  console.log(JSON.stringify(s.slice(Math.max(0, a - before), a + needle.length + after)));
}
ctx('src/render/screens.js', "import { t as tr, kc as kcap, onLocale } from '../core/strings.js';", 0, 120, 'import');
ctx('src/render/screens.js', "#screen-menu .vr-settings > div > div{background:rgba(6,12,30,0.92);}", 60, 40, 'css-scope');
ctx('src/render/screens.js', '  let shown = null;\r\n  function showPanel(state) {', 0, 420, 'showPanel');
ctx('src/render/screens.js', "    if (campaignBtn) { campaignBtn.textContent = tr('menu.mode_campaign'); campaignBtn.setAttribute('aria-label', tr('menu.mode_campaign')); } // ST-420 (I450)", 0, 200, 'onLocale');
ctx('src/main.js', "import { Storage, toggleFxQuality } from './core/storage.js';", 0, 80, 'main-import');
ctx('src/main.js', "  menu: menuSettings, pause: pauseSettings, touch: coarse, // I71: touch-aware menu", 0, 80, 'main-settings');
ctx('src/main.js', "      startRun('normal'); // ST-141: Enter starts a normal run (DAILY button for the daily run)", 100, 60, 'main-enter');
ctx('tests/strings.test.js', "  'src/main.js',", 40, 120, 'tests-files');