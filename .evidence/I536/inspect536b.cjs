const fs=require("fs");
const s=fs.readFileSync("E:/Game/.evidence/I536/i536docs.cjs","latin1");
const i=s.indexOf("4. timeline.md");
console.log("=== timeline block head ===");
console.log(JSON.stringify(s.slice(i-10,i+420)));
// also list all backtick positions
const BT=String.fromCharCode(96);
let pos=[]; let k=-1;
while((k=s.indexOf(BT,k+1))!==-1)pos.push(k);
console.log("backtick positions:",pos);
for(const p of pos){
  console.log(p, JSON.stringify(s.slice(Math.max(0,p-18),p+10)));
}
