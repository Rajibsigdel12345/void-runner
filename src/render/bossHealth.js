// ST-055: boss HP bar - minimal DOM (no assets): thin fixed bar under the wave chip.
export function createBossHealth(root) {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'position:fixed;top:54px;left:50%;transform:translateX(-50%);width:340px;max-width:60vw;opacity:0;pointer-events:none;transition:opacity 0.25s;z-index:30;text-align:center;';
  const label = document.createElement('div');
  label.textContent = 'MONOLITH';
  label.style.cssText = 'font:600 calc(10px * var(--vr-fs,1))/1 system-ui,sans-serif;letter-spacing:0.25em;color:rgba(190,160,255,0.9);margin-bottom:4px;'; // I161: font-scale
  const bar = document.createElement('div');
  bar.style.cssText = 'height:10px;background:rgba(10,8,20,0.65);border:1px solid rgba(150,110,255,0.5);border-radius:5px;overflow:hidden;';
  const fill = document.createElement('div');
  fill.style.cssText = 'height:100%;width:100%;background:linear-gradient(90deg,#8b5cf6,#c084fc);transition:width 0.1s linear;';
  bar.appendChild(fill);
  wrap.appendChild(label);
  wrap.appendChild(bar);
  root.appendChild(wrap);

  let _kind = ''; // ST-143: last-synced boss kind (avoids rewriting styles every frame)
  /** sync(boss): visible while the boss is alive; fill width = hpFrac; label + tint per variant (ST-143). */
  function sync(boss) {
    if (!boss || !boss.alive) { wrap.style.opacity = '0'; return; }
    wrap.style.opacity = '1';
    fill.style.width = (Math.max(0, Math.min(1, boss.hpFrac)) * 100) + '%';
    if (_kind !== boss.kind) {
      _kind = boss.kind;
      const sp = boss.kind === 'splicer';
      label.textContent = sp ? 'SPLICER' : 'MONOLITH';
      label.style.color = sp ? 'rgba(120,235,220,0.9)' : 'rgba(190,160,255,0.9)';
      bar.style.borderColor = sp ? 'rgba(45,212,191,0.5)' : 'rgba(150,110,255,0.5)';
      fill.style.background = sp ? 'linear-gradient(90deg,#14b8a6,#5eead4)' : 'linear-gradient(90deg,#8b5cf6,#c084fc)';
    }
  }

  return { sync, wrap };
}
