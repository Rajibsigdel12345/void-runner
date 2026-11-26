const fs = require('node:fs');
const G = 'tests/assetGlbs.test.js';
let s = fs.readFileSync(G, 'latin1');
const pairs = [
  ["assert.ok(s.matNames.includes('VR_DroneMat'), 'VR_DroneMat material (vestigial - in-code JS material governs)');",
   "assert.ok(s.matNames.includes('VR_Drone'), 'VR_Drone material (I593 v2: VR_ naming without the I508 Mat suffix - vestigial, in-code JS material governs)');"],
  ["assert.ok(s.matNames.includes('VR_Warden_HullMat'), 'VR_Warden_HullMat material (I508; vestigial - in-code JS material governs)');",
   "assert.ok(s.matNames.includes('VR_Warden_Hull'), 'VR_Warden_Hull material (I593 v2: VR_ naming without the I508 Mat suffix - vestigial, in-code JS material governs)');"],
  ["assert.ok(s.matNames.includes('VR_Warden_ArmorMat'), 'VR_Warden_ArmorMat material (I508)');",
   "assert.ok(s.matNames.includes('VR_Warden_Armor'), 'VR_Warden_Armor material (I593 v2: VR_ naming without the I508 Mat suffix)');"],
];
for (const [old, neu] of pairs) {
  const n = s.split(old).length - 1;
  if (n !== 1) { console.error('FAIL count=' + n + ' for ' + old.slice(0, 60)); process.exit(1); }
  s = s.replace(old, neu);
}
fs.writeFileSync(G, s, 'latin1');
console.log('MATERIAL PIN PATCHES APPLIED (3)');