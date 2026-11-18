import bpy, bmesh, math, mathutils
OUT=r"E:/Game/.evidence/I503/boss_v2.glb"
bpy.ops.wm.read_factory_settings(use_empty=True)
S=6
def new_obj(name,me):
    ob=bpy.data.objects.new(name,me)
    bpy.context.scene.collection.objects.link(ob)
    return ob
def ring(bm,y,r):
    vs=[]
    for i in range(S):
        a=i*2.0*math.pi/S
        vs.append(bm.verts.new((r*math.cos(a),y,r*math.sin(a))))
    return vs
def box(bm,cx,cy,cz,sx,sy,sz):
    vs=[]
    for dx in (-1,1):
        for dy in (-1,1):
            for dz in (-1,1):
                vs.append(bm.verts.new((cx+dx*sx,cy+dy*sy,cz+dz*sz)))
    for f in ((0,1,3,2),(4,6,7,5),(0,2,6,4),(1,5,7,3),(0,4,5,1),(2,3,7,6)):
        try:
            bm.faces.new([vs[i] for i in f])
        except ValueError:
            pass
def spike(bm,cx,cy,cz,nx,nz,r,h,sides):
    base=[]
    for i in range(sides):
        a=i*2.0*math.pi/sides
        base.append(bm.verts.new((cx+r*math.cos(a),cy,cz+r*math.sin(a))))
    tip=bm.verts.new((cx+nx*h,cy,cz+nz*h))
    for i in range(sides):
        j=(i+1)%sides
        bm.faces.new((base[i],base[j],tip))
    bm.faces.new(tuple(reversed(base)))
yB,yM,yT=-4.35,0.0,3.30
r_base,r_mid,r_top=2.11,1.95,1.80
def r_at(y):
    if y<0.0:
        t=(y-yB)/(yM-yB); return r_base+(r_mid-r_base)*t
    t=(y-yM)/(yT-yM); return r_mid+(r_top-r_mid)*t
bm=bmesh.new()
ringB=ring(bm,yB,r_base)
ringM=ring(bm,yM,r_mid)
ringT=ring(bm,yT,r_top)
bay_faces=[]
for a in range(S):
    b=(a+1)%S
    bay_faces.append(bm.faces.new((ringB[a],ringB[b],ringM[b],ringM[a])))
    bay_faces.append(bm.faces.new((ringM[a],ringM[b],ringT[b],ringT[a])))
bm.faces.new(tuple(reversed(ringT)))
bm.faces.new(tuple(ringB))
res=bmesh.ops.inset_region(bm,faces=bay_faces,thickness=0.09,depth=0.0)
inner=res.get("faces_new") or res.get("faces") or []
for f in inner:
    n=f.normal
    bmesh.ops.translate(bm,verts=list(f.verts),vec=n*0.05)
for i in range(S):
    a=i*2.0*math.pi/S
    rr=(r_base+r_mid+r_top)/3.0+0.02
    box(bm, rr*math.cos(a), (yB+yT)/2.0, rr*math.sin(a), 0.09, (yT-yB)/2.0, 0.09)
for i in range(S):
    a=(i+0.5)*2.0*math.pi/S
    rr=r_base+0.03
    box(bm, rr*math.cos(a), yB+0.15, rr*math.sin(a), 0.03, 0.15, 0.03)
for (fa,yy,sc) in [(0.5,-2.2,1.0),(2.5,-1.0,0.8),(3.5,1.8,0.9),(1.0,2.4,0.7),(5.0,-0.5,1.0)]:
    a=fa*2.0*math.pi/S
    rr=r_at(yy)+0.02
    nx,nz=math.cos(a),math.sin(a)
    spike(bm, rr*nx, yy, rr*nz, nx, nz, 0.14*sc, 0.05*sc, 4)
for (deg,yy) in [(30,-2.0),(330,-2.0),(150,-2.0),(210,-2.0),(30,1.8),(330,1.8),(150,1.8),(210,1.8)]:
    a=math.radians(deg)
    rr=r_at(yy)+0.02
    box(bm, rr*math.cos(a), yy, rr*math.sin(a), 0.04, 0.35, 0.24)
bmesh.ops.recalc_face_normals(bm,faces=bm.faces[:])
me=bpy.data.meshes.new("VR_Boss_Hull")
bm.to_mesh(me)
bm.free()
hull=new_obj("VR_Boss_Hull",me)
bm=bmesh.new()
ringC=ring(bm,3.30,1.86)
ringD=ring(bm,4.55,1.30)
for a in range(S):
    b=(a+1)%S
    bm.faces.new((ringC[a],ringC[b],ringD[b],ringD[a]))
bm.faces.new(tuple(reversed(ringD)))
for deg in (45,135,225,315):
    a=math.radians(deg)
    rr=1.55
    spike(bm, rr*math.cos(a),4.40, rr*math.sin(a), math.cos(a),math.sin(a),0.12,0.35,4)
