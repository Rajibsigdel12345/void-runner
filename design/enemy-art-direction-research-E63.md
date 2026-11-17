# Enemy Art Direction Research - Void Runner (E63, I479)

ST-446 (I479) / E63. Authored under cgs-art-bible (research pass) + cgs-scope-check (E63).
Extends the roster rules of design/enemy-visual-language.md (E57/ST-417) - this doc is the
research + gap-analysis base for ST-447 (the role specs). Research items below are LABELED;
tree items are verified in this tree (I479).

## 1. Labeled research sources

YouTube (mcp__youtube, 2 search passes, 13 queries, 92 raw results; 6 selected):
- Y1 Design Doc - "How Do You Design a Cast of Enemies?" (2020-08-24, 546K views) - roster design:
  visual AND mechanical novelty; palette-swap failure mode; functionally-identical skins (Origami
  King) kill discovery.
- Y2 Inner Chaos Games - "Why Your Game SUCKS: How To Improve Attack Animations" (2023-02-06) -
  anticipation/hit/recovery; enemy attacks need "serious anticipation" (>= player reaction time);
  hit instant; recovery = the player's counter-window.
- Y3 PepperHead - "What Makes A Good Roguelike/Roguelite?" (2023, 924K) - enemy-design chapter
  (26:16): novelty over time, diversity.
- Y4 AdamCYounis - "Pixel Art Class - The Importance of Character Scale" (2022, 356K) -
  silhouette first, second shade, color/detail last (chapters 22:35-29:22).
- Y5 UPLN Gaming - "18. Enemies in Formation - Space Shooter PICO-8" (2025) - formation entry as
  readable intent.
- Y6 Tim's Tiny Arcade - "Galaga Strategy Tips from Pro Player Jordan Dorrington" (2019, 327K) -
  dive-bomb telegraphs; the fake dive.

Web (mcp__parallel web_search, 1 pass, 3 queries, search_id search_d6c8f617679f34ec999d9e816e9be4cf; 10 selected):
- W1 gamedeveloper.com - "Designing Enemies With Distinct Functions" (1999) - Defender case study:
  four distinction axes (movement rate / flight type / aggression / special ability); derive the
  enemy FROM its function (reverse-engineering).
- W2 book.leveldesignbook.com - "Enemy design" - roster roles Grunt/Squad/Leader/Tank/Swarm/Sniper;
  unique silhouette readable at mid-range; telegraph state/intent/weakness.
- W3 gamedeveloper.com - "7 twin-stick shooters that game developers should study" (2017) -
  Robotron: 2084: each enemy behaviorally simple, clearly distinct; COMBINATIONS create the
  challenge.
- W4 code198x.com - "Enemy Design" - Space Invaders shootback; Robotron tuning: "Grunt finished in
  the first week; several weeks spent tweaking each enemy with extensive play testing"; random
  events are associated by players with enemy mood/intelligence.
- W5 gamedeveloper.com - "Enemy design and enemy AI for melee combat systems" (2015) -
  Emphasizers/Enforcers/Smashers/Challengers; tells communicate the question, not the answer.
- W6 gamedesignskills.com - "Enemy Design in Games" (2024) - uniqueness, readability/telegraph,
  threat hierarchy, emotional range; "establish the enemy's core function" (narrative +
  mechanical why).
- W7 cyyanhan.com - "#025 Level Design - Combat Enemy Design" (2023) - roster matrix role x
  speed/health/range/DPS; diversity/hierarchy/longevity/emergence/intelligence/consistency.
- W8 supagamesai.com - "Neon Siege: Arena FPS Lessons" - enemy roles make waves legible
  (chaser/shooter/heavy); wave = puzzle, not crowd; roles as data (speed, preferred range,
  cooldown, reward).
- W9 slynyrd.com - "Shmup Design Part 1" (2020) - speed/HP/size/movement-geometry axes;
  "popcorn" one-shot kills buy action feel; size spectrum (big = high HP + slow; small = low HP +
  fast); faction cohesion via visual consistency + individual shape/color.
