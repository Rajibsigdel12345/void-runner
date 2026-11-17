// ST-448 (E63): WASP - a popcorn dasher (wave 12+). Spawns as a V-PACK of 3 at the
// rim; each wasp then runs its own state machine independently (a partial pack kill
// leaves survivors that continue). CORKSCREW (the anticipation phase) toward the
// player, nose glowing threat-red, for 1.0-1.2 s (the F2 floor), then a straight-line
// DASH at the player position as predicted at dash start (15.5 u/s = 1.107x the ship's
// 14, under the 1.15x F2 cap and < 16 absolute). One shot to kill (+100). Contact costs
// a life, no score. DOM-free, three-free. Mirrors the HunterField one-shot contract:
// 'dash' (the lunge), 'death' (self-expiry only - a bullet kill emits nothing from the
// field; game.js awards + emits). Determinism: the pack bearing, corkscrew duration and
// spiral phase all flow through the world RNG; the wave gate in game.js returns before
// any spawn draw, so a pinned W2-3 run never sees a wasp.
import { CONFIG } from './config.js';
import { v2, v2Len } from './math.js';

const SPIRAL_WOBBLE = 0.5; // rad: heading oscillation amplitude during the corkscrew

export class WaspField {
  constructor(rng, cfg = CONFIG) {
    this.rng = rng;
    this.cfg = cfg;
    this.wasps = [];
    this.events = []; // { kind: 'dash' | 'death', pos, self? }
    this.nextId = 1;
  }

  /** Number of live wasps that are NOT split-children (the cap counts only these). */
  nonSplitCount() {
    let n = 0;
    for (const w of this.wasps) if (!w.dead && !w.splitChild) n++;
    return n;
  }

  /** Spawn one V-pack of 3 wasps at the rim (atomic). Returns the array, or null to
   * defer (the live non-split cap is full - the pack never overflows the render pool). */
  spawn(shipPos = null) {
    const s = this.cfg.wasp;
    if (this.nonSplitCount() + 3 > s.maxConcurrent) return null;
    const r = this.cfg.arena.radius - s.radius;
    let a0 = this.rng.next() * Math.PI * 2;
    if (shipPos) {
      for (let i = 0; i < 8 && Math.hypot(Math.cos(a0) * r - shipPos.x, Math.sin(a0) * r - shipPos.y) < s.rimDist; i++) {
        a0 = this.rng.next() * Math.PI * 2;
      }
    }
    const pack = [];
    for (const off of [-1, 0, 1]) {
      const a = a0 + off * s.packSpread;
      pack.push(this.spawnAt(v2(Math.cos(a) * r, Math.sin(a) * r), false));
    }
    return pack;
  }

  /** Spawn a single wasp at pos (NOT cap-gated - used for split-children too).
   * Rim-clamped so a split child near the arena edge cannot spawn outside it. */
  spawnAt(pos, splitChild = false) {
    const s = this.cfg.wasp;
    const r = this.cfg.arena.radius - s.radius;
    const d = Math.hypot(pos.x, pos.y);
    if (d > r) { const k = r / d; pos.x *= k; pos.y *= k; }
    this.wasps.push({
      id: this.nextId++,
      pos,
      vel: v2(),
      radius: s.radius,
      state: 'corkscrew',
      t: 0,
      age: 0,
      corkscrewDur: this.rng.range(s.corkscrewDurMin, s.corkscrewDurMax),
      spiralPhase: this.rng.next() * Math.PI * 2,
      splitChild: !!splitChild,
      dead: false,
    });
    return this.wasps[this.wasps.length - 1];
  }

  /** Advance all wasps. dt is game-time (slow-mo scaled). shipPos is the aim target. */
  step(dt, shipPos) {
    const s = this.cfg.wasp;
    const R = this.cfg.arena.radius;
    for (const w of this.wasps) {
      if (w.dead) continue;
      w.age += dt;
      const dx = shipPos.x - w.pos.x, dy = shipPos.y - w.pos.y;
      if (w.state === 'corkscrew') {
        w.t += dt;
        const base = Math.atan2(dy, dx);
        const heading = base + SPIRAL_WOBBLE * Math.sin(s.corkscrewOmega * w.t + w.spiralPhase);
        w.vel.x = Math.cos(heading) * s.corkscrewSpeed;
        w.vel.y = Math.sin(heading) * s.corkscrewSpeed;
        w.pos.x += w.vel.x * dt;
        w.pos.y += w.vel.y * dt;
        if (w.t >= w.corkscrewDur) { // predict-and-dash at the ship's position NOW
          const len = Math.hypot(dx, dy) || 1;
          w.vel.x = dx / len * s.dashSpeed;
          w.vel.y = dy / len * s.dashSpeed;
          w.state = 'dash';
          w.t = 0;
          this.events.push({ kind: 'dash', pos: v2(w.pos.x, w.pos.y) });
        }
      } else { // dash: straight line until it ends or leaves the arena
        w.t += dt;
        w.pos.x += w.vel.x * dt;
        w.pos.y += w.vel.y * dt;
        if (w.t >= s.dashDur || v2Len(w.pos) + w.radius >= R) {
          w.state = 'corkscrew';
          w.t = 0;
          w.corkscrewDur = this.rng.range(s.corkscrewDurMin, s.corkscrewDurMax);
        }
      }
      if (w.age >= s.maxAge) { // self-destruct (seeker maxAge precedent)
        w.dead = true;
        this.events.push({ kind: 'death', pos: v2(w.pos.x, w.pos.y), self: true });
      }
    }
    this.compact();
  }

  /** Destroy a wasp by id (bullet kill - one shot). Returns the wasp or null. */
  destroy(id) {
    const w = this.wasps.find(x => x.id === id && !x.dead);
    if (!w) return null;
    w.dead = true;
    this.compact();
    return w;
  }

  drainEvents() { const e = this.events; this.events = []; return e; }

  compact() {
    let w = 0;
    for (let i = 0; i < this.wasps.length; i++) {
      if (!this.wasps[i].dead) this.wasps[w++] = this.wasps[i];
    }
    this.wasps.length = w;
  }

  get count() { return this.wasps.length; }
  clear() { this.wasps.length = 0; this.events.length = 0; this.nextId = 1; } // I190: fresh ID space per run
}
