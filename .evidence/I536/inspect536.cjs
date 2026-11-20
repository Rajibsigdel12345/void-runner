const fs=require("fs");
const s=fs.readFileSync("E:/Game/.evidence/I536/i536docs.cjs","latin1");
const BT=String.fromCharCode(96);
let i=-1; const occ=[];
while((i=s.indexOf("4/4 E72 remasters complete",i+1))!==-1)occ.push(i);
console.log("occurrences:",occ.length,occ);
for(const o of occ){
  console.log("=== around",o,"===");
  const seg=s.slice(o-20,o+60);
  console.log(JSON.stringify(seg));
}
console.log("=== last 400 ===");
console.log(JSON.stringify(s.slice(-400)));
