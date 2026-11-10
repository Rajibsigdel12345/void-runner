// Void Runner - power-up field core (ST-019). DOM-free, three-free.
// Drops spawn at kill positions, drift, bounce off the arena rim, and (while
// MAGNET is active) accelerate toward the ship. Pickup radius gates collection.
// Timed effects refresh (no stacking) on same-type pickup; BOMB is instant
// (dur 0) and is queued for World to resolve (shatter-all lands in I23).
import { CONFIG } from './config.js';
import { v2, v2Len } from './math.js';

export const POWERUP_TYPES = Object.freeze(['rapid', 'spread', 'shield', 'bomb', 'magnet', 'overdrive', 'slowmo']);
const TIMED = Object.freeze(['rapid', 'spread', 'shield', 'magnet', 'overdrive', 'slowmo']);

export class PowerUpField {
  constructor(rng, cfg = CONFIG) {
    this.rng = rng;
    this.cfg = cfg;
    this.drops = [];
    this.timeLeft = { rapid: 0, spread: 0, shield: 0, magnet: 0, overdrive: 0, slowmo: 0 };
    this.shieldHits = 0; // hits absorbed while the shield timer is alive
    this.pendingInstant = null; // 'bomb' queued for World
    this.nextId = 1;
  }

  get count() { return this.drops.length; }
  active(type) { return this.timeLeft[type] > 0; }
  isShielding() { return this.shieldHits > 0; }

  /** I130: weighted drop-table roll - ONE RNG draw; weights rescale over their sum; zero-weight types never roll. */
  pickType() {
    const ws = this.cfg.powerup.weights;
    let total = 0;
    for (const t of POWERUP_TYPES) total += ws[t] || 0;
    let r = this.rng.next() * (total || POWERUP_TYPES.length);
    for (const t of POWERUP_TYPES) {
      r -= ws[t] || 0;
      if (r < 0) return t;
    }
    return POWERUP_TYPES[POWERUP_TYPES.length - 1]; // float-edge guard
  }

  /** @returns {boolean} true when a shield hit was absorbed this call. */
  consumeShieldHit() {
    if (this.shieldHits <= 0) return false;
    this.shieldHits--;
    return true;
  }

  /** Roll a drop at a kill position. Honors maxActiveDrops. Returns drop or null. */
  maybeDrop(pos) {
    const p = this.cfg.powerup;
    if (this.drops.length >= p.maxActiveDrops) return null;
    if (!this.rng.chance(p.dropChance)) return null;
    const type = this.pickType(); // I130: weighted table (was uniform 1/7)
    const a = this.rng.next() * Math.PI * 2;
    const drop = {
      id: this.nextId++,
      type,
      pos: v2(pos.x, pos.y),
      vel: v2(Math.cos(a) * p.drift, Math.sin(a) * p.drift),
      life: p.dropLife, // I130: counts down with the (full, unscaled) dt passed to step()
      dead: false,
    };
    this.drops.push(drop);
    return drop;
  }

  /** Enable (or refresh) an effect for a pickup type. */
  apply(type) {
    const t = this.cfg.powerup.types[type];
    if (!t) return;
    if (t.dur > 0) {
      this.timeLeft[type] = t.dur; // refresh, never stack
      if (type === 'shield') this.shieldHits = 1;
    } else {
      this.pendingInstant = type; // bomb (dur 0) -> World resolves
    }
  }

  /** World calls after consuming the queued instant effect. */
  takeInstant() {
    const i = this.pendingInstant;
    this.pendingInstant = null;
    return i;
  }

  /**
   * Drift, magnet pull, arena bounce, pickup.
   * @param {number} dt seconds
   * @param {{pos:{x:number,y:number}}} ship
   * @returns {Array<{id:number,type:string,pos:{x:number,y:number}}>} pickups this frame
   */
  step(dt, ship) {
    const p = this.cfg.powerup;
    const R = this.cfg.arena.radius;
    const pickups = [];
    for (const d of this.drops) {
      if (d.dead) continue;
      d.life -= dt; // I130: drop lifetime (game-time; player-side, so NOT slow-mo scaled)
      if (d.life <= 0) { d.dead = true; continue; } // I130: expired - frees the pool (compactDrops below)
      const dx = ship.pos.x - d.pos.x;
      const dy = ship.pos.y - d.pos.y;
      const dist = v2Len(v2(dx, dy));
      if (this.active('magnet') && dist < p.magnetRadius && dist > 0.001) {
        const acc = p.magnetAccel; // strong pull inside the magnet ring (I38: now a config tunable)
        d.vel.x += (dx / dist) * acc * dt;
        d.vel.y += (dy / dist) * acc * dt;
      }
      d.pos.x += d.vel.x * dt;
      d.pos.y += d.vel.y * dt;
      // arena bounce (same rule as rocks)
      const dd = v2Len(d.pos);
      if (dd > R) {
        const inv = 1 / (dd || 1);
        const nx = d.pos.x * inv, ny = d.pos.y * inv;
        const dot = d.vel.x * nx + d.vel.y * ny;
        if (dot > 0) { d.vel.x -= 2 * dot * nx; d.vel.y -= 2 * dot * ny; }
        const push = dd - R;
        d.pos.x -= nx * push;
        d.pos.y -= ny * push;
      }
      if (dist < p.pickupRadius) {
        d.dead = true;
        this.apply(d.type);
        pickups.push({ id: d.id, type: d.type, pos: { x: d.pos.x, y: d.pos.y } });
      }
    }
    for (const t of TIMED) {
      if (this.timeLeft[t] > 0) {
        this.timeLeft[t] = Math.max(0, this.timeLeft[t] - dt);
        if (this.timeLeft[t] === 0 && t === 'shield') this.shieldHits = 0;
      }
    }
    if (this.drops.some((d) => d.dead)) this.compactDrops(); // ST-074: no per-frame array alloc
    return pickups;
  }

  /** In-place removal of dead drops (ST-074: zero per-frame allocations; keeps array identity). */
  compactDrops() {
    let w = 0;
    for (let i = 0; i < this.drops.length; i++) {
      if (!this.drops[i].dead) this.drops[w++] = this.drops[i];
    }
    this.drops.length = w;
  }

  clear() {
    this.drops.length = 0;
    this.timeLeft = { rapid: 0, spread: 0, shield: 0, magnet: 0, overdrive: 0, slowmo: 0 };
    this.shieldHits = 0;
    this.pendingInstant = null;
  }
}
