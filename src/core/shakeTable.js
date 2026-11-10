// ST-175: unified screen-shake table lookup. Pure core (DOM-free): the render
// layer passes CONFIG.fx.shakeTable plus the juice event type. The table is
// the single source of truth for shake strength - unmapped events (or an
// invalid table) shake 0. Values are energies 0..1 consumed by createShake
// (master scale, max-stacking, exponential decay).
export function shakeEnergy(type, table) {
  if (!table || typeof table !== 'object') return 0;
  const v = table[type];
  return typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : 0;
}