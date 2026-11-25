const fs = require("fs");
const a = fs.readFileSync(".evidence/I587/bk587a.cjs", "utf8");
const b = fs.readFileSync(".evidence/I587/bk587b.cjs", "utf8");
const c = fs.readFileSync(".evidence/I587/bk587c.cjs", "utf8");
fs.writeFileSync(".evidence/I587/bookkeep587.cjs", a + b + c, "utf8");
console.log("concat OK", (a.length + b.length + c.length));