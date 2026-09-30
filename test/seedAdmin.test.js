const test = require('node:test')
const assert = require('node:assert/strict')
const { seedAdminUser } = require('../src/database/seedAdmin')

const fakeModels = (users = []) => ({
  Role: { findOne: async () => ({ id: 7, name: 'Admin' }) },
  User: {
    findOne: async ({ where }) => users.find(user => user.email === where.email) || null,
    create: async row => { const created = { id: users.length + 1, ...row }; users.push(created); return created }
  }
})

test('seedAdminUser creates a hashed admin once and never overwrites an existing one', async () => {
  const users = []
  const env = { ADMIN_EMAIL: 'boss@example.test', ADMIN_PASSWORD: 'SuperSecret1' }
  await seedAdminUser(fakeModels(users), env)
  assert.equal(users.length, 1)
  assert.equal(users[0].roleId, 7)
  assert.notEqual(users[0].password, 'SuperSecret1')
  const originalHash = users[0].password
  await seedAdminUser(fakeModels(users), { ...env, ADMIN_PASSWORD: 'AnotherSecret2' })
  assert.equal(users.length, 1)
  assert.equal(users[0].password, originalHash)
})

test('seedAdminUser refuses the development fallback password in production', async () => {
  await assert.rejects(seedAdminUser(fakeModels(), { NODE_ENV: 'production' }), /ADMIN_PASSWORD/)
})
