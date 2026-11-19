// ST-484 (E69): PHANTOM - a flank-ambush cloaker (wave 13+). Spawns invisible
// (opacity 0) at the rim, flanks to an 11-u ring beside the ship, then cycles
// orbit (3.5 s, opacity 1.0) -> cloak (1.2 s, 1.0 -> 0.12) -> drift (1.0 s,
// 0.12) -> strike (2.5 s: 0.5 s uncloak, charge cue, 3-bolt spread aimed at
// the ship at fire time) -> orbit (8.2 s cycle). Targetable ONLY while opacity
// > targetOpacity (0.5) - bullets pass through the cloak with no feedback;
// contact costs a life regardless of cloak. 2 hits (+250, the stinger rung).
// DOM-free, three-free. Determinism: the rim bearing and strafe dir are frozen
// RNG draws at spawn; step() draws no RNG and the wave gate in game.js returns
// before any spawn draw, so pinned low-wave runs stay bit-identical. The field
// pushes 'fire' (bolt, with dir), 'charge' (anticipation cue), 'hit' (non-lethal
// damage) and 'death' (self-expiry only - a bullet kill emits nothing from the
// field; game.js reads q.dead, awards + emits).
import { CONFIG } from './config.js';
import { v2, v2Len } from './math.js';

export class PhantomField {
  constructor(rng, cfg = CONFIG) {
    this.rng = rng;
    this.cfg = cfg;
    this.phantoms = [];
    this.events = []; // { kind: 'fire' | 'charge' | 'hit' | 'death', pos, dir?, self? }
    this.nextId = 1;
  }

  /** Spawn one phantom at the rim (away from the ship when a position is given).
   * Returns the phantom, or null to defer (the live cap is full). */
  spawn(shipPos = null) {
    const s = this.cfg.phantom;
    if (this.phantoms.length >= s.maxConcurrent) return null;
    const r = this.cfg.arena.radius - s.radius;
    let a = this.rng.next() * Math.PI * 2;
    if (shipPos) {
      for (let i = 0; i < 8 && Math.hypot(Math.cos(a) * r - shipPos.x, Math.sin(a) * r - shipPos.y) < s.rimDist; i++) {
        a = this.rng.next() * Math.PI * 2;
      }
    }
    this.phantoms.push({
      id: this.nextId++,
      pos: v2(Math.cos(a) * r, Math.sin(a) * r),
      vel: v2(),
      radius: s.radius,
      state: 'enter',
      t: 0,
      age: 0,
      hp: s.hp,
      opacity: 0,
      bandA: a,
      orbitR: s.orbitR,
      orbitA: 0,
      strafeDir: this.rng.next() < 0.5 ? -1 : 1,
      burstFired: 0,
      chargeEmitted: false,
      hitFlash: 0,
      dead: false,
    });
    return this.phantoms[this.phantoms.length - 1];
  }

