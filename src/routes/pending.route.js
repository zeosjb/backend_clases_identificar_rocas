const { Router } = require('express')
const validateToken = require('../middlewares/validateToken')
const { createResolveActor } = require('../middlewares/resolveActor')
const { adminOnly, authenticated } = require('../middlewares/guards')
const { guestSessions } = require('./recognition.route')
const { notImplemented } = require('../controllers/pending.controller')

// Routes students must implement. Access rules are already in place; only the handlers are missing (501).
// Mounted at `/api` BEFORE the generic CRUD routers so paths like `/achievement/me` are not captured by `/:id`.
const router = Router()
const userOrGuest = [validateToken.optional, createResolveActor(guestSessions)]

// --- Progress and statistics -------------------------------------------------------------------------------
// TODO(student): return { totalRecognitions, distinctRocks, unlockedAchievements, discoveryPercentage } for the caller.
//   discoveryPercentage = distinctRocks / total rocks in the catalog * 100 (round to 1 decimal, 0 if the catalog is empty).
//   Works for users (persistent) and guests (current session only). Reuse Analysis, Collection and the unlock tables.
router.get('/progress/me', ...userOrGuest, notImplemented('progress-stats'))
// TODO(student): paginated activity history (newest first) built from the caller's Analysis rows; reuse buildListOptions.
router.get('/progress/me/history', ...userOrGuest, notImplemented('progress-history'))

// TODO(student): list every active achievement with `unlocked: boolean` and `unlockedAt` for the authenticated user.
router.get('/achievement/me', ...authenticated, notImplemented('achievement-locked-unlocked'))

// --- Recognition feedback ----------------------------------------------------------------------------------
// TODO(student): create a Feedback model (analysisId UNIQUE, userId, isCorrect, comment) and register it in models/index.js.
//   Rules: one feedback per recognition, only the owner of the Analysis can create/read/update it (403/404 otherwise).
router.post('/recognition/:id/feedback', ...authenticated, notImplemented('feedback-create'))
router.get('/recognition/:id/feedback', ...authenticated, notImplemented('feedback-read'))
router.patch('/recognition/:id/feedback', ...authenticated, notImplemented('feedback-update'))

// --- Guest migration ---------------------------------------------------------------------------------------
// TODO(student): POST with Bearer token + X-Guest-Token. In ONE transaction move the guest's Collection rows (merge with
//   the user's existing rows: add counters, keep the earliest firstDiscoveredAt) and GuestAchievement rows (skip ones the
//   user already has), then set the session status to 'transferred' and transferredToUserId. Reject a session that is
//   already transferred (409) so it cannot be moved to several accounts.
router.post('/guest/migrate', ...authenticated, notImplemented('guest-migration'))

// --- Administration ----------------------------------------------------------------------------------------
// TODO(student): { registeredUsers, totalRecognitions, mostRecognizedRocks: [{ rockId, name, count }] } (top 5 by Analysis count).
router.get('/admin/stats', ...adminOnly, notImplemented('admin-stats'))
// TODO(student): paginated recognition history for the whole platform, optional filters userId / rockId.
router.get('/admin/recognitions', ...adminOnly, notImplemented('admin-recognitions'))
// TODO(student): all feedback sent by users (needs the Feedback model above).
router.get('/admin/feedback', ...adminOnly, notImplemented('admin-feedback'))
// TODO(student): change a user's `roleId` and/or `status` ('active' | 'blocked'). Validate both; an admin must not be able to
//   block or demote themselves. Registration and PATCH /api/user/me must keep ignoring these fields.
router.patch('/admin/users/:id', ...adminOnly, notImplemented('admin-user-management'))
// TODO(student): collection and unlocked achievements of any user (404 if the user does not exist).
router.get('/admin/users/:id/collection', ...adminOnly, notImplemented('admin-user-collection'))
router.get('/admin/users/:id/achievements', ...adminOnly, notImplemented('admin-user-achievements'))

module.exports = router
