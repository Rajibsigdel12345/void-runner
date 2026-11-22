// ST-526 (I560, E76 D4): cockpit instrument cluster - speed / hull / shield arc gauges.
// Procedural 2D canvases, no assets, i18n-free (geometry + single letters only, same
// convention as the ST-444 bearing strip's C/R letters). Fades with the cockpit mode
// (opacity only - reduced-motion safe: transition disabled). 0 new 3D draw calls and
// 0 scene tris: DOM-only, so the playframe/causal pins are untouched.
// Placement is periphery-only (bottom-left + a bottom-right column; never center-frame)
// per the HUD-2 readability research (design/e76-expansion-research.md): instruments
// live out of the fire line, clear of the bearing strip (center, bottom 11%) and the
// screen-center crosshair.
import { CONFIG } from '../core/config.js';

const W = 84;
const H = 72;
const CX = W / 2;        // 42
const CY = 38;
const R = 26;
const A0 = Math.PI * 0.75;  // 135 deg (lower-left)
const A1 = Math.PI * 2.25;  // 405 deg (lower-right) - 270 deg sweep, gap at the bottom
const C_TRACK = 'rgba(207,232,255,0.16)';
const C_SPEED = 'rgb(127,212,255)';    // arena-center cyan (bearing-strip family)
const C_HULL = 'rgb(235,245,255)';     // heading white (hull pips)
const C_HULL_LOW = 'rgb(255,107,87)';  // hit-red (last life = attention)
const C_SHIELD = 'rgb(83,216,255)';    // 0x53d8ff shield cyan (canonical)
const FONT = '10px ui-monospace,monospace';
const BASE_CSS = 'position:fixed;width:' + W + 'px;height:' + H + 'px;z-index:55;opacity:0;transition:opacity .3s;pointer-events:none;scale:var(--vr-fs,1);';

function mkGauge(id, css) {
  const dpr = Math.min(2, (typeof window !== 'undefined' && window.devicePixelRatio) || 1);
  const canvas = document.createElement('canvas');
  canvas.id = id;
  canvas.setAttribute('aria-hidden', 'true');
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  canvas.style.cssText = BASE_CSS + css;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  return { canvas, ctx };
}

function drawTrack(ctx) {
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.strokeStyle = C_TRACK;
  ctx.beginPath();
  ctx.arc(CX, CY, R, A0, A1);
  ctx.stroke();
}

function drawLetter(ctx, letter, color) {
  ctx.font = FONT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(letter, CX, CY + 1);
}

// speed: continuous fill 0..1 of the 270 deg arc, letter "V" (velocity)
function drawSpeed(ctx, frac) {
  ctx.clearRect(0, 0, W, H);
  drawTrack(ctx);
  if (frac > 0.004) {
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = C_SPEED;
    ctx.beginPath();
    ctx.arc(CX, CY, R, A0, A0 + (A1 - A0) * frac);
    ctx.stroke();
  }
  drawLetter(ctx, 'V', frac > 0.004 ? 'rgba(127,212,255,0.9)' : C_TRACK);
}

// hull: maxLives segmented pips (small gaps), lit count = lives from the A0 end;
// the LAST pip is the first consumed; ember-red while only one life remains.
function drawHull(ctx, lives, maxLives) {
  ctx.clearRect(0, 0, W, H);
  const sweep = A1 - A0;
  const gap = 0.14;
  const seg = (sweep - gap * (maxLives - 1)) / maxLives;
  for (let i = 0; i < maxLives; i++) {
    const s = A0 + i * (seg + gap);
    const lit = i < lives;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = lit ? (lives <= 1 ? C_HULL_LOW : C_HULL) : C_TRACK;
    ctx.beginPath();
    ctx.arc(CX, CY, R, s, s + seg);
    ctx.stroke();
  }
  drawLetter(ctx, 'H', lives > 0 ? (lives <= 1 ? 'rgba(255,107,87,0.9)' : 'rgba(235,245,255,0.85)') : C_TRACK);
}

// shield: continuous fill while shielding (remaining time fraction); track only
// when down, letter dimmed.
function drawShield(ctx, shielding, frac) {
  ctx.clearRect(0, 0, W, H);
  drawTrack(ctx);
  if (shielding && frac > 0.004) {
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = C_SHIELD;
    ctx.beginPath();
    ctx.arc(CX, CY, R, A0, A0 + (A1 - A0) * frac);
    ctx.stroke();
  }
  drawLetter(ctx, 'S', shielding && frac > 0.004 ? 'rgba(83,216,255,0.9)' : 'rgba(83,216,255,0.35)');
}

export function createGauges() {
  const speed = mkGauge('vr-gauge-speed', 'left:2%;bottom:3%;transform-origin:left bottom;');
  const hull = mkGauge('vr-gauge-hull', 'right:2%;bottom:3%;transform-origin:right bottom;');
  const shield = mkGauge('vr-gauge-shield', 'right:2%;bottom:calc(3% + 80px);transform-origin:right bottom;');
  const els = [speed.canvas, hull.canvas, shield.canvas];
  let visible = false;
  let lastRM = null;

  function update(opts) {
    const on = !!opts.on;
    if (on !== visible) {
      visible = on;
      for (let i = 0; i < els.length; i++) els[i].style.opacity = on ? '1' : '0';
    }
    if (opts.reducedMotion !== lastRM) {
      lastRM = opts.reducedMotion;
      for (let i = 0; i < els.length; i++) els[i].style.transition = opts.reducedMotion ? 'none' : 'opacity .3s';
    }
    if (on) {
      drawSpeed(speed.ctx, opts.speedFrac);
      drawHull(hull.ctx, opts.lives, opts.maxLives);
      drawShield(shield.ctx, opts.shielding, opts.shieldFrac);
    }
  }

  return { update, elSpeed: speed.canvas, elHull: hull.canvas, elShield: shield.canvas };
}