  /** Advance all phantoms. dt is game-time (slow-mo scaled). shipPos is the aim
   * target. No RNG here. */
  step(dt, shipPos) {
    const s = this.cfg.phantom;
    for (const p of this.phantoms) {
      if (p.dead) continue;
      p.age += dt;
      p.hitFlash = Math.max(0, p.hitFlash - 3 * dt);
      if (p.state === 'enter') {
        // Invisible flank: home at enterSpeed toward the frozen flank bearing.
        p.t += dt;
        const flankA = p.bandA + p.strafeDir * Math.PI / 2;
        const tx = shipPos.x + Math.cos(flankA) * p.orbitR - p.pos.x;
        const ty = shipPos.y + Math.sin(flankA) * p.orbitR - p.pos.y;
        const tl = Math.hypot(tx, ty) || 1;
        p.vel.x = tx / tl * s.enterSpeed;
        p.vel.y = ty / tl * s.enterSpeed;
        p.pos.x += p.vel.x * dt;
        p.pos.y += p.vel.y * dt;
        p.opacity = 0;
        if (p.t >= s.enterDur) {
          p.state = 'orbit';
          p.t = 0;
          p.orbitA = Math.atan2(p.pos.y - shipPos.y, p.pos.x - shipPos.x);
          p.opacity = 1.0; // the uncloak on the flank
        }
      } else {
        // Flank orbit - orbit / cloak / drift / strike all keep circling.
        p.t += dt;
        p.orbitA += p.strafeDir * (s.orbitSpeed / p.orbitR) * dt;
        let r = v2Len({ x: p.pos.x - shipPos.x, y: p.pos.y - shipPos.y });
        const pull = s.orbitR - r;
        r += Math.max(-3 * dt, Math.min(3 * dt, pull)); // range-keep to orbitR at 3 u/s
        p.pos.x = shipPos.x + Math.cos(p.orbitA) * r;
        p.pos.y = shipPos.y + Math.sin(p.orbitA) * r;
        p.vel.x = (p.pos.x - shipPos.x) * (s.orbitSpeed / p.orbitR); // ~tangential (renderer aid)
        p.vel.y = (p.pos.y - shipPos.y) * (s.orbitSpeed / p.orbitR);
        if (p.state === 'orbit') {
          p.opacity = 1.0;
          if (p.t >= s.orbitDur) { p.state = 'cloak'; p.t = 0; }
        } else if (p.state === 'cloak') {
          p.opacity = 1.0 - (1.0 - s.cloakOpacity) * Math.min(1, p.t / s.cloakDur); // linear 1.0 -> 0.12
          if (p.t >= s.cloakDur) { p.state = 'drift'; p.t = 0; }
        } else if (p.state === 'drift') {
          p.opacity = s.cloakOpacity; // hold the cloak floor
          if (p.t >= s.driftDur) {
            p.state = 'strike'; p.t = 0;
            p.burstFired = 0; p.chargeEmitted = false;
          }
        } else { // strike
          p.opacity = s.cloakOpacity + (1.0 - s.cloakOpacity) * Math.min(1, p.t / s.uncloakDur); // uncloak ramp
          if (!p.chargeEmitted && p.t >= s.uncloakDur) {
            p.chargeEmitted = true;
            this.events.push({ kind: 'charge', pos: v2(p.pos.x, p.pos.y) });
          }
          while (p.burstFired < s.burstCount && p.t >= s.uncloakDur + s.chargeDur + p.burstFired * s.burstGap) {
            const i = p.burstFired;
            p.burstFired++;
            const fx = shipPos.x - p.pos.x, fy = shipPos.y - p.pos.y;
            const fl = Math.hypot(fx, fy) || 1;
            const bx = fx / fl, by = fy / fl; // aimed AT FIRE TIME (middle bolt dead-aims)
            const off = (i - (s.burstCount - 1) / 2) * s.boltSpread;
            const c = Math.cos(off), sn = Math.sin(off);
            this.events.push({ kind: 'fire', pos: v2(p.pos.x, p.pos.y), dir: v2(bx * c - by * sn, bx * sn + by * c) });
          }
          if (p.t >= s.strikeDur) { p.state = 'orbit'; p.t = 0; }
        }
      }
      if (p.age >= s.maxAge) { // self-destruct (I5: snap readable before the death FX)
        p.dead = true;
        p.opacity = 1;
        this.events.push({ kind: 'death', pos: v2(p.pos.x, p.pos.y), self: true });
      }
    }
    this.compact();
  }

  /** Damage a phantom by id. Non-lethal pushes 'hit'; LETHAL marks dead only -
   * game.js reads q.dead to award + emit (the cloak read lives in the resolver). */
  hit(id) {
    const p = this.phantoms.find(x => x.id === id && !x.dead);
    if (!p) return null;
    p.hp -= 1;
    p.hitFlash = 1;
    if (p.hp <= 0) {
      p.dead = true;
      p.opacity = 1; // I5: the kill is always readable
      this.compact();
    } else {
      this.events.push({ kind: 'hit', pos: v2(p.pos.x, p.pos.y) });
    }
    return p;
  }

  /** Force-remove a phantom by id (ship contact - applies even mid-cloak). */
  destroy(id) {
    const p = this.phantoms.find(x => x.id === id && !x.dead);
    if (!p) return null;
    p.dead = true;
    p.opacity = 1;
    this.compact();
    return p;
  }

  drainEvents() { const e = this.events; this.events = []; return e; }

  compact() {
    let w = 0;
    for (let i = 0; i < this.phantoms.length; i++) {
      if (!this.phantoms[i].dead) this.phantoms[w++] = this.phantoms[i];
    }
    this.phantoms.length = w;
  }

  get count() { return this.phantoms.length; }
  clear() { this.phantoms.length = 0; this.events.length = 0; this.nextId = 1; } // I190: fresh ID space per run
}