q1=[bm.verts.new((x,4.50,z)) for x,z in ((0.30,0.30),(-0.30,0.30),(-0.30,-0.30),(0.30,-0.30))]
q2=[bm.verts.new((x,4.98,z)) for x,z in ((0.16,0.16),(-0.16,0.16),(-0.16,-0.16),(0.16,-0.16))]
q3=bm.verts.new((0.0,5.25,0.0))
for a in range(4):
    b=(a+1)%4
    bm.faces.new((q1[a],q1[b],q2[b],q2[a]))
    bm.faces.new((q2[a],q2[b],q3))
bmesh.ops.recalc_face_normals(bm,faces=bm.faces[:])
me=bpy.data.meshes.new("VR_Boss_Crown")
bm.to_mesh(me)
bm.free()
crown=new_obj("VR_Boss_Crown",me)
bm=bmesh.new()
zc=1.88
c1=[]
c2=[]
for i in range(6):
    a=i*2.0*math.pi/6+math.pi/6
    c1.append(bm.verts.new((0.34*math.cos(a),-3.7,zc+0.22*math.sin(a))))
for i in range(6):
    a=i*2.0*math.pi/6+math.pi/6
    c2.append(bm.verts.new((0.34*math.cos(a),3.1,zc+0.22*math.sin(a))))
for a in range(6):
    b=(a+1)%6
    bm.faces.new((c1[a],c1[b],c2[b],c2[a]))
bm.faces.new(tuple(reversed(c2)))
bm.faces.new(tuple(c1))
bmesh.ops.recalc_face_normals(bm,faces=bm.faces[:])
me=bpy.data.meshes.new("VR_Boss_Core")
bm.to_mesh(me)
bm.free()
core=new_obj("VR_Boss_Core",me)
def hash3(x,y,z):
    h=(int(round(x*1000))*73856093)^(int(round(y*1000))*19349663)^(int(round(z*1000))*83492791)
    h&=0x7fffffff
    return (h%83)/82.0
def bake(ob,part):
    me=ob.data
    attr=me.color_attributes.new(name="Color",type="FLOAT_COLOR",domain="POINT")
    for i,v in enumerate(me.vertices):
        x,y,z=v.co.x,v.co.y,v.co.z
        h=hash3(x,y,z)
        r=math.hypot(x,z)
        if part=="hull":
            if z>1.5 and abs(x)<0.30: val=0.96
            elif abs(y)<0.28 and r>1.55: val=0.30
            elif y>3.02 and y<3.62 and r>1.5: val=0.30
            elif y<-3.9: val=0.26
            elif y>3.28: val=0.34
            else:
                base=0.42+0.20*h
                val=base+0.04*((h*7.3)%1.0-0.5)
            val=min(0.96,max(0.22,val))
        elif part=="crown":
            if y>4.4: val=0.92
            elif abs(y-3.30)<0.30: val=0.28
            else: val=0.34
        else:
            if math.hypot(x,z-zc)<0.10 and abs(y)<3.2: val=0.94
            elif abs(x)>0.20: val=0.86
            else: val=0.80
        attr.data[i].color=(val,val,val,1.0)
bake(hull,"hull")
bake(crown,"crown")
bake(core,"core")
def mat(name,base):
    m=bpy.data.materials.new(name)
    m.use_nodes=True
    nt=m.node_tree
    bsdf=nt.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value=(base,base,base,1.0)
    vc=nt.nodes.new("ShaderNodeVertexColor")
    vc.layer_name="Color"
    nt.links.new(vc.outputs["Color"],bsdf.inputs["Base Color"])
    return m
hull.data.materials.append(mat("VR_Boss_HullMat",0.55))
crown.data.materials.append(mat("VR_Boss_CrownMat",0.50))
core.data.materials.append(mat("VR_Boss_CoreMat",0.60))
RX=mathutils.Matrix.Rotation(math.radians(90),4,"X")
for ob in (hull,crown,core):
    ob.data.transform(RX)
def tris(ob):
    return sum(len(p.vertices)-2 for p in ob.data.polygons)
print("TRIS hull",tris(hull),"crown",tris(crown),"core",tris(core))
mn=[1e9,1e9,1e9]
mx=[-1e9,-1e9,-1e9]
for ob in (hull,crown,core):
    for v in ob.data.vertices:
        for k in range(3):
            mn[k]=min(mn[k],v.co[k])
            mx[k]=max(mx[k],v.co[k])
print("BBOX min",[round(v,4) for v in mn],"max",[round(v,4) for v in mx])
print("SPAN",[round(mx[k]-mn[k],4) for k in range(3)])
bpy.ops.object.select_all(action="DESELECT")
for ob in (hull,crown,core):
    ob.select_set(True)
bpy.context.view_layer.objects.active=hull
bpy.ops.export_scene.gltf(filepath=OUT,export_format="GLB",use_selection=True,export_yup=True,export_apply=True,export_materials="EXPORT",export_vertex_color="MATERIAL",export_image_format="AUTO",export_skins=False,export_animations=False,export_normals=True,export_texcoords=False,export_tangents=False)
print("EXPORT_OK",OUT)