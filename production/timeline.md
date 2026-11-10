# Timeline - Void Runner

- 2026-11-09  Stage: concept -> pre-production. Brainstorm + systems map + GDD done.
- 2026-11-09  Epics E1-E6, stories ST-001..ST-050, sprint plan written.
- 2026-11-09  Sprint 1 starts (iteration log: production/iterations.md).
- 2026-11-13  M1 (E1-E6, I01-I48) closed: slice gate PASS (I45), final regression (I46), docs (I47),
                milestone review + retrospective (I48), release checklist SHIP (I49, dist 22.9MB -> 1.4MB).
- 2026-11-13  Sprint 1 closes at I50 (v0.2.0). E7 (ST-051..100) begins I51.
- 2026-11-10  (I186 consolidation, recorded late) E7 (ST-051..100) closed at I100: final gate closed, 100 iterations complete (production/iterations.md I99-I100).
- 2026-11-10  (I186 consolidation, recorded late) Blender asset arc I101-I106: art bible (design/art-bible.md) + asset spec (design/asset-spec.md) + five first-party GLBs (ship, asteroid L/M/S, boss) exported via Blender, GLTFLoader integration with procedural fallback, browser verification + asset audit; AGENTS.md assets/ convention.
- 2026-11-10  (I186 consolidation, recorded late) E8 (ST-107..206) opened at I107: six arcs - E8A planning (I107-110), E8B core gameplay (I111-132, docs I132), E8C content variety (I133-150, docs I150), E8D UI/UX (I151-168, docs I168), E8E audio + feel (I169-186, docs I186), E8F robustness + QA (I187-206, docs I200).
- 2026-11-10  E8E closed at I186: G8.4 gate PASS (I182), 581/581 tests, E8E deep perf profile (I184) + 600 s memory soak (I185) clean. Next: E8F - context-loss hardening (ST-187, I187).

- 2026-11-11  E9 asset phase (ST-207..216, I207..I216) gate G9.0 PASS at I216: 15 Blender GLBs + equirect skybox (111.3 KB / 1021 tris, budgets met, fallback proven), IBL + engine trail (I213), asset perf no bottleneck (I214), tests 630->670, dist 1939.2/501.3 KB. Next: I217 ST-217 (post-processing polish).

- 2026-11-11  E9 CLOSED at I218 (G9.1 closeout gate PASS): 11/11 stories ST-207..217 (I207..I217) + closeout. 15 Blender GLBs + skybox (111.3 KB / 1021 tris, budgets pinned, fallback proven), IBL + emissive engine trail (I213), asset perf no bottleneck (I214), post-processing polish (half-res bloom internal 1/4 frame, 40 ms phase-2 hit-stop; I217), tests 630->676, dist 1940.6/501.9 KB (<=2048/<=550). Carried: 8 HUMAN-PENDING perception items + low-end device validation. Next: E10 (post-E9 polish; first lever = camera/feel per art research lever 6).