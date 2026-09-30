const test = require('node:test')
const assert = require('node:assert/strict')
const { Op } = require('sequelize')
const { createRockService } = require('../src/services/rockService')
const { bootTestApp } = require('./helpers/testApp')

test('hardness service builds an inclusive range query', async () => {
  let received
  const service = createRockService({ Rock: { findAll: async options => { received = options; return [] } } })
  assert.deepEqual(await service.findByHardness({ min: '5', max: '7' }), { min: 5, max: 7, total: 0, rocks: [] })
  assert.deepEqual(received.where.hardness[Op.between], [5, 7])
})

test('hardness service rejects missing, non-numeric, negative and inverted ranges with clear 400 errors', async () => {
  const service = createRockService({ Rock: { findAll: async () => [] } })
  const cases = [
    [{}, /obligatorios/],
    [{ min: '5' }, /obligatorios/],
    [{ max: '7' }, /obligatorios/],
    [{ min: 'abc', max: '7' }, /numéricos/],
    [{ min: '-1', max: '7' }, /no negativos/],
    [{ min: '5', max: '' }, /obligatorios/],
    [{ min: ['1', '2'], max: '7' }, /numéricos/],
    [{ min: '8', max: '5' }, /min no puede ser mayor/]
  ]
  for (const [query, message] of cases) {
    await assert.rejects(service.findByHardness(query), error => error.status === 400 && message.test(error.message), JSON.stringify(query))
  }
})

test('GET /api/rock/dureza returns only rocks inside the range, limits included', async t => {
  const app = await bootTestApp('hardness')
  t.after(() => app.close())
  const token = await app.adminToken()
  const base = { composition: 'x', formula: 'x', environment: 'x', commonUses: 'x', streak: 'x', color: 'x', texture: 'x', density: 2, transparency: 0, tenacity: 1, imgUrl: 'https://example.org/x.jpg', mindatUrl: 'https://www.mindat.org/', typeId: 1, categoryId: 1 }
  for (const hardness of [2, 5, 7, 9]) {
    const created = await app.request('POST', '/api/rock', { token, body: { ...base, index: 500 + hardness, name: `H${hardness}`, scientificName: `Hardite ${hardness}`, hardness } })
    assert.equal(created.status, 201)
  }

  const response = await app.request('GET', '/api/rock/dureza?min=5&max=7')
  assert.equal(response.status, 200)
  const hardnesses = response.body.rocks.map(rock => rock.hardness)
  assert.ok(hardnesses.length >= 2)
  assert.ok(hardnesses.every(value => value >= 5 && value <= 7))
  assert.ok(hardnesses.includes(5) && hardnesses.includes(7), 'both limits are inclusive')
  assert.equal(response.body.total, hardnesses.length)
  const names = response.body.rocks.map(rock => rock.name)
  assert.ok(!names.includes('H2') && !names.includes('H9'))

  const single = await app.request('GET', '/api/rock/dureza?min=9&max=9')
  assert.deepEqual(single.body.rocks.map(rock => rock.name), ['H9'])
  const empty = await app.request('GET', '/api/rock/dureza?min=0&max=1')
  assert.equal(empty.status, 200)
  assert.equal(empty.body.total, 0)

  for (const query of ['', '?min=5', '?max=7', '?min=a&max=7', '?min=-2&max=7', '?min=8&max=5']) {
    const invalid = await app.request('GET', `/api/rock/dureza${query}`)
    assert.equal(invalid.status, 400, query)
    assert.ok(invalid.body.message)
  }
})
