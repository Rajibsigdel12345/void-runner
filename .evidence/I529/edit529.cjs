const fs = require('fs');
const p = 'E:/Game/src/render/bearingStrip.js';
let s = fs.readFileSync(p, 'latin1');
const before = s;
function rep(anchor, repl, label) {
  const n = before.split(anchor).length - 1;
  if (n !== 1) throw new Error('anchor count ' + n + ' != 1: ' + label);
}
rep("  document.body.appendChild(dot);\n", 1, 'dot-append');
rep("      dot.style.opacity = on ? '1' : '0'; // I504 (ST-470): the center dot fades with the cockpit\n", 1, 'dot-opacity');
rep("      dot.style.transition = opts.reducedMotion ? 'none' : 'opacity .3s';\n", 1, 'dot-transition');
rep("  return { update, el: canvas, elDot: dot };\n", 1, 'return');
rep("// Fades with the cockpit mode (opacity only - reduced-motion safe: transition disabled).\n", 1, 'header');

const tickBlock = [
  "  // I529 (ST-495, E71 R-CAM-1): the user asked for a CROSSHAIR, not a plain dot. Keep the",
  "  // dot element + id (smoke504 probes #vr-cockpit-dot's own .style.opacity) and add four",
  "  // short symmetric ticks around it - static CSS shapes (no image, no animation), opacity-",
  "  // only fade (reduced-motion safe), 0 per-frame JS, 0 new 3D draw calls. Each tick toggles",
  "  // its OWN opacity (like the dot); no parent-container opacity gating.",
  "  const mkTick = (w, h, offX, offY) => {",
  "    const t = document.createElement('div');",
  "    t.setAttribute('aria-hidden', 'true');",
  "    t.style.cssText = 'position:fixed;left:50%;top:50%;transform:translate(-50%,-50%) translate(' + offX + 'px,' + offY + 'px);z-index:55;width:' + w + 'px;height:' + h + 'px;background:rgba(235,245,255,0.80);opacity:0;transition:opacity .3s;pointer-events:none;';",
  "    document.body.appendChild(t);",
  "    return t;",
  "  };",
  "  // 11px ticks, 1.5px thick, 3px gap around the 4px dot (dot edge 2px, tick inner edge",
  "  // 5px, tick center 10.5px, tick outer edge 16px from screen center).",
  "  const xhTicks = [mkTick(1.5, 11, 0, -10.5), mkTick(1.5, 11, 0, 10.5), mkTick(11, 1.5, -10.5, 0), mkTick(11, 1.5, 10.5, 0)];",
  "  const xh = [dot].concat(xhTicks); // the crosshair surface: dot + 4 ticks",
  ""
].join('\n');

s = s.replace("  document.body.appendChild(dot);\n", "  document.body.appendChild(dot);\n" + tickBlock);
s = s.replace("      dot.style.opacity = on ? '1' : '0'; // I504 (ST-470): the center dot fades with the cockpit\n", "      for (let i = 0; i < xh.length; i++) xh[i].style.opacity = on ? '1' : '0'; // I504 (ST-470) dot + I529 (ST-495) ticks fade with the cockpit\n");
s = s.replace("      dot.style.transition = opts.reducedMotion ? 'none' : 'opacity .3s';\n", "      for (let i = 0; i < xh.length; i++) xh[i].style.transition = opts.reducedMotion ? 'none' : 'opacity .3s';\n");
s = s.replace("  return { update, el: canvas, elDot: dot };\n", "  return { update, el: canvas, elDot: dot, elTicks: xhTicks };\n");
s = s.replace("// Fades with the cockpit mode (opacity only - reduced-motion safe: transition disabled).\n", "// Fades with the cockpit mode (opacity only - reduced-motion safe: transition disabled).\n// I529 (ST-495, E71 R-CAM-1): the aim indicator is a crosshair (dot + 4 ticks), not a bare dot.\n");

if (s.indexOf('\r') !== -1) throw new Error('CRLF introduced');
fs.writeFileSync(p, s, 'latin1');
console.log('EDIT529 OK bytes', before.length, '->', s.length, 'delta', s.length - before.length);