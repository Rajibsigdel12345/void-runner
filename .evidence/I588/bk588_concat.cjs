const fs = require("fs");
const a = fs.readFileSync(".evidence/I588/bk588a.cjs", "utf8");
const b = fs.readFileSync(".evidence/I588/bk588b.cjs", "utf8");
fs.writeFileSync(".evidence/I588/bookkeep588.cjs", a + b, "utf8");
console.log("concat", (a + b).length, "B");
