const fs=require('fs');
let s=fs.readFileSync('.evidence/I535/build_bulwark_v2.py','utf8');
const rep=(old,nw,c)=>{const k=s.split(old).length-1;if(k!==(c||1))throw new Error('occurrence '+k+' for: '+old.slice(0,50));s=k>1?s.split(old).join(nw):s.replace(old,nw);};
rep('import bpy, bmesh, math\r\nEV','import bpy, bmesh, math, mathutils\r\nEV');
rep('"VR_Shield": (2000, 2500),','"VR_Shield": (1850, 2300),');
rep('def hexring(bm, x, r, ph=0.0):','def boxx(bm, cx, cy, cz, sx, sy, sz, rot):\n    vs = []\n    for dx in (-1,1):\n        for dy in (-1,1):\n            for dz in (-1,1):\n                p = mathutils.Vector((dx*sx, dy*sy, dz*sz))\n                p.rotate(mathutils.Euler((rot,0,0)))\n                vs.append(bm.verts.new((cx+p.x, cy+p.y, cz+p.z)))\n    for f in ((0,1,3,2),(4,6,7,5),(0,2,6,4),(1,5,7,3),(0,4,5,1),(2,3,7,6)):\n        try: bm.faces.new([vs[i] for i in f])\n        except ValueError: pass\ndef hexring(bm, x, r, ph=0.0):');
rep('for i in range(6):\n    a0 = (i+0.5)*2.0*math.pi/6; a1 = (i+1.5)*2.0*math.pi/6\n    plate(bm, (-0.04, 0.98*math.cos(a0), 0.98*math.sin(a0)),\n              (-0.04, 0.98*math.cos(a1), 0.98*math.sin(a1)),\n              (-0.04, 0.62*math.cos(a0), 0.62*math.sin(a0)),\n              (-0.04, 0.62*math.cos(a1), 0.62*math.sin(a1)), 5, 3, t=0.012)  # rear gussets',
    'for i in range(6):\n    a = (i+0.5)*2.0*math.pi/6\n    boxx(bm, -0.065, 0.80*math.cos(a), 0.80*math.sin(a), 0.04, 0.14, 0.16, a)  # raised rear gussets');
fs.writeFileSync('.evidence/I535/build_bulwark_v2.py',s);
console.log('GUSSET_FIX_APPLIED');