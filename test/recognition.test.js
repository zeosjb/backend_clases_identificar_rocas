const test = require('node:test')
const assert = require('node:assert/strict')
const { bootTestApp } = require('./helpers/testApp')

let app
let rocks
test.before(async () => {
  app = await bootTestApp('recognition')
  rocks = await app.models.Rock.findAll({ order: [['id', 'ASC']] })
})
test.after(async () => { await app.close() })

const recognize = (rock, credentials, overrides = {}) =>
  app.request('POST', '/api/recognition', { ...credentials, body: { rockId: rock.id, confidence: 91, imageUrl: 'https://example.org/photo.jpg', ...overrides } })

test('guest sessions get an unguessable token that is stored only as a hash', async () => {
  const response = await app.request('POST', '/api/guest/session')
  assert.equal(response.status, 201)
  assert.match(response.body.token, /^[0-9a-f]{64}$/)
  assert.equal(response.body.limit, 10)
  assert.equal(response.body.remaining, 10)
  const stored = await app.models.GuestSession.findAll()
  assert.ok(stored.every(session => session.tokenHash !== response.body.token))
  const status = await app.request('GET', '/api/guest/session', { guestToken: response.body.token })
  assert.equal(status.status, 200)
  assert.equal(status.body.recognitionCount, 0)
})

test('recognition requires a Bearer token or a valid guest token', async () => {
  assert.equal((await recognize(rocks[0], {})).status, 401)
  assert.equal((await recognize(rocks[0], { guestToken: 'not-a-real-token' })).status, 401)
  assert.equal((await app.request('GET', '/api/guest/session', { guestToken: 'nope' })).status, 401)
})

test('recognition validates the mocked model result', async () => {
  const { body: { token } } = await app.request('POST', '/api/guest/session')
  const credentials = { guestToken: token }
  assert.equal((await app.request('POST', '/api/recognition', { ...credentials, body: { confidence: 90 } })).status, 400)
  assert.equal((await app.request('POST', '/api/recognition', { ...credentials, body: { rockId: rocks[0].id } })).status, 400)
  assert.equal((await recognize(rocks[0], credentials, { confidence: 150 })).status, 400)
  assert.equal((await recognize(rocks[0], credentials, { rockId: 99999 })).status, 404)
  const status = await app.request('GET', '/api/guest/session', credentials)
  assert.equal(status.body.recognitionCount, 0, 'failed requests must not consume the limit')
})

test('a guest session is limited to 10 recognitions, deduplicates the collection and unlocks each achievement once', async () => {
  const { body: { token } } = await app.request('POST', '/api/guest/session')
  const credentials = { guestToken: token }

  const first = await recognize(rocks[0], credentials)
  assert.equal(first.status, 201)
  assert.equal(first.body.newDiscovery, true)
  assert.deepEqual(first.body.unlockedAchievements.map(item => item.slug), ['first-discovery'])
  assert.equal(first.body.guest.remaining, 9)

  const repeat = await recognize(rocks[0], credentials)
  assert.equal(repeat.body.newDiscovery, false)
  assert.equal(repeat.body.collection.recognitionCount, 2)
  assert.deepEqual(repeat.body.unlockedAchievements, [])

  await recognize(rocks[1], credentials)
  const third = await recognize(rocks[2], credentials)
  assert.deepEqual(third.body.unlockedAchievements.map(item => item.slug), ['rock-explorer'])
  for (let i = 0; i < 5; i += 1) assert.equal((await recognize(rocks[i % 3], credentials)).status, 201)
  const tenth = await recognize(rocks[0], credentials)
  assert.equal(tenth.status, 201)
  assert.deepEqual(tenth.body.unlockedAchievements.map(item => item.slug), ['dedicated-identifier'])
  assert.equal(tenth.body.guest.remaining, 0)

  const blocked = await recognize(rocks[0], credentials)
  assert.equal(blocked.status, 403)
  assert.equal(blocked.body.code, 'GUEST_LIMIT_REACHED')
  assert.match(blocked.body.message, /cuenta/)

  const session = (await app.models.GuestSession.findAll()).find(item => item.recognitionCount === 10)
  assert.ok(session)
  assert.equal(await app.models.Collection.count({ where: { guestSessionId: session.id } }), 3)
  assert.equal(await app.models.Analysis.count({ where: { guestSessionId: session.id } }), 10)
  const unlocked = await app.models.GuestAchievement.findAll({ where: { guestSessionId: session.id } })
  assert.equal(unlocked.length, 3)
  assert.ok(unlocked.every(item => item.unlockedAt instanceof Date))
})

test('authenticated users are not limited, keep the first discovery date and only see their own collection', async () => {
  const { token } = await app.registerAndLogin('collector')
  const other = await app.registerAndLogin('bystander')

  const first = await recognize(rocks[0], { token })
  assert.equal(first.status, 201)
  const firstDate = first.body.collection.firstDiscoveredAt
  for (let i = 0; i < 12; i += 1) assert.equal((await recognize(rocks[0], { token })).status, 201)
  assert.equal(first.body.guest, undefined)

  const collection = await app.request('GET', '/api/collection/me', { token })
  assert.equal(collection.status, 200)
  assert.equal(collection.body.total, 1)
  assert.equal(collection.body.items[0].recognitionCount, 13)
  assert.equal(collection.body.items[0].firstDiscoveredAt, firstDate)
  assert.equal(collection.body.items[0].rock.id, rocks[0].id)

  const detail = await app.request('GET', `/api/collection/me/${rocks[0].id}`, { token })
  assert.equal(detail.status, 200)
  assert.equal(detail.body.rock.name, rocks[0].name)

  assert.equal((await app.request('GET', '/api/collection/me', { token: other.token })).body.total, 0)
  assert.equal((await app.request('GET', `/api/collection/me/${rocks[0].id}`, { token: other.token })).status, 404)
  assert.equal((await app.request('GET', '/api/collection/me')).status, 401)

  const user = await app.models.User.findOne({ where: { userName: 'collector' } })
  const unlocked = await app.models.UserAchievement.findAll({ where: { userId: user.id } })
  assert.deepEqual(unlocked.length, 2, 'first-discovery and dedicated-identifier, each exactly once')
  assert.ok(unlocked.every(item => item.unlockedAt instanceof Date))
})

test('deactivated achievements are not unlocked', async () => {
  const achievement = await app.models.Achievement.findOne({ where: { slug: 'first-discovery' } })
  const adminToken = await app.adminToken()
  assert.equal((await app.request('PATCH', `/api/achievement/${achievement.id}`, { token: adminToken, body: { isActive: false } })).status, 200)
  const { token } = await app.registerAndLogin('latecomer')
  const response = await recognize(rocks[0], { token })
  assert.deepEqual(response.body.unlockedAchievements, [])
})
