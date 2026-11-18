const fs=require("fs");
const b=fs.readFileSync("E:/Game/.evidence/I503/boss_v2.glb");
const bytes=b.length;
const dv=new DataView(b.buffer,b.byteOffset,b.byteLength);
let off=12,binOff=0,jsonLen=0;
while(off<b.length){
  const len=dv.getUint32(off,true);
  const type=dv.getUint32(off+4,true);
  if(type===0x4e4f534a){jsonLen=len;}
  if(type===0x004e4942){binOff=off+8;}
  off+=8+len;
}
const json=JSON.parse(b.slice(20,20+jsonLen).toString("utf8"));
const errs=[];
const nodeNames=(json.nodes||[]).map(n=>n.name);
for(const nm of ["VR_Boss_Hull","VR_Boss_Crown","VR_Boss_Core"]) if(!nodeNames.includes(nm)) errs.push("missing node "+nm);
const matNames=(json.materials||[]).map(m=>m.name);
for(const mn of ["VR_Boss_HullMat","VR_Boss_CrownMat","VR_Boss_CoreMat"]) if(!matNames.includes(mn)) errs.push("missing material "+mn);
let totalTris=0;
const meshB={};
let minX=9e9,maxX=-9e9,minY=9e9,maxY=-9e9,minZ=9e9,maxZ=-9e9;
for(const m of json.meshes||[]){
  for(const p of m.primitives||[]){
    const posAcc=json.accessors[p.attributes.POSITION];
    const pB={minX:9e9,maxX:-9e9,minY:9e9,maxY:-9e9,minZ:9e9,maxZ:-9e9};
    for(let i=0;i<posAcc.count;i++){
      const o=binOff+(json.bufferViews[posAcc.bufferView].byteOffset||0)+(posAcc.byteOffset||0)+i*12;
      const x=b.readFloatLE(o),y=b.readFloatLE(o+4),z=b.readFloatLE(o+8);
      pB.minX=Math.min(pB.minX,x);pB.maxX=Math.max(pB.maxX,x);
      pB.minY=Math.min(pB.minY,y);pB.maxY=Math.max(pB.maxY,y);
      pB.minZ=Math.min(pB.minZ,z);pB.maxZ=Math.max(pB.maxZ,z);
      minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);minZ=Math.min(minZ,z);maxZ=Math.max(maxZ,z);
    }
    meshB[m.name]=pB;
    const ind=json.accessors[p.indices];
    if(ind.componentType!==5123) errs.push(m.name+" index type "+ind.componentType);
    totalTris+=ind.count/3;
    if(p.attributes.COLOR_0===undefined) errs.push(m.name+" missing COLOR_0");
    if(p.attributes.COLOR_1!==undefined) errs.push(m.name+" has COLOR_1");
    if(p.attributes.COLOR_0!==undefined){
      const acc=json.accessors[p.attributes.COLOR_0];
      const stride=parseInt(acc.type.replace("VEC",""),10);
      if(stride<3||stride>4) errs.push(m.name+" color stride "+stride);
      if(acc.count!==posAcc.count) errs.push(m.name+" COLOR_0 count "+acc.count);
      const base=binOff+(json.bufferViews[acc.bufferView].byteOffset||0)+(acc.byteOffset||0);
      let cMin=9e9,cMax=-9e9,gray=true;
      for(let i=0;i<acc.count;i++){
        const r=b.readFloatLE(base+i*stride*4),g=b.readFloatLE(base+i*stride*4+4),bl2=b.readFloatLE(base+i*stride*4+8);
        if(Math.abs(r-g)>0.02||Math.abs(g-bl2)>0.02) gray=false;
        if(r<0.17||r>1.01||g<0.17||g>1.01||bl2<0.17||bl2>1.01) errs.push(m.name+" color out of range at "+i);
        cMin=Math.min(cMin,r);cMax=Math.max(cMax,r);
      }
      pB.cMin=cMin;pB.cMax=cMax;pB.gray=gray;
    }
  }
}
if(totalTris>1500) errs.push("totalTris "+totalTris+" > 1500");
const w=Math.max(maxX-minX,maxZ-minZ);
const h=maxY-minY;
if(Math.abs(w-4.0)>0.40) errs.push("cross-section "+w.toFixed(4));
if(Math.abs(h-9.6)>0.96) errs.push("height "+h.toFixed(4));
if(Math.abs((minX+maxX)/2)>0.5) errs.push("x not centered");
if(Math.abs((minY+maxY)/2)>0.5) errs.push("y not centered");
if(Math.abs((minZ+maxZ)/2)>0.5) errs.push("z not centered");
if(h<=w) errs.push("h <= w");
const core=meshB["VR_Boss_Core"];
const crown=meshB["VR_Boss_Crown"];
if(!(core&&core.minZ>0.3)) errs.push("core.minZ "+(core?core.minZ.toFixed(3):"?")+" not > 0.3");
if(!(core&&core.maxZ>0.5)) errs.push("core.maxZ "+(core?core.maxZ.toFixed(3):"?")+" not > 0.5");
if(!(crown&&crown.minY>0)) errs.push("crown.minY "+(crown?crown.minY.toFixed(3):"?"));
const hull=meshB["VR_Boss_Hull"];
if(!(hull&&hull.cMin<0.30)) errs.push("hull mottling min "+(hull?hull.cMin.toFixed(3):"?")+" not < 0.30");
if(!(hull&&hull.cMax>0.90)) errs.push("hull mottling max "+(hull?hull.cMax.toFixed(3):"?")+" not > 0.90");
for(const k in meshB) if(meshB[k].gray===false) errs.push(k+" not grayscale");
if(bytes>84*1024) errs.push("bytes "+bytes+" > 84KB");
console.log("BYTES ",bytes);
console.log("PER_NODE ",JSON.stringify(meshB));
console.log("TOTAL_TRIS ",totalTris);
console.log("W ",w.toFixed(4),"H ",h.toFixed(4));
if(errs.length){console.log("GATE FAIL");for(const e of errs)console.log(" - ",e);process.exit(1);}
console.log("GATE PASS");