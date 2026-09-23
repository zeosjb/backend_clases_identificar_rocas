const test = require('node:test')
const assert = require('node:assert/strict')
const { buildListOptions } = require('../src/utils/queryOptions')

test('buildListOptions bounds pagination and creates a whitelist search', () => {
  const options = buildListOptions({ page: '2', limit: '500', search: 'basalt' }, ['name', 'scientificName'])
  assert.equal(options.limit, 100)
  assert.equal(options.offset, 100)
  const { Op } = require('sequelize')
  assert.equal(options.where[Op.or][0].name[Op.like], '%basalt%')
})

test('buildListOptions rejects invalid pagination and unknown search fields', () => {
  assert.throws(() => buildListOptions({ page: '0' }, ['name']), /page/)
  assert.throws(() => buildListOptions({ searchBy: 'password' }, ['name']), /searchBy/)
})
