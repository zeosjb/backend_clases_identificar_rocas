const test = require('node:test')
const assert = require('node:assert/strict')
const { createCrudService } = require('../src/services/crudService')

test('CRUD service strips immutable fields before create and update', async () => {
  const calls = []
  const item = { update: async data => calls.push(['update', data]), destroy: async () => {} }
  const model = {
    primaryKeyAttribute: 'id',
    findAndCountAll: async options => ({ rows: [], count: 0, options }),
    findByPk: async () => item,
    create: async data => (calls.push(['create', data]), data)
  }
  const service = createCrudService({ model, allowedFields: ['name'] })
  await service.create({ id: 8, name: 'Basalto', password: 'secret', createdAt: 'ignored' })
  await service.update(1, { id: 3, name: 'Granito', other: true })
  assert.deepEqual(calls, [['create', { name: 'Basalto' }], ['update', { name: 'Granito' }]])
})

test('CRUD service reports missing rows without updating or deleting', async () => {
  const service = createCrudService({ model: { primaryKeyAttribute: 'id', findByPk: async () => null } })
  assert.equal(await service.update(42, { name: 'missing' }), null)
  assert.equal(await service.remove(42), false)
})
