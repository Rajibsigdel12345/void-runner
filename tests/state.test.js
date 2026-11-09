// ST-015: state machine tests
import test from 'node:test';
import assert from 'node:assert/strict';
import { GameState, STATE } from '../src/core/state.js';

test('state: starts in MENU', () => {
  const g = new GameState();
  assert.ok(g.in(STATE.MENU));
});

test('state: legal session sequence', () => {
  const g = new GameState();
  assert.ok(g.to(STATE.PLAYING));
  assert.ok(g.to(STATE.PAUSED));
  assert.ok(g.to(STATE.PLAYING));
  assert.ok(g.to(STATE.GAME_OVER));
  assert.ok(g.to(STATE.PLAYING)); // restart
  assert.deepEqual(g.transitions, [
    [STATE.MENU, STATE.PLAYING],
    [STATE.PLAYING, STATE.PAUSED],
    [STATE.PAUSED, STATE.PLAYING],
    [STATE.PLAYING, STATE.GAME_OVER],
    [STATE.GAME_OVER, STATE.PLAYING],
  ]);
});

test('state: illegal transitions are no-ops', () => {
  const g = new GameState();
  assert.ok(!g.to(STATE.PAUSED), 'MENU->PAUSED illegal');
  assert.ok(!g.to(STATE.GAME_OVER), 'MENU->GAME_OVER illegal');
  assert.ok(g.in(STATE.MENU));
  g.to(STATE.PLAYING);
  assert.ok(!g.to(STATE.MENU), 'PLAYING->MENU illegal');
  g.to(STATE.GAME_OVER);
  assert.ok(!g.to(STATE.PAUSED), 'GAME_OVER->PAUSED illegal');
  assert.ok(!g.to(STATE.MENU), 'GAME_OVER->MENU illegal');
});

test('state: unknown state rejected', () => {
  const g = new GameState();
  assert.ok(!g.to('NOPE'));
  assert.ok(g.in(STATE.MENU));
});

test('state: reset returns to MENU and clears history', () => {
  const g = new GameState();
  g.to(STATE.PLAYING);
  g.reset();
  assert.ok(g.in(STATE.MENU));
  assert.equal(g.transitions.length, 0);
});
