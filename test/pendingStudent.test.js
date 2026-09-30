const test = require('node:test')
const assert = require('node:assert/strict')
const { bootTestApp } = require('./helpers/testApp')

// SCAFFOLDING TEST: proves the pending routes exist and enforce access rules while answering 501.
// When you implement a route, delete its line here and add real tests (see the test.todo list below).
test('pending routes are wired with the right access rules and answer 501', async t => {
  const app = await bootTestApp('pending')
  t.after(() => app.close())
  const adminToken = await app.adminToken()
  const { token } = await app.registerAndLogin('student')
  const guest = (await app.request('POST', '/api/guest/session')).body.token

  const adminRoutes = [['GET', '/api/admin/stats'], ['GET', '/api/admin/recognitions'], ['GET', '/api/admin/feedback'], ['PATCH', '/api/admin/users/1'], ['GET', '/api/admin/users/1/collection'], ['GET', '/api/admin/users/1/achievements']]
  for (const [method, url] of adminRoutes) {
    assert.equal((await app.request(method, url)).status, 401, `${method} ${url} anonymous`)
    assert.equal((await app.request(method, url, { token })).status, 403, `${method} ${url} user`)
    assert.equal((await app.request(method, url, { token: adminToken })).status, 501, `${method} ${url} admin`)
  }

  const userRoutes = [['GET', '/api/achievement/me'], ['POST', '/api/recognition/1/feedback'], ['GET', '/api/recognition/1/feedback'], ['PATCH', '/api/recognition/1/feedback'], ['POST', '/api/guest/migrate']]
  for (const [method, url] of userRoutes) {
    assert.equal((await app.request(method, url)).status, 401, `${method} ${url} anonymous`)
    assert.equal((await app.request(method, url, { token })).status, 501, `${method} ${url} user`)
  }

  for (const url of ['/api/progress/me', '/api/progress/me/history']) {
    assert.equal((await app.request('GET', url)).status, 401, `${url} anonymous`)
    assert.equal((await app.request('GET', url, { guestToken: guest })).status, 501, `${url} guest`)
    assert.equal((await app.request('GET', url, { token })).status, 501, `${url} user`)
  }
})

// Expected behavior to implement (turn each into a real test first, then make it pass).
test.todo('progress: returns total recognitions, distinct rocks, unlocked achievements and discovery percentage for a user')
test.todo('progress: a guest sees only the progress of the current session')
test.todo('progress: discovery percentage is 0 when the catalog is empty and never exceeds 100')
test.todo('progress: history lists the caller recognitions newest first with pagination')
test.todo('achievements: /api/achievement/me lists locked and unlocked achievements with unlockedAt')
test.todo('feedback: an owner can create one feedback (correct/incorrect + comment) per recognition')
test.todo('feedback: a second feedback for the same recognition is rejected')
test.todo('feedback: a user cannot read, create or update feedback of another user recognition')
test.todo('feedback: the owner can read and update their own feedback')
test.todo('feedback: admin can list all feedback')
test.todo('migration: registering/migrating moves guest collection and achievements to the account')
test.todo('migration: duplicated rocks are merged (counters added, earliest first discovery kept)')
test.todo('migration: the guest session becomes transferred and is rejected afterwards')
test.todo('migration: a transferred session cannot be moved to a second account (409)')
test.todo('admin stats: registered users, total recognitions and most recognized rocks')
test.todo('admin: can change a user role and status; blocked users cannot log in')
test.todo('admin: cannot block or demote themselves')
test.todo('admin: can read the collection and achievements of any user, 404 for unknown users')
test.todo('admin: recognition history is restricted to admins and supports filters')
