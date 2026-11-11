// ST-229: STINGER charger - a telegraphed line-of-sight dash rammer (wave 7+).
// DOM-free, three-free. Per-stinger state machine:
//   cruise (slow homing at cruiseSpeed) -> telegraph (0.8 s: aim LOCKS to the
//   ship's position; the render layer glows the core cyan -> white and adds a
//   motion-gated wobble) -> charge (straight line at chargeSpeed along the locked
//   aim, chargeDur seconds or until the arena rim) -> recover (1.2 s vulnerable
//   drift) -> cruise again. Six charges of life, then it fizzles in place
//   (the I129 seeker maxAge precedent - a stinger that outlives its use expires
//   before it can pile onto later waves).
// 1 bullet kills it (+250, feeds the combo). Contact with the ship costs a life,
// no score (the mine/seeker contact flow). Determinism: the cruise window,
// wobble phase and spawn bearing all flow through the world RNG, so seeded
// replays match.
import { CONFIG } from './config.js';
import { v2, v2Len } from './math.js';

export class StingerField {
  constructor(rng, cfg = CONFIG) {
    this.rng = rng;
    this.cfg = cfg;
    this.stingers = [];
    this.events = []; // transient, drained by game.js after step(): { kind: 'telegraph' | 'charge' | 'fizzle', pos }
    this.nextId = 1;
  }

  /** Spawn a stinger at the arena rim, at least rimDist away from the ship. */
  spawn(shipPos = null) {
    const s = this.cfg.stinger;
    if (this.stingers.length >= s.maxConcurrent) return null;
    const r = this.cfg.arena.radius - s.radius;
    let a = this.rng.next() * Math.PI * 2;
    if (shipPos) {
      for (let i = 0; i < 8 && Math.hypot(Math.cos(a) * r - shipPos.x, Math.sin(a) * r - shipPos.y) < s.rimDist; i++) {
        a = this.rng.next() * Math.PI * 2;
      }
    }
    const pos = v2(Math.cos(a) * r, Math.sin(a) * r);
    const home = Math.atan2(-pos.y, -pos.x); // start heading inward
    this.stingers.push({
      id: this.nextId++,
      pos,
      vel: v2(Math.cos(home) * s.cruiseSpeed, Math.sin(home) * s.cruiseSpeed),
      radius: s.radius,
      state: 'cruise',
      t: 0,
      cruiseDur: this.rng.range(s.cruiseMin, s.cruiseMax),
      aim: null,     // locked aim point (ship position at telegraph start)
      aimDir: null,  // normalized aim direction (set with aim)
      chargesUsed: 0,
      wobblePhase: this.rng.next() * Math.PI * 2, // render-only telegraph shudder phase (visual)
      dead: false,
    });
    return this.stingers[this.stingers.length - 1];
  }

