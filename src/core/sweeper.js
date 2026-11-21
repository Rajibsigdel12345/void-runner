// ST-518 (E75): SWEEPER - the arc triangle (wave 18+). Spawns at the rim
// (away from the ship), homes to a 12-u hover ring around the ship, then
// cycles sweep (facing slews across a 120-degree arc at 0.9 rad/s; a FAN of
// 4 bolts every 0.6 s spread over a 0.4-rad sub-arc centered on the CURRENT
// facing - the shape IS the attack) -> reaim (0.7 s, no fire, re-acquire)
// -> sweep. 3 hits (+225, the drone rung). Contact costs a life. DOM-free,
// three-free. Determinism: the rim bearing, sweep dir, cadence phase and
// hover jitter are frozen RNG draws at spawn; step() draws no RNG so pinned
// runs stay bit-identical. The field pushes 'fire' (bolt, with dir), 'hit'
// (non-lethal) and 'death' (self-expiry only - a bullet kill emits nothing
// from the field; game.js reads q.dead, awards + emits).
import { CONFIG } from './config.js';
import { v2 } from './math.js';

export class SweeperField {
  constructor(rng, cfg = CONFIG) {
    this.rng = rng;
    this.cfg = cfg;
    this.sweepers = [];
    this.events = []; // { kind: 'fire' | 'hit' | 'death', pos, dir?, self? }
    this.nextId = 1;
  }

  /** Spawn one sweeper at the rim (away from the ship when a position is
   * given). Returns the sweeper, or null to defer (the live cap is full). */
  spawn(shipPos = null) {
    const s = this.cfg.sweeper;
    if (this.sweepers.length >= s.maxConcurrent) return null;
    const r = this.cfg.arena.radius - s.radius;
    let a = this.rng.next() * Math.PI * 2;
    if (shipPos) {
      for (let i = 0; i < 8 && Math.hypot(Math.cos(a) * r - shipPos.x, Math.sin(a) * r - shipPos.y) < s.rimDist; i++) {
        a = this.rng.next() * Math.PI * 2;
      }
    }
    this.sweepers.push({
      id: this.nextId++,
      pos: v2(Math.cos(a) * r, Math.sin(a) * r),
      vel: v2(),
      radius: s.radius,
      state: 'enter',
      t: 0,
      age: 0,
      hp: s.hp,
      hitFlash: 0,
      dead: false,
      sweepDir: this.rng.next() < 0.5 ? -1 : 1,
      cadencePhase: this.rng.next() * s.cadence,
      hoverJitter: (this.rng.next() - 0.5) * 0.5,
      hoverA: 0,
      facing: 0,
      nextFan: 0,
    });
    return this.sweepers[this.sweepers.length - 1];
  }

