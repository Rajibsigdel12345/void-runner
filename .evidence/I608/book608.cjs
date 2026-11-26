const fs = require('fs');
const R = p => fs.readFileSync('E:/Game/' + p, 'utf8');
const W = (p, s) => fs.writeFileSync('E:/Game/' + p, Buffer.from(s, 'utf8'));
function once(hay, needle) {
  let c = 0, i = 0;
  while ((i = hay.indexOf(needle, i)) >= 0) { c++; i += needle.length; }
  if (c !== 1) throw new Error('anchor count ' + c + ' != 1: ' + needle.slice(0, 60));
  return i;
}

// 1. epics.md (BOM, CRLF-only, endsNL): append E88 section
{
  let s = R('production/epics.md');
  if (s.includes('## E88 - MESHopt')) throw new Error('E88 section already present');
  const E = '\r\n';
  const sec =
    '## E88 - MESHopt compressed asset pipeline + headroom unlock - OPEN I608 (G88.0; opened I608)' + E + E +
    '- Goal: unlock permanent asset headroom so the user standing art ask (richer ship/enemy art via Blender, "use polygons and GPU resources as much as needed" - E89) is feasible. Measured blocker: the asset caps are 100% consumed (totalFilesKB headroom 712 B / totalGeoKB 988 B; totalTris EXACT at cap 123,188 t) and the ship file wall leaves only 30,704 B (about +1,360 t) of possible growth, against a 443,222 B total E88 growth budget (E87 close floor 545,622 B - 102,400 B close-floor floor). Fix: re-encode all 34 GLBs with EXT_meshopt_compression (lossless, three.js r187 GLTFLoader-native, JS-only in-buffer decoder 29,256 B already vendored + git-tracked, deterministic decode = geometry bit-identical, GLB stays single-file) + vendor the decoder module + renegotiate the asset caps to measured+15%. Expected dist DROP 6,854,378 B -> ~3.6-3.9 MB (permanent ~3.5 MB headroom for E89+).' + E + E +
    '- Research: production/scope-check-E88.md (I608, FROZEN) + .evidence/I608/glbtris608.cjs (34 GLB inventory: 4,431,160 B / 123,188 t, matches the house parser) + on-disk cap reads (tests/assetPerf.test.js totalFilesKB 4,328 KiB / totalGeoKB 4,261 KiB / perFileKB 1,400 / totalTris 123,188 / perFileMats 5; tests/assetGlbs.test.js MAX_FILE_BYTES 1,500,000 / BUDGETS.ship 62,254) + vendor tree read (vendor/jsm/libs/meshopt_decoder.module.js 29,256 B raw, git-tracked, NOT yet in build.mjs VENDOR_FILES; the import-map three/addons/ prefix resolves it; public/sw.js runtime-caches all same-origin GETs -> no PWA change) + reference research (YouTube metadata: Zeppelin rigid / Dominator / steampunk airship refs; inset/outset panel greebles without booleans; silhouette-first ship design).' + E + E +
    '- Stories: ST-573 (I608) E88 open - research + budget math + scope check FROZEN + bookkeeping - DONE I608: scope-check-E88.md FROZEN (measured infeasibility: asset caps 100% consumed, ship binding cap 30,704 B, E88 growth budget 443,222 B; MESHopt feasibility: native + JS-only in-buffer decoder + deterministic; FROZEN fix set / bounds / protocol / budget / cut ladder C1+C2 / cap renegotiation rule measured+15%); dist byte-identical 6,854,378 B / 204; vendor 4/4 EXACT; npm test 1,246/1,246 / ST-574 (I609) MESHopt atomic landing (re-encode 34 GLBs + decoder vendor + addMeshoptDecoder + re-pins WITH MEASUREMENT + headless smoke) - PENDING / ST-575 (I610) G88.0 close gate + CLOSE FLOOR E88 WITH MEASUREMENT + cap renegotiation recorded + AGENTS.md refresh - PENDING' + E + E +
    '- Status: OPEN I608 (G88.0 pending; 1/3 stories DONE). ST-573 I608 (research + budget math + FROZEN scope check, docs-only, dist byte-identical 6,854,378 B / 204).' + E;
  s = s + sec;
  W('production/epics.md', s);
  console.log('epics.md appended E88 section');
}

