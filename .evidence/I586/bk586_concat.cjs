const fs = require("fs");
const a = fs.readFileSync(".evidence/I586/bk586a.cjs", "utf8");
const b = fs.readFileSync(".evidence/I586/bk586b.cjs", "utf8");
const c = fs.readFileSync(".evidence/I586/bk586c.cjs", "utf8");
fs.writeFileSync(".evidence/I586/bookkeep586.cjs", a + b + c, "utf8");
console.log("concat OK", (a.length + b.length + c.length));
