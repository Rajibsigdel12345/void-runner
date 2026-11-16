// ST-418: GUNSHIP - a slow, high-HP heavy bomber (wave 8+). Enters from the arena
// rim to a mid-arena hold point, then lingers and fires LOB-STYLE heavy shots:
// it ARMS (the render brightens the payload-bay glow 0xff9a3d), then fires a
// slow, big aimed bolt (slower and larger than a normal enemy bolt). Ten hits to
// kill; it also self-destructs after maxAge (the I129 seeker maxAge precedent) so
// it cannot pile onto later waves. On death (killed or expired) it emits a 'death'
// event -> the main.js explosion + chaff popups. DOM-free, three-free. All entry
// bearing, hold point, drift phase and first-shot delay flow through the world RNG.
import { CONFIG } from './config.js';
import { v2, v2Len, v2Norm } from './math.js';

export class GunshipField {
  constructor(rng, cfg = CONFIG) {
    this.rng = rng;
    this.cfg = cfg;
    this.gunships = [];
    this.events = []; // { kind: 'arm' | 'fire' | 'hit' | 'death', pos, dir?, self? }
    this.nextId = 1;
  }

  /** Spawn a gunship at the rim, aiming to a mid-arena hold point. */
  spawn(shipPos = null) {
    const s = this.cfg.gunship;
    if (this.gunships.length >= s.maxConcurrent) return null;
    const R = this.cfg.arena.radius;
    // hold point in the mid-arena (rng bearing/radius), at least rimDist from the ship
    let hx = 0, hy = 0;
    for (let i = 0; i < 8; i++) {
      const hr = this.rng.range(s.holdRadiusMin, s.holdRadiusMax) * R;
      const ha = this.rng.next() * Math.PI * 2;
      hx = Math.cos(ha) * hr; hy = Math.sin(ha) * hr;
      if (!shipPos || Math.hypot(hx - shipPos.x, hy - shipPos.y) >= s.rimDist) break;
    }
    const spawnA = this.rng.next() * Math.PI * 2;
    const sr = R - s.radius;
    const pos = v2(Math.cos(spawnA) * sr, Math.sin(spawnA) * sr);
    const toHold = v2Norm(v2(hx - pos.x, hy - pos.y));
    this.gunships.push({
      id: this.nextId++,
      pos,
      holdPos: { x: hx, y: hy },
      driftCenter: null, // set at enter->hold (the actual arrival point)
      vel: v2(toHold.x * s.enterSpeed, toHold.y * s.enterSpeed),
      radius: s.radius,
      state: 'enter',
      hp: s.hp,
      age: 0,
      holdT: 0,
      phase: this.rng.next() * Math.PI * 2,   // deterministic drift direction
      fireTimer: this.rng.range(s.fireEvery * 0.5, s.fireEvery), // first shot sooner
      armed: false,
      armT: 0,
      hitFlash: 0,
      dead: false,
    });
    return this.gunships[this.gunships.length - 1];
  }

  /** Advance all gunships. dt is game-time (slow-mo scaled). shipPos for aim. */
  step(dt, shipPos) {
    const s = this.cfg.gunship;
    const R = this.cfg.arena.radius;
    for (const g of this.gunships) {
      if (g.dead) continue;
      g.age += dt;
      g.hitFlash = Math.max(0, g.hitFlash - 3 * dt); // enemyHitFlash decay (flyer dome rate)
      if (g.state === 'enter') {
        g.pos.x += g.vel.x * dt;
        g.pos.y += g.vel.y * dt;
        if (Math.hypot(g.holdPos.x - g.pos.x, g.holdPos.y - g.pos.y) < s.holdDist) {
          g.state = 'hold';
          g.driftCenter = { x: g.pos.x, y: g.pos.y }; // drift around the arrival point (no pop)
          g.holdT = 0;
        }
      } else { // hold: slow deterministic drift (eases in) + arm/fire cadence
        g.holdT += dt;
        const ang = g.holdT * s.driftOmega + g.phase;
        const rr = s.driftR * Math.min(1, g.holdT / 2.0);
        g.pos.x = g.driftCenter.x + Math.cos(ang) * rr;
        g.pos.y = g.driftCenter.y + Math.sin(ang) * rr;
        const d = v2Len(g.pos), maxd = R - g.radius;
        if (d > maxd) { g.pos.x *= maxd / d; g.pos.y *= maxd / d; }
        if (!g.armed) {
          g.fireTimer -= dt;
          if (g.fireTimer <= 0) { g.armed = true; g.armT = 0; this.events.push({ kind: 'arm', pos: v2(g.pos.x, g.pos.y) }); }
        } else {
          g.armT += dt;
          if (g.armT >= s.armDur) {
            const dir = v2Norm(v2(shipPos.x - g.pos.x, shipPos.y - g.pos.y));
            this.events.push({ kind: 'fire', pos: v2(g.pos.x, g.pos.y), dir: { x: dir.x, y: dir.y } });
            g.armed = false;
            g.fireTimer = s.fireEvery;
          }
        }
      }
      if (g.age >= s.maxAge) { // self-destruct (seeker maxAge precedent)
        g.dead = true;
        this.events.push({ kind: 'death', pos: v2(g.pos.x, g.pos.y), self: true });
      }
    }
    this.compact();
  }

  /** Damage a gunship by id. Returns the gunship (dead = hp hit 0); emits 'hit' / 'death'. */
  hit(id) {
    const g = this.gunships.find(x => x.id === id && !x.dead);
    if (!g) return null;
    g.hp -= 1;
    g.hitFlash = 1;
    if (g.hp <= 0) {
      g.dead = true; // lethal kill: game.js resolveBulletGunships awards score + emits gunshipDeath
      this.compact();
    } else {
      this.events.push({ kind: 'hit', pos: v2(g.pos.x, g.pos.y) });
    }
    return g;
  }

  /** Force-remove a gunship by id (ship contact). No score; FX burst via game.js. */
  destroy(id) {
    const g = this.gunships.find(x => x.id === id && !x.dead);
    if (!g) return null;
    g.dead = true;
    this.compact();
    return g;
  }

  drainEvents() { const e = this.events; this.events = []; return e; }

  compact() {
    let w = 0;
    for (let i = 0; i < this.gunships.length; i++) {
      if (!this.gunships[i].dead) this.gunships[w++] = this.gunships[i];
    }
    this.gunships.length = w;
  }

  get count() { return this.gunships.length; }
  clear() { this.gunships.length = 0; this.events.length = 0; this.nextId = 1; } // I190: fresh ID space per run
}
