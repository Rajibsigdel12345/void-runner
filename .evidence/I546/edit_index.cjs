const fs = require("fs");
const P = "index.html";
let src = fs.readFileSync(P, "utf8");
const bom = src.charCodeAt(0) === 0xFEFF;
const NL = src.indexOf("\r\n") >= 0 ? "\r\n" : "\n";
const anchor = "  <link rel=\"apple-touch-icon\" href=\"./public/icon-512.png\" />";
const n = src.split(anchor).length - 1;
if (n !== 1) throw new Error("anchor count " + n + " (want 1)");
const add =
  "  <meta name=\"mobile-web-app-capable\" content=\"yes\" />" + NL +
  "  <meta name=\"apple-mobile-web-app-capable\" content=\"yes\" />" + NL +
  "  <meta name=\"apple-mobile-web-app-status-bar-style\" content=\"black-translucent\" />" + NL +
  "  <meta name=\"apple-mobile-web-app-title\" content=\"Void Runner\" />" + NL +
  "  <meta name=\"description\" content=\"3D arcade space-asteroid shooter. Installable, offline-ready.\" />";
const i = src.indexOf(anchor) + anchor.length;
const rest = src.slice(i);
const nlOffset = rest.indexOf(NL);
const insertAt = i + (nlOffset >= 0 ? nlOffset + NL.length : 0);
src = src.slice(0, insertAt) + add + NL + src.slice(insertAt);
fs.writeFileSync(P, src, "utf8");
console.log("INDEX_DONE bom=" + (src.charCodeAt(0) === 0xFEFF) + " size=" + src.length);