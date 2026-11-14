// ST-322 (I353): touch haptics for the arcade feedback loop. navigator.vibrate is coarse +
// feature-gated (Android yes; iOS Safari has no vibrate -> no-op by design). Four short patterns
// are wired at the SFX dispatch in main.js (hit / death / bomb / pickup).
// The pattern table + patternFor() are PURE and DOM-free (unit-testable in node); createHaptics
// only reads navigator when it is called.
export const HAPTIC_PATTERNS = {
  hit: 20, // the ship took a hit (short sharp buzz)
  death: [40, 30, 60], // the ship was destroyed (game over; vibrate-pause-vibrate)
  bomb: 50, // the bomb detonated (medium single buzz)
  pickup: 15, // a power-up was collected (light tap)
};
export function patternFor(kind) {
  return Object.prototype.hasOwnProperty.call(HAPTIC_PATTERNS, kind) ? HAPTIC_PATTERNS[kind] : null;
}
export function createHaptics(coarse) {
  const enabled = !!coarse && typeof navigator !== 'undefined' && 'vibrate' in navigator;
  function pulse(kind) {
    if (!enabled) return false;
    const p = patternFor(kind);
    if (p == null) return false;
    try { navigator.vibrate(p); } catch (e) { /* vibrate can throw in some contexts; ignore */ }
    return true;
  }
  return { pulse: pulse, enabled: enabled };
}
