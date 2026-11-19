// ST-484 (E69): BULWARK - the shield enforcer (wave 17+). Enters to a 8-10 u
// ring around the ship, then hovers: slow strafe around the ring (0.15 rad/s)
// while yaw-slewing (0.5 rad/s) to face the ship. Its FRONTAL shield arc
// (+/- 50 degrees about the heading) NEGATES incoming bullets - no damage,
// negations++, 'negate'; six negations overload the shield (negations reset,
// 1.5 s stun, 'stun'), and only while stunned does frontal damage land.
// Every 6.0 s it looses one slow bolt (0.6 s charge cue first; the 'fire'
// event carries NO dir - game.js re-aims at the ship via fireAimedBolt).
// Stun does not pause the cadence. 18 hits (+500). DOM-free, three-free.
// Determinism: the rim bearing, hold radius and strafe dir are frozen RNG
// draws at spawn; step() draws no RNG and the wave gate in game.js returns
// before any spawn draw, so pinned low-wave runs stay bit-identical. The
// field pushes 'fire' (no dir), 'charge', 'negate', 'stun', 'hit' (non-lethal
// damage) and 'death' (self-expiry only - a bullet kill emits nothing from
// the field; game.js reads q.dead, awards + emits).
import { CONFIG } from './config.js';
import { v2, v2Len, angDiff } from './math.js';

export class BulwarkField {
  constructor(rng, cfg = CONFIG) {
    this.rng = rng;
    this.cfg = cfg;
    this.bulwarks = [];
    this.events = []; // { kind: 'fire' | 'charge' | 'negate' | 'stun' | 'hit' | 'death', pos, self? }
    this.nextId = 1;
  }

  /** Spawn one bulwark at the rim (away from the ship when a position is
   * given). Returns the bulwark, or null to defer (the live cap is full). */
  spawn(shipPos = null) {
    const s = this.cfg.bulwark;
    if (this.bulwarks.length >= s.maxConcurrent) return null;
    const r = this.cfg.arena.radius - s.radius;
    let a = this.rng.next() * Math.PI * 2;
    if (shipPos) {
      for (let i = 0; i < 8 && Math.hypot(Math.cos(a) * r - shipPos.x, Math.sin(a) * r - shipPos.y) < s.rimDist; i++) {
        a = this.rng.next() * Math.PI * 2;
      }
    }
    this.bulwarks.push({
      id: this.nextId++,
      pos: v2(Math.cos(a) * r, Math.sin(a) * r),
      vel: v2(),
      radius: s.radius,
      state: 'enter',
      t: 0,
      age: 0,
      hp: s.hp,
      bandA: a,
      holdR: this.rng.range(s.holdRMin, s.holdRMax),
      orbitA: 0,
      orbitR: 0,
      strafeDir: this.rng.next() < 0.5 ? -1 : 1,
      heading: a + Math.PI, // inward: face the arena centre (and the ship)
      fireTimer: s.boltEvery, // first bolt after a full interval
      charged: false,
      negations: 0,
      stunT: 0,
      hitFlash: 0,
      dead: false,
    });
    return this.bulwarks[this.bulwarks.length - 1];
  }

