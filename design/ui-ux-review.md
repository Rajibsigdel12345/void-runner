# UI/UX Review - Void Runner (I93, ST-093)

Scope: desktop web (keyboard) UI/UX. Reviewed the DOM overlay UI in src/render/ (hud, screens, waveBanner, bossHealth, settingsPanel, tutorialHint, scorePopups) against design/gdd.md for clarity, comprehension, accessibility, and player feedback. Scope bounded to the current UI (E7 arc); no engine/framework changes.

## Summary
The DOM UI is already in good shape: a clean three-region HUD (score/best top-left, wave top-center, lives top-right), power-up timer chips that never rely on color alone, a visible 4s combo drain bar, a MONOLITH boss HP bar, a first-wave tutorial hint, and a full settings panel (volume / SFX / FX quality / reduced motion / font scale) with keyboard nav + aria-labels. The one real comprehension gap found and fixed this iteration is the wave modifier, which was only shown in the 1.8s start banner and then invisible for the rest of the wave (the I90 "invisible wave-modifier tag").

## Friction
- F-MOD (FIXED, I93): the active wave modifier (fast/small/inward) was shown only under the 1.8s WAVE start banner, then invisible. A player mid-wave could not tell the modifier was in play. Fixed with a persistent tag under the WAVE counter (see Changed files).
- F-CONTROLS (LOW, accepted): flight controls are shown only for 6s on wave 1 (tutorialHint). No persistent "how to fly" reference after that. Accepted - arcade controls are standard (WASD/arrows + mouse aim) and the pause screen lists the settings-nav keys.
- F-ZOOM (LOW, accepted): viewport is locked to user-scalable=no. Prevents accidental pinch-zoom on a game canvas; an accessibility trade-off for touch users. Accepted for a desktop-first arcade game.

## Comprehension
- GOOD: score/best, wave number, lives (hearts), combo + multiplier with a draining 4s bar, active power-ups (letter + label + color + timer), and boss HP (MONOLITH bar) are all legible and always-on when relevant.
- FIXED (I93): the wave modifier is now persistent for the whole wave (e.g. "WAVE 3 / FAST ROCKS"), extending the GDD intent ("the active modifier is announced under the WAVE banner") from a 1.8s flash to the full wave.
- WATCH (unverified by bot, defer to human playtest): in-world entity colors (boss purple, mine red, golden rock, vortex) carry meaning partly through color/shape; a full colorblind audit of the 3D meshes is out of scope for this DOM-UI pass and is deferred to the graphics/Blender pass.

## Accessibility
- STRONG (existing): reduced-motion toggle (gates the banner slide and other motion; opacity still applies), font scale (NORMAL/LARGE/XL via --vr-fs applied across HUD/banner text), FX quality, text-shadow on every overlay for contrast, best-score contrast raised to 0.9, and power-up chips use a letter badge + color + label ("never color alone", per the GDD). Settings controls have aria-labels and a documented keyboard path (Tab/Arrows/Space).
- ADDS (I93): the new modifier tag uses a text label (not color alone) and respects the font scale; it is static (no motion) so reduced-motion is unaffected.
- GAPS: in-world (non-DOM) entity identification relies more on color/shape - deferred to the graphics pass (see Risks).

## UX Verdict
SHIP-READY for the desktop keyboard experience. The single meaningful comprehension gap (wave modifier) is now fixed and browser-verified. Remaining items are low-severity and either accepted (arcade norms) or explicitly deferred to the graphics/Blender pass (in-world colorblind audit).

## Risks
- In-world entity colorblind safety (boss/mine/golden/vortex/power-up drops) is not fully audited - color is one of several channels (shape + motion + SFX), but a dedicated pass belongs in the graphics work, not this DOM-UI review.
- The modifier tag adds a small always-on DOM element; it is display-toggled (no layout shift) and guarded by a lastModTag cache (no per-frame writes when unchanged), so cost is negligible.

## Changed files (I93)
- src/render/hud.js: added a persistent active-modifier tag under the WAVE counter (MOD_TAG label+color map, waveMod element, lastModTag cache, render logic). Shown for fast/small/inward, hidden for plain/breather waves.

## Proposed (not done - out of scope / deferred)
- Optional: a subtle in-world cue for the active modifier (e.g. rock tint) - belongs in the graphics/Blender pass.
- Optional: a "how to fly" recap in the pause menu - low priority.

## Verification evidence
- node --test 233/233 green; node scripts/build.mjs exit 0.
- Browser smoke (1280x720, live dev build): forced each modifier and read the DOM - wave 3 activeMod=fast -> tag "FAST ROCKS" (display block, color rgb(255,154,107)); wave 9 activeMod=small -> "SMALL ROCKS" (block, rgb(111,227,255)); wave 6 activeMod=none (breather) -> tag hidden. Screenshot .evidence/i93-smoke-modtag.png (WAVE 3 / FAST ROCKS tag visible in the live HUD, 0 console errors).

## Next owner or decision
I94 (reverse-document) - or the producer to green-light the deferred in-world colorblind audit as part of the post-I100 Blender graphics pass.