  /** Advance all sweepers. dt is game-time (slow-mo scaled). shipPos is the
   * hover-ring center + aim target. No RNG here. */
  step(dt, shipPos) {
    const s = this.cfg.sweeper;
    for (const p of this.sweepers) {
      if (p.dead) continue;
      p.age += dt;
      p.hitFlash = Math.max(0, p.hitFlash - 3 * dt);
      if (p.state === 'enter') {
        // Materialize window, then home in at the ship itself (the hover ring
        // is a DISTANCE, not a point: a ring point orbits with the ship's
        // transverse velocity and outruns the 3.2 u/s close).
        p.t += dt;
        const b = Math.atan2(shipPos.y - p.pos.y, shipPos.x - p.pos.x);
        p.hoverA = b + p.hoverJitter;
        p.vel.x = Math.cos(b) * s.speed;
        p.vel.y = Math.sin(b) * s.speed;
        p.pos.x += p.vel.x * dt;
        p.pos.y += p.vel.y * dt;
        if (p.t >= s.enterDur || Math.hypot(shipPos.x - p.pos.x, shipPos.y - p.pos.y) <= s.hoverDist) { p.state = 'approach'; p.t = 0; }
      } else if (p.state === 'approach') {
        // Home-in at the ship until inside the hover ring (distance-based -
        // robust when the ship moves faster than the ring point it orbits).
        const b = Math.atan2(shipPos.y - p.pos.y, shipPos.x - p.pos.x);
        p.hoverA = b + p.hoverJitter;
        p.vel.x = Math.cos(b) * s.speed;
        p.vel.y = Math.sin(b) * s.speed;
        p.pos.x += p.vel.x * dt;
        p.pos.y += p.vel.y * dt;
        if (Math.hypot(shipPos.x - p.pos.x, shipPos.y - p.pos.y) <= s.hoverDist) {
          p.state = 'sweep';
          p.t = 0;
          p.facing = b - p.sweepDir * s.arcSpan / 2; // the sweep starts behind the ship bearing
          p.nextFan = p.cadencePhase;
        }
      } else if (p.state === 'sweep') {
        p.t += dt;
        p.facing += p.sweepDir * s.sweepSpeed * dt;
        const px = p.pos.x, py = p.pos.y;
        let r = Math.hypot(px - shipPos.x, py - shipPos.y) || 1;
        const pull = s.hoverDist - r;
        r += Math.max(-3 * dt, Math.min(3 * dt, pull)); // range-keep to the ring at 3 u/s
        p.pos.x = shipPos.x + Math.cos(p.hoverA) * r;
        p.pos.y = shipPos.y + Math.sin(p.hoverA) * r;
        p.vel.x = (p.pos.x - px) / dt;
        p.vel.y = (p.pos.y - py) / dt;
        while (p.t >= p.nextFan) {
          // FAN: fanBolts bolts evenly over the sub-arc, centered on the CURRENT facing.
          for (let k = 0; k < s.fanBolts; k++) {
            const off = (k - (s.fanBolts - 1) / 2) * (s.fanSubArc / (s.fanBolts - 1));
            const c = Math.cos(off), sn = Math.sin(off);
            const fx = Math.cos(p.facing), fy = Math.sin(p.facing);
            this.events.push({ kind: 'fire', pos: v2(p.pos.x, p.pos.y), dir: v2(fx * c - fy * sn, fx * sn + fy * c) });
          }
          p.nextFan += s.cadence;
        }
        if (p.t >= s.arcSpan / s.sweepSpeed) {
          // Arc exhausted: re-acquire the ship for the next pass.
          const b = Math.atan2(shipPos.y - p.pos.y, shipPos.x - p.pos.x);
          p.hoverA = b + p.hoverJitter;
          p.facing = b;
          p.state = 'reaim';
          p.t = 0;
        }
      } else { // reaim
        p.t += dt;
        const px = p.pos.x, py = p.pos.y;
        let r = Math.hypot(px - shipPos.x, py - shipPos.y) || 1;
        const pull = s.hoverDist - r;
        r += Math.max(-3 * dt, Math.min(3 * dt, pull));
        p.pos.x = shipPos.x + Math.cos(p.hoverA) * r;
        p.pos.y = shipPos.y + Math.sin(p.hoverA) * r;
        p.vel.x = (p.pos.x - px) / dt;
        p.vel.y = (p.pos.y - py) / dt;
        if (p.t >= s.reaimDur) {
          const b = Math.atan2(shipPos.y - p.pos.y, shipPos.x - p.pos.x);
          p.hoverA = b + p.hoverJitter;
          p.facing = b - p.sweepDir * s.arcSpan / 2;
          p.nextFan = p.cadencePhase;
          p.state = 'sweep';
          p.t = 0;
        }
      }
      if (p.age >= s.maxAge) { // self-expiry (snap readable before the death FX)
        p.dead = true;
        this.events.push({ kind: 'death', pos: v2(p.pos.x, p.pos.y), self: true });
      }
    }
    this.compact();
  }

  /** Damage a sweeper by id. Non-lethal pushes 'hit'; LETHAL marks dead only -
   * game.js reads q.dead to award + emit. */
  hit(id) {
    const p = this.sweepers.find(x => x.id === id && !x.dead);
    if (!p) return null;
    p.hp -= 1;
    p.hitFlash = 1;
    if (p.hp <= 0) {
      p.dead = true;
      this.compact();
    } else {
      this.events.push({ kind: 'hit', pos: v2(p.pos.x, p.pos.y) });
    }
    return p;
  }

  /** Force-remove a sweeper by id (ship contact). */
  destroy(id) {
    const p = this.sweepers.find(x => x.id === id && !x.dead);
    if (!p) return null;
    p.dead = true;
    this.compact();
    return p;
  }

  drainEvents() { const e = this.events; this.events = []; return e; }

  compact() {
    let w = 0;
    for (let i = 0; i < this.sweepers.length; i++) {
      if (!this.sweepers[i].dead) this.sweepers[w++] = this.sweepers[i];
    }
    this.sweepers.length = w;
  }

  get count() { return this.sweepers.length; }
  clear() { this.sweepers.length = 0; this.events.length = 0; this.nextId = 1; } // I190: fresh ID space per run
}
