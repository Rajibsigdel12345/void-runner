import { test } from "node:test";
import assert from "node:assert/strict";
import { SkillModel } from "../src/core/skillModel.js";
import { CONFIG } from "../src/core/config.js";

const DT = 1 / 60;
const C = CONFIG.skill;

function model() {
  return new SkillModel(C, DT);
}

test("neutral start: P is exactly 0.5 and load 0 (ST-303)", () => {
  const m = model();
  m.sample({ x: 0, y: 0 }, []);
  assert.equal(m.performance, 0.5);
  assert.equal(m.load, 0);
  assert.equal(m.tick, 1);
  const snap = m.snapshot();
  assert.equal(snap.wave, 0);
  assert.equal(snap.kills, 0);
  assert.equal(snap.lethalHits, 0);
});

test("kills raise P monotonically to the cap 1", () => {
  const m = model();
  let prev = m.performance;
  for (let i = 0; i < 50; i++) {
    m.onEvent("kill", { combo: 0 });
    assert.ok(m.performance > prev || m.performance === 1);
    prev = m.performance;
  }
  assert.equal(m.performance, 1); // M = ~30 >> mMax -> clamped
  assert.equal(m.kills, 50);
});

test("hits lower P monotonically to the floor 0", () => {
  const m = model();
  m.onEvent("kill", { combo: 10 }); // start above neutral
  let prev = m.performance;
  for (let i = 0; i < 20; i++) {
    m.onEvent("hit", { lives: 1 });
    assert.ok(m.performance < prev || m.performance === 0);
    prev = m.performance;
  }
  assert.equal(m.performance, 0);
  assert.equal(m.hits, 20);
  assert.equal(m.lethalHits, 0);
});

test("single lethal hit from neutral: P = 0.5 - 0.13333... and swing <= 0.25 (R2d)", () => {
  const m = model();
  m.onEvent("hit", { lives: 0 });
  const expected = 0.5 - ((C.wHit + C.wDeathExtra) / C.mMax) * 0.5;
  assert.equal(m.performance, expected);
  assert.ok(expected < 0.5);
  assert.ok(0.5 - expected <= 0.25);
  assert.equal(m.lethalHits, 1);
  assert.equal(m.hits, 1);
});

test("30 s of no events relaxes P back to ~0.5", () => {
  const m = model();
  for (let i = 0; i < 10; i++) m.onEvent("kill", { combo: 0 }); // 10 kills: M = 3.5 > mMax 3 -> P = 1 (I329)
  assert.equal(m.performance, 1);
  for (let i = 0; i < 1800; i++) m.sample({ x: 0, y: 0 }, []); // 30 s at 60 Hz
  assert.ok(Math.abs(m.performance - 0.5) < 0.02);
});

test("combo scaling: kill bonus 10 > 5 > 1, capped at comboCap", () => {
  const p = (combo) => { const m = model(); m.onEvent("kill", { combo }); return m.performance; };
  assert.ok(p(10) > p(5));
  assert.ok(p(5) > p(1));
  assert.equal(p(15), p(10)); // comboCap = 10
});

test("gap-0 single threat: L = w/(1+w) exactly", () => {
  const m = model();
  m.sample({ x: 5, y: 5 }, [{ x: 5, y: 5, r: 2, w: 1.5 }]);
  assert.equal(m.load, 1.5 / 2.5);
});

test("L is monotone decreasing in threat distance", () => {
  const m = model();
  const lAt = (d) => { m.sample({ x: 0, y: 0 }, [{ x: d, y: 0, r: 1, w: 1 }]); return m.load; };
  const a = lAt(2);
  const b = lAt(8);
  const c = lAt(30);
  assert.ok(a > b);
  assert.ok(b > c);
});

test("50 threats: L stays finite and < 1", () => {
  const m = model();
  const threats = [];
  for (let i = 0; i < 50; i++) {
    threats.push({ x: Math.cos(i) * 3, y: Math.sin(i) * 3, r: 1, w: 2 });
  }
  m.sample({ x: 0, y: 0 }, threats);
  assert.ok(Number.isFinite(m.load));
  assert.ok(m.load < 1);
  assert.ok(m.load > 0.9); // 50 close high-weight threats saturate
});

test("empty threats: load is exactly 0", () => {
  const m = model();
  m.onEvent("kill", { combo: 3 });
  assert.equal(m.sample({ x: 1, y: 1 }, []), 0);
  assert.equal(m.load, 0);
});

test("wave event sets the wave; unknown events are ignored (no throw)", () => {
  const m = model();
  m.onEvent("wave", { n: 4, mod: "quiet", endless: false });
  assert.equal(m.wave, 4);
  m.onEvent("xyzzy", null);
  m.onEvent(undefined, null);
  assert.equal(m.wave, 4);
  assert.equal(m.kills, 0);
  assert.equal(m.hits, 0);
  assert.equal(m.shots, 0);
  assert.equal(m.nearmisses, 0);
  assert.equal(m.performance, 0.5);
});

test("determinism: identical interleaved feed -> identical snapshots", () => {
  const feed = (m) => {
    m.onEvent("wave", { n: 1 });
    for (let t = 0; t < 200; t++) {
      if (t % 7 === 0) m.onEvent("kill", { combo: (t / 7) % 5 });
      if (t % 13 === 0) m.onEvent("fire");
      if (t % 17 === 0) m.onEvent("nearmiss");
      if (t % 23 === 0) m.onEvent("hit", { lives: (t % 23) % 4 });
      m.sample(
        { x: Math.cos(t / 10) * 8, y: Math.sin(t / 10) * 8 },
        [{ x: 2, y: 2, r: 2, w: 1.2 }, { x: -5, y: 4, r: 1.5, w: 1.5 }],
      );
    }
    return m.snapshot();
  };
  assert.deepEqual(feed(model()), feed(model()));
});

test("10k mixed events + samples: every snapshot field stays finite", () => {
  const m = model();
  const types = ["kill", "hit", "nearmiss", "fire", "wave"];
  for (let t = 0; t < 10000; t++) {
    const k = t % 5;
    const data =
      k === 0 ? { combo: t % 11 } :
      k === 1 ? { lives: t % 2 } :
      k === 4 ? { n: t % 12 } :
      undefined;
    m.onEvent(types[k], data);
    m.sample(
      { x: t % 40 - 20, y: (t * 7) % 31 - 15 },
      [{ x: t % 13, y: t % 17, r: 1 + (t % 3), w: 1 + (t % 4) * 0.25 }],
    );
  }
  const s = m.snapshot();
  for (const v of Object.values(s)) {
    assert.ok(Number.isFinite(v), JSON.stringify(s));
  }
});

test("firing only drags P below neutral (accuracy cost)", () => {
  const m = model();
  for (let i = 0; i < 500; i++) m.onEvent("fire");
  assert.ok(m.performance < 0.5);
  assert.equal(m.shots, 500);
  assert.equal(m.kills, 0);
});
