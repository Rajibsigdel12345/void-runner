const fs = require("fs");
const m = fs.readFileSync("src/main.js", "latin1");
let i = 0; let n = 0;
while(true){ i = m.indexOf("chaseTargets", i); if(i<0) break; n++;
  const ls = m.lastIndexOf("\n", i) + 1;
  console.log("--- hit " + n + " (line approx " + m.slice(0,i).split("\n").length + ") ---");
  console.log(m.slice(Math.max(0,i-700), i+400));
  i += 10;
}
console.log("TOTAL chaseTargets refs: " + n);