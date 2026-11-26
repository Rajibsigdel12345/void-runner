const fs = require("fs");
const mod = `// ST-565 (I600, E86): cockpit interior frame - the "sitting in the cockpit" DOM chrome.
// One fixed div, static CSS only (7 background layers: 2 dashboard-band hairline
// edges + 2 dashboard bands + 2 canopy corner struts + a faint top canopy vignette),
// z-index 40 (behind the HUD's z 55 so the bearing strip / gauges / crosshair stay
// on top and legible), fades with the cockpit mode (opacity only; the transition is
// disabled under reduced motion - the same pattern as the ST-444 bearing strip and
// the ST-526 gauges). Per risk R2 the bottom dashboard band is a LEFT + RIGHT pair
// with a transparent center, so the bearing strip (bottom-center, bottom 11%) stays
// clean and the bow (3D, screen-center) is not tinted. 0 new 3D draw calls and 0
// scene tris: the playframe/causal pins are untouched. 0 per-frame JS after the
// fade: update() touches the DOM only on a mode change or a reduced-motion change.
export function createCockpitFrame() {
  const el = document.createElement('div');
  el.id = 'vr-cockpit-frame';
  el.setAttribute('aria-hidden', 'true');
  el.style.cssText =
    'position:fixed;inset:0;z-index:40;opacity:0;transition:opacity .3s;pointer-events:none;' +
    'background:' +
    'linear-gradient(to top, rgba(127,212,255,0) 93%, rgba(127,212,255,0.10) 98%, rgba(127,212,255,0) 100%) left bottom / 40% 15% no-repeat,' +
    'linear-gradient(to top, rgba(127,212,255,0) 93%, rgba(127,212,255,0.10) 98%, rgba(127,212,255,0) 100%) right bottom / 40% 15% no-repeat,' +
    'linear-gradient(112deg, rgba(13,19,33,0) 42%, rgba(13,19,33,0.50) 46%, rgba(13,19,33,0.50) 52%, rgba(13,19,33,0) 57%) left bottom / 46% 62% no-repeat,' +
    'linear-gradient(-112deg, rgba(13,19,33,0) 42%, rgba(13,19,33,0.50) 46%, rgba(13,19,33,0.50) 52%, rgba(13,19,33,0) 57%) right bottom / 46% 62% no-repeat,' +
    'linear-gradient(to top, rgba(9,14,25,0.85) 0, rgba(9,14,25,0.45) 6%, rgba(9,14,25,0) 100%) left bottom / 40% 15% no-repeat,' +
    'linear-gradient(to top, rgba(9,14,25,0.85) 0, rgba(9,14,25,0.45) 6%, rgba(9,14,25,0) 100%) right bottom / 40% 15% no-repeat,' +
    'linear-gradient(to bottom, rgba(7,11,20,0.40) 0, rgba(7,11,20,0) 100%) top / 100% 9% no-repeat';
  document.body.appendChild(el);
  let visible = false;
  let lastRM = null;

  function update(opts) {
    const on = !!opts.on;
    if (on !== visible) { visible = on; el.style.opacity = on ? '1' : '0'; }
    if (opts.reducedMotion !== lastRM) { lastRM = opts.reducedMotion; el.style.transition = opts.reducedMotion ? 'none' : 'opacity .3s'; }
  }

  return { update, el };
}
`;
fs.writeFileSync("src/render/cockpitFrame.js", mod, "latin1");
console.log("wrote src/render/cockpitFrame.js", mod.length, "B");

// ---- main.js wiring: 3 splices, anchor count===1 each ----
const p = "src/main.js";
let s = fs.readFileSync(p, "latin1");
const splices = [
  { anchor: "import { createGauges } from './render/gauges.js'; // ST-526 (I560, E76 D4): cockpit instrument cluster - speed/hull/shield arc gauges (3 DOM canvases, 0 new 3D draw calls)\r\n",
    ins: "import { createCockpitFrame } from './render/cockpitFrame.js'; // ST-565 (I600, E86): cockpit interior frame (DOM chrome; 0 new 3D draw calls)\r\n" },
  { anchor: "const gauges = createGauges(); // ST-526 (I560, E76 D4): cockpit instrument cluster (DOM canvas overlay; 0 new 3D draw calls)\r\n",
    ins: "const cockpitFrame = createCockpitFrame(); // ST-565 (I600, E86): cockpit interior frame (DOM overlay; 0 new 3D draw calls)\r\n" },
  { anchor: "gauges.update({ on: st === STATE.PLAYING && camMode === 'cockpit', speedFrac: spdFrac, lives: world.lives, maxLives: CONFIG.ship.lives, shielding: world.powerups.isShielding(), shieldFrac: world.powerups.timeLeft.shield / CONFIG.powerup.types.shield.dur, reducedMotion: motionOff }); // ST-526 (I560): cockpit gauges (DOM canvas, 0 3D draw calls)\r\n",
    ins: "  cockpitFrame.update({ on: st === STATE.PLAYING && camMode === 'cockpit', reducedMotion: motionOff }); // ST-565 (I600, E86): cockpit interior frame (fades with the mode; 0 3D draw calls)\r\n" },
];
for (const sp of splices) {
  const n = s.split(sp.anchor).length - 1;
  if (n !== 1) throw new Error("anchor count " + n + " != 1: " + sp.anchor.slice(0, 70));
  const i = s.indexOf(sp.anchor);
  s = s.slice(0, i + sp.anchor.length) + sp.ins + s.slice(i + sp.anchor.length);
}
fs.writeFileSync(p, s, "latin1");
console.log("main.js 3 splices OK, len", s.length);
