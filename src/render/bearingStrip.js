// ST-444 (I477): cockpit-only bearing strip - the orientation aid for the non-slewable
// first-person seat (S8: a 2D UI suffices; no 3D cockpit interior, 0 new 3D draw calls).
// Procedural 2D canvas, no assets, i18n-free (geometry + single letters only).
// Fades with the cockpit mode (opacity only - reduced-motion safe: transition disabled).
// I529 (ST-495, E71 R-CAM-1): the aim indicator is a crosshair (dot + 4 ticks), not a bare dot.
import { relBearing, nearestRim, centerVisible } from '../core/bearing.js';

const W = 260;
const H = 64;
const CX = W / 2; // 130 - the ship heading always sits at the center
const SPAN = 120; // half-width of the arc in px (covers +-180 deg of relative bearing)
const Y0 = 44; // arc height at the center
const YK = 12 / (SPAN * SPAN); // parabola k: y = Y0 + (x-CX)^2 * YK (bulges to 56 at the ends)
const C_CENTER = 'rgb(127,212,255)'; // arena-center marker
const C_RIM = 'rgb(255,210,127)'; // nearest-rim marker
const C_TICK = 'rgba(207,232,255,0.40)';
const C_TICK_MAJ = 'rgba(207,232,255,0.75)';
const C_ARC = 'rgba(207,232,255,0.35)';
const C_HEADING = 'rgba(235,245,255,0.95)';
const MIN_DIST = 0.5; // below this (at the arena center) the center/nearest-rim bearings are undefined

function yAt(x) {
  const d = x - CX;
  return Y0 + d * d * YK;
}

export function createBearingStrip() {
  const dpr = Math.min(2, (typeof window !== 'undefined' && window.devicePixelRatio) || 1);
  const canvas = document.createElement('canvas');
  canvas.id = 'vr-bearing-strip';
  canvas.setAttribute('aria-hidden', 'true');
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  canvas.style.cssText = 'position:fixed;left:50%;bottom:11%;transform:translateX(-50%) scale(var(--vr-fs,1));z-index:55;width:' + W + 'px;height:' + H + 'px;opacity:0;transition:opacity .3s;pointer-events:none;';
  document.body.appendChild(canvas);
  const dot = document.createElement('div'); // I504 (ST-470): small screen-center aiming dot (replaces the 3D fire-line in cockpit)
  dot.id = 'vr-cockpit-dot';
  dot.setAttribute('aria-hidden', 'true');
  dot.style.cssText = 'position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:55;width:4px;height:4px;border-radius:50%;background:rgba(235,245,255,0.85);box-shadow:0 0 4px rgba(127,212,255,0.6);opacity:0;transition:opacity .3s;pointer-events:none;';
  document.body.appendChild(dot);
  // I529 (ST-495, E71 R-CAM-1): the user asked for a CROSSHAIR, not a plain dot. Keep the
  // dot element + id (smoke504 probes #vr-cockpit-dot's own .style.opacity) and add four
  // short symmetric ticks around it - static CSS shapes (no image, no animation), opacity-
  // only fade (reduced-motion safe), 0 per-frame JS, 0 new 3D draw calls. Each tick toggles
  // its OWN opacity (like the dot); no parent-container opacity gating.
  const mkTick = (w, h, offX, offY) => {
    const t = document.createElement('div');
    t.setAttribute('aria-hidden', 'true');
    t.style.cssText = 'position:fixed;left:50%;top:50%;transform:translate(-50%,-50%) translate(' + offX + 'px,' + offY + 'px);z-index:55;width:' + w + 'px;height:' + h + 'px;background:rgba(235,245,255,0.80);opacity:0;transition:opacity .3s;pointer-events:none;';
    document.body.appendChild(t);
    return t;
  };
  // 11px ticks, 1.5px thick, 3px gap around the 4px dot (dot edge 2px, tick inner edge
  // 5px, tick center 10.5px, tick outer edge 16px from screen center).
  const xhTicks = [mkTick(1.5, 11, 0, -10.5), mkTick(1.5, 11, 0, 10.5), mkTick(11, 1.5, -10.5, 0), mkTick(11, 1.5, 10.5, 0)];
  const xh = [dot].concat(xhTicks); // the crosshair surface: dot + 4 ticks
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  const rimOut = { x: 0, y: 0, ok: false };
  let visible = false;
  let lastRM = null;

  function drawMarker(rel, color, letter) {
    let x = CX - (rel / Math.PI) * SPAN; // +rel (target LEFT of the heading) -> left of center
    if (x < CX - SPAN + 4) x = CX - SPAN + 4;
    if (x > CX + SPAN - 4) x = CX + SPAN - 4;
    const y = yAt(x);
    ctx.fillStyle = color;
    ctx.beginPath(); // diamond pointing down at the arc
    ctx.moveTo(x, y - 12);
    ctx.lineTo(x + 5, y - 6);
    ctx.lineTo(x, y - 2);
    ctx.lineTo(x - 5, y - 6);
    ctx.closePath();
    ctx.fill();
    ctx.font = '9px ui-monospace,monospace';
    ctx.textAlign = 'center';
    ctx.fillText(letter, x, y - 16);
  }

  function drawFrame(shipX, shipZ, fwdX, fwdZ, arenaR) {
    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = C_ARC; // the arc (parabola)
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i <= 24; i++) {
      const x = CX - SPAN + (i / 24) * 2 * SPAN;
      const y = yAt(x);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    for (let d = -180; d <= 180; d += 15) { // ticks every 15 deg, majors every 45
      const x = CX - (d / 180) * SPAN;
      const y = yAt(x);
      const maj = d % 45 === 0;
      ctx.strokeStyle = maj ? C_TICK_MAJ : C_TICK;
      ctx.lineWidth = maj ? 1.5 : 1;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y - (maj ? 9 : 5));
      ctx.stroke();
    }
    const yC = yAt(CX); // heading caret - fixed at the center ("you are looking this way")
    ctx.fillStyle = C_HEADING;
    ctx.beginPath();
    ctx.moveTo(CX, yC + 10);
    ctx.lineTo(CX + 5, yC + 1);
    ctx.lineTo(CX - 5, yC + 1);
    ctx.closePath();
    ctx.fill();
    if (centerVisible(shipX, shipZ, MIN_DIST)) {
      drawMarker(relBearing(shipX, shipZ, fwdX, fwdZ, 0, 0), C_CENTER, 'C');
    }
    if (nearestRim(shipX, shipZ, arenaR, rimOut, MIN_DIST).ok) {
      drawMarker(relBearing(shipX, shipZ, fwdX, fwdZ, rimOut.x, rimOut.y), C_RIM, 'R');
    }
  }

  function update(opts) {
    const on = !!opts.on;
    if (on !== visible) {
      visible = on;
      canvas.style.opacity = on ? '1' : '0';
      for (let i = 0; i < xh.length; i++) xh[i].style.opacity = on ? '1' : '0'; // I504 (ST-470) dot + I529 (ST-495) ticks fade with the cockpit
    }
    if (opts.reducedMotion !== lastRM) {
      lastRM = opts.reducedMotion;
      canvas.style.transition = opts.reducedMotion ? 'none' : 'opacity .3s';
      for (let i = 0; i < xh.length; i++) xh[i].style.transition = opts.reducedMotion ? 'none' : 'opacity .3s';
    }
    if (on) drawFrame(opts.shipX, opts.shipZ, opts.fwdX, opts.fwdZ, opts.arenaR);
  }

  return { update, el: canvas, elDot: dot, elTicks: xhTicks };
}