// 2. stories.md (BOM, mixed EOL, no endNL): append 3 story lines
{
  let s = R('production/stories.md');
  if (s.includes('ST-573 E88')) throw new Error('ST-573 line already present');
  const l1 = '- ST-573 E88 MESHopt compressed asset pipeline + headroom unlock - E88 OPEN (I608) - DONE I608: research + budget math (measured infeasibility of the art-only epic: totalFilesKB cap headroom 712 B / totalGeoKB 988 B / totalTris EXACT at cap 123,188 t / ship binding cap perFileKB 30,704 B = ~+1,360 t / MAX_FILE_BYTES looser 97,104 B / E88 total growth budget 443,222 B = E87 floor 545,622 - 102,400) + feasibility evidence (three r187 GLTFLoader EXT_meshopt_compression-native; JS-only in-buffer decoder vendor/jsm/libs/meshopt_decoder.module.js 29,256 B raw already vendored + git-tracked - no new fetch, no wasm, deterministic decode = geometry bit-identical; GLB contract preserved; public/sw.js runtime-caches -> no PWA change) + scope-check-E88.md FROZEN (fix set ST-573/574/575 / frozen bounds / measurement protocol / budget close <= 7,297,600 B / cut ladder C1+C2 / cap renegotiation rule measured+15%) + 6-file bookkeeping (BOM deltas 0). NO src: dist byte-identical 6,854,378 B / 204; vendor 4/4 EXACT (A65DE049A7F38B40 / 7AB0784CD2532367 / F549248412C62B9A / 7FF9ACF50F006017); npm test 1,246/1,246. I607 push c2836d8 VERIFIED on origin main this turn (git ls-remote == HEAD).';
  const l2 = '- ST-574 E88 MESHopt atomic landing (I609) - PENDING: re-encode ALL 34 GLBs with EXT_meshopt_compression (dev-only node tooling @gltf-transform/* + meshopt; double-encode byte-compare determinism, ABORT on diff; 34 backups + hash manifest to .evidence/I609/) + VENDOR_FILES += jsm/libs/meshopt_decoder.module.js + vendor.mjs raw pin 29,256 B + ADR row + assetLoader.js addMeshoptDecoder (2 lines) + re-pins WITH MEASUREMENT (assetPerf size caps -> measured+15%, totalTris 123,188 + perFileMats 5 unchanged; assetGlbs MAX_FILE_BYTES -> measured max+15%, BUDGETS tris unchanged) + headless smoke 34/34 (0 GLTF errors, 123,188 t, console 0/0, no NaN) + playframe/causal495/causal483 EXPECTED EXACT or re-pin WITH MEASUREMENT + document; pwa491 EXPECTED 11/11. ONE atomic commit (decoder + assets land together). Cut ladder C1 (ship + 5 flagged only if ratio < 2x) / C2 (dist > 4,200,000 B -> register + reconsider, no forced swap).';
  const l3 = '- ST-575 E88 G88.0 close gate (I610) - PENDING: 5/5 harness (clone .evidence/I607/run_closegate607.cjs -> .evidence/I610/run_closegate610.cjs, labels CLOSEGATE610, ports self-start/self-kill), fresh dist re-measure (expect ~3.6-3.9 MB), CLOSE FLOOR E88 WITH MEASUREMENT (expect ~3.5 MB), cap renegotiation recorded WITH MEASUREMENT, AGENTS.md item-4 + asset line refresh, E88 CLOSED, push delegate + verified, hygiene (0 tabs, all 4 ports free, no terminals).';
  s = s + '\r\n' + l1 + '\r\n' + l2 + '\r\n' + l3;
  W('production/stories.md', s);
  console.log('stories.md appended 3 lines');
}

