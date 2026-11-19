// ST-484 (E69): HAULER - the slow ore truck (wave 15+ by spec; wave 15 is a
// boss wave (boss.everyWave 5) so the standard gate makes its effective debut
// wave 16 - ST-487 adjudicates). Spawns at the rim, aims a frozen target
// ahead of and to one side of the ship, homes at 8 u/s for up to 2.0 s, then
// plods on a CLOSED-FORM path: constant 3.5 u/s along a frozen heading plus
// a 1.2 Hz +/-0.5 u wobble perpendicular to it; ping-pongs off the arena rim.
// Every 4.0 s it drops a mine (0.4 s telegraph first) flying opposite its
// current travel. It never shoots; no opacity. 12 hits (+400, the flyer rung).
// DOM-free, three-free. Determinism: every geometric random draw is frozen at
// spawn; step() draws no RNG and the wave gate in game.js returns before any
// spawn draw, so pinned low-wave runs stay bit-identical. The field pushes
// 'mineDrop' (with dir), 'telegraph', 'hit' (non-lethal damage) and 'death'
// (self-expiry only - a bullet kill emits nothing from the field; game.js
// reads q.dead, awards + emits). A pending drop auto-cancels on death
// (dead entities are skipped); dropped mines persist (game-owned).
import { CONFIG } from './config.js';
import { v2, v2Len, v2Norm } from './math.js';

export class HaulerField {
  constructor(rng, cfg = CONFIG) {
    this.rng = rng;
    this.cfg = cfg;
    this.haulers = [];
    this.events = []; // { kind: 'mineDrop' | 'telegraph' | 'hit' | 'death', pos, dir?, self? }
    this.nextId = 1;
  }

  /** Spawn one hauler targeting a spot in the ship's forward arc. shipAim is
   * the ship heading at spawn. Returns the hauler, or null to defer (the live
   * cap is full). */
  spawn(shipPos, shipAim) {
    const s = this.cfg.hauler;
    if (this.haulers.length >= s.maxConcurrent) return null;
    const r = this.cfg.arena.radius - s.radius;
    let a = this.rng.next() * Math.PI * 2;
    for (let i = 0; i < 8 && Math.hypot(Math.cos(a) * r - shipPos.x, Math.sin(a) * r - shipPos.y) < s.rimDist; i++) {
      a = this.rng.next() * Math.PI * 2;
    }
    const sp = v2(Math.cos(a) * r, Math.sin(a) * r);
    // Frozen geometry draws: the target is forwardOff u ahead of the ship
    // (along its aim) and latOff u to one side.
    const forwardOff = this.rng.range(s.forwardOffMin, s.forwardOffMax);
    const latSign = this.rng.next() < 0.5 ? -1 : 1;
    const latOff = this.rng.range(s.lateralOffMin, s.lateralOffMax);
    const fx = Math.cos(shipAim), fy = Math.sin(shipAim);
    let tx = shipPos.x + fx * forwardOff - fy * latSign * latOff;
    let ty = shipPos.y + fy * forwardOff + fx * latSign * latOff;
    const tl = v2Len({ x: tx, y: ty });
    if (tl > r) { tx = tx / tl * r; ty = ty / tl * r; } // keep the target inside the rim
    const heading = v2Norm({ x: tx - sp.x, y: ty - sp.y });
    const perp = v2(-heading.y, heading.x);
    this.haulers.push({
      id: this.nextId++,
      pos: sp,
      vel: v2(),
      radius: s.radius,
      state: 'enter',
      t: 0,
      age: 0,
      hp: s.hp,
      target: v2(tx, ty),
      plodOrigin: null, // fresh copy at the enter -> plod transition
      headingVec: heading,
      perpVec: perp,
      wobblePhase: this.rng.next() * Math.PI * 2,
      mineTimer: s.mineEvery, // first drop only after a full interval
      telegraphed: false,
      hitFlash: 0,
      dead: false,
    });
    return this.haulers[this.haulers.length - 1];
  }

