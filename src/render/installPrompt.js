// Void Runner - ST-512 (I546, E74 D4): DOM-only, NON-BLOCKING PWA install affordance.
// Render layer only. A compact pill button (fixed top-right) shown ONLY when BOTH (a) the core
// installUiState decision says install is offered (browser surfaced beforeinstallprompt, app not
// installed, user did not dismiss) AND (b) the game loop reports we are on the menu (setMenuVisible).
// It NEVER auto-fires the native prompt: the button is an explicit opt-in that calls prompt() on
// click. Browsers without beforeinstallprompt (iOS Safari, most desktop) leave it hidden - for iOS
// the meta tags in index.html are the install affordance instead. Visibility is a no-op-guarded
// state so the game loop can call setMenuVisible every frame for free. Pure DOM + window events;
// zero 3D surface (does not touch the playframe draw-call/triangle pins).
import { installUiState } from '../core/installUi.js';

export function createInstallButton(host) {
  let promptEvent = null;      // the captured beforeinstallprompt event (holds .prompt())
  let promptAvailable = false; // true once the browser has surfaced a beforeinstallprompt
  let appInstalled = false;    // true once appinstalled fires
  let dismissed = false;       // true once the user dismisses the native prompt (userChoice)
  let menuVisible = false;     // fed by the game loop (st === STATE.MENU)
  let lastVis = null;          // last applied visibility (no-op guard for per-frame refresh)

  const el = document.createElement('button');
  el.type = 'button';
  el.className = 'vr-install-btn';
  el.id = 'vr-install-btn';
  el.style.cssText = 'position:fixed;top:calc(14px + env(safe-area-inset-top));right:calc(14px + env(safe-area-inset-right));z-index:40;display:none;align-items:center;gap:8px;padding:8px 14px;border:1px solid rgba(120,200,255,0.5);border-radius:999px;background:rgba(10,24,48,0.82);color:#bfe3ff;font-family:"Segoe UI",system-ui,sans-serif;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;cursor:pointer;backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);';
  el.setAttribute('aria-label', 'Install the app');
  host.appendChild(el);

  function decision() { return installUiState({ promptAvailable, appInstalled, dismissed }); }
  function refresh() {
    const vis = menuVisible && decision().showButton;
    if (vis === lastVis) return; // no-op guard: per-frame setMenuVisible is free
    lastVis = vis;
    el.style.display = vis ? 'inline-flex' : 'none';
  }
  function onBeforeInstall(e) {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    promptEvent = e;
    promptAvailable = true;
    dismissed = false; // a fresh prompt re-arms the affordance
    if (e && e.userChoice && typeof e.userChoice.then === 'function') {
      e.userChoice.then((c) => { if (c && c.outcome === 'dismissed') { dismissed = true; refresh(); } }).catch(() => {});
    }
    refresh();
  }
  function onAppInstalled() {
    appInstalled = true;
    promptAvailable = false;
    refresh();
  }
  function promptInstall() {
    if (!promptEvent || typeof promptEvent.prompt !== 'function') return false;
    try { const p = promptEvent.prompt(); if (p && typeof p.catch === 'function') p.catch(() => {}); } catch (_) { /* ignore */ }
    return true;
  }
  if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onAppInstalled);
  }

  return {
    el,
    setLabel(text) { el.textContent = text; el.setAttribute('aria-label', text); },
    get visible() { return lastVis === true; },
    get reason() { return decision().reason; },
    get canInstall() { return decision().showButton; },
    setMenuVisible(v) { menuVisible = v === true; refresh(); },
    promptInstall, // exposed so the menu button click is testable / reusable
    dispose() {
      if (typeof window !== 'undefined' && typeof window.removeEventListener === 'function') {
        window.removeEventListener('beforeinstallprompt', onBeforeInstall);
        window.removeEventListener('appinstalled', onAppInstalled);
      }
      if (el.parentNode) el.parentNode.removeChild(el);
    },
  };
}