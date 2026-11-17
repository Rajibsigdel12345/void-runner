// ST-448 (E63): SENTRY - a mid-range aimed shooter (wave 11+, never on boss waves).
// Enters from the arena rim to an orbital band around the ship (prefRMin..prefRMax),
// HOLDS (strafes the band), AIMs (slews the barrel at a turn limit), then CHARGES
// (the render ramps the charge glow over the telegraph floor >= 0.7 s) and fires a
// 3-bolt spread - the middle bolt dead-aimed at the ship at the moment it leaves
// the barrel. Three hits to kill (+350, feeds the combo). Self-destructs after
// maxAge (the I129 seeker maxAge precedent) so it cannot pile onto later waves.
// DOM-free, three-free. Mirrors the GunshipField event contract: 'hit' (non-lethal),
// 'charge' (the telegraph), 'fire' (one bolt, dir included), 'death' (self-expiry
// only - a bullet kill emits nothing from the field; game.js awards + emits).
// Determinism: spawn bearing, strafe direction, hold window and cooldown window all
// flow through the world RNG; the wave gate in game.js returns before any spawn draw.
import { CONFIG } from './config.js';
import { v2, angDiff, clamp } from './math.js';

export class SentryField {
  constructor(rng, cfg = CONFIG) {
    this.rng = rng;
    this.cfg = cfg;
    this.sentries = [];
    this.events = []; // { kind: 'hit' | 'charge' | 'fire' | 'death', pos, dir?, self? }
    this.nextId = 1;
  }

  /** Spawn a sentry at the rim, aiming at its orbital band around the ship. */
  spawn(shipPos = null) {
    const s = this.cfg.sentry;
    if (this.sentries.length >= s.maxConcurrent) return null;
    const r = this.cfg.arena.radius - s.radius;
    let a = this.rng.next() * Math.PI * 2;
    if (shipPos) {
      for (let i = 0; i < 8 && Math.hypot(Math.cos(a) * r - shipPos.x, Math.sin(a) * r - shipPos.y) < s.rimDist; i++) {
        a = this.rng.next() * Math.PI * 2;
      }
    }
    const pos = v2(Math.cos(a) * r, Math.sin(a) * r);
    const d = Math.hypot(pos.x, pos.y) || 1;
    this.sentries.push({
      id: this.nextId++,
      pos,
      vel: v2(-pos.x / d * s.enterSpeed, -pos.y / d * s.enterSpeed), // inward
      radius: s.radius,
      state: 'enter',
      t: 0,
      age: 0,
      hp: s.hp,
      bandA: a,             // spawn bearing = the band it orbits (relative to the ship)
      orbitR: 0,            // set at enter->hold (distance from the ship)
      orbitA: 0,            // set at enter->hold (bearing from the ship)
      strafeDir: this.rng.next() < 0.5 ? -1 : 1,
      aimAngle: a + Math.PI, // faces inward (toward the arena center)
      holdT: this.rng.range(s.holdMin, s.holdMax),
      fireT: 0,
      burstFired: 0,
      hitFlash: 0,
      dead: false,
    });
    return this.sentries[this.sentries.length - 1];
  }

