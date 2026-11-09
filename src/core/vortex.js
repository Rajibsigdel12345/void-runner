// ST-059: gravity vortex - a periodic pull field. Pure core: no DOM, no three.
// Lifecycle: idle (scheduling) -> telegraph (warning) -> active (pull) -> idle.
// The vortex mutates rock velocities in place and reports a ship pull vector;
// World applies the ship pull and drains the emitted events.
import { v2 } from './math.js';

export class VortexField {
  constructor(rng, cfg) {
    this.rng = rng;
    this.cfg = cfg;
    this.phase = 'idle';
    this.pos = v2(0, 0);
    this.timer = 0;      // phase countdown (telegraph / active)
    this.nextIn = 0;     // idle countdown to the next telegraph
    this.pending = [];   // events to drain
    this.rolls = 0;      // number of times a vortex has engaged
    this.rearm();
  }

  /** Roll a fresh idle countdown from the seeded interval band. */
  rearm() {
    const c = this.cfg.vortex;
    this.timer = 0;
    this.nextIn = this.rng.range(c.intervalMin, c.intervalMax);
  }

  reset() {
    this.phase = 'idle';
    this.pos = v2(0, 0);
    this.pending.length = 0;
    this.rolls = 0;
    this.rearm();
  }

  /** Test/future hook: force an active vortex at (x, y), skipping scheduling. */
  activateAt(x, y) {
    this.phase = 'active';
    this.pos = v2(x, y);
    this.timer = this.cfg.vortex.duration;
  }

  eligible(wave) { return wave >= this.cfg.vortex.firstWave; }

  drain() { const e = this.pending; this.pending = []; return e; }

  /**
   * Advance the vortex. Mutates rock velocities in place (rocks inside the
   * radius are accelerated toward the center).
   * @param {number} dt seconds
   * @param {{wave:number, shipPos:{x:number,y:number}, rocks:Array}} ctx
   * @returns {{pull:{x:number,y:number}|null, events:Array}} pull is the
   *   acceleration World should add to the ship this step (null when the ship
   *   is outside the radius or the vortex is not active).
   */
  step(dt, ctx) {
    const c = this.cfg.vortex;
    let pull = null;
    if (this.phase === 'idle') {
      if (this.eligible(ctx.wave)) {
        this.nextIn -= dt;
        if (this.nextIn <= 0) this.spawn(ctx);
      }
    } else if (this.phase === 'telegraph') {
      this.timer -= dt;
      if (this.timer <= 0) {
        this.phase = 'active';
        this.timer = c.duration;
        this.pending.push({ type: 'vortexStart', data: { pos: { x: this.pos.x, y: this.pos.y } } });
      }
    } else if (this.phase === 'active') {
      this.timer -= dt;
      const R = c.radius;
      for (const r of ctx.rocks) {
        if (r.dead) continue;
        const dx = this.pos.x - r.pos.x, dy = this.pos.y - r.pos.y;
        const d = Math.hypot(dx, dy);
        if (d >= R || d === 0) continue;
        const s = (c.pullRocks / d) * dt;
        r.vel.x += dx * s;
        r.vel.y += dy * s;
      }
      const sx = this.pos.x - ctx.shipPos.x, sy = this.pos.y - ctx.shipPos.y;
      const sd = Math.hypot(sx, sy);
      if (sd < R && sd > 0) {
        const s = c.pullShip / sd;
        pull = { x: sx * s, y: sy * s };
      }
      if (this.timer <= 0) {
        this.phase = 'idle';
        this.pending.push({ type: 'vortexEnd', data: { pos: { x: this.pos.x, y: this.pos.y } } });
        this.rearm();
      }
    }
    const events = this.drain();
    return { pull, events };
  }

  /** Pick a deterministic, fair spawn: disk fully inside the arena, center at
   * least minDistFromShip from the ship (re-rolled, bounded tries). */
  spawn(ctx) {
    const c = this.cfg.vortex;
    const R = this.cfg.arena.radius - c.radius - 4;
    let px = 0, py = 0, tries = 0;
    do {
      const a = this.rng.next() * Math.PI * 2;
      const d = this.rng.next() * Math.max(0, R);
      px = Math.cos(a) * d;
      py = Math.sin(a) * d;
      tries++;
    } while (Math.hypot(px - ctx.shipPos.x, py - ctx.shipPos.y) < c.minDistFromShip && tries < 10);
    this.pos = v2(px, py);
    this.phase = 'telegraph';
    this.timer = c.telegraph;
    this.rolls += 1;
    this.pending.push({ type: 'vortexTelegraph', data: { pos: { x: px, y: py }, in: c.telegraph } });
  }
}
