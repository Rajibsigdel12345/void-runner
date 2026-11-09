// Void Runner - game state machine (ST-015).
// MENU -> PLAYING -> (PAUSED <-> PLAYING) / GAME_OVER -> PLAYING
export const STATE = Object.freeze({
  MENU: 'MENU',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  GAME_OVER: 'GAME_OVER',
});

const TRANSITIONS = {
  [STATE.MENU]: [STATE.PLAYING],
  [STATE.PLAYING]: [STATE.PAUSED, STATE.GAME_OVER],
  [STATE.PAUSED]: [STATE.PLAYING],
  [STATE.GAME_OVER]: [STATE.PLAYING],
};

export class GameState {
  constructor() {
    this.state = STATE.MENU;
    this.transitions = []; // history for tests/debug
  }
  in(state) { return this.state === state; }
  can(next) { return TRANSITIONS[this.state].includes(next); }
  /** Attempt a transition; returns true on success, false (no-op) when illegal. */
  to(next) {
    if (!this.can(next)) return false;
    this.transitions.push([this.state, next]);
    this.state = next;
    return true;
  }
  reset() { this.state = STATE.MENU; this.transitions.length = 0; }
}
