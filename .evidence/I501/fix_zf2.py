s = open('zf_final.py', encoding='utf-8').read()
old = "def ident(g):\n    b=bb[g]; cx=(b[0]+b[1])/2; cy=(b[2]+b[3])/2; cz=(b[4]+b[5])/2"
new = "SC=(1.600,1.405,1.260)\ndef ident(g):\n    b=bb[g]; cx=(b[0]+b[1])/2/SC[0]; cy=(b[2]+b[3])/2/SC[1]; cz=(b[4]+b[5])/2/SC[2]"
assert s.count(old)==1
open('zf_final.py','w',encoding='utf-8',newline='\n').write(s.replace(old,new))
print("FIXED")