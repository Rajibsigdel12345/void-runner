// ST-055: boss HP bar - minimal DOM (no assets): thin fixed bar under the wave chip.
import { t, onLocale } from '../core/strings.js'; // I404: ST-374 + I405: ST-375 locale
export function createBossHealth(root) {
  const wrap = document.createElement('div');
  wrap.id = 'hud-bossbar'; // ST-269 (I284): probeable DOM ids (wrap/label/bar/fill were id-less = unprobeable)
  wrap.style.cssText = 'position:fixed;top:54px;left:50%;transform:translateX(-50%);width:340px;max-width:60vw;opacity:0;pointer-events:none;transition:opacity 0.25s;z-index:30;text-align:center;';
  const label = document.createElement('div');
  label.id = 'hud-bossbar-label'; // ST-269 (I284)
  label.textContent = t('boss.monolith');
  label.style.cssText = 'font:600 calc(12px * var(--vr-fs,1))/1 system-ui,sans-serif;letter-spacing:0.25em;color:rgba(190,160,255,0.9);margin-bottom:4px;'; // I161: font-scale; I284: base 10->12px (800x450 rendered ~9.8px = below legibility floor; the --vr-fs hook stays the only scale path, no font changes)
  const bar = document.createElement('div');
  bar.id = 'hud-bossbar-bar'; // ST-269 (I284)
  bar.style.cssText = 'height:10px;background:rgba(10,8,20,0.65);border:1px solid rgba(150,110,255,0.5);border-radius:5px;overflow:hidden;';
  const fill = document.createElement('div');
  fill.id = 'hud-bossbar-fill'; // ST-269 (I284)
  fill.style.cssText = 'height:100%;width:100%;background:linear-gradient(90deg,#8b5cf6,#c084fc);transition:width 0.1s linear;';
  bar.appendChild(fill);
  wrap.appendChild(label);
  wrap.appendChild(bar);
  root.appendChild(wrap);

  let _kind = ''; // ST-143: last-synced boss kind (avoids rewriting styles every frame)
  onLocale(() => { _kind = ''; }); // ST-375: force the label to re-derive on the next sync() (monolith/splicer label + tint)
  /** sync(boss): visible while the boss is alive; fill width = hpFrac; label + tint per variant (ST-143). */
  function sync(boss) {
    if (!boss || !boss.alive) { wrap.style.opacity = '0'; return; }
    wrap.style.opacity = '1';
    fill.style.width = (Math.max(0, Math.min(1, boss.hpFrac)) * 100) + '%';
    if (_kind !== (boss.kind + (boss.prime ? ':prime' : ''))) { // ST-420: prime shares kind 'monolith' -> composite discriminator
      _kind = boss.kind + (boss.prime ? ':prime' : '');
      const prime = boss.prime === true; // Monolith Prime re-tint (gold)
      if (prime) {
        label.textContent = t('boss.monolith_prime');
        label.style.color = 'rgba(255,214,120,0.95)';
        bar.style.borderColor = 'rgba(255,201,77,0.6)';
        fill.style.background = 'linear-gradient(90deg,#f59e0b,#ffd54d)';
      } else {
        const sp = boss.kind === 'splicer';
        label.textContent = sp ? t('boss.splicer') : t('boss.monolith');
        label.style.color = sp ? 'rgba(120,235,220,0.9)' : 'rgba(190,160,255,0.9)';
        bar.style.borderColor = sp ? 'rgba(45,212,191,0.5)' : 'rgba(150,110,255,0.5)';
        fill.style.background = sp ? 'linear-gradient(90deg,#14b8a6,#5eead4)' : 'linear-gradient(90deg,#8b5cf6,#c084fc)';
      }
    }
  }

  return { sync, wrap };
}
