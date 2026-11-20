const fs=require('fs');
let s=fs.readFileSync('.evidence/I535/build_bulwark_v2.py','utf8');
const rep=(old,nw,c)=>{const k=s.split(old).length-1;if(k!==(c||1))throw new Error('occurrence '+k+' for: '+old.slice(0,50));s=k>1?s.split(old).join(nw):s.replace(old,nw);};
rep('import bpy, bmesh, math\r\nEV','import bpy, bmesh, math, mathutils\r\nEV');
rep('"VR_Shield": (2000, 2500),','"VR_Shield": (1850, 2300),');
const boxx=['def boxx(bm, cx, cy, cz, sx, sy, sz, rot):','    vs = []','    for dx in (-1,1):','        for dy in (-1,1):','            for dz in (-1,1):','                p = mathutils.Vector((dx*sx, dy*sy, dz*sz))','                p.rotate(mathutils.Euler((rot,0,0)))','                vs.append(bm.verts.new((cx+p.x, cy+p.y, cz+p.z)))','    for f in ((0,1,3,2),(4,6,7,5),(0,2,6,4),(1,5,7,3),(0,4,5,1),(2,3,7,6)):','        try: bm.faces.new([vs[i] for i in f])','        except ValueError: pass',''].join('\r\n');
rep('def hexring(bm, x, r, ph=0.0):', boxx + 'def hexring(bm, x, r, ph=0.0):');
fs.writeFileSync('.evidence/I535/build_bulwark_v2.py',s);
console.log('ALL_FIXES_APPLIED');