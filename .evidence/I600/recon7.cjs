const fs = require("fs");
// fix runner label
const p = ".evidence/I600/run_regression600.cjs";
let s = fs.readFileSync(p, "latin1");
if (s.includes("REGRESSION599 PASS")) {
  const i = s.indexOf("REGRESSION599 PASS");
  s = s.slice(0, i) + "REGRESSION600 PASS" + s.slice(i + "REGRESSION599 PASS".length);
  fs.writeFileSync(p, s, "latin1");
  console.log("runner label fixed");
}
// full ST-565 stories line
const st = fs.readFileSync("production/stories.md", "latin1");
const a = st.indexOf("- ST-565 E86 cockpit interior frame DOM");
const b = st.indexOf("\n", a);
console.log("ST-565 line:");
console.log(JSON.stringify(st.slice(a, b + 1)));
