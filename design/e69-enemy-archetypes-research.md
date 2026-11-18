# E69 Research - New Enemy Archetypes + Campaign Level 4 (I514, ST-480)

Research for opening E69 (standing queue item a: "new enemy types with better
real-spaceship Blender models" + "campaign extension (levels 4+)"). Method:
role-GAP analysis of the E68 frozen roster against labeled external design
references (S1-S12; YouTube transcript fetches were rate-limited this session,
so S4/S10/S11/S12 are chapter/metadata-level evidence and labeled as such).

## 0. Roster role matrix (E68 frozen 9 + hazards)

5-role vocabulary [S5]: tank / skirmisher / artillery / swarm / support.
Shmup-specific roles [S4]: pressure / area denial / direct challenge.
"Trick" test [S1]: every enemy's function must be explainable in one sentence.

| Role (slot) | Current occupant(s) | Gap? |
|---|---|---|
| Pressure (basic) | drone, stinger, wasp | - |
| Skirmisher (fast flank) | stinger, hunter, wasp | - |
| Artillery (ranged, forces movement) | gunship | - |
| Area denial | sentry, mines | - |
| Swarm | wasp | - |
| Tank (slow soaker, lane control) | warden (mini-boss only) | GAP - no regular slow tank |
| Support (buff/priority target) | - | GAP |
| Cloak / information twist | - | GAP |
| Enforcer (forces ONE specific counter) | - | GAP |
| Bomber/transport (drops hazards, Defender-style [S8]) | - | GAP |

GAP verdict: four empty slots. E69 fills three (cloak, slow-tank/bomber,
enforcer); support/buff is DEFERRED (highest balance-complexity cost, only
readable against groups - revisit after level 4 lands).

## 1. Findings (labeled sources)

F1 [S1] Enemy roles = four functions: SMASHER (player feels powerful),
EMPHASIZER (incentivizes one mechanic; most enemies should be these),
ENFORCER (requires a specific mechanic; use sparingly, make the mechanic
obvious), CHALLENGER (mini-boss/boss tier).

F2 [S5] The small role alphabet: a player learns one answer per role; fights
are "sentences" of roles. Compositions create emergent problems (tank+artillery,
support+swarm inverts target order, skirmisher+tank is a positioning vice).
Distinct silhouettes keep roles readable.

F3 [S4] Shmup enemy roles = screen-space control: PRESSURE (constant shot
pressure), AREA DENIAL (blocks movement), DIRECT CHALLENGE (elite dense
patterns). Levels mix and match; players like controlled repetition; constant
max-intensity wears players out (tighten <-> release arc - matches the E64
hazardProfile vocabulary already in CONFIG).

F4 [S3] Golden Triangle (endurance / speed / damage): an enemy may excel at at
most TWO, never all three - unless it is explicitly signaled as "avoid or run".

F5 [S2/S7] Enemy FAMILIES: a shared readable foundation + ONE varied dimension;
visual language lets players transfer knowledge; never ship variants whose only
difference is hidden stats. Each type must LOOK, FEEL, SOUND, ACT and MOVE
differently [S6] - a palette swap reads as a disappointment.

F6 [S7] Introduce new threats deliberately: ISOLATE it briefly, give room to
OBSERVE, use a SAFER early version, REPEAT the behavior before combining it
with other threats. Too many novel enemies overloads learning.

F7 [S8] Defender case study (lander / mutant / bomber): the unit's function
must be obvious or learnable by observation; that function becomes part of the
game dynamics.

F8 [S6] Readability + telegraph: consistent audiovisual feedback so patterns,
timing and tactics can be learned; a new enemy must represent a new challenge
or a strain on resources (not window dressing).

F9 [S9] Industry-consensus roster qualities: DIVERSITY (each type feels
different to fight), HIERARCHY (weak/strong ranking must be clear), LONGEVITY
(early enemies stay interesting later - new enemies must NOT make old ones
obsolete), EMERGENCE (combinations create new situations), CONSISTENCY
(predictable patterns the player can exploit).

F10 [S10, YouTube chapter list only] Archetype inventory of classic
"annoying-but-familiar" types: shielded, regenerating health, one-shot,
self-detonating, bullet sponge, plays dead, CLOAKING, requires specific
attack, healer, turret operator. The annoyances are mostly TELEGRAPH failures
or opacity of the rule - the archetypes themselves are proven.

F11 [S11, YouTube chapter list only] Level-layout anti-patterns: too big, too
symmetrical, too flat, too open, too empty, too linear, too samey, too generic.
Level 4 must not be "samey" vs levels 1-3 (a new identity + new hazards, not a
longer version of the ember zone).

F12 [S12, YouTube chapter list only] Level-design tips: clear goal, keep it
fresh, don't waste space, follow the flow, "the game is a language" (each
level should say something new in the established language).
## 2. The three E69 archetypes (decided; ST-481 pins exact numbers)

