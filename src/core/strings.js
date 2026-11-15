// Void Runner - locales-ready presentation strings (E49 / ST-374). DOM-free core module.
// Player-facing UI text extracted from the 8 render files (see design/i18n-strings.md).
// en is the default and the byte-faithful source of truth (extract = move, not reword).
// t(key, vars) substitutes {named} placeholders (never concatenation); a key missing from the
// active locale falls back to en; a key missing from en returns '' (never the raw key).
// kc(key) resolves a hardware/control label for the active locale.
// locale is 'en' for ST-374; ST-375 adds setLocale() switching + persistence; ST-376 adds zh/ja.

export const STRINGS = {
  en: {
    // state words (shared ON/OFF/HIGH/LOW values)
    'state.on': 'ON',
    'state.off': 'OFF',
    'state.high': 'HIGH',
    'state.low': 'LOW',
    // control captions (shared by menu + tutorial)
    'ctrl.thrust': 'thrust',
    'ctrl.aim': 'aim',
    'ctrl.fire': 'fire',
    'ctrl.pause': 'pause',
    'ctrl.mute': 'mute',
    'ctrl.music': 'music',
    'ctrl.fx': 'fx',
    'ctrl.drag_fly': 'drag to fly',
    'ctrl.aim_fire': 'aim + fire',
    // menu
    'menu.tagline': 'survive the void, outlast the waves',
    'menu.board': 'TOP 5',
    'menu.start_tap': 'TAP TO START',
    'menu.start_key': 'PRESS ENTER TO START',
    'menu.daily': 'DAILY RUN',
    'menu.daily_aria': 'Start the daily seeded run',
    'menu.replays': 'REPLAYS',
    'menu.replays_aria': 'Watch a saved replay',
    'menu.credit': 'a three.js arcade shooter \u25c6 Blender-modeled low-poly assets \u25c6 built with the Codex Game Studio pipeline',
    'menu.status_line': 'M \u2014 MUTE ({mute})     F \u2014 FX ({fx})     N \u2014 MUSIC ({music})',
    'menu.best': 'BEST {best}',
    'menu.no_best': 'NO BEST YET',
    'menu.daily_line': 'DAILY {key}  \u00b7  {best}',
    'menu.no_scores': '\u2014 no scores yet \u2014',
    // pause
    'pause.title': 'PAUSED',
    'pause.resume': 'RESUME',
    'pause.restart': 'RESTART',
    'pause.quit': 'QUIT TO MENU',
    'pause.label_mute': 'M \u2014 MUTE ({mute})',
    'pause.label_fx': 'F \u2014 FX ({fx})',
    'pause.snap': 'SCORE {score}    WAVE {wave}    KILLS {kills}',
    'pause.aria_btn': 'Pause',
    // game over
    'over.title': 'GAME OVER',
    'over.score': 'SCORE {score}',
    'over.best': 'BEST {best}',
    'over.new_best': 'NEW BEST!',
    'over.rank': 'BOARD RANK #{rank}',
    'over.stats_kills': 'KILLS {kills}    WAVE {wave}',
    'over.stats_combo_time': 'MAX COMBO {combo}    TIME {time}',
    'over.stats_accuracy': 'ACCURACY {acc}%    SHOTS {hit}/{fired}',
    'over.daily_badge': 'DAILY RUN{key_seg}{new_seg}',
    'over.new_daily': 'NEW DAILY BEST',
    'over.restart_key': 'PRESS ENTER TO RESTART',
    'over.restart_replay': 'PRESS Q TO QUIT TO MENU',
    'over.restart_tap': 'TAP TO RESTART',
    'over.copy': 'COPY RESULT',
    'over.copy_aria': 'Copy result code',
    'over.copied': 'COPIED!',
    'over.copy_failed': 'COPY FAILED',
    'over.copy_caption': 'copies a reproducible result code',
    'over.watch_run': 'WATCH THIS RUN',
    'over.watch_run_aria': 'Watch this run as a replay',
    // replays panel
    'replays.title': 'REPLAYS',
    'replays.sub': 'watch the demo pilot or a saved run',
    'replays.empty': '\u2014 no saved replays yet \u2014',
    'replays.demo_pilot': 'DEMO PILOT',
    'replays.saved_run': 'SAVED RUN',
    'replays.row_stat': 'SCORE {score}    WAVE {wave}    {kills} KILLS    {time}',
    'replays.row_aria': '{label}, score {score}',
    'replays.back': 'BACK',
    'replays.back_aria': 'Back to the menu',
    // hud
    'hud.wave': 'WAVE {wave}',
    'hud.best': 'BEST {best}',
    'hud.combo': 'COMBO',
    'hud.wpn': 'WPN',
    'hud.pu.rapid': 'RAPID',
    'hud.pu.spread': 'SPREAD',
    'hud.pu.shield': 'SHIELD',
    'hud.pu.magnet': 'MAGNET',
    'hud.pu.overdrive': 'OVERDRIVE',
    'hud.pu.slowmo': 'SLOW-MO',
    'hud.mod.fast': 'FAST ROCKS',
    'hud.mod.small': 'SMALL ROCKS',
    'hud.mod.inward': 'INWARD DRIFT',
    'hud.mod.big': 'HEAVY ROCKS',
    // wave banner
    'banner.wave': 'WAVE {n}',
    'banner.endless': 'ENDLESS',
    'banner.cleared': 'CLEARED',
    'banner.countdown': 'NEXT WAVE IN {n}',
    'banner.boss_sub': 'WAVE {n} \u00b7 {hp} HP',
    'banner.boss.splicer': 'THE SPLICER',
    'banner.boss.monolith': 'THE MONOLITH',
    // boss HP bar (short forms)
    'boss.splicer': 'SPLICER',
    'boss.monolith': 'MONOLITH',
    // kill feed labels
    'feed.warden': 'WARDEN',
    'feed.mine': 'MINE',
    'feed.seeker': 'SEEKER',
    'feed.stinger': 'STINGER',
    'feed.flyer': 'FLYER',
    'feed.golden_rock': 'GOLDEN ROCK',
    'feed.rock': '{size} ROCK',
    // tutorial overlay
    'tutorial.title': 'HOW TO PLAY',
    'tutorial.sub': 'fly, aim, fire - and outlast the waves',
    'tutorial.boss_note': 'survive the waves - bosses arrive on wave 5 and beyond',
    'tutorial.go_tap': 'TAP TO LAUNCH',
    'tutorial.go_key': 'LAUNCH',
    'tutorial.dismiss_aria': 'Dismiss the tutorial and start playing',
    // settings panel
    'settings.audio': 'AUDIO',
    'settings.volume': 'VOLUME',
    'settings.volume_aria': 'Volume',
    'settings.sfx': 'SFX',
    'settings.sfx_aria': 'Sound effects',
    'settings.music': 'MUSIC',
    'settings.music_aria': 'Music',
    'settings.visuals': 'VISUALS',
    'settings.fx': 'FX QUALITY',
    'settings.fx_aria': 'FX quality',
    'settings.fx_auto': 'AUTO: LOW',
    'settings.fx.high': 'HIGH',
    'settings.fx.low': 'LOW',
    'settings.fx.off': 'OFF',
    'settings.reduced_motion': 'REDUCED MOTION',
    'settings.reduced_motion_aria': 'Reduced motion',
    'settings.font_scale': 'FONT SCALE',
    'settings.font_scale_aria': 'Font scale',
    'settings.font_scale.normal': 'NORMAL',
    'settings.font_scale.large': 'LARGE',
    'settings.font_scale.xl': 'XL',
    'settings.shape_cues': 'SHAPE CUES',
    'settings.shape_cues_aria': 'Shape cues',
    'settings.colorblind': 'COLORBLIND',
    'settings.colorblind_aria': 'Colorblind preview',
    'settings.slowmo_hint': 'SLOW-MO HINT',
    'settings.slowmo_hint_aria': 'Slow-mo hint',
    'settings.kbd_hint': 'TAB NAVIGATES - ARROWS MOVE - SPACE TOGGLES',
    // toasts
    'toast.fx_auto_low': 'FX AUTO-SET TO LOW (LOW FPS)',
    'toast.recording': 'RECORDING - O TO STOP',
    'toast.recording_stopped': 'RECORDING STOPPED',
    'toast.paused_two_finger': 'PAUSED \u00b7 2-FINGER',
    'toast.fx': 'FX {level}',
    'toast.music': 'MUSIC {onoff}',
    'toast.splicer': 'SPLICER INBOUND',
    'toast.warden': 'WARDEN INBOUND',
    'toast.stinger': 'STINGER INBOUND',
    'toast.flyer': 'FLYER INBOUND',
    'toast.weapon': 'WEAPON LEVEL {level}',
    'toast.run_saved': 'RUN SAVED TO REPLAYS',
    'toast.slowmo': 'SLOWMO \u00b7 enemies slow to 40% \u2014 you stay at full speed',
    // WebGL context-loss overlay
    'ctxlost.title': 'RENDERING INTERRUPTED',
    'ctxlost.message': 'The browser dropped the 3D rendering context. It usually comes back on its own - please wait.',
    'ctxlost.timeout': 'Still no signal after 10s. If it does not come back, reload the game.',
    'ctxlost.reload': 'RELOAD GAME',
  },
};
export const KEYCAPS = {
  en: {
    'wasd_arrows': 'WASD / ARROWS',
    'mouse': 'MOUSE',
    'click_space': 'CLICK / SPACE',
    'p_esc': 'P / ESC',
    'm': 'M',
    'f': 'F',
    'n': 'N',
    'p': 'P',
    'r': 'R',
    'q': 'Q',
    'enter': 'ENTER',
    'left_zone': 'LEFT ZONE',
    'right_zone': 'RIGHT ZONE',
    'two_fingers': '2 FINGERS',
  },
};

let locale = 'en';

export function getLocale() { return locale; }
export function setLocale(l) { if (STRINGS[l]) locale = l; } // unknown locale ignored (stays)

function substitute(s, vars) {
  if (!s) return s;
  if (!vars) return s;
  return s.replace(/\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g, (m, name) => (vars[name] != null ? String(vars[name]) : ''));
}

export function t(key, vars) {
  let s = STRINGS[locale] ? STRINGS[locale][key] : undefined;
  if (s == null) s = STRINGS.en[key]; // locale -> en fallback
  if (s == null) { if (typeof console !== 'undefined') console.warn('[strings] missing key: ' + key); return ''; }
  return substitute(s, vars);
}
export function kc(key) {
  let s = KEYCAPS[locale] ? KEYCAPS[locale][key] : undefined;
  if (s == null) s = KEYCAPS.en[key];
  if (s == null) { if (typeof console !== 'undefined') console.warn('[keycaps] missing key: ' + key); return ''; }
  return s;
}