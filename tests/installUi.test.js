// ST-512 (I546, E74 D4): src/core/installUi.js - the pure core PWA install-affordance model (DOM-free unit tests).
// (a) prompt available + not installed + not dismissed -> show; (b) installed -> hide; (c) dismissed beats
// available -> hide; (d) installed beats dismissed; (e) no prompt (desktop/iOS) -> hide; (f) truthy non-boolean
// flags coerce to safe booleans; (g) garbage/null/non-object inputs coerce to safe (no throw, no show).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { installUiState } from '../src/core/installUi.js';

test('installUiState: prompt available, not installed, not dismissed -> show (available)', () => {
  const s = installUiState({ promptAvailable: true, appInstalled: false, dismissed: false });
  assert.equal(s.showButton, true);
  assert.equal(s.reason, 'available');
});
test('installUiState: already installed -> hide (installed)', () => {
  const s = installUiState({ promptAvailable: true, appInstalled: true, dismissed: false });
  assert.equal(s.showButton, false);
  assert.equal(s.reason, 'installed');
});
test('installUiState: dismissed beats available -> hide (dismissed)', () => {
  const s = installUiState({ promptAvailable: true, appInstalled: false, dismissed: true });
  assert.equal(s.showButton, false);
  assert.equal(s.reason, 'dismissed');
});
test('installUiState: installed beats dismissed (installed checked first)', () => {
  const s = installUiState({ promptAvailable: true, appInstalled: true, dismissed: true });
  assert.equal(s.showButton, false);
  assert.equal(s.reason, 'installed');
});
test('installUiState: no prompt (desktop w/o PWA / iOS) -> hide (unavailable)', () => {
  const s = installUiState({ promptAvailable: false, appInstalled: false, dismissed: false });
  assert.equal(s.showButton, false);
  assert.equal(s.reason, 'unavailable');
});
test('installUiState: truthy non-booleans coerce to false (strict === true: only a real true arms it) (no show, no throw)', () => {
  const s = installUiState({ promptAvailable: 'yes', appInstalled: 1, dismissed: 'x' });
  assert.equal(s.showButton, false);
  assert.equal(s.promptAvailable, false); // 'yes' !== true
  assert.equal(s.appInstalled, false); // 1 !== true
  assert.equal(s.dismissed, false); // 'x' !== true
  assert.equal(s.reason, 'unavailable');
});
test('installUiState: garbage / null / non-object inputs coerce to safe (unavailable)', () => {
  for (const g of [null, undefined, 42, 'x', [], true, false]) {
    const s = installUiState(g);
    assert.equal(s.showButton, false);
    assert.ok(['installed', 'dismissed', 'available', 'unavailable'].includes(s.reason));
  }
});