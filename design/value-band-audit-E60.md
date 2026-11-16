# Void Runner - C2 Value-Band Audit (E60 / ST-431, I463)

Docs-only audit (input to B1 role names). Question: does the arena floor
stay a distinct value band below the actors at 3:1 or better, at the
busiest moment? Method: headless SwiftShader (1280x720, pixelRatio 1,
sRGB-forced), frozen frame driven by the real composer (vr.bloom.render()),
pixels read straight from the GL buffer, sRGB luma = 0.2126R + 0.7152G +
0.0722B. Scene = the busy460 densest population (30 enemies across all
roles + warden + boss + 29 rocks + ship). Evidence:
.evidence/I463/valueband463.mjs + valueband463.json + valueband463.png
(grayscale); probe-placed actors (no game RNG involved).

## Measured (busy frame, 2026-11-17, I462 shipped state)

| Band | Metric | sRGB luma |
|---|---|---|
| Floor (bottom 22% of frame) | median | 10.6 |
| Floor (bottom 22% of frame) | mean | 12.7 |
| Actor zone (mid 25-92% of frame) | p90 | 83.8 |
| Actor zone (mid 25-92% of frame) | p95 | 91.3 |
| Actor zone (mid 25-92% of frame) | p99 | 135.6 |
| Rock patches (4 x ~4.6k px, sky-excluded) | median | 73.7 - 76.0 |

## Ratios vs the 3:1 acceptance

- Rock-median / floor-median = 6.98 - 7.19 (PASS, 2.3x the 3:1 bar)
- Actor-zone p90 / floor-median = 7.9 (PASS)
- Actor-zone p99 / floor-median = 12.8 (PASS)

## Findings -> B1 role names

1. The floor band is well separated from every actor band; no value
   collision found anywhere in the frame. The floor role values
   (arena.gridBright 0x483728 / gridDim 0x1a130d) stay in the bottom band
   by construction (hub luma 57.5 renders ~10-13 sRGB at distance under the
   I334 grade).
2. Because the floor owns the bottom of the value scale, the role kit can
   allocate the upper bands without conflict: body roles mid-band, hazard /
   reward / shield / emissiveSignal in the top band. B1's 12 role values
   (config.js "palette" section) are named accordingly; this audit is the
   evidence they do not need re-spacing.
3. Caveats: headless SwiftShader luma is display-true (post-tonemap/grade,
   sRGB) but hardware-independent; the 7:1 margin is large enough that real
   GPU tone-mapping variance cannot bring it to 3:1. Re-run this probe if
   the floor grade (I334), bloom (0.6/0.35/0.72), or floor hexes ever
   change - any of those is a frozen-identity change and stops for a
   producer decision anyway.
