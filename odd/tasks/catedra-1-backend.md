# Cátedra I Backend: ~70% Reference Implementation

## Objective
Implement roughly 70% of the Cátedra I requirements as a working guide for students. The remaining ~30% is left as clearly marked, guided TODOs (`TODO(student)` comments, 501 stubs, `test.todo` entries and a README checklist).

## Constraints
- Stay on branch `feat/clase-23-09/new-workflow`; no push, no PR.
- Layers: route -> controller -> service -> model. Reuse the CRUD factory. Tests use `node:test`.
- Code/comments/tests in English; README in Spanish.
- Local SQLite files are disposable: new columns need a fresh `DATABASE_NAME` or deleting `src/database/rock.sqlite` (no auto-migration; documented).
- Conventional commits, no AI attribution.

## Resolved workflow
- TDD: enabled (session config). Runner: `npm test` (`node --test test/*.test.js`).
- Route: delegated direct, single writer (this fork). Engram mirror: skipped, Engram tools are not available to this worker.
- ~400 line heuristic is advisory only.

## Tasks
- [ ] C1 Roles, admin seed, guards, locked-down registration, `/me` profile (auth/roles)
- [ ] C2 Catalog: hardness challenge, rock filters + validation, unique types/categories, 409 delete guard, rocks-by-type/category
- [ ] C3 Guest sessions, recognition (mock model), 10-per-session limit, collection, 3 automatic achievements
- [ ] C4 Student TODO stubs (501), pending tests, `.env.example`, README student guide

## Student TODO (not implemented on purpose)
progress/stats, admin statistics, feedback, guest -> account migration, admin user management, admin views of any user's collection/achievements, locked/unlocked achievement listing.

## Verification evidence
(filled per task)
