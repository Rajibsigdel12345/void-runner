// Void Runner - game state machine (ST-015).
// MENU -> PLAYING -> (PAUSED <-> PLAYING) / PAUSED -> MENU (quit, ST-068) / GAME_OVER -> PLAYING
// ST-190: MENU -> REPLAY -> (PAUSED <-> REPLAY) / REPLAY -> GAME_OVER / GAME_OVER -> MENU
export const STATE = Object.freeze({
  MENU: 'MENU',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  GAME_OVER: 'GAME_OVER',
  REPLAY: 'REPLAY', // ST-190: watch a saved replay / the demo pilot
});

const TRANSITIONS = {
  [STATE.MENU]: [STATE.PLAYING, STATE.REPLAY], // ST-190: + start a replay
  [STATE.PLAYING]: [STATE.PAUSED, STATE.GAME_OVER],
  [STATE.PAUSED]: [STATE.PLAYING, STATE.REPLAY, STATE.MENU], // ST-068 quit; ST-190 resume-into-replay
  [STATE.GAME_OVER]: [STATE.PLAYING, STATE.MENU], // ST-190: a finished run/replay returns to menu
  [STATE.REPLAY]: [STATE.PAUSED, STATE.GAME_OVER], // ST-190: pause it, or the pilot dies
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
