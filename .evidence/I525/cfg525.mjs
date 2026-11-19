import { CONFIG as C } from "../../src/core/config.js";
const keys = ["enemyBullets","boss","splicer","warden","gunship","sentry","phantom","bulwark","mine","drone","wasp","stinger","hunter","flyer","pod","hauler"];
for (const k of keys) { console.log("=== " + k + " ==="); console.log(JSON.stringify(C[k], null, 1)); }
console.log("=== asteroid.sizes ===");
console.log(JSON.stringify(C.asteroid.sizes, null, 1));