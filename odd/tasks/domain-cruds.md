# Domain CRUD API

## Objective
Refactor the rock-recognition API into clear layers, add useful CRUD/demo functionality for the existing domain models, and turn the README into an instructor-style explanation of the API.

## Problem and rationale
The app previously put validation and persistence inside controllers, did not await database readiness before listening, and documented no useful routes. It now demonstrates a layered Express/Sequelize API while making no machine-learning recognition claims.

## Scope and constraints
- Keep Express, Sequelize, SQLite, existing model schema/relationships.
- Preserve auth/password secrecy; no unauthenticated password CRUD.
- Controllers translate HTTP, shared CRUD service owns persistence, utility validates paging/search, app owns the error middleware.
- Provide CRUDs for Rock, Category, Type, Role, Achievement, Analysis, Collection and UserAchievement; User remains register/login only.
- Rock identification is an explainable text-match demo across catalog fields, not image/ML recognition.
- README is Spanish instructor-style; documents architecture, endpoints, functions/models, setup, examples and tests.
- Preserve existing untracked `.atl/`.
- Route: delegated direct implementation. Strict TDD: node --test`; RED observed for missing query utility, then GREEN; the final suite has 7 tests.
- Delivery strategy ask-on-risk; no push/PR. Commit/review decision remains parent-coordinated.

## Acceptance criteria
- [x] Logic is separated across HTTP controller, service and utility layers; app centralizes middleware/errors.
- [x] Rock API includes CRUD, pagination/search and clearly scoped text-match demo.
- [x] Existing domain entities have CRUD except User, which intentionally retains auth-safe register/login only.
- [x] Password hashing and JSON secrecy retained; token middleware Bearer parsing corrected.
- [x] Tests cover pagination, field whitelist, immutable CRUD data, missing records and password secrecy.
- [x] Spanish README explains setup, API, layer responsibilities, functions/classes/models, data flow and tests.
- [ ] Commit/review evidence: pending parent coordination.

## Tasks
- [x] API-1 Establish the shared CRUD/test foundation and association initialization (confirmed as part of current implementation).
- [x] API-2 Refactor startup, auth, validation, and API logic into layers; implement/test rock and supporting CRUD/demo endpoints.
- [x] API-3 Write instructor-style README for implemented behavior.

## Progress
- Uses explicit model imports and invokes model associations rather than a Sequelize CLI factory loader (the model files export initialized classes).
- Startup is now async and refuses to listen until DB authentication/sync succeeds.
- Existing legacy user endpoints remain; standard CRUD paths added for other non-User entities.
- npm CLI is broken on this machine (npm exec` / npm test` cannot load npm-cli.js), although direct node --test` works.

## Verification evidence
- node --test test/*.test.js`: 7 passed, 0 failed.
- node -c` on app, server, model index, rock route and CRUD controller: passed.
- Import smoke: all nine models load, Rock.category and User.role associations exist, `createApp()` succeeds.
- `git diff --check`: no whitespace errors after trimming EOFs; only Git line-ending warnings observed.
- npm test`: blocked by host npm installation (`Cannot find module ... npm-cli.js`), not project tests.

## Next step
Parent to inspect integration/diff, decide commit and native review according to repo workflow. Avoid writing to or cleaning `.atl/`.

## Corrección de clave compuesta

- [x] `UserAchievement` get/update/delete usan ambos campos de clave primaria por rutas `/api/user-achievement/:userId/:achievementId`.
- [x] Se evita que PATCH altere `userId` o `achievementId`; solo `rockId` puede cambiar.
- [x] Regresión cubre lookup en ambos parámetros, update y delete, además de las rutas registradas.
- No se modificaron reglas de autorización de Analysis/Collection.

## Verificación de corrección
- node --test test/compositeCrud.test.js`: 2 passed; covers both key fields for get/update/delete, immutable-key sanitization and registered paths.
- node --test test/*.test.js`: 7 passed, 0 failed.
- node -c` on changed service/controller/router/app: passed.
- `git diff --check`: passed after EOF cleanup; only line-ending warnings.
