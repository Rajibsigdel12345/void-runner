# Sprint 1 - Void Runner (cgs-sprint-plan)

Window: single agent (Codex) continuous loop. Cadence: 1 story == 1 iteration
(numbered I01..I50+), each iteration = implement -> test -> verify -> commit -> log.

## Goals
1. Green test suite + green build at EVERY iteration.
2. Vertical slice gate PASS by iteration 45.
3. 50+ logged iterations with verification evidence by iteration 50.

## Task board (iteration ranges)
- I01-I04  E1 Foundations      (ST-001..004)
- I05-I18  E2 Core Loop         (ST-005..018)
- I19-I23  E3 Power-ups         (ST-019..023)
- I24-I30  E4 Presentation      (ST-024..030)
- I31-I33  E5 Player systems    (ST-031..033)
- I34-I50  E6 Polish/QA/Gates   (ST-034..050)

## Acceptance (sprint level)
- npm test green; npm run build green; browser regression clean.
- production/iterations.md has >= 50 entries.
- Gate: vertical slice PASS documented.

## Risks & mitigations
- Big iterations -> split at implementation time; each commit is independently green.
- Browser smoke flaky -> smoke script checks console + a screenshot-free DOM assertion.
