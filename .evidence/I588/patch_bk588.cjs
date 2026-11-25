const fs = require("fs");
let s = fs.readFileSync(".evidence/I588/bookkeep588.cjs", "utf8");
const old = "if (i === -1 || j === -1 || j < h2) throw new Error(\"epics: E83 Status line not in section\");";
const nu = "if (i === -1 || j === -1 || i < h || i >= h2 || j >= h2) throw new Error(\"epics: E83 Status line not in section\");";
if (!s.includes(old)) throw new Error("anchor");
if (s.includes(old, s.indexOf(old) + 1)) throw new Error("not unique");
s = s.replace(old, nu);
fs.writeFileSync(".evidence/I588/bookkeep588.cjs", s, "utf8");
console.log("patched");
