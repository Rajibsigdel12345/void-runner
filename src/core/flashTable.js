// ST-179: unified flash-bump table lookup. Pure core (DOM-free): the render
// layer passes CONFIG.fx.flashTable plus the juice event type. Unmapped
// events (or an invalid table) bump 0. Values 0..0.8 are added to flashA
// under the shared Math.min(0.8, ...) cap in the juice dispatch.
export function flashEnergy(type, table) {
  if (!table || typeof table !== 'object') return 0;
  const v = table[type];
  return typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : 0;
}
