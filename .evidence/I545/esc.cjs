const en = 'ROTATE TO LANDSCAPE';
const zh = '\u8bf7\u6a2a\u5c4f\u6e38\u73a9';
const ja = '\u6a2a\u5411\u304b\u3067\u30d5\u30ec\u30a4\u3057\u3066\u3046\u3060\u3055\u3044\u3061\u3042';
const codes = (s) => Array.from(s).map(c => c.codePointAt(0).toString(16)).join(',');
console.log('en codes:', codes(en));
console.log('zh codes:', codes(zh), 'len', Array.from(zh).length);
console.log('ja codes:', codes(ja), 'len', Array.from(ja).length);
console.log('zh src escape: ' + JSON.stringify(zh).replace(/[^\x00-\x7f]/g, c => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0')));
console.log('ja src escape: ' + JSON.stringify(ja).replace(/[^\x00-\x7f]/g, c => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0')));
