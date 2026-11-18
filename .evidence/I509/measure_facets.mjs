import fs from "node:fs";
function load(p){
  const b = fs.readFileSync(p);
  const jsonLen = b.readUInt32LE(12);
  const json = JSON.parse(b.subarray(20, 20 + jsonLen).toString("utf8"));
  let off = 12, binOff = -1;
  while (off < b.length) { const len = b.readUInt32LE(off); const type = b.readUInt32LE(off+4); if (type === 0x004e4942) binOff = off+8; off += 8 + len; }
  return { b, json, binOff };
}
function primLuma({ b, json, binOff }, prim){
  const cAcc = json.accessors[prim.attributes.COLOR_0];
  const iAcc = json.accessors[prim.indices];
  const cBase = binOff + (json.bufferViews[cAcc.bufferView].byteOffset||0) + (cAcc.byteOffset||0);
  const iBase = binOff + (json.bufferViews[iAcc.bufferView].byteOffset||0) + (iAcc.byteOffset||0);
  const readIdx = (i)=> (iAcc.componentType===5123? b.readUInt16LE(iBase+i*2) : iAcc.componentType===5125? b.readUInt32LE(iBase+i*4) : b.readUInt8(iBase+i));
  const lum = (i)=>{ const o=cBase+i*12; return 0.2126*b.readFloatLE(o)+0.7152*b.readFloatLE(o+4)+0.0722*b.readFloatLE(o+8); };
  const fl=[];
  for(let t=0;t<iAcc.count/3;t++){ const i0=readIdx(t*3),i1=readIdx(t*3+1),i2=readIdx(t*3+2); fl.push((lum(i0)+lum(i1)+lum(i2))/3); }
  fl.sort((a,c)=>a-c);
  const q=(f)=>fl[Math.min(fl.length-1,Math.floor(f*fl.length))];
  return { p10:q(0.1), p50:q(0.5), p90:q(0.9), min:fl[0], max:fl[fl.length-1] };
}
function primExtents({ b, json, binOff }, m){
  const pos = json.accessors[m.primitives[0].attributes.POSITION];
  const bv = json.bufferViews[pos.bufferView];
  let minx=1/0,maxx=-1/0,miny=1/0,maxy=-1/0,minz=1/0,maxz=-1/0;
  for(let i=0;i<pos.count;i++){ const o=binOff+(bv.byteOffset||0)+(pos.byteOffset||0)+i*12; const x=b.readFloatLE(o),y=b.readFloatLE(o+4),z=b.readFloatLE(o+8); if(x<minx)minx=x; if(x>maxx)maxx=x; if(y<miny)miny=y; if(y>maxy)maxy=y; if(z<minz)minz=z; if(z>maxz)maxz=z; }
  return { x:maxx-minx, y:maxy-miny, z:maxz-minz, cx:(minx+maxx)/2, cz:(minz+maxz)/2 };
}
for (const f of ["hunter","gunship","sentry","wasp"]) {
  const { b, json, binOff } = load("E:/Game/.evidence/I509/"+f+".glb");
  console.log("\n==== "+f+" ====");
  let gmin=1/0, gmax=-1/0;
  for (const m of json.meshes||[]){
    for (const pr of m.primitives||[]){
      const tris = Math.round((pr.indices!=null? json.accessors[pr.indices].count : json.accessors[pr.attributes.POSITION].count)/3);
      const name = m.name||"?";
      if (pr.attributes.COLOR_0!==undefined){
        const L = primLuma({b,json,binOff}, pr);
        if(L.min<gmin)gmin=L.min; if(L.max>gmax)gmax=L.max;
        console.log(name, "tris="+tris, "p10="+L.p10.toFixed(4), "p50="+L.p50.toFixed(4), "p90="+L.p90.toFixed(4), "spread="+(L.p90-L.p10).toFixed(4), "luma["+L.min.toFixed(4)+","+L.max.toFixed(4)+"]");
      } else console.log(name, "tris="+tris, "(no COLOR_0)");
      const E = primExtents({b,json,binOff}, m);
      console.log("   ext x="+E.x.toFixed(4)+" y="+E.y.toFixed(4)+" z="+E.z.toFixed(4)+" cx="+E.cx.toFixed(4)+" cz="+E.cz.toFixed(4));
    }
  }
  console.log("FILE COLOR_0 luma domain: ["+gmin.toFixed(4)+", "+gmax.toFixed(4)+"]");
}