# E92 scope check - Late-wave pacing: stragglers stop holding the wave hostage

Opened I629 (ST-589..ST-591 pre-registered). E91 CLOSED at I628 (6c69b62; push landing verified via git ls-remote before the I629 open). The user's explicit ask: "after the blue unbreakable rocks appear around wave 8 or 9, the wave clearance takes a long time even after all the asteroids and the enemies are dealt with... make that transition less long, it feels like waiting forever... if you wanted to fill in the gaps then see to that so it just does not feel like waiting doing nothing."

## Scope Fit

Measured at I629 (on disk, post-I628):
- dist: 6,638,132 B / 205 files (byte-identical to I627; I628 was a docs-only close).
- Close target: 7,297,600 B (7,400,000 ceiling - 102,400 B close-floor). CLOSE FLOOR E91 = 659,468 B (measured at G91.0) -> E92 envelope 659,468 B.
- Assets: 34 GLB / 4,182,504 B / 189,495 t (E91 final). E92 makes NO asset changes: no new GLB, no re-encode, no loader/decoder touch.
- Feasibility: worst-case code-only growth +12,000 B -> dist 6,650,132 B -> margin vs close target 647,468 B (>= 102,400 B floor). Feasible; no cut-ladder trigger expected.

## Root cause (I629, on disk - measured)