  /** Advance all bulwarks. dt is game-time (slow-mo scaled). shipPos is the
   * aim target. No RNG here. */
  step(dt, shipPos) {
    const s = this.cfg.bulwark;
    for (const b of this.bulwarks) {
      if (b.dead) continue;
      b.age += dt;
      b.hitFlash = Math.max(0, b.hitFlash - 3 * dt);
      if (b.stunT > 0) b.stunT = Math.max(0, b.stunT - dt); // stun does not pause cadence
      if (b.state === 'enter') {
        // Inward entry: home at enterSpeed toward the frozen ring bearing.
        b.t += dt;
        const tx = shipPos.x + Math.cos(b.bandA) * b.holdR - b.pos.x;
        const ty = shipPos.y + Math.sin(b.bandA) * b.holdR - b.pos.y;
        const tl = Math.hypot(tx, ty) || 1;
        b.vel.x = tx / tl * s.enterSpeed;
        b.vel.y = ty / tl * s.enterSpeed;
        b.pos.x += b.vel.x * dt;
        b.pos.y += b.vel.y * dt;
        b.heading = Math.atan2(b.vel.y, b.vel.x); // track the travel direction
        const d = v2Len({ x: b.pos.x - shipPos.x, y: b.pos.y - shipPos.y });
        if (b.t >= s.enterDur || Math.abs(d - b.holdR) < 1.0) {
          b.state = 'hover';
          b.t = 0;
          b.orbitR = Math.min(10, Math.max(8, d)); // range-keep to the hold ring
          b.orbitA = Math.atan2(b.pos.y - shipPos.y, b.pos.x - shipPos.x);
        }
      } else { // hover
        b.t += dt;
        b.orbitA += b.strafeDir * s.strafeOmega * dt;
        let r = v2Len({ x: b.pos.x - shipPos.x, y: b.pos.y - shipPos.y });
        const pull = b.holdR - r;
        r += Math.max(-0.5 * dt, Math.min(0.5 * dt, pull)); // range-keep at 0.5 u/s
        b.pos.x = shipPos.x + Math.cos(b.orbitA) * r;
        b.pos.y = shipPos.y + Math.sin(b.orbitA) * r;
        b.vel.x = (b.pos.x - shipPos.x) * s.strafeOmega; // ~tangential (renderer aid)
        b.vel.y = (b.pos.y - shipPos.y) * s.strafeOmega;
        // Yaw slew toward the ship at yawRate (the shield leads the nose).
        const want = Math.atan2(shipPos.y - b.pos.y, shipPos.x - b.pos.x);
        b.heading += Math.max(-s.yawRate * dt, Math.min(s.yawRate * dt, angDiff(b.heading, want)));
        // Slow bolt cadence.
        b.fireTimer -= dt;
        if (!b.charged && b.fireTimer <= s.boltTelegraph) {
          b.charged = true;
          this.events.push({ kind: 'charge', pos: v2(b.pos.x, b.pos.y) });
        }
        if (b.fireTimer <= 0) {
          b.charged = false;
          b.fireTimer += s.boltEvery;
          this.events.push({ kind: 'fire', pos: v2(b.pos.x, b.pos.y) }); // no dir: game.js re-aims
        }
      }
      if (b.age >= s.maxAge) { // self-destruct
        b.dead = true;
        this.events.push({ kind: 'death', pos: v2(b.pos.x, b.pos.y), self: true });
      }
    }
    this.compact();
  }

  /** Damage a bulwark by id. A bullet whose line from the hull lies inside
   * the frontal shield arc (|angDiff(heading, toBullet)| <= shieldArc) is
   * NEGATED: no damage, negations++, 'negate' - and the Nth negation overloads
   * the shield (negations -> 0, stunT, 'stun'). Otherwise standard hp -= 1;
   * LETHAL marks dead only - game.js reads q.dead to award + emit. */
  hit(id, bulletPos) {
    const b = this.bulwarks.find(x => x.id === id && !x.dead);
    if (!b) return null;
    const s = this.cfg.bulwark;
    b.hitFlash = 1;
    if (b.stunT <= 0 && bulletPos && Number.isFinite(bulletPos.x) && Number.isFinite(bulletPos.y)) {
      const toB = Math.atan2(bulletPos.y - b.pos.y, bulletPos.x - b.pos.x);
      if (Math.abs(angDiff(b.heading, toB)) <= s.shieldArc) {
        b.negations += 1;
        this.events.push({ kind: 'negate', pos: v2(b.pos.x, b.pos.y) });
        if (b.negations >= s.shieldHitsToStun) {
          b.negations = 0;
          b.stunT = s.shieldStunDur;
          this.events.push({ kind: 'stun', pos: v2(b.pos.x, b.pos.y) });
        }
        return b;
      }
    }
    b.hp -= 1;
    if (b.hp <= 0) {
      b.dead = true;
      this.compact();
    } else {
      this.events.push({ kind: 'hit', pos: v2(b.pos.x, b.pos.y) });
    }
    return b;
  }

  /** Force-remove a bulwark by id (ship contact). */
  destroy(id) {
    const b = this.bulwarks.find(x => x.id === id && !x.dead);
    if (!b) return null;
    b.dead = true;
    this.compact();
    return b;
  }

  drainEvents() { const e = this.events; this.events = []; return e; }

  compact() {
    let w = 0;
    for (let i = 0; i < this.bulwarks.length; i++) {
      if (!this.bulwarks[i].dead) this.bulwarks[w++] = this.bulwarks[i];
    }
    this.bulwarks.length = w;
  }

  get count() { return this.bulwarks.length; }
  clear() { this.bulwarks.length = 0; this.events.length = 0; this.nextId = 1; } // I190: fresh ID space per run
}
