import { STRINGS, t, setLocale, getLocale } from 'file:///E:/Game/src/core/strings.js';
const keys = ['menu.continue', 'menu.continue_aria', 'menu.new_game', 'menu.settings', 'menu.settings_aria'];
let ok = true;
for (const loc of ['en', 'zh', 'ja']) {
  for (const k of keys) {
    const v = STRINGS[loc][k];
    if (v === undefined) { ok = false; console.log('MISSING ' + loc + '.' + k); }
    else console.log(loc + '.' + k + ' = ' + v);
  }
}
console.log('--- t en level3:', t('menu.continue', { level: 3 }));
setLocale('zh');
console.log('--- t zh level3:', t('menu.continue', { level: 3 }));
console.log('--- t zh aria3 :', t('menu.continue_aria', { level: 3 }));
setLocale('ja');
console.log('--- t ja level3:', t('menu.continue', { level: 3 }));
setLocale('en');
console.log('--- locale restored:', getLocale());
console.log('--- cross-check zh pause.resume:', JSON.stringify(STRINGS.zh['pause.resume']));
console.log('--- cross-check zh toast.continue:', JSON.stringify(STRINGS.zh['toast.continue']));
console.log(ok ? 'KEYS OK 15/15' : 'KEYS FAIL');