# E88 scope check - MESHopt compressed asset pipeline + headroom unlock

Opened I608 (ST-573/574/575 pre-registered). E87 CLOSED at I607 (c2836d8, remote-verified this turn: git ls-remote origin main == c2836d8 == local HEAD). The user standing art ask - richer ship/enemy art via Blender 5.2.3 headless, "use polygons and GPU resources as much as needed" - is STRUCTURALLY CAPPED under the current asset pipeline (measured below), so E88 is the pipeline unlock that makes the art epic (E89) feasible: MESHopt-compress all 34 GLBs in-buffer (EXT_meshopt_compression), vendor the JS decoder, and renegotiate the asset caps to measured+15%.

## Scope Fit

Measured at I608 (.evidence/I608/glbtris608.cjs - matches the house parser total exactly): 34 GLBs, 4,431,160 B / 123,188 tris (ship 1,402,896 B / 62,254 t; phantom 343,244 / 4,544; hauler 289,748 / 3,724; bulwark 190,584 / 3,160; sweeper 129,764 / 1,946; beacon 208,100 / 3,144; wasp 310,036 / 4,020; gunship 215,032 / 2,906; boss.glb 31 KB / 398 t - a real art gap for E89; boss_archon 128,780 / 3,108 t).

Why an art-only epic NOW is infeasible (every number on-disk):
- Asset total caps 100% consumed: tests/assetPerf.test.js totalFilesKB 4,328 KiB (4,431,872 B) vs measured 4,431,160 B -> 712 B headroom; totalGeoKB 4,261 KiB (4,363,264 B) vs 4,362,276 B -> 988 B headroom; totalTris cap 123,188 t = measured EXACT; perFileMats 5 (hauler at cap).
- Ship wall: tests/assetGlbs.test.js perFileKB 1,400 KiB (1,433,600 B) vs ship.glb 1,402,896 B (1,369.04 KiB) -> 30,704 B (about +1,360 t at the I587 measured 22.5 B/t raw ratio) is the BINDING ship cap; MAX_FILE_BYTES 1,500,000 is looser (97,104 B). The entire possible ship growth before hitting any file cap is about 1,360 t - an art pass targeting ship v9 at ~100-120k t (a +38-58k t model) is off the table by ~30x.
- Bundle: E87 close floor 545,622 B; the 102,400 B close-floor floor leaves a 443,222 B total E88 growth budget - smaller than what a serious art pass is worth modeling against.
- Conclusion: the standing art ask needs ~500 KB+ of asset headroom that does not exist. E88 creates it by SHRINKING the existing assets, not by growing the ceiling.

Why MESHopt (feasibility, all verified on disk at I608):
- three.js r187 GLTFLoader is EXT_meshopt_compression-NATIVE: loader.addMeshoptDecoder({ decodeGltfBuffer, ... }) from three/addons/libs/meshopt_decoder.module.js. No new fetch and no wasm: the decoder (vendor/jsm/libs/meshopt_decoder.module.js, 29,256 B raw, ALREADY vendored + git-tracked) is pure JS operating on the in-GLB bufferView, so each GLB stays a single file and the GLB contract (per-asset tris / COLOR_0 / node set / materials per file) is preserved at decode time.
- MESHopt compression is LOSSLESS and decode is DETERMINISTIC (same compressed bytes -> same geometry, exactly), so the decoded meshes are bit-identical to the current GLB meshes -> the render pins are EXPECTED EXACT; re-pin WITH MEASUREMENT only on surprise (I570 pattern).
- Expected dist: 4,362,276 B of geometry compresses ~3-4x on dense triangle meshes (to be measured at I609) -> assets ~1.2-1.5 MB -> dist ~3.6-3.9 MB -> permanent ~3.5 MB headroom for E89+ (the current all-time-low dist floor 6,854,378 B becomes the new all-time-HIGH).
- PWA: public/sw.js runtime-caches every same-origin GET after first load (precache is shell-only) -> the new dist/vendor/jsm/libs/meshopt_decoder.module.js needs NO SW list change; pwa491 EXPECTED 11/11.

## Fix set (PRE-REGISTERED)

