const fs = require("fs");
const files = ["enemy_phantom.glb", "enemy_hauler.glb", "enemy_bulwark.glb", "enemy_gunship.glb", "enemy_hunter.glb", "enemy_sentry.glb", "enemy_wasp.glb"];
let total = 0;
for (const f of files) {
  const s = fs.statSync("E:/Game/assets/" + f).size;
  total += s;
  console.log(f, s);
}
console.log("4-rebuild subtotal:", 0);
