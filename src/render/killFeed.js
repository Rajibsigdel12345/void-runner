// I153: kill feed - a compact, fading list of the most recent kills (top-right HUD).
// Passive display driven by 'kill' events (data: size/golden/boss/kind/mine/drone,
// points, multiplier, overdrive). DOM only; mirrors the panel style of screens.js.
// Reduced motion is honored via the vr-reduced class (no slide-in, no fade).
// aria-hidden: decorative HUD - score popups + game-over stats already carry the data.
import { t } from '../core/strings.js'; // I404: ST-374 strings
export function createKillFeed(root) {
  const MAX = 5;
  const LIFE = 3.0; // seconds an entry stays on screen
  const FADE = 0.45; // last seconds of the life, opacity eases to 0
  const el = document.createElement('div');
  el.id = 'kill-feed';
  el.setAttribute('aria-hidden', 'true');
  el.style.cssText = [
    'position:fixed', 'top:18px', 'right:20px', 'z-index:30',
    'display:none', 'flex-direction:column', 'align-items:flex-end', 'gap:6px',
    'pointer-events:none', 'user-select:none',
    'font-family:"Segoe UI",system-ui,sans-serif', 'text-align:right',
  ].join(';');
  const style = document.createElement('style');
  style.textContent = [
    '@keyframes vrKfIn{0%{opacity:0;transform:translateX(14px)}100%{opacity:1;transform:translateX(0)}}',
    '.vr-kf-row{animation:vrKfIn 0.22s cubic-bezier(0.22,1,0.36,1) both;}',
    '#kill-feed.vr-reduced .vr-kf-row{animation:none !important;}',
    '@media (max-width:620px){#kill-feed{right:12px;top:12px;}}',
  ].join('');
  el.appendChild(style);
  root.appendChild(el);
  let rows = []; // { node, age }
  let visible = false;

  function label(d) {
    if (d.size === 'boss' || d.boss) return d.archon ? t('banner.boss.archon') : d.prime ? t('banner.boss.prime') : (d.kind === 'splicer' ? t('banner.boss.splicer') : t('banner.boss.monolith')); // ST-519 (E75): archon label
    if (d.size === 'warden') return t('feed.warden');
    if (d.size === 'mine') return t('feed.mine');
    if (d.size === 'drone') return t('feed.seeker');
    if (d.size === 'stinger') return t('feed.stinger');
    if (d.size === 'flyer') return t('feed.flyer');
    if (d.size === 'hunter') return t('feed.hunter');
    if (d.size === 'gunship') return t('feed.gunship');
    if (d.size === 'sentry') return t('feed.sentry');
    if (d.size === 'wasp') return t('feed.wasp');
    if (d.size === 'pod') return t('feed.pod');
    if (d.golden) return t('feed.golden_rock');
    const s = String(d.size || 'M').toUpperCase();
    return t('feed.rock',{size:s});
  }
  function color(d) {
    if (d.size === 'boss' || d.boss) return '#ffe08a';
    if (d.size === 'warden') return '#ff9d6d';
    if (d.size === 'stinger') return '#baf3ff';
    if (d.size === 'flyer') return '#ffb3ec';
    if (d.size === 'hunter') return '#ffb088';
    if (d.size === 'gunship') return '#ffc98a';
    if (d.size === 'sentry') return '#ffcf9a';
    if (d.size === 'wasp') return '#d8e86a';
    if (d.size === 'pod') return '#7fd0c0';
    if (d.golden) return '#ffe08a';
    return '#cfe4ff';
  }
  function add(d) {
    if (!visible) return;
    const big = d.size === 'boss' || d.boss || d.size === 'warden';
    const row = document.createElement('div');
    row.className = 'vr-kf-row';
    row.style.cssText = [
      'font-size:calc(' + (big ? 15 : 12) + 'px * var(--vr-fs,1));',
      'font-weight:' + (big ? '800' : '700') + ';',
      'letter-spacing:2px;',
      'color:' + color(d) + ';',
      'padding:3px 10px;',
      'border:1px solid rgba(120,170,255,0.22);',
      'border-radius:8px;',
      'background:rgba(8,14,34,0.72);',
      'text-shadow:0 1px 6px rgba(0,0,0,0.9);',
      'white-space:nowrap;',
    ].join('');
    const m = Math.round((d.multiplier || 1) * 10) / 10; // display round - combo step is 0.1 floats
    const extra = (m >= 2 ? '  x' + m : '') + (d.overdrive ? '  OD' : '');
    row.textContent = label(d) + '  +' + d.points + extra;
    el.appendChild(row);
    rows.push({ node: row, age: 0 });
    if (rows.length > MAX) {
      const old = rows.shift();
      old.node.remove();
    }
  }
  function sync(dt, motionOff) {
    el.classList.toggle('vr-reduced', motionOff === true);
    el.style.display = visible ? 'flex' : 'none';
    if (!visible) return;
    const keep = [];
    for (const r of rows) {
      r.age += dt;
      if (r.age >= LIFE) { r.node.remove(); continue; }
      if (motionOff !== true) {
        r.node.style.opacity = String(Math.max(0, Math.min(1, (LIFE - r.age) / FADE)));
      }
      keep.push(r);
    }
    rows = keep;
  }
  function setVisible(v) {
    visible = !!v;
    el.style.display = visible ? 'flex' : 'none';
  }
  function clear() {
    for (const r of rows) r.node.remove();
    rows = [];
  }
  return { add, sync, setVisible, clear };
}
