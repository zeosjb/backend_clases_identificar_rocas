# SQLite Startup and Demo Data

## Objective
Ensure the documented startup path reaches the database-aware server and an empty database receives safe, repeatable sample records for classroom demonstrations.

## Problem and rationale
The previous `npm start` target was `src/app.js`, which only exports the Express app factory and bypasses `src/server.js`. The server authenticated and synced tables but inserted no records, so a fresh SQLite database remained empty.

## Scope and constraints
- Keep Express, Sequelize, SQLite, existing model schema and user data.
- Restore `src/server.js` as the package start entry; it imports `createApp` and listens only after DB setup.
- Add an idempotent demo-data seeder invoked after schema sync, with reference rows and rock examples.
- Never delete, truncate, force-sync, or overwrite existing user/catalog rows; use stable natural keys and create only missing seed records.
- Keep DB path deterministic from module location rather than process current working directory, and ensure seeder uses the same Sequelize model singleton.
- Tests use fakes or isolated subprocess path checks, never the user's database.
- Document seed data and location.
- Preserve unrelated package.json content; only corrected `main` and `start` entry.
- Route: delegated direct; strict TDD enabled. No push or PR; parent coordinates the local work-unit commit.

## Acceptance criteria
- [x] `npm start` starts `src/server.js`; server factory uses `createApp` and DB startup completes before HTTP listen.
- [x] A fresh DB gets demo reference data and rock examples visible through API models.
- [x] Repeated starts do not duplicate or alter existing records.
- [x] Existing records are preserved; startup never uses destructive sync.
- [x] Tests prove seed idempotency and startup ordering without mutating actual SQLite.
- [x] README explains database behavior.
- [x] Verification evidence is recorded.
- [x] Work-unit commit: `2885090` (`fix(db): seed empty SQLite database safely`).

## Tasks
- [x] DB-1 Fix package/server startup integration and deterministic DB path.
- [x] DB-2 Add and test safe idempotent seed data for empty databases.
- [x] DB-3 Document behavior and record verification.

## Progress
- Restored `main` and `start` to the server entry, which authenticates, syncs, seeds, and only then listens via `createApp`.
- Database storage now resolves under `src/database` relative to the module and rejects unsafe `DATABASE_NAME` values; fallback is `rock`.
- Added only-missing rows for rock types, categories, roles, achievements, and four sample rocks. Existing values are never updated.
- User database contents and `.env` values were not inspected or printed. The startup-test process loads `.env` indirectly via dotenv (it reported four injected values); the isolated DB smoke bypassed dotenv and did not use user credentials. The persistent user database was not started or touched.

## Verification evidence
- RED observed before source changes: `node --test test/demoSeeder.test.js test/databasePath.test.js` failed because the seeder module was missing and the storage path was cwd-relative.
- GREEN before collision regression: `node --test test/*.test.js` — 11 passed, 0 failed.
- Syntax: `node --check src/server.js`, `node --check src/database/seedDemoData.js`, `node --check src/config/database.js`, `node --check test/serverStartup.test.js` — all passed.
- Package entry check: `node -e "const p=require('./package.json'); if(p.scripts.start !== 'node src/server.js') process.exit(1); console.log(p.scripts.start)"` — passed (`node src/server.js`).
- `git diff --check` — passed.
- `npm start` intentionally not run to avoid creating/modifying the user's persistent SQLite database.
- Final GREEN after index-collision regression: `node --test test/*.test.js` — 12 passed, 0 failed.
- Isolated real SQLite smoke (unique generated `DATABASE_NAME`): authenticate/sync/seed yielded Type=3, Category=4, Role=2, Achievement=2, Rock=4; second seed kept all counts unchanged. Closed the connection and removed only the exact generated file after validating its path; confirmed absent afterward.

## Next step
- Completed as `2885090`; no push or PR.

## Relevant files
- `package.json` — server as package entry and start target.
- `src/server.js` — authenticate/sync/seed/listen startup sequence.
- `src/config/database.js` — safe absolute SQLite storage path.
- `src/database/seedDemoData.js` — idempotent classroom data seeder.
- `test/demoSeeder.test.js`, `test/databasePath.test.js`, `test/serverStartup.test.js` — isolated verification.
- `README.md` — storage and seed behavior documentation.

## Follow-up correction: unique rock index collision
- Addressed the verifier finding that a user's existing rock could own a demo rock's preferred unique `index`.
- Before creating each missing seeded rock, the seeder now checks occupancy including soft-deleted rows and picks the first free index at or above the deterministic preferred value. A matching seeded `scientificName` remains untouched; existing rock indices are never modified.
- Regression RED: `node --test test/demoSeeder.test.js` failed because the seeded Basalt reused index `1` already owned by a user rock.
- Regression GREEN/full suite: `node --test test/*.test.js` — 12 passed, 0 failed.
- Syntax: `node --check src/database/seedDemoData.js`, `node --check test/demoSeeder.test.js` — passed.
- `git diff --check` — passed.
