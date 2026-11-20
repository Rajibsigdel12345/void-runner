// Void Runner - ST-512 (I546, E74 D4): PWA install-affordance decision model. Pure core module:
// no three.js, no DOM (unit-testable). Given the browser install-prompt flags it decides whether
// the in-menu INSTALL button shows. showButton is true ONLY when the browser has surfaced a
// beforeinstallprompt (promptAvailable) AND the app is not already installed (appInstalled) AND
// the user has not dismissed it (dismissed). Every flag is coerced from truthy-to-boolean so a
// garbage probe can never crash the menu; reason names the single active cause for test/debug.
export function installUiState(flags) {
  const f = (flags && typeof flags === 'object') ? flags : {};
  const promptAvailable = f.promptAvailable === true;
  const appInstalled = f.appInstalled === true;
  const dismissed = f.dismissed === true;
  const showButton = promptAvailable && !appInstalled && !dismissed;
  let reason;
  if (appInstalled) reason = 'installed';
  else if (dismissed) reason = 'dismissed';
  else if (promptAvailable) reason = 'available';
  else reason = 'unavailable';
  return { showButton, reason, promptAvailable, appInstalled, dismissed };
}