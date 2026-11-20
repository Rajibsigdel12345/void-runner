const fs = require('fs');
const p = 'src/render/screens.js';
let s = fs.readFileSync(p, 'utf8');
function rep(str, from, to, tag) {
  if (!str.includes(from)) { console.error('FATAL: anchor not found: ' + tag); process.exit(1); }
  if (str.includes(to)) { console.error('FATAL: already applied: ' + tag); process.exit(1); }
  return str.replace(from, to);
}
// (a) coarse #vr-pause-btn: add safe-area bottom/right inset (beats the inline style via !important)
s = rep(s,
  '#vr-pause-btn{width:44px !important;height:44px !important}',
  '#vr-pause-btn{width:44px !important;height:44px !important;bottom:calc(16px + env(safe-area-inset-bottom,0px)) !important;right:calc(16px + env(safe-area-inset-right,0px)) !important}',
  'pause-btn safe-area');
// (b) menu padding -> safe-area aware (env() falls back to 0px on desktop = pixel-stable)
s = rep(s,
  "menu.style.padding = '24px 0 18px';",
  "menu.style.padding = 'calc(24px + env(safe-area-inset-top,0px)) 0 calc(18px + env(safe-area-inset-bottom,0px))';",
  'menu safe-area padding');
// (c) rotate hint keyframe (coarse-gated by the hint element existing only on touch)
s = rep(s,
  "'@keyframes vrPulse{0%,100%{opacity:1}50%{opacity:0.35}}',",
  "'@keyframes vrPulse{0%,100%{opacity:1}50%{opacity:0.35}}',\n    '@keyframes vrRotateHint{0%,25%{transform:rotate(0deg)}60%,100%{transform:rotate(90deg)}}',",
  'rotate keyframe');
fs.writeFileSync(p, s, 'utf8');
console.log('screens.js: 3 edits applied');
