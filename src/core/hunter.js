// ST-418: HUNTER - a rear-approach stalker (wave 6+). Pairs with the I445/I446
// camera work (the arena stays visible behind the ship): the hunter orbits to a
// REAR bearing (behind the ship's nose), telegraphs (the render deploys the W-fins
// and ramps the threat-red core 0xff4a2a), then DASHES in a straight line from
// behind toward the ship's position at lock time - a telegraphed, dodgeable rear
// attack. Five dashes, then it fizzles (the I129 stinger maxAge precedent).
// DOM-free, three-free. Mirrors the StingerField state machine (orbit ->
// telegraph -> dash -> recover) with the cruise retargeted to the rear anchor and
// the dash aimed from behind. 1 bullet kills (+300, feeds the combo). Contact
// costs a life, no score (the mine/stinger contact flow). Determinism: the orbit
// window, spawn bearing and drift phase all flow through the world RNG.
import { CONFIG } from './config.js';
import { v2, v2Len, angDiff } from './math.js';

export class HunterField {
  constructor(rng, cfg = CONFIG) {
    this.rng = rng;
    this.cfg = cfg;
    this.hunters = [];
    this.events = []; // transient, drained by game.js after step(): { kind: 'telegraph' | 'dash' | 'fizzle', pos }
    this.nextId = 1;
  }

  /** Spawn a hunter at the arena rim, at least rimDist away from the ship. */
  spawn(shipPos = null) {
    const s = this.cfg.hunter;
    if (this.hunters.length >= s.maxConcurrent) return null;
    const r = this.cfg.arena.radius - s.radius;
    let a = this.rng.next() * Math.PI * 2;
    if (shipPos) {
      for (let i = 0; i < 8 && Math.hypot(Math.cos(a) * r - shipPos.x, Math.sin(a) * r - shipPos.y) < s.rimDist; i++) {
        a = this.rng.next() * Math.PI * 2;
      }
    }
    const pos = v2(Math.cos(a) * r, Math.sin(a) * r);
    const home = Math.atan2(-pos.y, -pos.x); // start heading inward
    this.hunters.push({
      id: this.nextId++,
      pos,
      vel: v2(Math.cos(home) * s.orbitSpeed, Math.sin(home) * s.orbitSpeed),
      radius: s.radius,
      state: 'orbit',
      t: 0,
      orbitDur: this.rng.range(s.orbitDurMin, s.orbitDurMax),
      aim: null,     // locked aim point (ship position at telegraph start)
      aimDir: null,  // normalized dash direction (hunter -> ship; a rear approach)
      chargesUsed: 0,
      tumblePhase: this.rng.next() * Math.PI * 2, // render-only idle-tumble phase
      dead: false,
    });
    return this.hunters[this.hunters.length - 1];
  }

  /**
   * Advance all hunters. dt is game-time (slow-mo scaled). shipPos is the ship
   * position, shipAim the ship's nose angle (radians): the rear anchor sits
   * orbitR BEHIND the ship along its nose axis, so the hunter swings to it.
   */
  step(dt, shipPos, shipAim) {
    const s = this.cfg.hunter;
    const R = this.cfg.arena.radius;
    for (const h of this.hunters) {
      if (h.dead) continue;
      h.t += dt;
      if (h.state === 'orbit') {
        // turn-limited homing to the rear anchor (a point behind the ship's nose).
        this.steerToward(h, this.rearAnchor(shipPos, shipAim, s), s.orbitSpeed, s.orbitTurn, dt);
        if (h.t >= h.orbitDur) this.startTelegraph(h, shipPos);
      } else if (h.state === 'telegraph') {
        // holds position (the render deploys the W-fins + ramps the red core; the
        // core stays still so the aim lock is exact).
        h.vel.x = 0;
        h.vel.y = 0;
        if (h.t >= s.telegraph) this.startDash(h, s);
      } else if (h.state === 'dash') {
        h.pos.x += h.vel.x * dt;
        h.pos.y += h.vel.y * dt;
        if (h.t >= s.dashDur || v2Len(h.pos) + h.radius >= R) this.stateRecover(h);
      } else { // recover: vulnerable drift - re-aims softly back to the rear anchor
        this.steerToward(h, this.rearAnchor(shipPos, shipAim, s), s.orbitSpeed, s.orbitTurn * 0.6, dt, 0.6);
        if (h.t >= s.recover) {
          if (h.chargesUsed >= s.maxCharges) {
            h.dead = true;
            this.events.push({ kind: 'fizzle', pos: v2(h.pos.x, h.pos.y) });
          } else {
            h.state = 'orbit';
            h.t = 0;
            h.orbitDur = this.rng.range(s.orbitDurMin, s.orbitDurMax);
          }
        }
      }
    }
    this.compact();
  }

  /** The rear anchor: orbitR behind the ship along its nose axis. */
  rearAnchor(shipPos, shipAim, s) {
    const fx = Math.cos(shipAim), fy = Math.sin(shipAim);
    return { x: shipPos.x - fx * s.orbitR, y: shipPos.y - fy * s.orbitR };
  }

  /** Turn-limited homing toward a point at speed (speedMul scales the target speed). */
  steerToward(h, target, speed, turn, dt, speedMul = 1) {
    const cur = Math.atan2(h.vel.y, h.vel.x);
    const tgt = Math.atan2(target.y - h.pos.y, target.x - h.pos.x);
    const diff = angDiff(cur, tgt);
    const maxTurn = turn * dt;
    const ang = cur + (diff > maxTurn ? maxTurn : diff < -maxTurn ? -maxTurn : diff);
    const sp = speed * speedMul;
    h.vel.x = Math.cos(ang) * sp;
    h.vel.y = Math.sin(ang) * sp;
    h.pos.x += h.vel.x * dt;
    h.pos.y += h.vel.y * dt;
  }

  /** Telegraph: lock the aim to the ship's position NOW (the dash never re-aims). */
  startTelegraph(h, shipPos) {
    h.state = 'telegraph';
    h.t = 0;
    const dx = shipPos.x - h.pos.x, dy = shipPos.y - h.pos.y;
    const len = Math.hypot(dx, dy) || 1;
    h.aim = { x: shipPos.x, y: shipPos.y };
    h.aimDir = { x: dx / len, y: dy / len };
    this.events.push({ kind: 'telegraph', pos: v2(h.pos.x, h.pos.y) });
  }

  startDash(h, s) {
    h.state = 'dash';
    h.t = 0;
    h.chargesUsed++;
    h.vel.x = h.aimDir.x * s.dashSpeed;
    h.vel.y = h.aimDir.y * s.dashSpeed;
    this.events.push({ kind: 'dash', pos: v2(h.pos.x, h.pos.y) });
  }

  stateRecover(h) { h.state = 'recover'; h.t = 0; }

  /** Destroy a hunter by id (bullet kill). Returns the hunter or null. */
  destroy(id) {
    const h = this.hunters.find(x => x.id === id && !x.dead);
    if (!h) return null;
    h.dead = true;
    this.compact();
    return h;
  }

  drainEvents() { const e = this.events; this.events = []; return e; }

  compact() {
    let w = 0;
    for (let i = 0; i < this.hunters.length; i++) {
      if (!this.hunters[i].dead) this.hunters[w++] = this.hunters[i];
    }
    this.hunters.length = w;
  }

  get count() { return this.hunters.length; }
  clear() { this.hunters.length = 0; this.events.length = 0; this.nextId = 1; } // I190: fresh ID space per run
}