1. WaveDirector.step clear condition (I563): the wave clears only when toSpawn === 0 && field.killableCount === 0. Anything else waits for the cfg.wave.stallTime = 45 s backstop (the wave's ACTIVE elapsed time, I42). So a wave with a few killable stragglers (typically shielded M rocks - armor 3, drifting, easy to lose sight of) holds the player up to the 45 s wall even though the wave is effectively over.
2. ST-138 belt: from wave 8 (cfg.belt.fromWave), ONE indestructible blue belt rock joins per wave start (max 5), persistent for the rest of the run. They cannot be destroyed (bullet-proof, bomb-proof, survive ship contact) and visually reinforce "rocks are still everywhere, the wave will never end"; the player cannot tell which rocks are actually blocking the clear.
3. The waveCleared moment carries NO reward beat: gold CLEARED banner + 'cleared' SFX only, then a 2.2 s (shrinking to 1.2 s) intermission. The transition reads as a dead gap, which is exactly the "waiting doing nothing" the user asked to fix.

## Design (PRE-REGISTERED)

Two complementary halves - the user offered both ("less long" OR "fill in the gaps"); doing both is what a designed pacing beat looks like:

1. LEFTOVER GRACE (shorter transition - the core fix): once toSpawn === 0 and the field's killable count is down to cfg.wave.leftover.max (2) or fewer, a leftover timer runs; after cfg.wave.leftover.stall (10 s) the wave advances through the EXISTING stall path (leftovers carry over, no intermission - identical to the I42 stall semantics). The post-clear wait drops from up to 45 s to ~10 s. The timer resets to 0 whenever the condition stops holding (a split or trickle spawn lifts the count back above max). No new RNG draws; deterministic.
2. CLEAR REWARD BEAT (fill the gap - the clear itself becomes the reward): on a TRUE clear only (waveCleared, not a stall advance), the wave awards a flat score bonus via scoreKeeper.bonus() (combo-chain-safe, overdrive-doubled per ST-057): pts = min(cfg.wave.clearBonus.cap, base + perWave * wave) with base 150 / perWave 25 / cap 500. The banner's sub-line shows "WAVE n + pts" (new string banner.cleared_bonus, EN/zh/ja). Stall advances (grace or 45 s) get NO banner and NO bonus - only a complete clear is rewarded.

## Code audit (I629, on disk)

- src/core/waves.js: clear/stall branches in step() (lines ~170-190) - the only place wave advancement happens. field.killableCount excludes belt rocks (I563) - belt can never block; the grace builds on the same accessor.
- src/core/asteroids.js: belt rocks indestructible by design (hit/shatter/destroy guards); killableCount getter.
- src/core/game.js: cfg.belt (fromWave 8, max 5, size M) + spawnBeltForWave; line ~279 `if (wv.waveCleared) this.emit('waveCleared', { n: wv.waveCleared })` - the single emit site for the reward wiring. waves.step is called unconditionally (campaign included - campaign zones still run waves for rock content; the grace applies consistently to both modes, and campaign causal483 is EXPECTED EXACT: headless no-input runs never reach the grace or the clear).
- src/core/score.js: bonus(pts) - "Flat score bonus that does NOT touch the combo chain (ST-053 near-miss). Doubled under OVERDRIVE (ST-057)." Exactly the right API.
- src/render/waveBanner.js: startCleared(n) - gold big CLEARED + sub t('banner.wave',{n}); dur 1.2 s. Becomes startCleared(n, bonus) with sub t('banner.cleared_bonus',{n,p}).
- src/main.js L1054: `banner.showCleared(e.data.n)` -> passes e.data.bonus.
- src/core/strings.js: banner.cleared / banner.countdown at L112/347/574 (EN/zh/ja) - banner.cleared_bonus added in all three.
- config.js wave block: intermission 2.2 / stallTime 45 / spawnMinPlayerDist 8 - leftover + clearBonus levers added here.
- tests/waves.test.js: I42 stall test (line 97) - never kills rocks, count stays above leftover.max -> grace cannot fire -> stays green unchanged.

## Fix set (PRE-REGISTERED)

- ST-589 (I630) - D1 leftover grace, ONE atomic commit: cfg.wave.leftover { max: 2, stall: 10 }; WaveDirector leftoverT (constructor + start()/reset() init, per-frame recompute in the active branch); grace advance reuses the stallAdvance path (ev.stallAdvance, banner flow unchanged); unit tests: (a) 2 stragglers -> advance at ~stall s, (b) 3 stragglers -> no grace (stallTime only), (c) timer resets when count rises, (d) true clear still instant + grace state reset. Pins: causal495/483 EXPECTED EXACT, playframe EXPECTED EXACT (no geometry), pwa EXPECTED 11/11.
- ST-590 (I631) - D2 clear reward beat, ONE atomic commit: cfg.wave.clearBonus { base: 150, perWave: 25, cap: 500 }; game.js computes pts on wv.waveCleared, scoreKeeper.bonus(pts), emits { n, bonus }; waveBanner startCleared(n, bonus) + banner.cleared_bonus strings EN/zh/ja; main.js passes the bonus; unit tests: pts formula (mid + cap), stall advance emits NO bonus, bonus lands in the score (overdrive doubling per ST-057 stays as-is). Pins: same EXPECTED EXACT set (DOM-only + score; no scene draws, no RNG).
- ST-591 (I632) - G92.0 close gate: 6/6 harness battery (labels CLOSEGATE632) + fresh dist re-measure vs 7,297,600 B + CLOSE FLOOR E92 WITH MEASUREMENT + AGENTS.md refresh (item-4 chain + one-liner + close-floor clause) + 7-file bookkeeping + ONE atomic commit + push subagent.

## Budget (FROZEN)

- code-only <= 12,000 B -> worst-case dist 6,650,132 B (margin 647,468 B vs the 7,297,600 B close target; >= 102,400 B floor).

## Cut ladder (PRE-REGISTERED - invoked only on acceptance failure, never silent)

- C1: drop the D2 reward beat (score bonus + banner bonus text) - grace only.
- C2: leftover.stall 10 s -> 15 s (more conservative; grace stays).
- C3: drop D1 entirely (D2 only) - last resort; the grace is the user's core ask.

## Risks

1. Grace firing on a wave whose total content is <= leftover.max: impossible with current config (contentFor >= base + growth*1 = 10 > 2) but the toSpawn === 0 precondition makes it structurally safe regardless.
2. Campaign parity: waves.step runs in both modes; grace + bonus apply to campaign waves identically - headless causal483 never triggers either path (no input -> no kills), EXPECTED EXACT.
3. Overdrive doubling of the clear bonus (ST-057) is intentional parity with near-miss bonuses.
4. i18n bytes: 3 short strings - within budget.
5. Grace advance uses the stall path on purpose: no CLEARED banner, no bonus - only a complete clear rewards.

## Acceptance

- A1: with <= 2 killables left, the wave advances within leftover.stall + epsilon (unit).
- A2: with 3+ killables left, the grace never fires (stallTime remains the only backstop) (unit).
- A3: the timer resets when the killable count rises again (unit).
- A4: true clear is still instant and gets the bonus; stall/grace advance gets neither (unit).
- A5: CLOSEGATE632 battery 6/6 EXACT (zero re-pins, or WITH MEASUREMENT where moved).
- A6: manual smoke (one browser tab, closed after): endless run to wave 8+, verify the grace + bonus banner read.