- W10 gamedeveloper.com - "Enemy Attacks and Telegraphing" (2015) - pre-attack delay = fairness;
  telegraph = animation + SFX + VFX; the charge-up pattern.

## 2. Findings

F1 - Roster novelty is two-channel. Visual novelty and mechanical novelty EACH independently
sustain "novelty over time"; a new skin with the same function (palette swap) measurably lowers
player expectation (Y1 2:30-4:36, 6:34). => E63 adds roles with NEW FUNCTIONS, not new skins.
F2 - Fairness = anticipation budget. Enemy attacks require anticipation >= average player
reaction time; attack = anticipation/hit/recovery; recovery is the player's counter-window (Y2
1:07-1:40). => Every E63 attack pre-registers a minimum anticipation; dash speed capped against
ship.maxSpeed (14 u/s).
F3 - Function first. Design units by role function, then derive the body from it; distinction
axes: movement rate, flight type, aggression, special ability (W1; W6 step 1). => Each role spec
starts from a "why does it exist" line.
F4 - Roster-role matrix is the gap tool. Standard role set (Grunt/Squad/Leader/Tank/Swarm/Sniper,
W2; matrix role x speed/HP/range/DPS, W7); readability contract = mid-range silhouette +
state/intent telegraphs (W2, W7).
F5 - Simple, distinct, combined. Per-enemy behavior stays simple and clearly distinct; the
challenge comes from COMBINATIONS in waves (W3); randomness reads as enemy mood (W4). => New
roles keep ONE verb each; mix matrix, not mix scripts.
F6 - Shmup unit axes. Speed, HP, size, movement geometry are the four craft axes; "popcorn"
one-shot kills buy action feel; size spectrum: big = high HP/slow, small = low HP/fast (W9).
F7 - Telegraph = multi-sensory, charge-up pattern. Pre-attack delay tells the question, not the
answer (W10; W5). => E63 telegraphs combine pose + glow + (where meaningful) SFX, reusing the
existing threat-red (0xff4a2a imminent) / ember (0xff9a3d payload) semantics (E57 rule 4).
F8 - Waves are legible as role compositions. A wave of 10 identical enemies is less interesting
than a wave of 3 roles (W8); roles as data; wave = puzzle (Y1 6:34; Y3 26:16). => wave-gate
"teach rhythm" + mix matrix in the design doc.
F9 - Dive telegraphs are the classic swarm read. Galaga dive/fake-dive (Y6) and formation entry
(Y5) communicate intent geometrically. => WASP corkscrew-then-dash.
F10 - Silhouette before color. Outline readable at small render size; second shade, then
color/detail (Y4 22:35-29:22). => 96-px silhouette check + back-view check (E57 rule 2) for every
new GLB.

## 3. Roster gap analysis (evidence)

Current fleet (tree-verified: src/core/config.js + design/enemy-visual-language.md E57):

| Role | First wave | Function | Coverage axis |
|------|-----------|----------|---------------|
| Mine | 5 | slow homing mine, fires inside 7.0 u | homing-seek |
| Hunter | 6 | rear-approach dash stalker | dash-ram |
| Stinger | 7 | LOS dash rammer | dash-ram |
| Drone | 8 | fast homing seeker, decays at 30 s | homing-seek |
| Vortex | 8 | pulsing gravity pull field | area-control |
| Gunship | 8 | slow heavy bomber, lobbed shots | bomber |
| Flyer | 9 | sine-weave crosser, never attacks | evasive |
| Warden | 5th waves | armored mini-boss | tank (mini-boss) |
| Monolith / Splicer | 5/10/15... | boss ring-burst / spiral | boss |

Gaps vs the F4 matrix (W2/W7):
(a) SQUAD - a mid-range shooter that HOLDS range and fires aimed shots: nobody in the fleet holds
    position and shoots (gunship LOBS; mines only fire inside 7.0 u) - the biggest gap (W8:
    "a shooter controls sightlines").
