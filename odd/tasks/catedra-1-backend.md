# Cátedra I Backend: ~70% Reference Implementation

## Objective
Implement roughly 70% of the Cátedra I requirements as a working guide for students. The remaining ~30% is left as clearly marked, guided TODOs (`TODO(student)` comments, 501 stubs, `test.todo` entries and a README checklist).

## Constraints
- Stay on branch `feat/clase-23-09/new-workflow`; no push, no PR.
- Layers: route -> controller -> service -> model. Reuse the CRUD factory. Tests use `node:test`.
- Code/comments/tests in English; README in Spanish.
- Local SQLite files are disposable: new columns need a fresh `DATABASE_NAME` or deleting `src/database/rock.sqlite` (no auto-migration; documented in README).
- Conventional commits, no AI attribution.

## Resolved workflow
- TDD: enabled (session config). Runner: `npm test` (`node --test test/*.test.js`).
- Route: delegated direct, single writer (this fork). Engram mirror: skipped, Engram tools are not available to this worker.
- ~400 line heuristic is advisory only.

## Tasks
- [x] C1 Roles, admin seed, guards, locked-down registration, `/me` profile — commit `f72e91e`
- [x] C2 Catalog: hardness challenge, rock filters + validation, unique types/categories, 409 delete guard, rocks-by-type/category — commit `e2d5e62`
- [x] C3 Guest sessions, recognition (mock model), 10-per-session limit, collection, 3 automatic achievements — commit `dd55394`
- [x] C4 Student TODO stubs (501), pending tests, README student guide — see final commit

## Student TODO (not implemented on purpose)
progress/stats, admin statistics, feedback, guest -> account migration, admin user management, admin views of any user's collection/achievements, locked/unlocked achievement listing, `.env.example` file.

## Verification evidence
- C1 RED: `node --test test/auth.test.js test/seedAdmin.test.js` -> 9 fail (missing `seedAdmin` module). GREEN: `npm test` 21 pass / 0 fail.
- C2 RED: `node --test test/rockHardness.test.js test/catalog.test.js` -> 6 fail (missing `rockService`). GREEN: `npm test` 29 pass / 0 fail.
- C3 RED: `node --test test/recognition.test.js` -> 6 fail. GREEN: `npm test` 35 pass / 0 fail.
- C4: `npm test` -> 55 tests, 36 pass, 0 fail, 19 todo.
- Tests run against throwaway `test_*.sqlite` files that are deleted on teardown; `src/database/rock.sqlite` untouched.

## Known limitations / failed or skipped checks
- `.env.example` could not be created (write to `.env*` files denied by permission settings); the example is documented in the README and left as a student TODO.
- `npm start` was not run against the persistent DB.
- Concurrent recognitions on one guest session were not load-tested (SQLite file DB serializes writes).