All three pass the one-sentence "trick" test [S1] and the F4 Golden Triangle
(max two of endurance/speed/damage). All are real-spaceship Blender builds at
the E68 remaster tier (VR_ naming, NEUTRAL COLOR_0 bake, Y-up, detail pass).
Hue/ladder bands below are CANDIDATES - ST-485 finalizes in-game WITH
MEASUREMENT (the E57 rule-1 AND test, |dluma|<=10 AND dhue<=40, must fail vs
every frozen pair). Candidate bands: green-cyan h~95-140; magenta h~300
(rendered luma outside 84-104); orange-red h~20-30 (rendered luma outside
106-126 vs hunter 116.11/13.5).

### 2.1 PHANTOM (cloaker) - "fades, then ambushes from your flank."
Role: cloak / information twist. Triangle: SPEED + info, NOT tanky (glass HP).
Cycle: visible 3.5 s -> cloak fade 1.2 s (opacity to ~0.12, faint READABLE
silhouette, untargetable) -> visible 2.5 s firing a 3-bolt aimed spread ->
repeat. Flank-bias steering: arrives from a side vector, never a head-on
charge. On death: full-opacity de-cloak flash so kills read [S10/F8].
First exposure (F6): isolated - own wave at firstWave 13+ (endless) and alone
in calm level-4 z1 (campaign): room to observe before combination.
Shape language: slim arrow hull with two swept canopy pods; cloak = opacity +
faint edge glow, never invisible-vanishing (readability F8).
Tri AIM/CAP: 2,200 / 2,600. Gate: firstWave 13+.

### 2.2 HAULER (bomber/transport, Defender-style [S8]) - "slow truck keeps
dropping mines."
Role: tank + area denial + resource pressure; the function is obvious by
observation [F7]. Triangle: ENDURANCE + size, LOW speed.
Behavior: plods ahead at 3-4 u/s (ship is 14), high HP, weak or no direct
fire; drops ONE mine every ~4 s that drifts into a denial corridor behind it.
Telegraph: mine-hatch glow + drop SFX 0.4 s before release [S6/F8]. Killing
it stops the mine feed - the priority decision the level teaches.
First exposure: firstWave 15+; campaign z2 with mines only (isolate).
Shape language: squat armored transport - wide flat hull, belly sponsons,
visible mine bay, heavy dorsal stack; reads as "truck" at 60 px [S9].
Tri AIM/CAP: 3,200 / 3,800 (largest new ship; watch the MAX_FILE_BYTES pin).
Gate: firstWave 15+.

### 2.3 BULWARK (shield-bearer, ENFORCER) - "front is invulnerable; go
around."
Role: enforcer - forces exactly one counter (flank it). Triangle: ENDURANCE
+ info (the arc), NOT speed.
Behavior: hovers near the player's plane, slowly yawing to face the player; a
frontal ~100 deg arc negates bullets (spark + clang on hit, F8); sides/rear
take normal damage; after N absorbed hits the shield flash-stuns ~1.5 s (the
reward window). maxConcurrent 1 - rare, boss-adjacent pressure.
First exposure: firstWave 17+; campaign z3 with a familiar mix around it
(isolation via rarity + the slow yaw makes the arc learnable).
Shape language: broad hexagonal shield plate on a narrow armored spine; the
shield IS the silhouette [S5].
Tri AIM/CAP: 2,400 / 2,900. Gate: firstWave 17+.
## 3. Campaign level 4 (data-driven; builds on E64 flightPath/level.js)

Structure: 4 zones on the curved race line, teach-isolate-combine per F6,
monotonic intensity calm -> gauntlet (F11: must not be "samey" - a new
identity + new hazards, not a longer ember zone). Candidate zone lengths
100/110/120/90 (L1-L3 precedent: boss-zone steps 60/70/80; finalized at
ST-486 with the palette audit).

| Zone | Hazard profile | Enemy mix (candidate) | Teach goal |
|---|---|---|---|
| z1 "Reef Approach" | calm (.5/0/.8) | phantom only, sparse | observe the cloak cycle in a safe window |
| z2 "Minefield Drift" | moderate (1/1/1) | hauler + falling mines | mine corridor + priority (kill the truck) |
| z3 "Bulwark Wall" | dense (1.5/1.5/1.25) | bulwark (maxConcurrent 1) + familiar mix | flank the shield arc |
| z4 "Necro Gauntlet" | gauntlet (2/2/1.5) | full mix incl. all three new types | combine every counter |

Identity candidates (ST-486 picks WITH MEASUREMENT - rendered-luma audit per
the I480 pattern + visible check): (a) deep teal-green bioluminescent "reef"
vs (b) magenta/violet "necro-reef". NOTE: debris-1..4 is already the teal
0x2dd4bf family, so (a) risks palette collision with level-3 debris vistas -
flag it for the audit either way.

