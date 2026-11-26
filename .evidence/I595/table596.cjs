const fs = require("fs");
const pre = JSON.parse(fs.readFileSync(".evidence/I595/luma_i595_pre.json", "utf8"));
const post = JSON.parse(fs.readFileSync(".evidence/I595/luma_i595_post.json", "utf8"));
const c1 = JSON.parse(fs.readFileSync(".evidence/I595/luma_i595_postc1.json", "utf8"));
const roles = Object.keys(pre.fleet);
console.log("role,backdrop,n,p50(pre),p50(first),p50(c1),hue(pre),hue(c1)");
for (const r of roles) {
  for (const b of ["sky", "floor"]) {
    const a = pre.fleet[r][b], p = post.fleet[r][b], x = c1.fleet[r][b];
    console.log(`${r},${b},${a.n},${a.p50},${p.p50},${x.p50},${a.hue},${x.hue}`);
  }
}
console.log("keys:", Object.keys(pre).join("|"));