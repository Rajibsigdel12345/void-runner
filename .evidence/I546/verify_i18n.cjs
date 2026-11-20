const fs = require("fs");
function toEsc(str){return [...str].map(c=>"\\u"+c.codePointAt(0).toString(16).padStart(4,"0")).join("");}
for(const tag of ["zh1","ja1"]){
  const b = fs.readFileSync(".evidence/I546/i18n_ref_"+tag+".bin");
  const txt = b.toString("utf8");
  console.log(tag+" utf8len="+b.length+" cp="+[...txt].length);
  console.log(tag+" esc="+toEsc(txt));
  // sanity: ensure it decodes back to the same bytes (round-trip)
  const re = Buffer.from(txt,"utf8");
  console.log(tag+" roundtrip_ok="+re.equals(b));
}
console.log("VERIFY_I18N_DONE");