  /** Advance all sentries. dt is game-time (slow-mo scaled). shipPos for the band. */
  step(dt, shipPos) {
    const s = this.cfg.sentry;
    const midR = (s.prefRMin + s.prefRMax) / 2;
    for (const q of this.sentries) {
      if (q.dead) continue;
      q.age += dt;
      q.hitFlash = Math.max(0, q.hitFlash - 3 * dt); // enemyHitFlash decay (flyer dome rate)
      if (q.state === 'enter') {
        // home at the band point (spawn bearing, mid-band radius) relative to the ship
        const tx = shipPos.x + Math.cos(q.bandA) * midR;
        const ty = shipPos.y + Math.sin(q.bandA) * midR;
        const dx = tx - q.pos.x, dy = ty - q.pos.y;
        const dl = Math.hypot(dx, dy) || 1;
        q.vel.x = dx / dl * s.enterSpeed;
        q.vel.y = dy / dl * s.enterSpeed;
        q.pos.x += q.vel.x * dt;
        q.pos.y += q.vel.y * dt;
        q.aimAngle = Math.atan2(q.vel.y, q.vel.x);
        const dist = Math.hypot(q.pos.x - shipPos.x, q.pos.y - shipPos.y);
        if (Math.abs(dist - midR) < 1.0) {
          q.state = 'hold';
          q.t = 0;
          q.orbitR = clamp(dist, s.prefRMin, s.prefRMax);
          q.orbitA = Math.atan2(q.pos.y - shipPos.y, q.pos.x - shipPos.x);
        }
      } else if (q.state === 'hold') {
        q.t += dt;
        this.orbit(q, shipPos, s, midR, 1.0, dt);
        if (q.t >= q.holdT) { q.state = 'aim'; q.t = 0; }
      } else if (q.state === 'aim') {
        q.t += dt;
        this.orbit(q, shipPos, s, midR, 0.5, dt);
        const want = Math.atan2(shipPos.y - q.pos.y, shipPos.x - q.pos.x);
        this.slew(q, want, s.aimTurn, dt);
        if (Math.abs(angDiff(q.aimAngle, want)) <= 0.15 || q.t >= 2.5) {
          q.state = 'charge';
          q.t = 0;
          this.events.push({ kind: 'charge', pos: v2(q.pos.x, q.pos.y) });
        }
      } else if (q.state === 'charge') {
        q.t += dt;
        q.vel.x = 0; q.vel.y = 0; // frozen while charging (the glow ramp is the cue)
        const want = Math.atan2(shipPos.y - q.pos.y, shipPos.x - q.pos.x);
        this.slew(q, want, s.aimTurn, dt);
        if (q.t >= s.telegraph) { q.state = 'burst'; q.t = 0; q.burstFired = 0; }
      } else if (q.state === 'burst') {
        q.t += dt;
        q.vel.x = 0; q.vel.y = 0;
        const want = Math.atan2(shipPos.y - q.pos.y, shipPos.x - q.pos.x); // bearing to ship NOW
        for (let i = q.burstFired; i < s.burstCount; i++) { // fire only bolts not yet fired (no re-fire per step)
          if (q.t >= i * s.burstGap) {
            const off = (i - (s.burstCount - 1) / 2) * s.boltSpread; // middle bolt dead-aimed
            this.events.push({ kind: 'fire', pos: v2(q.pos.x, q.pos.y), dir: { x: Math.cos(want + off), y: Math.sin(want + off) } });
            q.burstFired = i + 1;
          } else break;
        }
        if (q.burstFired >= s.burstCount) {
          q.state = 'cooldown';
          q.t = 0;
          q.fireT = this.rng.range(s.fireMin, s.fireMax);
        }
      } else { // cooldown: orbit again, keep the barrel on the ship
        q.t += dt;
        this.orbit(q, shipPos, s, midR, 1.0, dt);
        q.aimAngle = Math.atan2(shipPos.y - q.pos.y, shipPos.x - q.pos.x);
        if (q.t >= q.fireT) {
          q.state = 'hold';
          q.t = 0;
          q.holdT = this.rng.range(s.holdMin, s.holdMax);
        }
      }
      if (q.age >= s.maxAge) { // self-destruct (seeker maxAge precedent)
        q.dead = true;
        this.events.push({ kind: 'death', pos: v2(q.pos.x, q.pos.y), self: true });
      }
    }
    this.compact();
  }

  /** Turn-limited slew of the barrel toward want (radians). */
  slew(q, want, turn, dt) {
    const diff = angDiff(q.aimAngle, want);
    const maxTurn = turn * dt;
    q.aimAngle += diff > maxTurn ? maxTurn : diff < -maxTurn ? -maxTurn : diff;
  }

  /** Strafe orbit around the ship at orbitR, range-kept to the pref band. */
  orbit(q, shipPos, s, midR, strafeMul, dt) {
    q.orbitA += q.strafeDir * s.strafeOmega * strafeMul * dt;
    let radV = 0;
    if (q.orbitR < s.prefRMin - s.rangeKeep) radV = s.enterSpeed;
    else if (q.orbitR > s.prefRMax + s.rangeKeep) radV = -s.enterSpeed;
    else if (q.orbitR !== midR) radV = (midR > q.orbitR ? 1 : -1) * 0.5 * s.enterSpeed;
    q.orbitR += radV * dt;
    const ca = Math.cos(q.orbitA), sa = Math.sin(q.orbitA);
    q.pos.x = shipPos.x + ca * q.orbitR;
    q.pos.y = shipPos.y + sa * q.orbitR;
    const tanV = q.strafeDir * s.strafeOmega * strafeMul * q.orbitR; // tangential (strafe) speed
    q.vel.x = ca * radV - sa * tanV;
    q.vel.y = sa * radV + ca * tanV;
  }

  /** Damage a sentry by id. Returns the sentry (dead = hp hit 0); emits 'hit' if non-lethal. */
  hit(id) {
    const q = this.sentries.find(x => x.id === id && !x.dead);
    if (!q) return null;
    q.hp -= 1;
    q.hitFlash = 1;
    if (q.hp <= 0) {
      q.dead = true; // lethal kill: game.js resolveBulletSentries awards score + emits sentryDeath
      this.compact();
    } else {
      this.events.push({ kind: 'hit', pos: v2(q.pos.x, q.pos.y) });
    }
    return q;
  }

  /** Force-remove a sentry by id (ship contact). No score; FX burst via game.js. */
  destroy(id) {
    const q = this.sentries.find(x => x.id === id && !x.dead);
    if (!q) return null;
    q.dead = true;
    this.compact();
    return q;
  }

  drainEvents() { const e = this.events; this.events = []; return e; }

  compact() {
    let w = 0;
    for (let i = 0; i < this.sentries.length; i++) {
      if (!this.sentries[i].dead) this.sentries[w++] = this.sentries[i];
    }
    this.sentries.length = w;
  }

  get count() { return this.sentries.length; }
  clear() { this.sentries.length = 0; this.events.length = 0; this.nextId = 1; } // I190: fresh ID space per run
}