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
  assert.ok(g.to(STATE.MENU), 'GAME_OVER->MENU legal (ST-190)');
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

// ST-068: quit from pause
test('state: PAUSED -> MENU quit transition (ST-068)', () => {
  const g = new GameState();
  g.to(STATE.PLAYING);
  g.to(STATE.PAUSED);
  assert.ok(g.can(STATE.MENU));
  assert.ok(g.to(STATE.MENU));
  assert.ok(g.in(STATE.MENU));
});

test('state: quit transition does not open other back-edges', () => {
  const g = new GameState();
  assert.ok(!g.to(STATE.MENU), 'MENU->MENU illegal');
  g.to(STATE.PLAYING);
  assert.ok(!g.to(STATE.MENU), 'PLAYING->MENU still illegal');
  g.to(STATE.PAUSED);
  g.to(STATE.MENU);
  assert.ok(!g.to(STATE.PAUSED), 'MENU->PAUSED still illegal');
});

// ST-190: replay viewer states
test('state: replay session sequence (ST-190)', () => {
  const g = new GameState();
  assert.ok(g.to(STATE.REPLAY), 'MENU->REPLAY legal');
  assert.ok(g.to(STATE.PAUSED), 'REPLAY->PAUSED legal');
  assert.ok(g.to(STATE.REPLAY), 'PAUSED->REPLAY resume legal');
  assert.ok(g.to(STATE.GAME_OVER), 'REPLAY->GAME_OVER (pilot dies) legal');
  assert.ok(g.to(STATE.MENU), 'GAME_OVER->MENU legal');
  assert.ok(g.in(STATE.MENU));
});

test('state: REPLAY->MENU direct is illegal (quit only via PAUSED or GAME_OVER) (ST-190)', () => {
  const g = new GameState();
  g.to(STATE.REPLAY);
  assert.ok(!g.to(STATE.MENU), 'REPLAY->MENU illegal');
  g.to(STATE.PAUSED);
  assert.ok(g.to(STATE.MENU), 'PAUSED->MENU quit legal');
});
