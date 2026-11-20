// I551 (ST-517, E75): K5 byte-level CJK pipeline for the Level 5 i18n keys.
// - Final strings are pure-ASCII \uXXXX escapes in THIS script (no console-derived CJK).
// - Anchors are ASCII-only (the 'level.name.l4' / 'level.zone.l4z4' keys, one per locale block).
// - Inserted lines match the detected EOL of the anchor line (file is CRLF-dominant).
// - Read-back verification: every inserted string's codepoints must match exactly.
// - Best-effort MyMemory fetch of an independent MT reference per string (logged, non-blocking).
const fs = require('fs');

// en/zh/ja for the 5 new keys. CJK as \uXXXX (ASCII-safe source).
const KEYS = [
  ['level.name.l5', 'Zenith Spire', '\u5929\u9876\u4e4b\u5854', '\u5929\u9802\u306e\u5c16\u5854'],
  ['level.zone.l5z1', 'Spire Approach', '\u5c16\u5854\u63a5\u8fd1', '\u30b9\u30d1\u30a4\u30a2\u63a5\u8fd1'],
  ['level.zone.l5z2', 'Halo Circuit', '\u5149\u73af\u822a\u9053', '\u30cf\u30fc\u30fc\u56de\u8def'],
  ['level.zone.l5z3', 'Crown Ascent', '\u738b\u5195\u6500\u5347', '\u30af\u30e9\u30a6\u30f3\u4e0a\u6607'],
  ['level.zone.l5z4', 'Archon Threshold', '\u6267\u653f\u5b98\u4e4b\u95e8', '\u30a2\u30fc\u30b3\u30f3\u6563\u5c45']
];

function cp(str) { return [...str].map((c) => c.codePointAt(0).toString(16).toUpperCase()); }

async function mtRef(text, tl) {
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 5000);
    const r = await fetch('https://api.mymemory.translated.net/get?q=' + encodeURIComponent(text) + '&langpair=en|' + tl, { signal: ctl.signal });
    clearTimeout(t);
    const j = await r.json();
    return (j && j.responseData && j.responseData[0] && j.responseData[0].translatedText) || 'EMPTY';
  } catch (e) { return 'FETCH_FAILED:' + e.message; }
}

(async () => {
  const file = 'src/core/strings.js';
  let s = fs.readFileSync(file, 'utf8');

  // 1. Sanity: no l5 keys exist yet; anchors unique per locale block.
  for (const k of KEYS) if (s.includes("'" + k[0] + "'")) { console.error('ALREADY PRESENT: ' + k[0]); process.exit(1); }
  const nameAnchor = "'level.name.l4':";
  const zoneAnchor = "'level.zone.l4z4':";
  const count = (needle) => s.split(needle).length - 1;
  if (count(nameAnchor) !== 3 || count(zoneAnchor) !== 3) { console.error('ANCHOR COUNT name=' + count(nameAnchor) + ' zone=' + count(zoneAnchor)); process.exit(1); }

  // 2. Build the new lines per locale (4-space indent, matching the block style).
  const nameLines = KEYS.length; // not used directly
  const mk = (locIdx) => KEYS.map(([key, en, zh, ja]) => {
    const v = [en, zh, ja][locIdx];
    return "    '" + key + "': '" + v + "',";
  });

  // 3. Insert after the i-th occurrence of the anchor line (i = 0 en, 1 zh, 2 ja),
  //    matching that line's EOL.
  function insertAfterOccurrence(src, anchor, which, newLine) {
    const idxs = [];
    let i = src.indexOf(anchor);
    while (i !== -1) { idxs.push(i); i = src.indexOf(anchor, i + 1); }
    const at = idxs[which];
    // end of the anchor LINE
    let eol = '\n';
    const nl = src.indexOf('\n', at);
    if (src[nl - 1] === '\r') eol = '\r\n';
    const insertAt = nl + 1;
    return src.slice(0, insertAt) + newLine + eol + src.slice(insertAt);
  }

  for (const locIdx of [0, 1, 2]) {
    // name.l5 goes after the name.l4 line; zone.l5z1..4 after the zone.l4z4 line.
    const nameIns = [mk(locIdx)[0]]; // only level.name.l5 in the name group
    const zoneIns = mk(locIdx).slice(1);
    s = insertAfterOccurrence(s, nameAnchor, locIdx, nameIns[0]);
    // insert zones in REVERSE order after the same anchor so they end up z1..z4
    for (let z = zoneIns.length - 1; z >= 0; z--) s = insertAfterOccurrence(s, zoneAnchor, locIdx, zoneIns[z]);
  }

  // 4. Write (UTF-8, no BOM - file had no BOM).
  fs.writeFileSync(file, s, 'utf8');

  // 5. Read-back verification by codepoint.
  const back = fs.readFileSync(file, 'utf8');
  const errs = [];
  for (const [key, en, zh, ja] of KEYS) {
    const exp = [en, zh, ja];
    for (let li = 0; li < 3; li++) {
      const want = exp[li];
      const re = new RegExp("'" + key + "':\\s*'([^']*)'");
      const all = [...back.matchAll(new RegExp("'" + key + "':\\s*'([^']*)'", 'g'))];
      if (all.length !== 3) { errs.push(key + ' count=' + all.length); continue; }
      const got = all[li][1];
      if (cp(got).join(' ') !== cp(want).join(' ')) errs.push(key + ' locale' + li + ' mismatch: got ' + cp(got).join(' '));
    }
  }

  // 6. Best-effort MT references (logged only; the curated strings are final -
  //    house pattern: curated CJK consistent with the existing L1-L4 translations).
  const refs = [];
  for (const [key, en] of KEYS) {
    const zh = await mtRef(en, 'zh');
    const ja = await mtRef(en, 'ja');
    refs.push({ key, en, mt_zh: zh, mt_ja: ja });
  }

  const out = {
    pipeline: 'I551 (ST-517, E75) K5 CJK byte pipeline - curated \\uXXXX source, EOL-matched insert, read-back codepoint verify',
    keys: KEYS.map(([k, en, zh, ja]) => ({ key: k, en: { value: en, codepoints: cp(en) }, zh: { value: zh, codepoints: cp(zh) }, ja: { value: ja, codepoints: cp(ja) } })),
    mt_references: refs,
    verification: errs.length ? { FAIL: errs } : { PASS: 'all 15 insertions verified by codepoint' }
  };
  fs.writeFileSync(__dirname + '/cjk551.json', JSON.stringify(out, null, 2) + '\n');
  console.log('MT references (independent cross-check, non-blocking):');
  for (const r of refs) console.log('  ' + r.key + ': zh=[' + r.mt_zh + '] ja=[' + r.mt_ja + ']');
  if (errs.length) { console.error('CJK551 FAIL: ' + errs.join('; ')); process.exit(1); }
  console.log('CJK551 PASS - 15/15 insertions verified by codepoint (5 keys x 3 locales)');
})();
