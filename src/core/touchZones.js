// ST-268: pure dual-zone touch math (no DOM) - unit-testable. Render/input layer consumes it.
// LEFT-zone drag = thrust (floating stick: dead-zone + linear ramp + auto-centre on release);
// RIGHT-zone touch = aim + fire. The zone split is the viewport's vertical midline.
export const ZONE = { NONE: 'none', LEFT: 'left', RIGHT: 'right' };

// x = pointer x in CSS px, w = viewport width. The midline belongs to the RIGHT zone.
export function zoneFor(x, w) {
  return x < w / 2 ? ZONE.LEFT : ZONE.RIGHT;
}

// dx/dy = drag from the stick origin in CSS px (screen +x right, +y down = sim +x/+y).
// |d| <= thresh -> zero (dead-zone, boundary inclusive). Beyond it: direction preserved,
// magnitude ramps linearly 0 -> 1 across [thresh, maxPx] and clamps at 1 (full thrust).
export function thrustFromDrag(dx, dy, thresh, maxPx) {
  const m = Math.hypot(dx, dy);
  if (m <= thresh) return { x: 0, y: 0, mag: 0 };
  const f = maxPx > thresh ? Math.min(1, (m - thresh) / (maxPx - thresh)) : 1;
  return { x: (dx / m) * f, y: (dy / m) * f, mag: f };
}

