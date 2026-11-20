const fs = require("fs");
const p = "E:/Game/src/render/screens.js";
let s = fs.readFileSync(p, "latin1");
const old = "    if (continueBtn) {\r\n      continueBtn.textContent = mm.primary.label;\r\n      if (mm.hasContinue) continueBtn.setAttribute('aria-label', mm.primary.aria);";
const neu = "    if (continueBtn) {\r\n      if (mm.hasContinue) {\r\n        continueBtn.textContent = mm.primary.label;\r\n        continueBtn.setAttribute('aria-label', mm.primary.aria);\r\n      }";
let n = s.split(old).length - 1;
if (n !== 1) {
  old = "    if (continueBtn) {\n      continueBtn.textContent = mm.primary.label;\n      if (mm.hasContinue) continueBtn.setAttribute('aria-label', mm.primary.aria);";
  neu = "    if (continueBtn) {\n      if (mm.hasContinue) {\n        continueBtn.textContent = mm.primary.label;\n        continueBtn.setAttribute('aria-label', mm.primary.aria);\n      }";
  n = s.split(old).length - 1;
}
if (n !== 1) { console.error("ANCHOR COUNT " + n); process.exit(1); }
s = s.split(old).join(neu);
fs.writeFileSync(p, s, "latin1");
console.log("I544 refreshMenu continue-label guard applied");