# Build Size + Load Audit (I197 / ST-197)

Companion to production/perf-profile.md (I95, frame time). This audit covers the
DOWNLOAD + LOAD side: artifact weight, transfer cost, and startup timing.
Re-measure command: `node scripts/build.mjs` then load http://localhost:5173 and
read performance.getEntriesByType("resource").

## Summary
- dist/ artifact: **1,864 KB raw / 449.6 KB gzip** (measured with zlib level 6).
- The browser fetches exactly the import graph (81 scripts + 5 GLB fetches = 86
  resources); build.mjs copies only imported jsm modules, never the whole vendor tree.
- No build-size or load blocker. Three advisories below (compression, three.js
  weight, request count) - all acceptable for the desktop-web target.

## Metric (measured 2026-11-10, node v26, headless Chromium, dev :5173)
Artifact by section (raw / gzip):
| Section            | raw     | gzip    | note                                   |
|--------------------|---------|---------|----------------------------------------|
| vendor/            | 1655 KB | 290.3 KB| three.module.js 1243 KB (65% of dist)  |
|  - GLTFLoader.js   | 106 KB  | ~80 KB  | biggest jsm (real GLB pipeline)        |
|  - BufferGeometryUtils | 31 KB | ~10 KB | merge utility for rock fields         |
|  - postprocessing  | 25.6 KB | ~8 KB   | bloom chain (Effect/Render/Shader/Output/UnrealBloom/LuminosityHighPass/Copy/Mask/Pass) |
| src/               | ~332 KB | 131.4 KB| main.js 62.6 KB, game.js 33.5 KB, screens.js 24.8 KB, config.js 23.6 KB, audio.js 20.3 KB |
| assets/ (5 GLB)    | 88.1 KB | 27.1 KB | ship 22.2, boss 14.4, L 33.1, M 9.2, S 9.2 KB |
| index.html + favicon | 1.8 KB | 0.9 KB |                                        |

Load timing (headless, localhost - absolute numbers are environment-specific;
ratios and the parallel-load shape transfer):
- navigation TTFB 2 ms (localhost); all 86 resources start in parallel at ~77 ms
  and finish by 622 ms; domReady 890 ms; loadEvent 924 ms.
- No waterfall: the import graph loads fully parallel; the longest individual
  fetch was ~159 ms (a small core module - headless timing noise, not size).
- The one-time first-gameplay-frame WebGL init cost is tracked separately
  (gates.md: ~90-600 ms one-time, I95) and is NOT part of this download metric.

## Budget
- Target: desktop web, broadband. Budget adopted here: <= 2 MB raw / <= 550 KB
  gzip for the whole first payload. Measured: 1,864 KB / 449.6 KB -> **within
  budget with 7% raw / 18% gzip headroom**.
- Assets sub-budget: 5 GLBs total 88.1 KB raw / 27.1 KB gzip (design/asset-spec.md
  poly budgets already keep triangle cost GPU-negligible; byte cost is trivial).
- If the game ever targets low-bandwidth mobile, the 449.6 KB gzip payload is the
  first thing to revisit (see Optimization 1).

## Bottleneck
1. **three.module.js = 1,243 KB raw (~200 KB of the 450 KB gzip total)**. It is
   already the minified official build; the project's no-bundler/no-CDN convention
   (offline-capable, vendored) means the whole engine ships regardless of how
   little of it is used. This is the dominant and irreducible cost under the
   current conventions.
2. **81 separate module requests** (import map, no bundler). On localhost/HTTP1.1
   this is 6-connection parallel fetch - fine. On an HTTP/2+ host it is a single
   multiplexed stream - also fine. Only a pathological HTTP/1.1-only host without
   keep-alive would turn this into a waterfall; none of our targets are that.
3. **Dev/preview servers serve uncompressed** (transferSize measured raw:
   1,887 KB on the wire). Production static hosts with gzip/brotli cut this to
   ~450 KB automatically; our serve.mjs is a dev convenience, not the shipping
   path.

## Optimization (advisories only - NO changes made in I197)
1. (LOW) If load on slow links ever matters: enable gzip/brotli at the static
   host level (or add optional gzip to scripts/serve.mjs). Expected: -76%
   transfer (1,864 -> 450 KB). No code change needed for any real host.
2. (LOW) three.js weight: the only large lever is a CDN import (breaks the
   offline/vendored convention - NOT recommended) or feature-slimming (not
   available in the official build - not recommended). Accept as-is.
3. (INFO) Request count: a bundler would collapse 81 scripts into 1-3, but
   AGENTS.md pins the no-bundler import-map architecture; the measured load
   shows no waterfall, so this stays a documented trade-off, not a debt item.

## Blocking issues
None. Artifact and load are within the adopted budgets on the desktop target.

## Changed files
production/build-size-audit.md (this file, NEW).

## Verification evidence
- `node scripts/build.mjs` -> "build: dist/ assembled" (exit 0) immediately before
  the measurements; dist/ tree walked recursively (file list + sizes in the I197
  iteration entry's command output).
- gzip sizes: zlib.gzipSync(level 6) per file over the full dist/ tree:
  raw 1,864.3 KB -> gzip 449.6 KB (vendor 290.3 / src 131.4 / assets 27.1 /
  index 0.7 / public 0.2 KB).
- Browser load profile (Playwright, clean navigation to :5173/?perf=i197):
  86 resources (81 script + 5 fetch), all finished by t=622 ms, domReady 890 ms,
  loadEvent 924 ms, sum transferSize 1,887.7 KB (raw, dev server), window.__vr
  live at measurement.
- Cross-check: the 5 fetch-initiated resources are exactly the five assets/*.glb
  loads (assetLoader.js), matching AGENTS.md's asset inventory.

## Next owner or decision
I198 ST-198 gate G8.5 (cgs-gate-check) - advisory phase gate over the I187-I196
feel/juice/replay/security/regression arc.