  /** Advance all haulers. dt is game-time (slow-mo scaled). No shipPos, no RNG. */
  step(dt) {
    const s = this.cfg.hauler;
    for (const h of this.haulers) {
      if (h.dead) continue;
      h.age += dt;
      h.hitFlash = Math.max(0, h.hitFlash - 3 * dt);
      if (h.state === 'enter') {
        h.t += dt;
        const dx = h.target.x - h.pos.x, dy = h.target.y - h.pos.y;
        const d = Math.hypot(dx, dy) || 1;
        h.vel.x = dx / d * s.enterSpeed;
        h.vel.y = dy / d * s.enterSpeed;
        h.pos.x += h.vel.x * dt;
        h.pos.y += h.vel.y * dt;
        if (h.t >= s.enterDur || d < 0.75) {
          h.state = 'plod';
          h.t = 0;
          h.plodOrigin = v2(h.pos.x, h.pos.y); // fresh copy (FRESH COPY MATTERS)
        }
      } else { // plod - CLOSED FORM. Order matters: position -> velocity ->
        // rim reversal -> mine cadence (a drop decided this frame flies behind
        // the heading AFTER any same-frame reversal).
        h.t += dt;
        const wob = Math.sin(s.wobbleFreq * h.t + h.wobblePhase) * s.wobbleAmp;
        h.pos.x = h.plodOrigin.x + h.headingVec.x * s.speed * h.t + h.perpVec.x * wob;
        h.pos.y = h.plodOrigin.y + h.headingVec.y * s.speed * h.t + h.perpVec.y * wob;
        const wv = Math.cos(s.wobbleFreq * h.t + h.wobblePhase) * (s.wobbleFreq * s.wobbleAmp);
        h.vel.x = h.headingVec.x * s.speed + h.perpVec.x * wv;
        h.vel.y = h.headingVec.y * s.speed + h.perpVec.y * wv;
        if (v2Len(h.pos) + h.radius >= this.cfg.arena.radius) { // rim ping-pong
          const l = v2Len(h.pos) || 1;
          h.pos.x = h.pos.x / l * (this.cfg.arena.radius - h.radius);
          h.pos.y = h.pos.y / l * (this.cfg.arena.radius - h.radius);
          h.plodOrigin = v2(h.pos.x, h.pos.y);
          h.t = 0;
          h.headingVec = v2(-h.headingVec.x, -h.headingVec.y);
          h.perpVec = v2(-h.perpVec.x, -h.perpVec.y);
        }
        h.mineTimer -= dt;
        if (!h.telegraphed && h.mineTimer <= s.dropTelegraph) {
          h.telegraphed = true;
          this.events.push({ kind: 'telegraph', pos: v2(h.pos.x, h.pos.y) });
        }
        if (h.mineTimer <= 0) {
          h.telegraphed = false;
          h.mineTimer += s.mineEvery;
          this.events.push({ kind: 'mineDrop', pos: v2(h.pos.x, h.pos.y), dir: v2(-h.headingVec.x, -h.headingVec.y) });
        }
      }
      if (h.age >= s.maxAge) { // self-destruct; the pending drop auto-cancels
        h.dead = true; // (dead is skipped above); dropped mines are game-owned
        this.events.push({ kind: 'death', pos: v2(h.pos.x, h.pos.y), self: true });
      }
    }
    this.compact();
  }

  /** Damage a hauler by id. Non-lethal pushes 'hit'; LETHAL marks dead only -
   * game.js reads q.dead to award + emit. */
  hit(id) {
    const h = this.haulers.find(x => x.id === id && !x.dead);
    if (!h) return null;
    h.hp -= 1;
    h.hitFlash = 1;
    if (h.hp <= 0) {
      h.dead = true;
      this.compact();
    } else {
      this.events.push({ kind: 'hit', pos: v2(h.pos.x, h.pos.y) });
    }
    return h;
  }

  /** Force-remove a hauler by id (ship contact). */
  destroy(id) {
    const h = this.haulers.find(x => x.id === id && !x.dead);
    if (!h) return null;
    h.dead = true;
    this.compact();
    return h;
  }

  drainEvents() { const e = this.events; this.events = []; return e; }

  compact() {
    let w = 0;
    for (let i = 0; i < this.haulers.length; i++) {
      if (!this.haulers[i].dead) this.haulers[w++] = this.haulers[i];
    }
    this.haulers.length = w;
  }

  get count() { return this.haulers.length; }
  clear() { this.haulers.length = 0; this.events.length = 0; this.nextId = 1; } // I190: fresh ID space per run
}
