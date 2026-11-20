const fs = require("fs");
function toEsc(str){return [...str].map(c=>"\\u"+c.codePointAt(0).toString(16).padStart(4,"0")).join("");}
const SRC = "Install the application";
const pairs = [
  { tag: "zh2", langpair: "en|zh-CN" },
  { tag: "ja2", langpair: "en|ja" },
];
(async () => {
  for (const p of pairs) {
    const url = "https://api.mymemory.translated.net/get?q=" + encodeURIComponent(SRC) + "&langpair=" + encodeURIComponent(p.langpair);
    const r = await fetch(url);
    const j = await r.json();
    const raw = j && j.responseData && j.responseData.translatedText;
    if (typeof raw !== "string") { console.log(p.tag + " FETCH FAILED: " + JSON.stringify(j)); continue; }
    let txt; try { txt = decodeURIComponent(raw); } catch (e) { txt = raw; }
    fs.writeFileSync(".evidence/I546/i18n_ref_" + p.tag + ".bin", Buffer.from(txt, "utf8"));
    const b = fs.readFileSync(".evidence/I546/i18n_ref_" + p.tag + ".bin");
    console.log(p.tag + " utf8len=" + b.length + " cp=" + [...txt].length + " esc=" + toEsc(txt));
  }
  console.log("I18N_FETCH2_DONE");
})();