- ST-573 (I608) - E88 open: research + budget math + feasibility evidence (this check) + scope check FROZEN + bookkeeping. NO src. Expected dist delta: 0 B (byte-identical 6,854,378 B / 204).
- ST-574 (I609) - ATOMIC landing, ONE commit: (1) re-encode ALL 34 GLBs with EXT_meshopt_compression in node (dev-only tooling @gltf-transform/* + meshopt; DETERMINISM = double-encode byte-compare, ABORT on diff; all 34 originals backed up + hash manifest to .evidence/I609/); (2) scripts/build.mjs VENDOR_FILES += jsm/libs/meshopt_decoder.module.js + scripts/vendor.mjs raw size pin 29,256 B + vendor-r187 ADR row (raw + dist sha256-16, I495 pattern; jsm files are NOT minified so dist = raw); (3) src/render/assetLoader.js += 2 lines (import MeshoptDecoder + loader.addMeshoptDecoder); (4) re-pins WITH MEASUREMENT: assetPerf totalFilesKB/totalGeoKB/perFileKB down to measured compressed + 15% (totalTris 123,188 + perFileMats 5 UNCHANGED - compression is buffer-level), assetGlbs MAX_FILE_BYTES down to measured max file + 15% (BUDGETS per-asset tris UNCHANGED, ship stays 62,254). Expected dist delta: DROP to ~3.6-3.9 MB (measured).
- ST-575 (I610) - G88.0 close gate: 5/5 harness (clone .evidence/I607/run_closegate607.cjs -> .evidence/I610/, labels CLOSEGATE610), fresh dist re-measure, CLOSE FLOOR E88 WITH MEASUREMENT (expected ~3.5 MB), cap renegotiation recorded WITH MEASUREMENT, AGENTS.md item-4 + asset-line refresh, E88 CLOSED. Expected dist delta: ~0 B (docs-only).

## Frozen bounds

IN (ST-574 only): scripts/build.mjs VENDOR_FILES (+1 line), scripts/vendor.mjs (+1 raw size pin), docs/architecture/vendor-r187-adr.md (+decoder pin row), src/render/assetLoader.js (+2 lines), assets/*.glb re-encode (34 files, buffer-level only), tests/assetPerf.test.js + tests/assetGlbs.test.js re-pins WITH MEASUREMENT, package.json devDependencies (@gltf-transform/*, meshopt - dev-only, never shipped), .evidence/I609/ (re-encode script, 34 backups, hash manifest, determinism check, smoke + screenshots).

OUT (frozen): any mesh/geometry change, tri counts, node sets, COLOR_0, materials per file, any gameplay or src/core code, the 5 harness runners (clones only, labels changed), the PWA surface (sw.js untouched - runtime cache covers the new module), audio, the WebGPU default switch (E90 candidate - gated on causal495 EXACT parity + real-device WebGPU smoke, separate epic).

## Measurement protocol (FROZEN)

1. Re-encode determinism: encode every GLB twice (separate runs); byte-compare all 34 outputs; ANY diff = ABORT + register the encoder non-determinism and re-open the tooling choice.
2. GLB contract: after re-encode, .evidence/I608/glbtris608.cjs + the house .evidence/I547/glb_tris.cjs must report EXACT 123,188 t total + every per-asset pin unchanged (JSON accessor counts are untouched by buffer compression).
3. Headless browser smoke (Chrome SwiftShader, dev :5173, self-start/self-kill): 34/34 GLBs load with 0 GLTF errors; total scene tris == 123,188 on both the endless and campaign boot paths; console 0/0; pageerror 0; no NaN; ship + one enemy + one boss frame screenshots to .evidence/I609/ (non-degenerate geometry).
4. Re-pins WITH MEASUREMENT: assetPerf size caps = measured compressed values + 15% headroom (pre-registered rule); assetGlbs MAX_FILE_BYTES = measured max file + 15%; per-asset tris pins UNCHANGED; playframe491/483 + causal495 + causal483 EXPECTED EXACT (decoded geometry bit-identical) or re-pin WITH MEASUREMENT + documented; pwa491 EXPECTED 11/11.
5. Vendor pins: meshopt_decoder.module.js raw sha256-16 + dist sha256-16 added to the ADR (I495 pattern); the existing 4 bundle pins must stay EXACT (A65DE049A7F38B40 / 7AB0784CD2532367 / F549248412C62B9A / 7FF9ACF50F006017).

## Budget (pre-registered)

- Close gate (I610): dist <= 7,297,600 B (ceiling 7,400,000 B - 102,400 B floor) WITH MEASUREMENT.
- Expected close dist: ~3.6-3.9 MB (the ST-574 DROP). CLOSE FLOOR E88 expected ~3.5 MB WITH MEASUREMENT.
- Cut ladder (pre-registered): C1 = if the full-set compression ratio underperforms (< 2x total asset bytes), compress ship + the 5 largest flagged enemies only (the rest stay raw), re-measure, document; C2 = if dist after ST-574 > 4,200,000 B, register the measured ratio + reconsider (do NOT force the swap: revert to raw assets, close E88 as docs-only pipeline research with the measured ratio, reopen as E88a with the tooling finding).
- Cap renegotiation rule (pre-registered): new size caps = measured compressed values + 15% headroom, recorded WITH MEASUREMENT at I609 and re-confirmed at the I610 close.

## Verification evidence

(to be filled at close I610: per-story evidence WITH MEASUREMENT + quality bar 4/4 + the 5-harness G88.0 gate + CLOSE FLOOR E88 WITH MEASUREMENT + AGENTS.md item-4 + asset-line refresh)

## DoD

- E88 3/3 stories DONE (ST-573 docs + budget math / ST-574 atomic MESHopt landing + re-pins WITH MEASUREMENT + smoke / ST-575 G88.0 close gate).
- Close gate 5/5 EXACT (or re-pins WITH MEASUREMENT, documented); fresh dist re-measured under the ceiling; CLOSE FLOOR E88 WITH MEASUREMENT (expected ~3.5 MB); caps renegotiated WITH MEASUREMENT; AGENTS.md refreshed; E88 CLOSED; push delegated + verified; hygiene (all 4 ports free, zero tabs, zero terminals).

Next owner: E88 CLOSED I610 (G88.0; 3/3 stories DONE) -> E89 = the user-visible Blender art pass on the freed headroom: ship v9 Mk.II rigid airship warship (target ~100-120k t, extend the .evidence/I587/ ship v8 build scripts; inset/outset panel greebles WITHOUT booleans; gondola / fins / nacelles / prop pods; COLOR_0; 6-node VR_Ship_* contract) + boss.glb remaster (398 t -> ~2-3k t, the L1-4 campaign boss is the art gap) + enemy v3 for the 5 flagged ships (phantom / hauler / bulwark / sweeper / beacon) + cap renegotiation WITH MEASUREMENT at each asset landing. Queue behind E89: WebGPU default switch (E90 candidate, gated) / Monolith wave-5 wall / late-wave pacing / 2 E85 luma residuals / cockpit ship-portions + cockpit-relative controls.