// I546 (ST-512, E74 D4): byte-level i18n fetch for the install affordance label.
// CJK lesson: never hand-derive / console-read CJK. Fetch trusted raw-UTF-8 via the MT API,
// URL-decode to a real string, save raw UTF-8 bytes to .bin, and emit ASCII \uXXXX escapes.
const fs = require('fs');
const SRC = 'Install App';
const pairs = [
  { tag: 'zh1', langpair: 'en|zh-CN' },
  { tag: 'ja1', langpair: 'en|ja' },
];
function toEsc(str) {
  return [...str].map(c => {
    const cp = c.codePointAt(0);
    return '\\u' + cp.toString(16).padStart(4, '0');
  }).join('');
}
(async () => {
  for (const p of pairs) {
    const url = 'https://api.mymemory.translated.net/get?q=' + encodeURIComponent(SRC) + '&langpair=' + encodeURIComponent(p.langpair);
    const r = await fetch(url);
    const j = await r.json();
    const raw = j && j.responseData && j.responseData.translatedText;
    if (typeof raw !== 'string') { console.log(p.tag + ' FETCH FAILED: ' + JSON.stringify(j)); continue; }
    let txt;
    try { txt = decodeURIComponent(raw); } catch (e) { txt = raw; }
    fs.writeFileSync('.evidence/I546/i18n_ref_' + p.tag + '.bin', Buffer.from(txt, 'utf8'));
    const b = fs.readFileSync('.evidence/I546/i18n_ref_' + p.tag + '.bin');
    console.log(p.tag + ' (' + p.langpair + ') utf8len=' + b.length + ' cp=' + [...txt].length + ' esc=' + toEsc(txt));
  }
  console.log('I18N_FETCH_DONE');
})();
