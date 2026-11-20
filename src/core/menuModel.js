// Void Runner - main-menu decision model (E74 / ST-510, I544). Pure core module: no three.js, no DOM.
// Given the saved campaign progress (0 = none, 1..4 = highest level reached, storage.js) it decides
// the menu's primary action: CONTINUE - LV N (checkpoint continue, ST-457) when progress exists,
// otherwise the classic start prompt. screens.js (DOM) and main.js (the Enter hotkey) both consume
// it, so the button label, its aria text, and what Enter does can never disagree.

import { t } from './strings.js';

export function menuModel(campaignProgress) {
  const p = Number.isInteger(campaignProgress) && campaignProgress >= 1 && campaignProgress <= 4 ? campaignProgress : 0; // domain: 4 campaign levels (out-of-range = garbage -> bit-identical pre-E74 path)
  return {
    level: p,
    hasContinue: p > 0,
    primary: p > 0
      ? { kind: 'continue', label: t('menu.continue', { level: p }), aria: t('menu.continue_aria', { level: p }) }
      : { kind: 'start', label: t('menu.start_key'), tap: t('menu.start_tap') },
    enterAction: p > 0 ? 'campaign' : 'normal', // 'normal' = the pre-E74 Enter path (endless)
  };
}
