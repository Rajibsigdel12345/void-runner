import { STRINGS } from 'file:///E:/Game/src/core/strings.js';
function cps(s) { return Array.from(s).map((c) => 'U+' + c.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')).join(' '); }
for (const k of ['menu.continue', 'menu.new_game']) {
  console.log('ja.' + k + ': ' + cps(STRINGS.ja[k]));
}
// expected: menu.continue = U+7D9A U+7D9A U+2014 U+4C U+56 {level}
//           menu.new_game = U+65B0 U+4F5C U+30EC U+30FC U+30E9
console.log('expect continue: 7D9A 7D9A 2014 4C 56 7B 6C 65 76 65 6C 7D');
console.log('expect new_game: 65B0 4F5C 30EC 30FC 30E9');