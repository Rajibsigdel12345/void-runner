// Seeded RNG (mulberry32). All game randomness flows through here so tests can pin seeds.
export class RNG {
  constructor(seed = 1) {
    this.seed = seed >>> 0;
    this._s = this.seed === 0 ? 0x9e3779b9 : this.seed;
  }
  reset(seed = this.seed) { this.seed = seed >>> 0; this._s = this.seed === 0 ? 0x9e3779b9 : this.seed; }
  next() {
    this._s = (this._s + 0x6d2b79f5) >>> 0;
    let t = this._s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  range(min, max) { return min + (max - min) * this.next(); }
  int(min, max) { return Math.floor(this.range(min, max + 1)); }
  pick(arr) { return arr[this.int(0, arr.length - 1)]; }
  chance(p) { return this.next() < p; }
}
