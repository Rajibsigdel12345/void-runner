// Void Runner - lives (ST-015). Pure core.
import { CONFIG } from './config.js';

export class Lives {
  constructor(max = CONFIG.ship.lives) {
    this.max = max;
    this.count = max;
  }
  get alive() { return this.count > 0; }
  /** Consume one life. Returns remaining count (never below 0). */
  damage() {
    if (this.count > 0) this.count -= 1;
    return this.count;
  }
  reset() { this.count = this.max; }
}
