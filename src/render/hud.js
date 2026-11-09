// Void Runner - HUD (ST-016; I44 UI/UX pass). DOM overlay; text updates only on
// change; drain bars quantized (chips 1/20, combo 1/40) so style writes stop
// once the displayed value is unchanged.
import { CONFIG } from '../core/config.js';

// I44: power-up indicator chips (GDD: top-right "active power-up timers").
// Accessibility (GDD): shape + color + label - never color alone. Palette
// matches the GDD power-up colors.
const PU_STYLE = {
  rapid:  { label: 'RAPID',  letter: 'R', color: '#ffe08a' },
  spread: { label: 'SPREAD', letter: 'S', color: '#ffa657' },
  shield: { label: 'SHIELD', letter: 'H', color: '#53d8ff' },
  magnet: { label: 'MAGNET', letter: 'M', color: '#7dff9e' },
  overdrive: { label: 'OVERDRIVE', letter: 'O', color: '#ff6ae2' },
};

const MOD_TAG = { fast: ['FAST ROCKS', '#ff9a6b'], small: ['SMALL ROCKS', '#6fe3ff'], inward: ['INWARD DRIFT', '#8bff9e'] }; // I93: persistent active-modifier tag

export function createHUD(root) {
  const el = document.createElement('div');
  el.id = 'hud';
  el.style.cssText = [
    'position:fixed', 'inset:0', 'pointer-events:none', 'z-index:10',
    'font-family:"Segoe UI",system-ui,sans-serif', 'color:#cfe4ff',
    'text-shadow:0 1px 3px rgba(0,0,0,0.8)', 'user-select:none',
  ].join(';');

  function box(pos, css = '') {
    const d = document.createElement('div');
    d.style.cssText = `position:absolute;${pos};${css}`;
    el.appendChild(d);
    return d;
  }

  const scoreBox = box('top:14px;left:18px');
  const score = document.createElement('div');
  score.style.cssText = 'font-size:calc(26px * var(--vr-fs,1));font-weight:700;letter-spacing:1px;';
  const best = document.createElement('div');
  best.style.cssText = 'font-size:calc(13px * var(--vr-fs,1));opacity:0.9;margin-top:2px;'; // I44: 0.75 -> 0.9 contrast
  scoreBox.append(score, best);

  const waveBox = box('top:16px;left:50%;transform:translateX(-50%);text-align:center');
  const wave = document.createElement('div');
  wave.style.cssText = 'font-size:calc(18px * var(--vr-fs,1));font-weight:600;letter-spacing:4px;'; // I44: full opacity
  waveBox.appendChild(wave);
  const waveMod = document.createElement('div'); // I93: active modifier shown for the whole wave (not just the start banner)
  waveMod.style.cssText = 'font-size:calc(12px * var(--vr-fs,1));font-weight:700;letter-spacing:2px;margin-top:3px;text-shadow:0 1px 3px rgba(0,0,0,0.8);display:none;';
  waveBox.appendChild(waveMod);

  const livesBox = box('top:14px;right:18px;text-align:right');
  const lives = document.createElement('div');
  lives.style.cssText = 'font-size:calc(22px * var(--vr-fs,1));letter-spacing:3px;color:#ff6d8a;';
  livesBox.appendChild(lives);

  // I44: power-up chips below lives; chip appears while timer > 0.
  const chipCol = box('top:46px;right:18px;text-align:right');
  const chips = {};
  for (const t of Object.keys(PU_STYLE)) {
    const s = PU_STYLE[t];
    const chip = document.createElement('div');
    chip.style.cssText = 'display:none;width:calc(96px * var(--vr-fs,1));margin-top:6px;';
    const top = document.createElement('div');
    top.style.cssText = `font-size:calc(13px * var(--vr-fs,1));font-weight:700;letter-spacing:1px;color:${s.color};white-space:nowrap;`;
    const letter = document.createElement('span'); // I70: letter badge (R/S/H/B/M/O)
    letter.style.cssText = `display:inline-flex;align-items:center;justify-content:center;width:1em;height:1em;margin-right:7px;font-size:calc(13px * var(--vr-fs,1));font-weight:800;line-height:1;color:#08101f;background:${s.color};border-radius:0.18em;`;
    letter.textContent = s.letter;
    top.append(letter, document.createTextNode(s.label));
    const track = document.createElement('div');
    track.style.cssText = 'height:3px;margin-top:2px;background:rgba(255,255,255,0.15);';
    const fill = document.createElement('div');
    fill.style.cssText = `height:100%;width:100%;background:${s.color};transform-origin:left center;transform:scaleX(1);`;
    track.appendChild(fill);
    chip.append(top, track);
    chipCol.appendChild(chip);
    chips[t] = { chip, fill, lastBar: -1 };
  }

  const comboWrap = box('bottom:26px;left:50%;transform:translateX(-50%);text-align:center;transition:opacity 0.15s linear');
  const combo = document.createElement('div');
  combo.style.cssText = 'font-size:calc(20px * var(--vr-fs,1));font-weight:700;color:#ffe08a;';
  // I44: drain bar under the chain text - the 4s combo window becomes visible.
  const comboTrack = document.createElement('div');
  comboTrack.style.cssText = 'width:calc(150px * var(--vr-fs,1));height:3px;margin:4px auto 0;background:rgba(255,255,255,0.15);';
  const comboFill = document.createElement('div');
  comboFill.style.cssText = 'height:100%;width:100%;background:#ffe08a;transform-origin:left center;transform:scaleX(1);';
  comboTrack.appendChild(comboFill);
  comboWrap.append(combo, comboTrack);
  comboWrap.style.opacity = '0';

  const cache = {};
  function set(part, node, text) {
    if (cache[part] === text) return;
    cache[part] = text;
    node.textContent = text;
  }

  let lastComboBar = -1;
  let lastModTag = ''; // I93: cache for the persistent modifier tag
  function render(world, opts = {}) {
    set('score', score, String(world.score));
    set('best', best, opts.best > 0 ? `BEST ${opts.best}` : '');
    set('wave', wave, world.wave > 0 ? `WAVE ${world.wave}` : '');
    const modTag = (world.waves && world.waves.activeMod && MOD_TAG[world.waves.activeMod]) ? world.waves.activeMod : 'none'; // I93
    if (modTag !== lastModTag) {
      lastModTag = modTag;
      if (modTag !== 'none') { waveMod.textContent = MOD_TAG[modTag][0]; waveMod.style.color = MOD_TAG[modTag][1]; waveMod.style.display = 'block'; }
      else { waveMod.textContent = ''; waveMod.style.display = 'none'; }
    }
    const n = world.lives;
    set('lives', lives, '♥'.repeat(n) + '♡'.repeat(Math.max(0, world.livesMgr.max - n)));

    for (const t of Object.keys(chips)) {
      const c = chips[t];
      const left = world.powerups.timeLeft[t];
      if (left <= 0) {
        if (c.chip.style.display !== 'none') c.chip.style.display = 'none';
        c.lastBar = -1;
        continue;
      }
      if (c.chip.style.display === 'none') c.chip.style.display = 'block';
      const dur = CONFIG.powerup.types[t].dur; // > 0 for all timed types (see tests)
      const q = Math.floor(Math.min(1, Math.max(0, left / dur)) * 20) / 20;
      if (q !== c.lastBar) { c.lastBar = q; c.fill.style.transform = `scaleX(${q})`; }
    }

    const c = world.scoreKeeper.combo;
    if (c > 1) {
      comboWrap.style.opacity = '1';
      set('combo', combo, `COMBO ${c}  \u00d7${world.scoreKeeper.multiplier.toFixed(1)}`);
      const remain = CONFIG.combo.window - (world.time - world.scoreKeeper.lastKillTime);
      const q = Math.floor(Math.min(1, Math.max(0, remain / CONFIG.combo.window)) * 40) / 40;
      if (q !== lastComboBar) { lastComboBar = q; comboFill.style.transform = `scaleX(${q})`; }
    } else {
      comboWrap.style.opacity = '0';
      lastComboBar = -1;
    }
  }

  let visible = true;
  function setVisible(v) { if (visible === v) return; visible = v; el.style.display = v ? '' : 'none'; }

  root.appendChild(el);
  return { el, render, setVisible };
}
