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
    if (boss.isCampaignBoss) { wrap.style.opacity = '0'; return; } // ST-456: campaign uses the vertical bar (createBossHealthVertical)
    wrap.style.opacity = '1';
    fill.style.width = (Math.max(0, Math.min(1, boss.hpFrac)) * 100) + '%';
    if (_kind !== (boss.kind + (boss.prime ? ':prime' : '') + (boss.archon ? ':archon' : ''))) { // ST-420: prime shares kind 'monolith' -> composite discriminator; ST-519 (E75): +archon
      _kind = boss.kind + (boss.prime ? ':prime' : '') + (boss.archon ? ':archon' : '');
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

// ST-456 (E64): campaign boss VERTICAL HP bar (right edge) - the endless horizontal bar above is
// hidden while a campaign boss is up. Same variant tinting (monolith purple / splicer teal /
// prime gold), same DOM id pattern (probeable). Shown only for campaign bosses (isCampaignBoss).
export function createBossHealthVertical(root) {
  const wrap = document.createElement('div');
  wrap.id = 'hud-bossbar-v';
  wrap.style.cssText = 'position:fixed;top:50%;right:18px;transform:translateY(-50%);height:220px;max-height:40vh;width:14px;opacity:0;pointer-events:none;transition:opacity 0.25s;z-index:30;';
  const bar = document.createElement('div');
  bar.id = 'hud-bossbar-v-bar';
  bar.style.cssText = 'position:absolute;inset:0;background:rgba(10,8,20,0.65);border:1px solid rgba(150,110,255,0.5);border-radius:7px;overflow:hidden;';
  const fill = document.createElement('div');
  fill.id = 'hud-bossbar-v-fill';
  fill.style.cssText = 'position:absolute;left:0;right:0;bottom:0;height:100%;background:linear-gradient(0deg,#8b5cf6,#c084fc);transition:height 0.1s linear;';
  bar.appendChild(fill);
  wrap.appendChild(bar);
  const label = document.createElement('div');
  label.id = 'hud-bossbar-v-label';
  label.textContent = t('boss.monolith');
  label.style.cssText = 'position:absolute;top:calc(100% + 6px);left:50%;transform:translateX(-50%);white-space:nowrap;font:600 calc(11px * var(--vr-fs,1))/1 system-ui,sans-serif;letter-spacing:0.25em;color:rgba(190,160,255,0.9);';
  wrap.appendChild(label);
  root.appendChild(wrap);

  let _kind = '';
  onLocale(() => { _kind = ''; });
  function sync(boss) {
    if (!boss || !boss.alive || !boss.isCampaignBoss) { wrap.style.opacity = '0'; return; }
    wrap.style.opacity = '1';
    fill.style.height = (Math.max(0, Math.min(1, boss.hpFrac)) * 100) + '%';
    if (_kind !== (boss.kind + (boss.prime ? ':prime' : '') + (boss.archon ? ':archon' : ''))) {
      _kind = boss.kind + (boss.prime ? ':prime' : '') + (boss.archon ? ':archon' : ''); // ST-519 (E75): +archon
      const prime = boss.prime === true;
      const sp = boss.kind === 'splicer';
      const archon = boss.archon === true; // ST-519 (E75): Zenith Spire final boss (violet-indigo identity)
      if (archon) {
        label.textContent = t('boss.archon');
        label.style.color = 'rgba(205,180,255,0.95)';
        bar.style.borderColor = 'rgba(150,120,255,0.6)';
        fill.style.background = 'linear-gradient(0deg,#7c5cff,#c4b5fd)'; // ST-519 (E75): 0deg (sibling match; spec 90deg superseded by house pattern)
      } else if (prime) {
        label.textContent = t('boss.monolith_prime');
        label.style.color = 'rgba(255,214,120,0.95)';
        bar.style.borderColor = 'rgba(255,201,77,0.6)';
        fill.style.background = 'linear-gradient(0deg,#f59e0b,#ffd54d)';
      } else if (sp) {
        label.textContent = t('boss.splicer');
        label.style.color = 'rgba(120,235,220,0.9)';
        bar.style.borderColor = 'rgba(45,212,191,0.5)';
        fill.style.background = 'linear-gradient(0deg,#14b8a6,#5eead4)';
      } else {
        label.textContent = t('boss.monolith');
        label.style.color = 'rgba(190,160,255,0.9)';
        bar.style.borderColor = 'rgba(150,110,255,0.5)';
        fill.style.background = 'linear-gradient(0deg,#8b5cf6,#c084fc)';
      }
    }
  }
  return { sync, wrap };
}
