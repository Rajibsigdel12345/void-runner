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
  slowmo: { label: 'SLOW-MO', letter: 'T', color: '#9fe8ff' }, // ST-116
};

const MOD_TAG = { fast: ['FAST ROCKS', '#ff9a6b'], small: ['SMALL ROCKS', '#6fe3ff'], inward: ['INWARD DRIFT', '#8bff9e'], big: ['HEAVY ROCKS', '#c99eff'] }; // I93: persistent active-modifier tag; ST-228: big

// I112: combo text brightens as the chain climbs multiplier tiers (index = tier, 0..tierCount).
const TIER_COLOR = ['#ffe08a', '#ffe08a', '#fff0b0', '#fff6cf', '#fffdf2', '#ffffff'];

// I123: hex number -> css color (weapon-level pips read CONFIG.fx.palette.bulletLevel).
function hexColor(h) { return '#' + (h >>> 0).toString(16).padStart(6, '0'); }

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
  // I160: compact score row - the combo multiplier rides inline next to the
  // score (hidden while there is no chain), so the bottom-center block shrinks
  // to a heat bar.
  const scoreRow = document.createElement('div');
  scoreRow.style.cssText = 'display:flex;align-items:baseline;gap:8px;';
  const score = document.createElement('div');
  score.id = 'hud-score';
  score.style.cssText = 'font-size:calc(24px * var(--vr-fs,1));font-weight:700;letter-spacing:1px;';
  const mult = document.createElement('span');
  mult.id = 'hud-mult';
  mult.style.cssText = 'font-size:calc(15px * var(--vr-fs,1));font-weight:800;letter-spacing:1px;display:none;transform-origin:left center;';
  scoreRow.append(score, mult);
  const best = document.createElement('div');
  best.style.cssText = 'font-size:calc(13px * var(--vr-fs,1));opacity:0.9;margin-top:2px;'; // I44: 0.75 -> 0.9 contrast
  scoreBox.append(scoreRow, best);

  // I123: weapon-level indicator (WPN label + 3 pips) under the score, top-left.
  const wpnBox = box('top:58px;left:18px');
  const wpnLabel = document.createElement('div');
  wpnLabel.style.cssText = 'font-size:calc(11px * var(--vr-fs,1));font-weight:800;letter-spacing:2px;opacity:0.85;margin-bottom:3px;';
  wpnLabel.textContent = 'WPN';
  wpnBox.appendChild(wpnLabel);
  const pipRow = document.createElement('div');
  pipRow.style.cssText = 'display:flex;gap:5px;';
  const pips = [];
  for (let pi = 0; pi < 3; pi++) {
    const p = document.createElement('span');
    p.style.cssText = 'display:inline-block;width:10px;height:10px;border-radius:50%;background:rgba(255,255,255,0.16);';
    pipRow.appendChild(p);
    pips.push(p);
  }
  wpnBox.appendChild(pipRow);

  const waveBox = box('top:16px;left:50%;transform:translateX(-50%);text-align:center');
  const wave = document.createElement('div');
  wave.style.cssText = 'font-size:calc(18px * var(--vr-fs,1));font-weight:600;letter-spacing:4px;'; // I44: full opacity
  waveBox.appendChild(wave);
  const waveMod = document.createElement('div'); // I93: active modifier shown for the whole wave (not just the start banner)
  waveMod.style.cssText = 'font-size:calc(12px * var(--vr-fs,1));font-weight:700;letter-spacing:2px;margin-top:3px;text-shadow:0 1px 3px rgba(0,0,0,0.8);display:none;';
  waveBox.appendChild(waveMod);

  const livesBox = box('top:14px;right:18px;text-align:right');
  const lives = document.createElement('div');
  lives.id = 'hud-lives'; // ST-269 (I284): probeable (score already has hud-score)
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

  // I160: bottom-center is a compact combo heat bar (small label + 4s drain);
  // the chain/multiplier text now rides the score line (top-left).
  const heatWrap = box('bottom:26px;left:50%;transform:translateX(-50%);text-align:center;transition:opacity 0.15s linear');
  const comboLabel = document.createElement('div');
  comboLabel.id = 'hud-combo-label';
  comboLabel.textContent = 'COMBO';
  comboLabel.style.cssText = 'font-size:calc(10px * var(--vr-fs,1));font-weight:800;letter-spacing:3px;margin-bottom:4px;color:#ffe08a;opacity:0.9;';
  const comboTrack = document.createElement('div');
  comboTrack.id = 'hud-combo-track';
  comboTrack.style.cssText = 'width:calc(150px * var(--vr-fs,1));height:3px;margin:0 auto;background:rgba(255,255,255,0.15);';
  const comboFill = document.createElement('div');
  comboFill.style.cssText = 'height:100%;width:100%;background:#ffe08a;transform-origin:left center;transform:scaleX(1);';
  comboTrack.appendChild(comboFill);
  heatWrap.append(comboLabel, comboTrack);
  heatWrap.style.opacity = '0';

  const cache = {};
  function set(part, node, text) {
    if (cache[part] === text) return;
    cache[part] = text;
    node.textContent = text;
  }

  let lastComboBar = -1;
  const reduceMotion = (typeof window !== 'undefined' && window.matchMedia) ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false; // I112 a11y: skip scale pop
  let prevKills = 0;    // I112: kill-feedback pop trigger (kills counter)
  let prevTier = 0;     // I112: tier-up moment -> bigger pop
  let popScale = 1;     // I112: combo text scale, 1 = settled
  let prevTime = null;  // I112: sim dt source for pop decay
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
    // I123: weapon-level pips - fill by level, recolor by level; write only on change.
    const wl = (typeof world.weaponLevel === 'function') ? world.weaponLevel() : 1;
    if (cache['wpn'] !== wl) {
      cache['wpn'] = wl;
      const wcol = hexColor(CONFIG.fx.palette.bulletLevel[Math.min(2, wl - 1)]);
      for (let i = 0; i < 3; i++) pips[i].style.background = i < wl ? wcol : 'rgba(255,255,255,0.16)';
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
      heatWrap.style.opacity = '1';
      // I160: multiplier rides the score line (top-left); big bottom text removed.
      if (mult.style.display === 'none') mult.style.display = 'inline-block';
      set('mult', mult, '\u00d7' + world.scoreKeeper.multiplier.toFixed(1));
      // I112 (I160): kill feedback pop + tier color. Kill = kills counter up; a tier-up pops bigger.
      const tierNow = world.scoreKeeper.tier;
      if (world.scoreKeeper.kills > prevKills) popScale = tierNow > prevTier ? 1.35 : 1.15;
      prevKills = world.scoreKeeper.kills;
      prevTier = tierNow;
      const tcol = TIER_COLOR[tierNow] || TIER_COLOR[0];
      if (cache['comboColor'] !== tcol) { cache['comboColor'] = tcol; mult.style.color = tcol; comboLabel.style.color = tcol; }
      const effPop = reduceMotion ? 1 : popScale;
      mult.style.transform = Math.abs(effPop - 1) > 0.001 ? 'scale(' + effPop.toFixed(3) + ')' : 'scale(1)';
      // I112: combo window bar driven by ScoreKeeper.heatAt() (I111) - single source for the drain.
      const q = Math.floor(world.scoreKeeper.heatAt(world.time) * 40) / 40;
      if (q !== lastComboBar) { lastComboBar = q; comboFill.style.transform = `scaleX(${q})`; }
    } else {
      heatWrap.style.opacity = '0';
      if (mult.style.display !== 'none') mult.style.display = 'none';
      mult.style.transform = 'scale(1)';
      lastComboBar = -1;
    }
    // I112: pop decay + sim-time tracking run every frame (even while the combo is hidden).
    const dtPop = prevTime === null ? 0 : Math.max(0, world.time - prevTime);
    popScale += (1 - popScale) * Math.min(1, dtPop * 12);
    prevTime = world.time;
  }

  let visible = true;
  function setVisible(v) { if (visible === v) return; visible = v; el.style.display = v ? '' : 'none'; }

  root.appendChild(el);
  return { el, render, setVisible };
}