// 3. iterations.md (BOM, CRLF-dominant, no endNL): append I608 entry
{
  let s = R('production/iterations.md');
  if (s.includes('## I608 - ST-573')) throw new Error('I608 entry already present');
  const main = '## I608 - ST-573 (E88): E88 open - MESHopt compressed asset pipeline + headroom unlock. The user standing art ask (richer ship/enemy art, "use polygons and GPU resources as much as needed") is STRUCTURALLY CAPPED by the current asset pipeline - measured on disk: asset total caps 100% consumed (totalFilesKB 4,328 KiB cap vs 4,431,160 B = 712 B headroom; totalGeoKB 4,261 KiB vs 4,362,276 B = 988 B; totalTris EXACT at cap 123,188 t; perFileMats 5 = hauler at cap), the ship binding cap perFileKB 1,400 KiB vs ship.glb 1,369.04 KiB = 30,704 B (~+1,360 t at the measured 22.5 B/t; MAX_FILE_BYTES 1,500,000 looser at 97,104 B), and the E88 total growth budget 443,222 B (E87 close floor 545,622 B - 102,400 B close-floor floor). E88 = the pipeline unlock: re-encode ALL 34 GLBs (4,431,160 B / 123,188 t) with EXT_meshopt_compression - lossless, three r187 GLTFLoader-native (addMeshoptDecoder), JS-only in-buffer decoder (vendor/jsm/libs/meshopt_decoder.module.js 29,256 B raw, ALREADY vendored + git-tracked, not yet in build.mjs VENDOR_FILES), no new fetch, no wasm, deterministic decode = geometry bit-identical -> render pins EXPECTED EXACT; GLB stays single-file (contract preserved); public/sw.js runtime-caches -> no PWA change. Expected dist DROP 6,854,378 B -> ~3.6-3.9 MB = permanent ~3.5 MB headroom for E89 (ship v9 Mk.II ~100-120k t / boss.glb remaster 398 t -> ~2-3k t / enemy v3 x5 flagged ships). FROZEN design + budget + cut ladder C1/C2 + cap renegotiation rule (measured+15%) in production/scope-check-E88.md (9,485 B, LF, no BOM, FROZEN). NO src change: dist byte-identical 6,854,378 B / 204; vendor 4/4 EXACT (A65DE049A7F38B40 / 7AB0784CD2532367 / F549248412C62B9A / 7FF9ACF50F006017); npm test 1,246/1,246. I607 push c2836d8 VERIFIED on origin main this turn (git ls-remote == local HEAD).';
  const push = '- Push: I608 commit push delegated to Wegener 01a215dc-9568-7921-925d-3a64bbd7f9be (landing verified next turn via git ls-remote; the I607 push c2836d8 confirmed on origin main this turn).';
  s = s + '\r\n' + main + '\r\n' + push;
  W('production/iterations.md', s);
  console.log('iterations.md appended I608 entry');
}

// 4. timeline.md (BOM, LF-dominant, no endNL): append I608 paragraph
{
  let s = R('production/timeline.md');
  if (s.includes('## I608 - ST-573')) throw new Error('timeline I608 already present');
  const p = '## I608 - ST-573: E88 open - MESHopt compressed asset pipeline + headroom unlock. The standing art ask hit a measured wall: the asset storage caps are 100% consumed (712 bytes of room on the total-size cap, the triangle count exactly at its cap, and only ~30 KB of growth room on the ship file) and the bundle headroom (545,622 bytes) cannot absorb a serious art pass, so this round opens the pipeline unlock instead: every 3D model will be re-encoded with lossless MESHopt compression (native to the three.js loader, a pure JS decoder that is already in the vendor tree, and deterministic decoding means the meshes come out bit-identical so every render pin is expected to hold exactly), which should shrink the download from 6.85 MB to about 3.6-3.9 MB - permanently freeing ~3.5 MB for the next art pass (a much bigger airship, a rebuilt L1-4 boss, and five remastered enemy hulls). The design is frozen (scope-check-E88.md) with a pre-registered cut ladder and cap renegotiation rules; no gameplay or rendering code changed this round and the build is byte-identical at 6,854,378 bytes / 204 files. Next: I609 lands the compression atomically (decoder + all 34 re-encoded models in one commit), then I610 runs the G88.0 close gate.';
  s = s + '\n\n' + p;
  W('production/timeline.md', s);
  console.log('timeline.md appended I608 paragraph');
}

