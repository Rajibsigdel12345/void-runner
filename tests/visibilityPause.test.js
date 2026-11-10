// I189: visibility-pause decision (ST-189). Pure logic - exhaustive state matrix.
import { test } from "node:test";
import assert from "node:assert/strict";
import { visibilityAction, VISIBILITY } from "../src/core/visibilityPause.js";

test("hidden while PLAYING pauses", () => {
  assert.equal(visibilityAction("hidden", "PLAYING"), "pause");
});

test("hidden while REPLAY pauses (a replay has a sim to protect) (ST-190)", () => {
  assert.equal(visibilityAction("hidden", "REPLAY"), "pause");
});

test("visible while REPLAY never auto-resumes (no-surprise-resume policy) (ST-190)", () => {
  assert.equal(visibilityAction("visible", "REPLAY"), "none");
});

test("hidden while MENU does nothing (no sim to protect)", () => {
  assert.equal(visibilityAction("hidden", "MENU"), "none");
});

test("hidden while PAUSED does nothing (already safe; no transition spam)", () => {
  assert.equal(visibilityAction("hidden", "PAUSED"), "none");
});

test("hidden while GAME_OVER does nothing (the results screen is static)", () => {
  assert.equal(visibilityAction("hidden", "GAME_OVER"), "none");
});

test("visible never pauses, in any state (no auto-resume by design)", () => {
  for (const st of ["MENU", "PLAYING", "PAUSED", "GAME_OVER", "REPLAY"]) {
    assert.equal(visibilityAction("visible", st), "none");
  }
});

test("the VISIBLE constant is the literal document value", () => {
  assert.equal(VISIBILITY.VISIBLE, "visible");
  assert.equal(VISIBILITY.HIDDEN, "hidden");
});

test("unknown visibility strings are defensive no-ops", () => {
  for (const v of ["prerender", "unloaded", "weird", "", undefined, null]) {
    assert.equal(visibilityAction(v, "PLAYING"), "none");
  }
});

test("unknown state names are defensive no-ops", () => {
  for (const st of ["LOADING", "playing", "Paused", "", undefined]) {
    assert.equal(visibilityAction("hidden", st), "none");
  }
});

test("the decision is exact-match, not case-insensitive or substring", () => {
  assert.equal(visibilityAction("Hidden", "PLAYING"), "none");
  assert.equal(visibilityAction("hidden ", "PLAYING"), "none");
  assert.equal(visibilityAction("hidden", "PLAYING "), "none");
});

test("the full 5x2 matrix has exactly two pause cells (PLAYING + REPLAY) (ST-190)", () => {
  const states = ["MENU", "PLAYING", "PAUSED", "GAME_OVER", "REPLAY"];
  const vis = ["visible", "hidden"];
  let pauses = 0;
  for (const v of vis) for (const st of states) {
    if (visibilityAction(v, st) === "pause") pauses++;
    assert.ok(["pause", "none"].includes(visibilityAction(v, st)), "returns only the two contract values");
  }
  assert.equal(pauses, 2);
});
