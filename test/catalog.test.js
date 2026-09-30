const test = require('node:test')
const assert = require('node:assert/strict')
const { bootTestApp } = require('./helpers/testApp')

const rockBody = overrides => ({
  index: 700, name: 'Catalog rock', scientificName: 'Catalogite', composition: 'x', formula: 'x', environment: 'x', commonUses: 'x', hardness: 5,
  streak: 'x', color: 'x', texture: 'x', density: 2, transparency: 0, tenacity: 1, imgUrl: 'https://example.org/x.jpg', mindatUrl: 'https://www.mindat.org/',
  typeId: 1, categoryId: 1, ...overrides
})

let app
let adminToken
test.before(async () => { app = await bootTestApp('catalog'); adminToken = await app.adminToken() })
test.after(async () => { await app.close() })

test('rocks reject incomplete or inconsistent records with 400', async () => {
  const incomplete = rockBody({}); delete incomplete.name
  assert.equal((await app.request('POST', '/api/rock', { token: adminToken, body: incomplete })).status, 400)
  assert.equal((await app.request('POST', '/api/rock', { token: adminToken, body: rockBody({ hardness: 11 }) })).status, 400)
  assert.equal((await app.request('POST', '/api/rock', { token: adminToken, body: rockBody({ typeId: 9999 }) })).status, 400)
  assert.equal((await app.request('POST', '/api/rock', { token: adminToken, body: rockBody({ scientificName: 'Basalt', index: 701 }) })).status, 400)
})

test('rocks can be filtered by type and category and validate the filter values', async () => {
  const igneous = await app.models.Type.findOne({ where: { name: 'Ignea' } })
  const byType = await app.request('GET', `/api/rock?typeId=${igneous.id}`)
  assert.equal(byType.status, 200)
  assert.ok(byType.body.items.length >= 2)
  assert.ok(byType.body.items.every(rock => rock.typeId === igneous.id))
  const slate = await app.models.Category.findOne({ where: { name: 'Foliada' } })
  const byCategory = await app.request('GET', `/api/rock?categoryId=${slate.id}`)
  assert.deepEqual(byCategory.body.items.map(rock => rock.name), ['Pizarra'])
  assert.equal((await app.request('GET', '/api/rock?typeId=abc')).status, 400)
})

test('types and categories reject duplicate names', async () => {
  assert.equal((await app.request('POST', '/api/type', { token: adminToken, body: { name: 'Ignea' } })).status, 400)
  assert.equal((await app.request('POST', '/api/category', { token: adminToken, body: { name: 'Volcanica', description: 'again' } })).status, 400)
  assert.equal((await app.request('POST', '/api/type', { token: adminToken, body: { name: 'Nueva' } })).status, 201)
})

test('types and categories with rocks cannot be deleted (409), unused ones can (204)', async () => {
  const used = await app.models.Type.findOne({ where: { name: 'Sedimentaria' } })
  const blocked = await app.request('DELETE', `/api/type/${used.id}`, { token: adminToken })
  assert.equal(blocked.status, 409)
  assert.match(blocked.body.message, /rocas asociadas/)
  const usedCategory = await app.models.Category.findOne({ where: { name: 'Clastica' } })
  assert.equal((await app.request('DELETE', `/api/category/${usedCategory.id}`, { token: adminToken })).status, 409)

  const created = await app.request('POST', '/api/category', { token: adminToken, body: { name: 'Temporal', description: 'unused' } })
  assert.equal((await app.request('DELETE', `/api/category/${created.body.id}`, { token: adminToken })).status, 204)
})

test('lists the rocks that belong to a type or category', async () => {
  const igneous = await app.models.Type.findOne({ where: { name: 'Ignea' } })
  const response = await app.request('GET', `/api/type/${igneous.id}/rocks`)
  assert.equal(response.status, 200)
  assert.ok(response.body.rocks.length >= 2)
  assert.ok(response.body.rocks.every(rock => rock.typeId === igneous.id))
  const volcanic = await app.models.Category.findOne({ where: { name: 'Volcanica' } })
  const byCategory = await app.request('GET', `/api/category/${volcanic.id}/rocks`)
  assert.deepEqual(byCategory.body.rocks.map(rock => rock.name), ['Basalto'])
  assert.equal((await app.request('GET', '/api/type/9999/rocks')).status, 404)
})
