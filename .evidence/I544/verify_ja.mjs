import { STRINGS } from 'file:///E:/Game/src/core/strings.js';
function cps(s) { return Array.from(s).map((c) => c.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')).join(' '); }
console.log('ja.continue cps:', cps(STRINGS.ja['menu.continue']));
console.log('expect cont  : 7D9A 7D9A 2014 4C 56 7B 6C 65 76 65 6C 7D');
console.log('ja.new_game  :', cps(STRINGS.ja['menu.new_game']));
console.log('expect newgm : 65B0 4F5C 30EC 30FC 30E9');
console.log('ja.cont_aria :', cps(STRINGS.ja['menu.continue_aria']));
console.log('expect aria  : 30EC 30D9 30EB 7B 6C 65 76 65 6C 7D 304B 3089 30AD 30E3 30FC 3092 7D9A 3059 308B');