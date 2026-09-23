const test = require('node:test')
const assert = require('node:assert/strict')
const { createCrudService } = require('../src/services/crudService')
const createCrudRouter = require('../src/routes/crud.route')

 test('composite-key CRUD locates rows by both key fields', async () => {
  const calls = []
  const row = { update: async data => calls.push(['update', data]), destroy: async () => calls.push(['destroy']) }
  const model = {
    primaryKeyAttribute: 'userId',
    primaryKeyAttributes: ['userId', 'achievementId'],
    findOne: async options => (calls.push(['findOne', options.where]), row),
    findAndCountAll: async () => ({ rows: [], count: 0 })
  }
  const keyFields = ['userId', 'achievementId']
  const service = createCrudService({ model, keyFields, allowedFields: ['rockId'] })
  const key = { userId: '7', achievementId: '3' }
  assert.equal(await service.find(key), row)
  assert.equal(await service.update(key, { userId: 99, achievementId: 88, rockId: 12 }), row)
  assert.equal(await service.remove(key), true)
  assert.deepEqual(calls, [
    ['findOne', { userId: '7', achievementId: '3' }],
    ['findOne', { userId: '7', achievementId: '3' }],
    ['update', { rockId: 12 }],
    ['findOne', { userId: '7', achievementId: '3' }],
    ['destroy']
  ])
})

test('composite-key router exposes explicit two-key paths', () => {
  const router = createCrudRouter({}, { name: 'Logro', keyFields: ['userId', 'achievementId'] })
  const itemRoutes = router.stack.filter(layer => layer.route && layer.route.path !== '/')
  assert.deepEqual(itemRoutes.map(layer => layer.route.path), ['/:userId/:achievementId', '/:userId/:achievementId', '/:userId/:achievementId'])
})
