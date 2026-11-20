const fs = require("fs");
const P = "src/main.js";
let src = fs.readFileSync(P, "utf8");
const bom = src.charCodeAt(0) === 0xFEFF;
const NL = src.indexOf("\r\n") >= 0 ? "\r\n" : "\n";
function count(s, a) { return s.split(a).length - 1; }
function insertAfter(s, anchor, add) {
  if (count(s, anchor) !== 1) throw new Error("anchor count " + count(s, anchor) + " (want 1) :: " + anchor);
  const i = s.indexOf(anchor) + anchor.length;
  const rest = s.slice(i);
  const nlOffset = rest.indexOf(NL);
  const insertAt = i + (nlOffset >= 0 ? nlOffset + NL.length : 0); // start of the line after the anchor line
  return s.slice(0, insertAt) + add + NL + s.slice(insertAt);
}
function replaceOnce(s, from, to) {
  if (count(s, from) !== 1) throw new Error("anchor count " + count(s, from) + " (want 1) :: " + from);
  return s.replace(from, to);
}
// 1) import
src = insertAfter(src, "import { createRotateHint } from './render/rotateHint.js';",
  "import { createInstallButton } from './render/installPrompt.js'; // ST-512 (I546, E74 D4): PWA install affordance (beforeinstallprompt + menu gated)");
// 2) create + setLabel + onLocale
src = insertAfter(src, "onLocale(() => rotateHint.setLabel(tr('ui.rotate_hint')));",
  "const installPrompt = createInstallButton(document.body); // ST-512 (I546, E74 D4): PWA install affordance (body overlay; beforeinstallprompt + menu gated)" + NL +
  "installPrompt.setLabel(tr('menu.install')); // i18n label (en/zh/ja)" + NL +
  "onLocale(() => installPrompt.setLabel(tr('menu.install'))); // ST-375: live re-emit");
// 3) feed the menu-visible flag in the frame loop
src = insertAfter(src, "screens.update(st, world, screenOpts);",
  "installPrompt.setMenuVisible(st === STATE.MENU); // ST-512 (I546, E74 D4): install button only on the menu (no-op guard keeps per-frame free)");
// 4) expose on window.__vr
src = replaceOnce(src, "input, rotateHint, stickGeom", "input, rotateHint, installPrompt, stickGeom");
fs.writeFileSync(P, src, "utf8");
console.log("MAIN_EDITS_DONE bom=" + (src.charCodeAt(0) === 0xFEFF) + " nl=" + (NL === "\r\n" ? "CRLF" : "LF") + " size=" + src.length);