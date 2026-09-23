const test = require('node:test')
const assert = require('node:assert/strict')
const User = require('../src/models/user')

test('User JSON serialization never exposes the password hash', () => {
  const user = Object.create(User.prototype)
  user.get = () => ({ id: 1, email: 'demo@example.test', password: 'hashed-secret' })
  assert.deepEqual(user.toJSON(), { id: 1, email: 'demo@example.test' })
})
