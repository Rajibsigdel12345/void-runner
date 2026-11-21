// ST-518 (E75): BEACON - the signal island (wave 19+). Mid-arena spawn 6-10 u
// from the ship at a spawn-time bearing, stationary: enter (1.0 s, materialize
// + callout) -> idle (0.8 s) -> charge (1.5 s brightening telegraph - the lamp
// IS the warning, the 'charge' event fires at charge start) -> release (emits
// 'release' {pos, bearing} - game.js rim-spawns escortCount 2 drones via the
// drone field; a full drone field drops silently - the beacon NEVER
// hard-blocks) -> idle; after releaseCap 3 releases it is spent (self-death).
// 8 hits (+750, the new top non-boss rung). Contact costs a life. DOM-free,
// three-free. Determinism: the offset distance, bearing and initial idle
// phase are frozen RNG draws at spawn; step() draws no RNG so pinned runs
// stay bit-identical. The field pushes 'charge' {self:true}, 'release'
// {bearing}, 'hit' (non-lethal) and 'death' (spent or self-expiry only - a
// bullet kill emits nothing from the field; game.js reads q.dead, awards +
// emits).
import { CONFIG } from './config.js';
import { v2 } from './math.js';

export class BeaconField {
  constructor(rng, cfg = CONFIG) {
    this.rng = rng;
    this.cfg = cfg;
    this.beacons = [];
    this.events = []; // { kind: 'charge' | 'release' | 'hit' | 'death', pos, bearing?, self? }
    this.nextId = 1;
  }

  /** Spawn one beacon in the mid-arena (offset 6-10 u from the ship).
   * Returns the beacon, or null to defer (the live cap is full). */
  spawn(shipPos = null) {
    const s = this.cfg.beacon;
    if (this.beacons.length >= s.maxConcurrent) return null;
    const d = s.spawnOffMin + this.rng.next() * (s.spawnOffMax - s.spawnOffMin); // FROZEN draw 1: offset
    const a = this.rng.next() * Math.PI * 2; // FROZEN draw 2: bearing
    const cx = shipPos ? shipPos.x : 0;
    const cy = shipPos ? shipPos.y : 0;
    this.beacons.push({
      id: this.nextId++,
      pos: v2(cx + Math.cos(a) * d, cy + Math.sin(a) * d),
      vel: v2(),
      radius: s.radius,
      state: 'enter',
      t: 0,
      age: 0,
      hp: s.hp,
      hitFlash: 0,
      dead: false,
      releases: 0,
      idleT: this.rng.next() * s.idleTime, // FROZEN draw 3: initial idle phase
    });
    return this.beacons[this.beacons.length - 1];
  }

  /** Advance all beacons. dt is game-time (slow-mo scaled). shipPos is the
   * release-aim target (the escorts rim-spawn away from the player anyway).
   * No RNG here. */
  step(dt, shipPos) {
    const s = this.cfg.beacon;
    for (const p of this.beacons) {
      if (p.dead) continue;
      p.age += dt;
      p.hitFlash = Math.max(0, p.hitFlash - 3 * dt);
      if (p.state === 'enter') {
        // Materialize + callout window (the lamp powers up).
        p.t += dt;
        if (p.t >= s.enterDur) {
          p.state = 'idle';
          p.t = p.idleT; // the pre-rolled idle phase
        }
      } else if (p.state === 'idle') {
        p.t += dt;
        if (p.t >= s.idleTime) {
          p.state = 'charge';
          p.t = 0;
          this.events.push({ kind: 'charge', pos: v2(p.pos.x, p.pos.y), self: true });
        }
      } else { // charge
        p.t += dt;
        if (p.t >= s.chargeTime) {
          // RELEASE: the bearing is the ship at release time (the aim read);
          // game.js rim-spawns the escorts away from the player.
          const b = Math.atan2(shipPos.y - p.pos.y, shipPos.x - p.pos.x);
          p.releases++;
          this.events.push({ kind: 'release', pos: v2(p.pos.x, p.pos.y), bearing: b });
          if (p.releases >= s.releaseCap) {
            // Spent: the source is gone.
            p.dead = true;
            this.events.push({ kind: 'death', pos: v2(p.pos.x, p.pos.y), self: true });
          } else {
            p.state = 'idle';
            p.t = 0;
          }
        }
      }
      if (!p.dead && p.age >= s.maxAge) { // hard-cap self-expiry
        p.dead = true;
        this.events.push({ kind: 'death', pos: v2(p.pos.x, p.pos.y), self: true });
      }
    }
    this.compact();
  }

  /** Damage a beacon by id. Non-lethal pushes 'hit'; LETHAL marks dead only -
   * game.js reads q.dead to award + emit. */
  hit(id) {
    const p = this.beacons.find(x => x.id === id && !x.dead);
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

  /** Force-remove a beacon by id (ship contact). */
  destroy(id) {
    const p = this.beacons.find(x => x.id === id && !x.dead);
    if (!p) return null;
    p.dead = true;
    this.compact();
    return p;
  }

  drainEvents() { const e = this.events; this.events = []; return e; }

  compact() {
    let w = 0;
    for (let i = 0; i < this.beacons.length; i++) {
      if (!this.beacons[i].dead) this.beacons[w++] = this.beacons[i];
    }
    this.beacons.length = w;
  }

  get count() { return this.beacons.length; }
  clear() { this.beacons.length = 0; this.events.length = 0; this.nextId = 1; } // I190: fresh ID space per run
}
