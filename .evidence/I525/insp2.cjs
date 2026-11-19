const fs = require("fs");
const j = JSON.parse(fs.readFileSync(".evidence/I525/sweep525.json", "latin1"));
for (const r of j.runs) console.log("seed " + r.seed + " bossDeaths:", JSON.stringify(r.bossDeaths));