Boss: Option A (DEFAULT) = boss.glb retint/posture variant (0 new tris; E64
campaignBoss machinery: weak point + telegraphed phases) + a new move set that
spawns phantom + bulwark minions (emergent composition - the boss stage
demonstrates the new counters). Option B = new boss GLB only if the
renegotiated budget still allows after the 3 enemy GLBs land (user pre-
approved the asset push; decide at ST-486).

Checkpoint/persistence: highest-level 3 -> 4 (storage key
'voidrunner.campaign'); Ikaruga-style checkpoint continue unchanged.

## 4. Budget impact (pre-registered)

Open state: dist 4,623,381 B / 175 files; ceiling 4,700,000 B (headroom
76,619 B = the E68 close floor). Expected delta: +3 GLBs ~1.0-1.4 MB
(phantom ~350-450 KB, bulwark ~400-500 KB, hauler ~350-500 KB) + code/tests/
i18n (en/zh/ja) ~80-120 KB -> projected ~5.7-6.1 MB.

PRE-REGISTERED RENEGOTIATION (E68/I506 precedent - document actual vs
expected): ceiling 4,700,000 -> 6,100,000 B WITH MEASUREMENT at the G69.0
close gate. MAX_FILE_BYTES re-pin WITH MEASUREMENT if hauler exceeds the
567.81 KB ship pin.

Tri budget: phantom 2,200/2,600, bulwark 2,400/2,900, hauler 3,200/3,800
(AIM/CAP) -> fleet grows 28 -> 31 GLBs, ~55,075 -> ~63-65k tris. GPU cost is
trivial for the target class (user pre-approved polygon growth).

Cut ladder (invoke in order at G69.0 if over the renegotiated ceiling):
C1 drop Bulwark (rarest/most complex) / C2 boss retint-only (already default
Option A) / C3 level 4 -> 3 zones (merge z3+z4) / C4 new-ship tri caps -25% /
C5 phantom procedural-only (no GLB).
## 5. Pin-safety argument (why the frozen pins should stay EXACT)

- causal483 (seed 9876, W2 endless arena) and playframe483/491 (A/B) are
  LOW-WAVE endless runs. The three new enemies gate at firstWave 13/15/17+
  -> ZERO RNG draws for new types inside the pinned windows -> pins expected
  to stay EXACT. Verify every E69 story; re-pin ONLY with measurement if
  drift appears (I482 pattern).
- E68 assetPerf/fleet pins (9-role fleet metrics) must be re-pinned WITH
  MEASUREMENT at ST-485 when the fleet grows 9 -> 12 roles (a documented
  geometry change, not drift).
- Endless bit-identity guard: all new-enemy code is gated behind firstWave
  and mode checks exactly like the E64 campaign code (the causal/playframe
  pins are the acceptance test for that).

## 6. Source list

S1  deliberate-gamedesign.com/enemy-categorization (2023, 4 roles)
S2  wayline.io/blog/designing-engaging-enemy-archetypes (2025, tank/DPS/support)
S3  jonwalker.design/portfolio-docs/enemy-archetypes (Golden Triangle)
S4  shmups.wiki Boghog's bullet hell shmup 101 + YouTube boghogSTG "Enemy
    Design & Effects [SHMUP WORKSHOP 04]" youtu.be/999tBKu8hNE (metadata/
    chapters ONLY - transcripts rate-limited)
S5  hayao.dev/docs/codex/system-enemy-archetypes (5-role vocab + compositions)
S6  gamedesignskills.com/game-design/enemy-design (2024, uniqueness/telegraph)
S7  gamedevchronicles.com/articles/enemy-design-challenging-opponents (2026,
    families/teaching/elites)
S8  gamedeveloper.com "Designing Enemies With Distinct Functions" (1999,
    Defender lander/mutant/bomber)
S9  cyyanhan.com/posts/025-Level-Design-Process-Combat-Enemy-Design (2023,
    diversity/hierarchy/longevity/emergence/consistency)
S10 YouTube GamingBolt "15 ANNOYING Enemy Types" youtu.be/MBHUSREhpyo
    (chapter list ONLY: shields/regen/one-shot/self-detonate/bullet
    sponge/plays dead/cloaking/specific-attack/healer/turret)
S11 YouTube Steve Lee "8 Common Problems with Level Layouts"
    youtu.be/wJEaWQz4180 (chapters ONLY: too big/symmetrical/flat/open/
    empty/linear/samey/generic)
S12 YouTube Apox Fox "5 Tips for Great Level Design" youtu.be/LBtucVc8l0M
    (chapters ONLY: clear goal/keep fresh/don't waste space/follow flow/
    game-is-a-language)
