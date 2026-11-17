// ST-448 (E63): POD - a drifting splitter (wave 13+). Spawns at the rim and drifts
// INWARD on a slow closed-form cosine wobble (no ship knowledge, no RNG in step():
// the wobble is a pure function of age + a fixed omega, so a pinned W2-3 run - where
// no pod ever spawns - draws zero extra RNG and stays bit-identical). 4 hits; on a
// LETHAL hit the field itself emits the 'death' event with split:true and game.js
// drives the 2 wasp split-children exactly once from that event (the field never
// spawns wasps). Natural expiry (maxAge) emits death with self:true, split:false.
// DOM-free, three-free.
import { CONFIG } from './config.js';
import { v2, v2Len } from './math.js';

const WOBBLE_OMEGA = 1.2; // rad/s: closed-form wobble frequency (fixed, not RNG)

export class PodField {
  constructor(rng, cfg = CONFIG) {
    this.rng = rng;
    this.cfg = cfg;
    this.pods = [];
    this.events = []; // { kind: 'hit' | 'death', pos, self?, split? }
    this.nextId = 1;
    this.ampScale = 1; // motion-reduction: main.js scales the wobble down (0.4)
  }

  /** Spawn one pod at the rim. Returns the pod, or null to defer (cap full). */
  spawn(shipPos = null) {
    const s = this.cfg.pod;
    if (this.pods.length >= s.maxConcurrent) return null;
    const r = this.cfg.arena.radius - s.radius;
    let a = this.rng.next() * Math.PI * 2;
    if (shipPos) {
      for (let i = 0; i < 8 && Math.hypot(Math.cos(a) * r - shipPos.x, Math.sin(a) * r - shipPos.y) < s.rimDist; i++) {
        a = this.rng.next() * Math.PI * 2;
      }
    }
    this.pods.push({
      id: this.nextId++,
      pos: v2(Math.cos(a) * r, Math.sin(a) * r),
      vel: v2(),
      radius: s.radius,
      hp: s.hp,
      age: 0,
      wobblePhase: this.rng.next() * Math.PI * 2,
      hitFlash: 0,
      dead: false,
    });
    return this.pods[this.pods.length - 1];
  }

  /** Advance all pods. NO shipPos, NO RNG - drift is closed-form in age. */
  step(dt) {
    const s = this.cfg.pod;
    for (const p of this.pods) {
      if (p.dead) continue;
      p.age += dt;
      p.hitFlash = Math.max(0, p.hitFlash - 3 * dt);
      const d = v2Len(p.pos);
      if (d > 1e-6) {
        const dirx = -p.pos.x / d, diry = -p.pos.y / d; // inward
        const perpX = -diry, perpY = dirx;
        const wob = s.driftWobble * this.ampScale * Math.cos(WOBBLE_OMEGA * p.age + p.wobblePhase); // amplitude = driftWobble (spec); omega is the frequency only
        p.vel.x = dirx * s.driftSpeed + perpX * wob;
        p.vel.y = diry * s.driftSpeed + perpY * wob;
        p.pos.x += p.vel.x * dt;
        p.pos.y += p.vel.y * dt;
      }
      if (p.age >= s.maxAge) { // natural expiry: no split
        p.dead = true;
        this.events.push({ kind: 'death', pos: v2(p.pos.x, p.pos.y), self: true, split: false });
      }
    }
    this.compact();
  }

  /** Damage a pod by id. Non-lethal emits 'hit'; LETHAL marks dead and emits
   * 'death' with split:true - game.js spawns the wasp children exactly once. */
  hit(id) {
    const p = this.pods.find(x => x.id === id && !x.dead);
    if (!p) return null;
    p.hp -= 1;
    p.hitFlash = 1;
    if (p.hp <= 0) {
      p.dead = true;
      this.events.push({ kind: 'death', pos: v2(p.pos.x, p.pos.y), self: false, split: true });
      this.compact();
    } else {
      this.events.push({ kind: 'hit', pos: v2(p.pos.x, p.pos.y) });
    }
    return p;
  }

  /** Force-remove a pod by id (ship contact). No score; FX burst via game.js. */
  destroy(id) {
    const p = this.pods.find(x => x.id === id && !x.dead);
    if (!p) return null;
    p.dead = true;
    this.compact();
    return p;
  }

  drainEvents() { const e = this.events; this.events = []; return e; }

  compact() {
    let w = 0;
    for (let i = 0; i < this.pods.length; i++) {
      if (!this.pods[i].dead) this.pods[w++] = this.pods[i];
    }
    this.pods.length = w;
  }

  get count() { return this.pods.length; }
  clear() { this.pods.length = 0; this.events.length = 0; this.nextId = 1; } // I190: fresh ID space per run
}
