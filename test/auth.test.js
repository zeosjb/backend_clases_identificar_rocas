const test = require('node:test')
const assert = require('node:assert/strict')
const { bootTestApp } = require('./helpers/testApp')

let app
test.before(async () => { app = await bootTestApp('auth') })
test.after(async () => { await app.close() })

const validRock = suffix => ({
  index: 900 + suffix, name: `Rock ${suffix}`, scientificName: `Testite ${suffix}`, composition: 'Quartz', formula: 'SiO2', environment: 'Lab',
  commonUses: 'Testing', hardness: 5, streak: 'White', color: 'Grey', texture: 'Fine', density: 2.5, transparency: 0, tenacity: 1,
  imgUrl: 'https://example.org/x.jpg', mindatUrl: 'https://www.mindat.org/', typeId: 1, categoryId: 1
})

test('registration ignores a client supplied roleId and never creates admins', async () => {
  const adminRole = await app.models.Role.findOne({ where: { name: 'Admin' } })
  const attempt = await app.request('POST', '/api/user/registro', { body: { userName: 'sneaky2', email: 'sneaky2@example.test', password: 'Password123!', roleId: adminRole.id } })
  assert.equal(attempt.status, 201)
  const stored = await app.models.User.findByPk(attempt.body.user.id, { include: [{ model: app.models.Role, as: 'role' }] })
  assert.equal(stored.role.name, 'Usuario autenticado')
  assert.equal('password' in attempt.body.user, false)
})

test('login returns a token without exposing the password hash', async () => {
  await app.request('POST', '/api/user/registro', { body: { userName: 'loginuser', email: 'loginuser@example.test', password: 'Password123!' } })
  const ok = await app.request('POST', '/api/user/login', { body: { email: 'loginuser@example.test', password: 'Password123!' } })
  assert.equal(ok.status, 200)
  assert.ok(ok.body.token)
  assert.equal('password' in ok.body.user, false)
  const bad = await app.request('POST', '/api/user/login', { body: { email: 'loginuser@example.test', password: 'wrong-password' } })
  assert.equal(bad.status, 401)
})

test('the seeded administrator can log in and holds the Admin role', async () => {
  const token = await app.adminToken()
  const me = await app.request('GET', '/api/user/me', { token })
  assert.equal(me.status, 200)
  assert.equal(me.body.role.name, 'Admin')
})

test('admin-only writes: 401 without token, 403 for regular users, 201 for admins; reads stay public', async () => {
  assert.equal((await app.request('GET', '/api/rock')).status, 200)
  assert.equal((await app.request('POST', '/api/rock', { body: validRock(1) })).status, 401)
  const { token } = await app.registerAndLogin('regular')
  assert.equal((await app.request('POST', '/api/rock', { token, body: validRock(1) })).status, 403)
  const adminToken = await app.adminToken()
  assert.equal((await app.request('POST', '/api/rock', { token: adminToken, body: validRock(1) })).status, 201)
})

test('only admins can list users', async () => {
  const { token } = await app.registerAndLogin('curious')
  assert.equal((await app.request('GET', '/api/user')).status, 401)
  assert.equal((await app.request('GET', '/api/user', { token })).status, 403)
  const list = await app.request('GET', '/api/user', { token: await app.adminToken() })
  assert.equal(list.status, 200)
  assert.ok(list.body.items.length >= 1)
  assert.ok(list.body.items.every(user => !('password' in user)))
})

test('profile update cannot change role or status', async () => {
  const { token } = await app.registerAndLogin('profile')
  const adminRole = await app.models.Role.findOne({ where: { name: 'Admin' } })
  const update = await app.request('PATCH', '/api/user/me', { token, body: { phone: '+56911111111', roleId: adminRole.id, status: 'blocked' } })
  assert.equal(update.status, 200)
  assert.equal(update.body.phone, '+56911111111')
  const me = await app.request('GET', '/api/user/me', { token })
  assert.equal(me.body.role.name, 'Usuario autenticado')
  assert.equal(me.body.status, 'active')
})

test('admin-only role management endpoints reject regular users', async () => {
  const { token } = await app.registerAndLogin('rolepoke')
  assert.equal((await app.request('GET', '/api/role', { token })).status, 403)
  assert.equal((await app.request('GET', '/api/role', { token: await app.adminToken() })).status, 200)
})
