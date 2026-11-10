// Void Runner - recording decisions for the replay capture UI (ST-191 / I191). Pure: no DOM, no three.
//
// The O-key toggle and the save-on-game-over decision live here (not in the DOM
// layer) so the rules are unit-testable; src/main.js owns the recorder state and
// calls these functions from the named toggleRecording() handler and the gameover
// event. The recorder itself is src/core/replay.js createRecorder (ST-190).
//
// Rules:
// - O only toggles while PLAYING (a watched replay is in REPLAY, so it can never
//   start or stop a recording by accident).
// - One recording per run: O starts, O stops. A stopped recording cannot be
//   re-armed in the same run (restart to record a fresh run).
// - A started recording saves on game over when it captured at least one substep,
//   even if it was stopped mid-run (the tape then plays out with neutral input
//   past the stop point - deterministic either way).

/**
 * @param {string} state current game state (exact string)
 * @param {boolean} hasRecorder a recorder exists for the current run
 * @param {boolean} stopped the user pressed O to stop that recorder
 * @returns {'start'|'stop'|'none'} the single action the handler must take
 */
export function recordingAction(state, hasRecorder, stopped) {
  if (state !== 'PLAYING') return 'none';
  if (!hasRecorder) return 'start';
  return stopped ? 'none' : 'stop';
}

/**
 * @param {boolean} hasRecorder a recorder exists for the finished run
 * @param {number} steps substeps captured by the recorder
 * @param {boolean} inReplayView true while a replay is being watched
 * @returns {boolean} true when the gameover handler must finish + save the recorder
 */
export function shouldSaveOnGameOver(hasRecorder, steps, inReplayView) {
  return !inReplayView && !!hasRecorder && steps > 0;
}
