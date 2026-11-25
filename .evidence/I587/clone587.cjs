const fs = require("fs");
let s = fs.readFileSync(".evidence/I584/run_closegate584.cjs", "utf8");
s = s.replace(/I584/g, "I587");
s = s.replace(/CLOSEGATE584/g, "CLOSEGATE587");
fs.writeFileSync(".evidence/I587/run_closegate587.cjs", s, "utf8");
console.log("clone OK");
