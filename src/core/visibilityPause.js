// Void Runner - visibility-pause decision (ST-189 / I189). Pure: no DOM, no three.
// Extracts the I43 inline decision so the auto-pause rule is unit-testable and the
// browser handler path stays thin (main.js reads document.visibilityState and calls
// this, then pauses if the rule says so).
//
// Design decisions (deliberate):
// - PAUSE on hidden while PLAYING: the tab's rAF stalls anyway; pausing gives the
//   player the pause screen instead of a surprise death on return, and the ST-078
//   clock (maxFrameDt clamp + reset on PAUSED->PLAYING) discards the stall, so no
//   dt spike / catch-up burst on resume.
// - NO auto-resume on visible: a surprise resume across a tab switch can kill the
//   ship while the player is looking away. The player resumes deliberately (P/Enter).
//   This is the same "restore does not auto-resume" policy as the I187 ctx-restore path.
// - Only PLAYING/REPLAY pause: MENU has no sim to protect; PAUSED and GAME_OVER are
//   already safe (the transition is guarded in GameState anyway - the rule keeps
//   the call site clean and transition records tidy).

export const VISIBILITY = Object.freeze({ HIDDEN: 'hidden', VISIBLE: 'visible' });

/**
 * Decide what the visibility handler should do.
 * @param {string} visibility document.visibilityState value ('visible' | 'hidden' | 'prerender' | ...)
 * @param {string} state the current game state name
 * @returns {'pause'|'none'} the single action the handler must take
 */
export function visibilityAction(visibility, state) {
  if (visibility === VISIBILITY.HIDDEN && (state === 'PLAYING' || state === 'REPLAY')) return 'pause'; // ST-190: a replay has a sim to protect too
  return 'none';
}
