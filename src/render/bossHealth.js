// ST-055: boss HP bar - minimal DOM (no assets): thin fixed bar under the wave chip.
export function createBossHealth(root) {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'position:fixed;top:54px;left:50%;transform:translateX(-50%);width:340px;max-width:60vw;opacity:0;pointer-events:none;transition:opacity 0.25s;z-index:30;text-align:center;';
  const label = document.createElement('div');
  label.textContent = 'MONOLITH';
  label.style.cssText = 'font:600 10px/1 system-ui,sans-serif;letter-spacing:0.25em;color:rgba(190,160,255,0.9);margin-bottom:4px;';
  const bar = document.createElement('div');
  bar.style.cssText = 'height:10px;background:rgba(10,8,20,0.65);border:1px solid rgba(150,110,255,0.5);border-radius:5px;overflow:hidden;';
  const fill = document.createElement('div');
  fill.style.cssText = 'height:100%;width:100%;background:linear-gradient(90deg,#8b5cf6,#c084fc);transition:width 0.1s linear;';
  bar.appendChild(fill);
  wrap.appendChild(label);
  wrap.appendChild(bar);
  root.appendChild(wrap);

  /** sync(boss): visible while the boss is alive; fill width = hpFrac. */
  function sync(boss) {
    if (!boss || !boss.alive) { wrap.style.opacity = '0'; return; }
    wrap.style.opacity = '1';
    fill.style.width = (Math.max(0, Math.min(1, boss.hpFrac)) * 100) + '%';
  }

  return { sync, wrap };
}
