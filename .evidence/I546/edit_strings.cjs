const fs = require("fs");
const P = "src/core/strings.js";
let src = fs.readFileSync(P, "utf8");
const bom = src.charCodeAt(0) === 0xFEFF;
const NL = src.indexOf("\r\n") >= 0 ? "\r\n" : "\n";
function toEsc(str){return [...str].map(c=>"\\u"+c.codePointAt(0).toString(16).padStart(4,"0")).join("");}
const zhTxt = fs.readFileSync(".evidence/I546/i18n_ref_zh1.bin", "utf8");
const jaTxt = fs.readFileSync(".evidence/I546/i18n_ref_ja1.bin", "utf8");
const vals = ["'INSTALL APP'", "'" + toEsc(zhTxt) + "'", "'" + toEsc(jaTxt) + "'"]; // en, zh, ja (file order)
const key = "'menu.new_game':";
let offsets = [];
for (let from = 0; ; ) {
  const i = src.indexOf(key, from);
  if (i < 0) break;
  offsets.push(i);
  from = i + key.length;
}
if (offsets.length !== 3) throw new Error("menu.new_game count " + offsets.length + " (want 3)");
for (let k = 2; k >= 0; k--) {
  const keyIdx = offsets[k];
  let lineStart = keyIdx;
  while (lineStart > 0 && src.charCodeAt(lineStart - 1) !== 10) lineStart--; // 10 = \n
  const indent = src.slice(lineStart, keyIdx);
  const lineEnd = src.indexOf(NL, keyIdx);
  const insertAt = lineEnd + NL.length;
  src = src.slice(0, insertAt) + indent + "'menu.install': " + vals[k] + "," + NL + src.slice(insertAt);
}
fs.writeFileSync(P, src, "utf8");
console.log("STRINGS_DONE bom=" + (src.charCodeAt(0) === 0xFEFF) + " install_count=" + (src.split("'menu.install':").length - 1));