(b) SWARM - small fast low-HP pack unit (the "popcorn" layer, F6): absent.
(c) STATE-CHANGE - a unit whose state change creates a new threat (Defender lander pattern, W1):
    only the Monolith splits, and that is boss-only.
E63 adds exactly these three roles: SENTRY (Squad), WASP (Swarm), POD (splitter). Nothing else
is added in E63 (sniper/leader/tank remain covered by gunship/warden/bosses; a true sniper is
deferred to E64's stage design).

## 4. Role proposals (high level; ST-447 finalizes numbers)

### 4.1 SENTRY - mid-range shooter (SQUAD)
- Why it exists: the fleet has no one who controls RANGE with aimed fire (F4/W8); forces the
  player to manage closing distance instead of orbiting.
- Behavior (sketch): spawns at the rim, strafes to a preferred range 9-13 u from the ship,
  aims, fires a 3-burst aimed spread on a 3.5-4.5 s cadence; 0.8 s charge-up telegraph (F2).
- Class: radius 1.1 (between hunter 0.8 and gunship 1.6); HP 3; score 350 (hunter 300 < sentry
  350 < flyer 400).
- Telegraph: hazardEmber 0xff9a3d barrel charge while armed (payload semantics, rule 4, gunship
  precedent); bolts use the existing threat-red enemy-bullet family.
- Silhouette: angular floating platform, cruciform base, one rotating barrel - a "watchtower"
  read (F10); back view = platform + exhaust stubs.
- Palette (proposed): body 0x8a8f7a sage-ash (hue ~135 deg, sRGB luma ~130) - clearance in 4.4.

### 4.2 WASP - swarm dive-bomber (SWARM)
- Why it exists: the "popcorn" layer (F6) + the only pack unit; adds crowd pressure and a
  fast-kill reward (one-shot kills, 3 per pack).
- Behavior (sketch): 3 per pack spawn at the rim in a tight V; corkscrew toward the ship for
  ~1.2 s (telegraph, F9), then dash ~0.5 s; HP 1; radius 0.45; score 100.
- Dodgeability (F2 floor): dash speed <= 1.15 x ship.maxSpeed (14 u/s) = 16 u/s; anticipation
  >= 1.0 s (stinger precedent).
- Silhouette: small arrow/dart with swept wings - must read at small rendered size (F10).
- Palette (proposed): 0xb9c34d acid chartreuse (hue ~64 deg, luma ~170) - TOP of the luma ladder:
  small + bright = fast read.

### 4.3 POD - drifting splitter (state change)
- Why it exists: the "shoot it or wait" tradeoff (W1 lander: a weak enemy that becomes critical
  on state change); the fleet's only non-boss state change.
- Behavior (sketch): drifts slowly toward the player (2.2 u/s); HP 4; radius 1.2; on death
  spawns 2 WASPs (immediate corkscrew) + POD score 300 (500 total if allowed to split); no new
  projectile family (children reuse WASP behavior + bolts).
- Telegraph: seam glow (hazardEmber) when split-primed - a frozen frame says "this splits"
  (E57 rule 7, reduced-motion safe: pose/shape change, not blink-only).
- Silhouette: organic capsule, two hemispheres with a visible seam + pulsing core (F3: the shape
  shows the function).
- PROCEDURAL-ONLY (no GLB): capsule + seam + core is trivial primitive composition (Vortex
  FX-only precedent); keeps the new-GLB count at 2 and the dist budget honest.

### 4.4 Palette clearance table (rule 1: collision only if dluma <= 10 AND dhue <= 40 deg)

Fleet body hues (E57 audit): stinger 258.6 / drone 203.1 / flyer 314.3 / hunter 14.0 / gunship
214.3. Lumas: stinger 135 / drone 131 / flyer ~110 / hunter ~102 / gunship ~65.

| New role | Color | Hue | Luma | Closest fleet body | Verdict |
|----------|-------|-----|------|--------------------|---------|
| SENTRY | 0x8a8f7a | ~135 | ~130 | drone (203.1, 131) | CLEAR: dhue ~68 deg (luma within 10 but hue clears) |
| WASP | 0xb9c34d | ~64 | ~170 | hunter (14.0, 102) | CLEAR: dhue ~50 deg; golden rock 0xffe070 (48 deg, ~228) dhue ~16 < 40 BUT dluma ~58 > 10 -> clear by the AND rule (documented approved near-band pair, hunter/flyer precedent) |
| POD | 0x5f8f86 | ~161 | ~122 | drone (203.1, 131) | CLEAR (tight: dhue ~42 deg) - re-audit with the I381/I383 rendered-luma method at ST-447 BEFORE any Blender work; Splicer teal 0x2dd4bf is a boss EMISSIVE RIM, not a fleet body (rule 1 scope = fleet bodies, documented) |

Luma ladder after E63 (top to bottom): WASP ~170 > SENTRY ~130 (stinger 135 / drone 131 band) >
POD ~122 (organic mid) > flyer ~110 > hunter ~102 > gunship ~65.

## 5. Wave gates + teach rhythm

New roles debut at the endless tail / campaign stage 3 (W11-15), ONE per wave, NEVER on boss
waves (5/10/15):
- W11 SENTRY, W12 WASP (pack 3), W13 POD.
Rationale (F8): one role per wave = a dedicated teach moment; boss waves keep their moment;
campaign stages 1-2 (W1-10) stay untouched (E64 owns linear levels).
Pinned-run impact: causal473 ends W2 / 36.15 s; playframe B ends ~52 s (approx W2-3) -> the W11+
gates cannot fire inside any pinned run -> causal + playframe pre-registered EXACT, no re-pins
(ST-448 verifies).

## 6. Art direction implications + deferrals

- Luma ladder extended (4.4); silhouette + back-view check on both new GLBs (F10, E57 rule 2).
- Faction cohesion: all 3 roles keep the fleet material budget (<= 3 materials, VR_ naming,
  COLOR_0 NEUTRAL bake - E57 rule 8 GLB contract).
- DEFERRED (documented, not silently dropped):
  - Enemy outline/rim pass (E59 finding: "enemy meshes have NO rim/outline pass today") - cost =
    2x enemy draw calls + frozen-FX-identity risk; revisit in E65 (WebGPU territory).
  - POD GLB (procedural now; promote later if headroom allows).
  - Boss-variant art for the E64 end-of-level boss (that is E64).
- E64 boundary: E63 = endless-arena enemy expansion only; the user's "linear game ... clearing
  levels ... boss at the end" request is explicitly E64 (step by step).

## 7. Budget + re-pin expectations (planning model; measured at ST-449)

Evidence model: hunter 2,256 t -> 144,460 B (64.0 B/t); gunship 2,268 t -> 171,736 B (75.7 B/t).
- SENTRY target <= 1,600 t (cap 1,800) -> ~102-137 KB
- WASP target <= 1,000 t (cap 1,200) -> ~64-91 KB
- GLB pair: median ~182 KB (range 166-228 KB)
- dist code delta (3 core + 3 mesh modules, config, i18n x3, main wiring, minified): ~25-35 KB
- Expected dist: ~3,100,000-3,155,000 B of the 3,250,000 ceiling -> headroom ~95,000-150,000 B
  vs the 102,400 B close floor (E61 rule) -> cut ladder C1/C2 pre-registered (scope-check E63
  section 6) + last-resort renegotiation branch (ST-407 precedent).
- Re-pins (each lands WITH its measurement at ST-449): BUDGETS += sentry 1,800 / wasp 1,200;
  assetPerf totalFilesKB 1,240 HOLDS if measured <= 1,240 (expect ~1,233) else -> 1,440;
  totalGeoKB 1,120 -> 1,280 (expect measured ~1,185); totalTris 36,000 HOLDS if SENTRY <= 1,600
  AND WASP <= 1,000 (expect 33,050 + 2,600 = 35,650) else -> 39,000. MAX_FILE_BYTES 393,216
  UNCHANGED (largest new file ~137 KB).