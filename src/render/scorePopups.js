// ST-030: floating score popups at kill positions. DOM overlay, no assets.
// Pooled divs reprojected each frame so they track the follow-camera.
import * as THREE from 'three';

export function createScorePopups(root, camera) {
  const POOL = 12;
  const DUR = 0.9;
  const RISE = 40; // px of float-up over the lifetime
  const scratch = new THREE.Vector3();
  const els = [];
  const items = [];

  for (let i = 0; i < POOL; i++) {
    const el = document.createElement('div');
    el.style.cssText = [
      'position:fixed', 'z-index:9', 'pointer-events:none', 'user-select:none',
      'font-family:"Segoe UI",system-ui,sans-serif', 'font-weight:800',
      'font-size:15px', 'letter-spacing:1px', 'color:#cfe4ff',
      'text-shadow:0 2px 8px rgba(0,0,0,0.9)',
      'transform:translate(-50%,-50%)', 'opacity:0', 'white-space:nowrap',
    ].join(';');
    root.appendChild(el);
    els.push(el);
    items.push({ t: 0, x: 0, y: 0, active: false, big: false, gold: false });
  }

  // add(x, y, text, {big}): world coords, y is the arena z axis.
  function add(x, y, text, opts) {
    let it = null;
    for (const o of items) if (!o.active) { it = o; break; }
    if (!it) { // pool exhausted: recycle the oldest
      it = items[0];
      for (const o of items) if (o.t > it.t) it = o;
    }
    it.x = x; it.y = y; it.t = 0; it.active = true; it.big = !!(opts && opts.big); it.gold = !!(opts && opts.gold);
    const el = els[items.indexOf(it)];
    el.textContent = text;
    el.style.fontSize = it.big ? '22px' : '15px';
    el.style.color = it.gold ? '#ffe27a' : it.big ? '#ffd27a' : '#cfe4ff';
  }

  function clear() {
    for (const it of items) it.active = false;
    for (const el of els) el.style.opacity = '0';
  }

  // sync(dt, motionOff): advance ages and reproject active popups.
  function sync(dt, motionOff) {
    let any = false;
    for (const it of items) { if (it.active) { any = true; break; } }
    if (!any) return;
    camera.updateMatrixWorld();
    camera.matrixWorldInverse.copy(camera.matrixWorld).invert();
    const w = window.innerWidth, h = window.innerHeight;
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it.active) continue;
      it.t += dt;
      const el = els[i];
      if (it.t >= DUR) { it.active = false; el.style.opacity = '0'; continue; }
      scratch.set(it.x, 0.5, it.y).project(camera);
      if (scratch.z > 1) { el.style.opacity = '0'; continue; } // behind camera
      const sx = (scratch.x * 0.5 + 0.5) * w;
      const sy = (-scratch.y * 0.5 + 0.5) * h;
      const p = it.t / DUR;
      const rise = motionOff ? 0 : RISE * p;
      el.style.left = sx.toFixed(1) + 'px';
      el.style.top = (sy - rise).toFixed(1) + 'px';
      el.style.opacity = p < 0.55 ? '1' : String(Math.max(0, (1 - p) / 0.45));
    }
  }

  return { add, clear, sync, els };
}
