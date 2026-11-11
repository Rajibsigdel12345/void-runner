// ST-232: FLYER evasive enemy - the Asteroids-UFO skill target (wave 9+).
// DOM-free, three-free. Enters from the arena rim (15 u from the ship) and
// crosses on a straight line at cruiseSpeed with a perpendicular sinusoidal
// weave: the lateral motion never stops, so hitting one demands a LEAD SHOT -
// the game has camera lead but no bullet aim-assist (the flyer is the game's
// one pure skill-shot target).
// Two exits, both NO score (the stinger fizzle precedent): the arena rim
// (|pos| + radius >= arena radius) or its lifetime (9-12 s game-time - the
// slot frees before the flyer can pile onto later waves).
// 2 S-bullets to kill (+400, feeds the combo). NO contact lethality: it is a
// target, not a threat - keeps the dodge/aim split clean (stinger = dodge
// verb, flyer = aim verb).
// Determinism: entry bearing, crossing direction, initial weave-velocity
// sign and lifetime all flow through the world RNG, so seeded replays match.
// The weave is a stateful harmonic oscillator (semi-implicit Euler, bounded
// - no drift), so a mid-run reduced-motion ampScale change is CONTINUOUS:
// position and velocity never jump, only the amplitude adapts (motion is
// kept - the weave is the enemy's identity; stinger glow-kept/wobble-gated
// precedent applied to the motion itself).
import { CONFIG } from './config.js';
import { v2, v2Len } from './math.js';

export class FlyerField {
  constructor(rng, cfg = CONFIG) {
    this.rng = rng;
    this.cfg = cfg;
    this.flyers = [];
    this.events = []; // transient, drained by game.js after step(): { kind: 'hit' | 'exit', pos }
    this.nextId = 1;
    this.ampScale = 1; // main.js sets this (1 = full weave; reduced motion scales down)
  }

  /** Spawn a flyer at the arena rim, at least rimDist away from the ship.
   *  The crossing direction points inward with a random lateral offset, so a
   *  flyer traverses most of the arena before it exits. */
  spawn(shipPos = null) {
    const s = this.cfg.flyer;
    if (this.flyers.length >= s.maxConcurrent) return null;
    const r = this.cfg.arena.radius - s.radius - 1.0; // 1 u inside the rim: the exit check (|pos| + radius >= R) must not fire on spawn
    let a = this.rng.next() * Math.PI * 2;
    if (shipPos) {
      for (let i = 0; i < 8 && Math.hypot(Math.cos(a) * r - shipPos.x, Math.sin(a) * r - shipPos.y) < s.rimDist; i++) {
        a = this.rng.next() * Math.PI * 2;
      }
    }
    const pos = v2(Math.cos(a) * r, Math.sin(a) * r);
    const heading = a + Math.PI + this.rng.range(-s.crossLatMax, s.crossLatMax); // inward + lateral offset
    const sign = this.rng.next() < 0.5 ? -1 : 1; // which side of the line the weave starts
    this.flyers.push({
      id: this.nextId++,
      pos,
      entry: { x: pos.x, y: pos.y },
      dir: { x: Math.cos(heading), y: Math.sin(heading) },
      radius: s.radius,
      t: 0,
      lifetime: this.rng.range(s.lifetimeMin, s.lifetimeMax),
      weaveOff: 0, // lateral offset from the cruise line (u)
      weaveVel: sign * s.weaveAmp * this.ampScale * ((2 * Math.PI) / s.weavePeriod), // start at peak lateral speed
      hits: 0,
      hitFlash: 0, // render juice: 1 on a hit, decays in step()
      dead: false,
    });
    return this.flyers[this.flyers.length - 1];
  }

  /** Advance all flyers. dt is game-time (slow-mo scaled). */
  step(dt) {
    const s = this.cfg.flyer;
    const R = this.cfg.arena.radius;
    const w = (2 * Math.PI) / s.weavePeriod;
    for (const f of this.flyers) {
      if (f.dead) continue;
      f.t += dt;
      f.hitFlash = Math.max(0, f.hitFlash - 3 * dt);
      // weave amplitude tracks ampScale smoothly (0.5 s blend, no position jump).
      // The lateral nudge goes to pos too, so pos stays EXACTLY on the weave state
      // (lateral projection of pos - entry == weaveOff, to fp precision).
      const px = -f.dir.y, py = f.dir.x; // perpendicular to the crossing direction
      const target = s.weaveAmp * this.ampScale;
      const amp = Math.hypot(f.weaveOff, f.weaveVel / w);
      if (amp > 1e-9) {
        const k = 1 + (target / amp - 1) * Math.min(1, 2 * dt);
        if (k !== 1) {
          const dOff = (k - 1) * f.weaveOff;
          f.weaveOff += dOff;
          f.weaveVel *= k;
          f.pos.x += px * dOff;
          f.pos.y += py * dOff;
        }
      }
      // harmonic oscillator around the cruise line (semi-implicit Euler: bounded)
      f.weaveVel += -w * w * f.weaveOff * dt;
      f.weaveOff += f.weaveVel * dt;
      f.pos.x += (f.dir.x * s.cruiseSpeed + px * f.weaveVel) * dt;
      f.pos.y += (f.dir.y * s.cruiseSpeed + py * f.weaveVel) * dt;
      if (f.t >= f.lifetime || v2Len(f.pos) + f.radius >= R) {
        f.dead = true;
        this.events.push({ kind: 'exit', pos: v2(f.pos.x, f.pos.y) });
      }
    }
    this.compact();
  }

  /** Damage a flyer by id (bullet hit). Returns the flyer (dead = killed). */
  hit(id) {
    const f = this.flyers.find(x => x.id === id && !x.dead);
    if (!f) return null;
    f.hits++;
    if (f.hits >= this.cfg.flyer.hitsToKill) {
      f.dead = true;
      this.compact();
    } else {
      f.hitFlash = 1;
      this.events.push({ kind: 'hit', pos: v2(f.pos.x, f.pos.y) });
    }
    return f;
  }

  drainEvents() { const e = this.events; this.events = []; return e; }

  compact() {
    let w = 0;
    for (let i = 0; i < this.flyers.length; i++) {
      if (!this.flyers[i].dead) this.flyers[w++] = this.flyers[i];
    }
    this.flyers.length = w;
  }

  get count() { return this.flyers.length; }
  clear() { this.flyers.length = 0; this.events.length = 0; this.nextId = 1; } // I190: fresh ID space per run
}
