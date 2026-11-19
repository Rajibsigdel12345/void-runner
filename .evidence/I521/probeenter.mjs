import { World } from "../../src/core/game.js";
import { RNG } from "../../src/core/rng.js";

const w = new World(new RNG(53100));
w.begin();
w.waves.state = "idle";
w.waves.wave = 12;
console.log("rocks after begin:", w.field.rocks.length, JSON.stringify(w.field.rocks.map(r => ({ x: +r.pos.x.toFixed(1), y: +r.pos.y.toFixed(1), r: r.radius }))));
console.log("ship pos:", w.ship.pos.x.toFixed(2), w.ship.pos.y.toFixed(2));
if (w.phantoms.spawn(w.ship.pos)) {
  const p = w.phantoms.phantoms[0];
  console.log("phantom spawn:", p.pos.x.toFixed(2), p.pos.y.toFixed(2), "state", p.state, "opacity", p.opacity);
}
for (let t = 0; t < 120; t++) {
  w.step(1/60, { thrust: { x: 0, y: 0 }, aimPoint: null, firing: false });
  const p = w.phantoms.phantoms[0];
  if (p && (t < 8 || Math.abs(p.opacity - 0.5) < 0.05 || (t % 10 === 0))) {
    console.log("t=" + t, "state=" + p.state, "op=" + p.opacity.toFixed(3),
      "dist=" + Math.hypot(p.pos.x - w.ship.pos.x, p.pos.y - w.ship.pos.y).toFixed(2),
      "hp=" + p.hp, p.dead ? "DEAD" : "");
  }
}
console.log("rocks after 120 ticks:", w.field.rocks.length, "gameOver:", w.gameOver);
