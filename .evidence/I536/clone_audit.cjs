const fs = require("fs");
const p = "E:/Game/.evidence/I535/audit_bulwark_v2.py";
let s = fs.readFileSync(p, "utf8");
s = s.split("I535").join("I536");
s = s.split("bulwark_v2").join("gunship_v2");
s = s.split("v2_bulwark_").join("v2_gunship_");
const tintOld = "(0xaa/255, 0x3c/255, 0x96/255, 1.0)";
const tintNew = "(0x33/255, 0x45/255, 0x50/255, 1.0)";
if (!s.includes(tintOld)) { console.error("TINT NOT FOUND"); process.exit(1); }
s = s.split(tintOld).join(tintNew);
fs.writeFileSync("E:/Game/.evidence/I536/audit_gunship_v2.py", s);
console.log("AUDIT_CLONE_OK bytes=" + Buffer.byteLength(s));