// 5. active.md (no BOM, CRLF-only, no endNL): append NEXT at I609
{
  let s = R('production/session-state/active.md');
  if (s.includes('NEXT at I609')) throw new Error('NEXT at I609 already present');
  const n = '- NEXT at I609 = ST-574 (E88): MESHopt atomic landing - (a) npm i -D @gltf-transform/core @gltf-transform/extensions @gltf-transform/functions meshopt (dev-only; verify node-side determinism: double-encode byte-compare, ABORT on diff; fallback = per-GLB meshopt_encoder script + manual GLB buffer rewrite if gltf-transform proves non-deterministic); (b) re-encode ALL 34 GLBs with EXT_meshopt_compression -> .evidence/I609/ with 34 backups + hash manifest; the GLB contract must hold EXACT (123,188 t total + per-asset pins + COLOR_0 + node set + materials per file, per glbtris608.cjs + house glb_tris.cjs); (c) scripts/build.mjs VENDOR_FILES += jsm/libs/meshopt_decoder.module.js + scripts/vendor.mjs raw size pin 29,256 B + vendor-r187 ADR row (raw + dist sha256-16, I495 pattern; jsm is NOT minified so dist = raw); (d) src/render/assetLoader.js += 2 lines (import { MeshoptDecoder } from three/addons/libs/meshopt_decoder.module.js + loader.addMeshoptDecoder(MeshoptDecoder)); (e) re-pins WITH MEASUREMENT: assetPerf totalFilesKB/totalGeoKB/perFileKB -> measured compressed + 15% (totalTris 123,188 + perFileMats 5 unchanged), assetGlbs MAX_FILE_BYTES -> measured max + 15% (BUDGETS per-asset tris unchanged, ship stays 62,254); (f) headless browser smoke: 34/34 GLB load 0 errors, total tris 123,188, console 0/0, no NaN, ship/enemy/boss frames non-degenerate; (g) playframe491/483 + causal495 + causal483 EXPECTED EXACT (decoded geometry bit-identical) or re-pin WITH MEASUREMENT + document; pwa491 EXPECTED 11/11 (sw.js runtime-caches, no SW change). ONE atomic commit (decoder + assets land together - never a commit with the decoder and no assets or assets and no decoder). Cut ladder C1 (ship + 5 largest flagged only if the ratio < 2x) / C2 (dist > 4,200,000 B -> register the measured ratio + reconsider, do NOT force the swap; revert to raw, close E88 as docs-only, reopen as E88a). THEN push delegate to Wegener + hygiene.';
  s = s + '\r\n' + n;
  W('production/session-state/active.md', s);
  console.log('active.md appended NEXT at I609');
}

// 6. CHANGELOG.md (BOM, LF-only): insert I608 line before the I606 line
{
  let s = R('CHANGELOG.md');
  const anchor = '- I606: The edge-of-arena camera fix is finished';
  const i = once(s, anchor);
  const line = '- I608: No visible change - the groundwork for a much lighter download is in place: we measured exactly how full the game\'s 3D model storage is (it is at 100 percent - no room left to add the new detailed ships you have been asking for), and froze the plan to losslessly compress every 3D model file in the next update so the same models take far less space, which opens the room for the next big art pass (a much bigger airship, a rebuilt boss, and five remastered enemy hulls). Nothing in the game changed. Bundle unchanged at 6,854,378 bytes, under the 7.4 MB limit with 545,622 bytes of room to spare.\n';
  if (s.includes('I608: No visible change')) throw new Error('CHANGELOG I608 already present');
  s = s.slice(0, i) + line + s.slice(i);
  W('CHANGELOG.md', s);
  console.log('CHANGELOG.md inserted I608 line');
}

// verify: BOM deltas 0 + key anchors count 1
const checks = [
  ['production/epics.md', '## E88 - MESHopt compressed asset pipeline'],
  ['production/stories.md', '- ST-575 E88 G88.0 close gate (I610)'],
  ['production/iterations.md', '## I608 - ST-573 (E88):'],
  ['production/timeline.md', '## I608 - ST-573:'],
  ['production/session-state/active.md', '- NEXT at I609 = ST-574 (E88):'],
  ['CHANGELOG.md', '- I608: No visible change'],
];
for (const [p, a] of checks) {
  const b = fs.readFileSync('E:/Game/' + p);
  const s = b.toString('utf8');
  let c = 0, i = 0;
  while ((i = s.indexOf(a, i)) >= 0) { c++; i += a.length; }
  console.log('verify', p, 'BOM:', b[0] === 0xEF, 'anchor count:', c, (c === 1 ? 'OK' : 'FAIL'));
}