// ST-238 (I245): class-scaled shockwave ring sizes (pure, DOM-free, three-free).
//
// Same table-lookup pattern as shakeTable / flashTable / killPunch: one rung
// per kill class that gets the ring; a class without a rung (mine, flyer,
// boss) maps to 0 - no ring. The ring is a LAYERING pass on plain kills (the
// Brackeys sparks/shockwave/debris recipe): it adds no flash, no hit-stop and
// no shake (the I224 readability rule) - it only adds the visual layer between
// the particle burst and the floor. The table lives in CONFIG.fx.shockwave
// (data-driven); this function only guards the lookup so a bad cfg or a new
// unmapped class degrades to "no ring" instead of NaN-ing a ring scale.

// Target ring radius (world units) for a kill class; 0 when unmapped/invalid.
export function shockwaveRadius(classKey, cfg) {
  if (!classKey || !cfg || !cfg.classes) return 0;
  const r = cfg.classes[classKey];
  return Number.isFinite(r) && r > 0 ? r : 0;
}
