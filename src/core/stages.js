// ST-419 (I449) / E57: linear campaign stage system. Pure core - no three, no DOM, no RNG.
// A derived view over the existing deterministic wave timeline (waves 1..15).
// NOTE: design/campaign-stages.md sec 4.1 gives ceil((w-1)/5) which is off-by-one; the
// stated ranges (stage1=1-5, stage2=6-10, stage3=11-15; bosses at 5/10/15) require
// floor((w-1)/5)+1 (implemented below).
export function stageForWave(w) { const n = Math.max(1, Math.floor(w)); return Math.floor((n-1)/5)+1; }
export function isStageEndWave(w) { return w >= 5 && w <= 15 && w % 5 === 0; }
export function isFinalWave(w) { return w === 15; }
export function stageIndex0(w) { const s = Math.floor((Math.max(1, Math.floor(w))-1)/5); return Math.max(0, Math.min(2, s)); }
export function stageRow(stage, cfg) { const rows = cfg.stages && cfg.stages.stages; if (!rows || !rows.length) return null; const i = Math.max(0, Math.min(rows.length-1, Math.floor(stage)-1)); return rows[i]; }
export function stageTheme(stage, cfg) { const r = stageRow(stage, cfg); return r ? r.theme : null; }
export function stageName(stage, cfg) { const r = stageRow(stage, cfg); return r ? r.name : ''; }
export function makeWarp(duration) { const dur = typeof duration === 'number' && duration > 0 ? duration : 0; return { t: 0, dur: dur }; }
export function stepWarp(warp, dt) { warp.t += dt; return warp.t >= warp.dur ? 'done' : 'active'; }
