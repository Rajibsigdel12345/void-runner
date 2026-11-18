s = open('zf_final.py', encoding='utf-8').read()
old = "isl={v:canon[comp[v.index]] for v in range(len(verts))}"
new = "isl=list(range(len(verts)))"
new = "isl=[canon[comp[vi]] for vi in range(len(verts))]"
assert s.count(old)==1
open('zf_final.py','w',encoding='utf-8',newline='\n').write(s.replace(old,new))
print("FIXED")