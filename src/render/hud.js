// Void Runner - HUD (ST-016). DOM overlay; text updates only on change (no per-frame DOM writes).
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
  score.style.cssText = 'font-size:26px;font-weight:700;letter-spacing:1px;';
  const best = document.createElement('div');
  best.style.cssText = 'font-size:13px;opacity:0.75;margin-top:2px;';
  scoreBox.append(score, best);

  const waveBox = box('top:16px;left:50%;transform:translateX(-50%);text-align:center');
  const wave = document.createElement('div');
  wave.style.cssText = 'font-size:18px;font-weight:600;letter-spacing:4px;opacity:0.9;';
  waveBox.appendChild(wave);

  const livesBox = box('top:14px;right:18px;text-align:right');
  const lives = document.createElement('div');
  lives.style.cssText = 'font-size:22px;letter-spacing:3px;color:#ff6d8a;';
  livesBox.appendChild(lives);

  const comboWrap = box('bottom:26px;left:50%;transform:translateX(-50%);text-align:center;transition:opacity 0.15s linear');
  const combo = document.createElement('div');
  combo.style.cssText = 'font-size:20px;font-weight:700;color:#ffe08a;';
  comboWrap.appendChild(combo);
  comboWrap.style.opacity = '0';

  const cache = {};
  function set(part, node, text) {
    if (cache[part] === text) return;
    cache[part] = text;
    node.textContent = text;
  }

  function render(world) {
    set('score', score, String(world.score));
    set('best', best, ''); // best score lands in I18
    set('wave', wave, world.wave > 0 ? `WAVE ${world.wave}` : '');
    const n = world.lives;
    set('lives', lives, '♥'.repeat(n) + '♡'.repeat(Math.max(0, world.livesMgr.max - n)));
    const c = world.scoreKeeper.combo;
    if (c > 1) {
      comboWrap.style.opacity = '1';
      set('combo', combo, `${c} CHAIN  ${world.scoreKeeper.multiplier.toFixed(1)}x`);
    } else {
      comboWrap.style.opacity = '0';
    }
  }

  let visible = true;
  function setVisible(v) { if (visible === v) return; visible = v; el.style.display = v ? '' : 'none'; }

  root.appendChild(el);
  return { el, render, setVisible };
}

