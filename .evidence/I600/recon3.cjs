const fs = require("fs");
const s = fs.readFileSync(".evidence/I599/probe599.mjs", "latin1");
console.log("len", s.length);
// find how it enters cockpit mode and the key helpers
for (const term of ["V", "camMode", "cockpit", "begin", "dismiss"]) {
  let k = s.indexOf(term);
  const occ = []; let kk = -1;
  while ((kk = s.indexOf(term, kk + 1)) >= 0) occ.push(kk);
  console.log(term, "->", occ.length, "occurrences");
}
console.log(JSON.stringify(s.slice(0, 4200)));
