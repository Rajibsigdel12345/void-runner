// ST-300: boss encounter telemetry (E32). Pure, DOM-free, three-free.
// External event subscriber: the harness feeds drainEvents() + ship pos per
// step, so game.js stays a 0 KB diff. O(1) per event; the only allocation
// after construction is one encounter record per boss.
//
// Encounters are encounter-isolated (one open at a time). Event routing:
//   bossSpawn   -> open encounter (kind, wave, maxHp from the event)
//   fire        -> bulletsFired++ (outerFires++ while ship in outer band)
//   hit         -> hitsTaken++ (split into hitsP1/hitsP2 at phase 2)
//   bossPhase2  -> mark phase 2 (once per boss)
//   bossDeath   -> close as 'kill'
//   gameover    -> close as 'die'
//   (unknown)   -> ignored, never throws

const DEFAULT_DT = 1 / 60;

class BossTally {
  /**
   * @param {number} dt seconds per simulated tick (TTK is reported in seconds)
   * @param {number} outerR ship radius beyond which the ship counts as
   *   "in the outer band" (anti-camp metric). Default 0.8 * arena.radius.
   */
  constructor(dt = DEFAULT_DT, outerR = 20.8) {
    this.dt = dt;
    this.outerR = outerR;
    this._outerR2 = outerR * outerR;
    this.tick = 0; // advanced once per sample()
    this.encounters = []; // closed records
    this._cur = null;
    this._shipR2 = 0;
  }

  /** True while a boss encounter is open (spawned, not yet resolved). */
  get open() {
    return this._cur !== null;
  }

  _newEncounter(kind, wave, maxHp) {
    return {
      kind,
      wave,
      maxHp,
      startTick: this.tick,
      endTick: -1,
      ttkTicks: -1,
      bulletsFired: 0,
      hitsTaken: 0,
      hitsP1: 0,
      hitsP2: 0,
      phase2: false,
      phase2Tick: -1,
      outerTicks: 0,
      outerFires: 0,
      outcome: 'open',
    };
  }

  _close(outcome) {
    const e = this._cur;
    if (!e) return;
    e.outcome = outcome;
    e.endTick = this.tick;
    e.ttkTicks = this.tick - e.startTick;
    this.encounters.push(e);
    this._cur = null;
  }

  /** Route one World event. Unknown types are ignored (never throws). */
  onEvent(type, data) {
    const d = data || {};
    switch (type) {
      case 'bossSpawn':
        if (this._cur) this._close('open'); // defensive: unresolved predecessor
        this._cur = this._newEncounter(d.kind || 'monolith', d.wave | 0, d.hp | 0);
        break;
      case 'fire':
        if (this._cur) {
          this._cur.bulletsFired += 1;
          if (this._shipR2 > this._outerR2) this._cur.outerFires += 1;
        }
        break;
      case 'hit':
        if (this._cur) {
          this._cur.hitsTaken += 1;
          if (this._cur.phase2) this._cur.hitsP2 += 1;
          else this._cur.hitsP1 += 1;
        }
        break;
      case 'bossPhase2':
        if (this._cur && !this._cur.phase2) {
          this._cur.phase2 = true;
          this._cur.phase2Tick = this.tick;
        }
        break;
      case 'bossDeath':
        this._close('kill');
        break;
      case 'gameover':
        this._close('die');
        break;
      default:
        break;
    }
  }

  /**
   * Call once per simulated step, after step()/drainEvents(). Advances the
   * tick counter and tracks the ship's outer-band presence.
   */
  sample(shipPos) {
    this.tick += 1;
    this._shipR2 = shipPos.x * shipPos.x + shipPos.y * shipPos.y;
    if (this._cur && this._shipR2 > this._outerR2) this._cur.outerTicks += 1;
  }

  /** Close a still-open encounter at run end (sim cap); no-op if none. */
  closeOpen() {
    this._close('open');
  }

  /** Plain JSON-safe copy of the closed records. */
  snapshot() {
    return this.encounters.map((e) => ({ ...e }));
  }
}

function quantile(sorted, q) {
  const n = sorted.length;
  if (n === 0) return null;
  const pos = (n - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

/**
 * Pure aggregation over encounter records: one summary per boss kind.
 * TTK stats use kills only; hit and band stats use closed encounters
 * (kill | die); band fractions are weighted by ticks / fires.
 * @returns {Array} sorted by kind
 */
export function summarizeBossTally(encounters, dt = DEFAULT_DT) {
  const byKind = new Map();
  for (const e of encounters) {
    let g = byKind.get(e.kind);
    if (!g) {
      g = {
        kind: e.kind,
        n: 0, kills: 0, dies: 0, open: 0,
        phase2Count: 0,
        ttks: [], hits: [],
        p1: 0, p2: 0,
        tickSum: 0, outerTickSum: 0,
        fireSum: 0, outerFireSum: 0,
      };
      byKind.set(e.kind, g);
    }
    g.n += 1;
    const closed = e.outcome === 'kill' || e.outcome === 'die';
    if (e.outcome === 'kill') {
      g.kills += 1;
      g.ttks.push(e.ttkTicks);
    } else if (e.outcome === 'die') {
      g.dies += 1;
    } else {
      g.open += 1;
    }
    if (closed) {
      g.hits.push(e.hitsTaken);
      if (e.phase2) g.phase2Count += 1;
      g.p1 += e.hitsP1;
      g.p2 += e.hitsP2;
      g.tickSum += e.ttkTicks;
      g.outerTickSum += e.outerTicks;
      g.fireSum += e.bulletsFired;
      g.outerFireSum += e.outerFires;
    }
  }
  const out = [];
  for (const g of [...byKind.values()].sort((a, b) =>
    a.kind < b.kind ? -1 : a.kind > b.kind ? 1 : 0)) {
    const ttks = g.ttks.slice().sort((a, b) => a - b);
    const hits = g.hits.slice().sort((a, b) => a - b);
    const closedN = g.kills + g.dies;
    out.push({
      kind: g.kind,
      n: g.n,
      kills: g.kills,
      dies: g.dies,
      open: g.open,
      ttkMed: ttks.length ? quantile(ttks, 0.5) * dt : null,
      ttkP90: ttks.length ? quantile(ttks, 0.9) * dt : null,
      hitsMed: hits.length ? quantile(hits, 0.5) : null,
      hitsMax: hits.length ? Math.max(...hits) : null,
      hitsP1: g.p1,
      hitsP2: g.p2,
      phase2Frac: closedN ? g.phase2Count / closedN : null,
      outerShipFrac: g.tickSum ? g.outerTickSum / g.tickSum : 0,
      outerFireFrac: g.fireSum ? g.outerFireSum / g.fireSum : 0,
      killRatio: closedN ? g.kills / closedN : null,
    });
  }
  return out;
}

export { BossTally };