  /** Advance all stingers through the state machine. dt is game-time (slow-mo scaled). */
  step(dt, shipPos) {
    const s = this.cfg.stinger;
    const R = this.cfg.arena.radius;
    for (const st of this.stingers) {
      if (st.dead) continue;
      st.t += dt;
      if (st.state === 'cruise') {
        // gentle homing at constant cruise speed (always far slower than the ship)
        const cur = Math.atan2(st.vel.y, st.vel.x);
        const tgt = Math.atan2(shipPos.y - st.pos.y, shipPos.x - st.pos.x);
        let diff = tgt - cur;
        while (diff > Math.PI) diff -= 2 * Math.PI;
        while (diff < -Math.PI) diff += 2 * Math.PI;
        const maxTurn = s.cruiseTurn * dt;
        const ang = cur + (diff > maxTurn ? maxTurn : diff < -maxTurn ? -maxTurn : diff);
        st.vel.x = Math.cos(ang) * s.cruiseSpeed;
        st.vel.y = Math.sin(ang) * s.cruiseSpeed;
        st.pos.x += st.vel.x * dt;
        st.pos.y += st.vel.y * dt;
        if (st.t >= st.cruiseDur) this.startTelegraph(st, shipPos);
      } else if (st.state === 'telegraph') {
        // holds position (the render layer adds the motion-gated wobble; the
        // core stays still so the aim lock is exact). Aim locked at start.
        st.vel.x = 0;
        st.vel.y = 0;
        if (st.t >= s.telegraph) this.startCharge(st, s);
      } else if (st.state === 'charge') {
        st.pos.x += st.vel.x * dt;
        st.pos.y += st.vel.y * dt;
        if (st.t >= s.chargeDur || v2Len(st.pos) + st.radius >= R) { this.stateRecover(st); }
      } else { // recover: vulnerable drift - speed decays back to cruise, re-aims softly
        const cur = Math.atan2(st.vel.y, st.vel.x);
        const tgt = Math.atan2(shipPos.y - st.pos.y, shipPos.x - st.pos.x);
        let diff = tgt - cur;
        while (diff > Math.PI) diff -= 2 * Math.PI;
        while (diff < -Math.PI) diff += 2 * Math.PI;
        const maxTurn = s.cruiseTurn * 0.6 * dt;
        const ang = cur + (diff > maxTurn ? maxTurn : diff < -maxTurn ? -maxTurn : diff);
        const sp0 = v2Len(st.vel);
        const sp = sp0 + (s.cruiseSpeed - sp0) * Math.min(1, 3 * dt); // decay toward cruise speed
        st.vel.x = Math.cos(ang) * sp;
        st.vel.y = Math.sin(ang) * sp;
        st.pos.x += st.vel.x * dt;
        st.pos.y += st.vel.y * dt;
        if (st.t >= s.recover) {
          if (st.chargesUsed >= s.maxCharges) { // charge budget spent: fizzle in place
            st.dead = true;
            this.events.push({ kind: 'fizzle', pos: v2(st.pos.x, st.pos.y) });
          } else {
            st.state = 'cruise';
            st.t = 0;
            st.cruiseDur = this.rng.range(s.cruiseMin, s.cruiseMax);
          }
        }
      }
    }
    this.compact();
  }

  /** Telegraph: lock the aim to the ship's position NOW (the charge never re-aims). */
  startTelegraph(st, shipPos) {
    st.state = 'telegraph';
    st.t = 0;
    const dx = shipPos.x - st.pos.x, dy = shipPos.y - st.pos.y;
    const len = Math.hypot(dx, dy) || 1;
    st.aim = { x: shipPos.x, y: shipPos.y };
    st.aimDir = { x: dx / len, y: dy / len };
    this.events.push({ kind: 'telegraph', pos: v2(st.pos.x, st.pos.y) });
  }

  startCharge(st, s) {
    st.state = 'charge';
    st.t = 0;
    st.chargesUsed++;
    st.vel.x = st.aimDir.x * s.chargeSpeed;
    st.vel.y = st.aimDir.y * s.chargeSpeed;
    this.events.push({ kind: 'charge', pos: v2(st.pos.x, st.pos.y) });
  }

  stateRecover(st) { st.state = 'recover'; st.t = 0; }

  /** Destroy a stinger by id (bullet kill). Returns the stinger or null. */
  destroy(id) {
    const st = this.stingers.find(x => x.id === id && !x.dead);
    if (!st) return null;
    st.dead = true;
    this.compact();
    return st;
  }

  drainEvents() { const e = this.events; this.events = []; return e; }

  compact() {
    let w = 0;
    for (let i = 0; i < this.stingers.length; i++) {
      if (!this.stingers[i].dead) this.stingers[w++] = this.stingers[i];
    }
    this.stingers.length = w;
  }

  get count() { return this.stingers.length; }
  clear() { this.stingers.length = 0; this.events.length = 0; this.nextId = 1; } // I190: fresh ID space per run
}